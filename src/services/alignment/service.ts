import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import axios from 'axios';
import { Logger } from '../../utils/logger';
import { AlignmentOptions, AlignmentResult, AlignmentMetrics } from './types';
import { alignmentCache } from './cache';
import { extractReferenceAudio, isFfmpegAvailable } from './audioExtractor';
import { runAlignmentTool, isAlassAvailable, isFfsubsyncAvailable } from './aligner';

export async function fetchSubtitleContent(subUrl: string, timeoutMs: number = 3000): Promise<string> {
  const response = await axios.get(subUrl, {
    responseType: 'text',
    timeout: timeoutMs,
    headers: {
      'User-Agent': 'AIOSubs-Alignment/1.0'
    }
  });
  return response.data;
}

export async function alignSubtitle(options: AlignmentOptions): Promise<AlignmentResult> {
  const startTime = Date.now();
  const sampleDurationMinutes = options.sampleDurationMinutes ?? 2;
  const timeoutSeconds = options.timeoutSeconds ?? 5;
  const totalTimeoutMs = timeoutSeconds * 1000;
  const preferredTool = options.tool || 'auto';

  const initialMemoryMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

  // 1. Generate cache key and verify cache
  const cacheKey = alignmentCache.generateKey(
    options.videoUrl,
    options.subUrl,
    sampleDurationMinutes,
    preferredTool
  );

  const cachedSrt = alignmentCache.get(cacheKey);
  if (cachedSrt) {
    const elapsed = Date.now() - startTime;
    return {
      srtContent: cachedSrt,
      fromCache: true,
      isOriginalFallback: false,
      metrics: {
        audioExtractionMs: 0,
        alignmentExecutionMs: 0,
        totalDurationMs: elapsed,
        initialMemoryMb,
        peakMemoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        success: true,
        cacheHit: true,
        toolUsed: 'cached'
      }
    };
  }

  // 2. Fetch candidate original subtitle
  let originalSrt = '';
  try {
    originalSrt = await fetchSubtitleContent(options.subUrl, Math.min(totalTimeoutMs, 3000));
  } catch (err: any) {
    Logger.error(`[Alignment] Failed to fetch candidate subtitle from ${options.subUrl}:`, err?.message || err);
    throw new Error(`Failed to fetch original candidate subtitle: ${err?.message || err}`);
  }

  // Helper to build fallback result
  const makeFallback = (reason: string, audioMs: number = 0, alignMs: number = 0): AlignmentResult => {
    const elapsed = Date.now() - startTime;
    const peakMem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    Logger.warn(`[Alignment] Fallback triggered (${reason}). Returning original candidate subtitle in ${elapsed}ms.`);
    return {
      srtContent: originalSrt,
      fromCache: false,
      isOriginalFallback: true,
      metrics: {
        audioExtractionMs: audioMs,
        alignmentExecutionMs: alignMs,
        totalDurationMs: elapsed,
        initialMemoryMb,
        peakMemoryMb: peakMem,
        success: false,
        fallbackReason: reason,
        cacheHit: false
      }
    };
  };

  // 3. Fast check for tool availability before attempting subprocesses
  const [hasFfmpeg, hasAlass, hasFfsubsync] = await Promise.all([
    isFfmpegAvailable(),
    isAlassAvailable(),
    isFfsubsyncAvailable()
  ]);

  if (!hasFfmpeg) {
    return makeFallback('ffmpeg_not_available');
  }

  const hasAnyAligner = hasAlass || hasFfsubsync;
  if (!hasAnyAligner) {
    return makeFallback('alignment_binary_not_available');
  }

  if (preferredTool === 'alass' && !hasAlass) {
    return makeFallback('alass_not_available');
  }

  if (preferredTool === 'ffsubsync' && !hasFfsubsync) {
    return makeFallback('ffsubsync_not_available');
  }

  // 4. Create isolated temp workspace
  const tmpDir = path.join(os.tmpdir(), `aiosubs-sync-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`);
  try {
    fs.mkdirSync(tmpDir, { recursive: true });
  } catch (err: any) {
    return makeFallback(`tmp_dir_creation_failed: ${err?.message || err}`);
  }

  const candidateSrtPath = path.join(tmpDir, 'candidate.srt');
  const audioWavPath = path.join(tmpDir, 'reference.wav');
  const outputSrtPath = path.join(tmpDir, 'aligned.srt');

  let audioExtractionMs = 0;
  let alignmentExecutionMs = 0;
  let toolUsed = '';

  try {
    fs.writeFileSync(candidateSrtPath, originalSrt, 'utf8');

    // Remaining budget calculation
    const elapsedSoFar = Date.now() - startTime;
    const remainingTime = totalTimeoutMs - elapsedSoFar;
    if (remainingTime <= 1000) {
      return makeFallback('timeout_budget_exhausted_before_extraction');
    }

    // Allocate 60% of remaining time to audio extraction, rest to aligner
    const audioBudget = Math.max(1000, Math.floor(remainingTime * 0.6));

    // 5. Extract reference audio from remote stream
    const audioResult = await extractReferenceAudio(
      options.videoUrl,
      sampleDurationMinutes,
      audioWavPath,
      audioBudget
    );
    audioExtractionMs = audioResult.durationMs;

    // Recalculate remaining budget for alignment tool
    const postExtractionRemaining = totalTimeoutMs - (Date.now() - startTime);
    if (postExtractionRemaining <= 500) {
      return makeFallback('timeout_budget_exhausted_after_audio_extraction', audioExtractionMs);
    }

    // 6. Execute alignment
    const alignResult = await runAlignmentTool(
      audioWavPath,
      candidateSrtPath,
      outputSrtPath,
      preferredTool,
      postExtractionRemaining
    );
    alignmentExecutionMs = alignResult.durationMs;
    toolUsed = alignResult.toolUsed;

    // 7. Read aligned output
    if (!fs.existsSync(outputSrtPath)) {
      return makeFallback('aligned_file_not_generated', audioExtractionMs, alignmentExecutionMs);
    }

    const alignedContent = fs.readFileSync(outputSrtPath, 'utf8');
    if (!alignedContent || alignedContent.trim().length === 0) {
      return makeFallback('aligned_file_empty', audioExtractionMs, alignmentExecutionMs);
    }

    // 8. Cache result
    alignmentCache.set(cacheKey, alignedContent);

    const totalElapsed = Date.now() - startTime;
    const peakMem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

    Logger.info(
      `[Alignment] Success using ${toolUsed}: audio=${audioExtractionMs}ms, align=${alignmentExecutionMs}ms, total=${totalElapsed}ms, peakRAM=${peakMem}MB`
    );

    return {
      srtContent: alignedContent,
      fromCache: false,
      isOriginalFallback: false,
      metrics: {
        audioExtractionMs,
        alignmentExecutionMs,
        totalDurationMs: totalElapsed,
        initialMemoryMb,
        peakMemoryMb: peakMem,
        success: true,
        toolUsed,
        cacheHit: false
      }
    };
  } catch (err: any) {
    Logger.warn(`[Alignment] Process error: ${err?.message || err}`);
    return makeFallback(`error: ${err?.message || err}`, audioExtractionMs, alignmentExecutionMs);
  } finally {
    // 9. Clean up temporary files to avoid leaking disk space
    try {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    } catch (cleanupErr: any) {
      Logger.warn(`[Alignment] Failed to remove temp directory ${tmpDir}: ${cleanupErr?.message || cleanupErr}`);
    }
  }
}
