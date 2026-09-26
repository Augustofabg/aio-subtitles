import { spawn } from 'child_process';
import { Logger } from '../../utils/logger';

export interface AudioExtractionResult {
  durationMs: number;
  outputWavPath: string;
}

export function getFfmpegPath(): string {
  return process.env.FFMPEG_PATH || 'ffmpeg';
}

export function isFfmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const proc = spawn(getFfmpegPath(), ['-version']);
      proc.on('error', () => resolve(false));
      proc.on('close', (code) => resolve(code === 0));
    } catch {
      resolve(false);
    }
  });
}

export async function extractReferenceAudio(
  videoUrl: string,
  sampleMinutes: number,
  outputWavPath: string,
  timeoutMs: number = 5000
): Promise<AudioExtractionResult> {
  const startTime = Date.now();
  const sampleSeconds = Math.max(30, Math.min(300, Math.round(sampleMinutes * 60)));
  const ffmpegBin = getFfmpegPath();

  const args = [
    '-y',
    '-nostdin',
    '-ss', '0',
    '-t', String(sampleSeconds),
    '-i', videoUrl,
    '-vn',
    '-ac', '1',
    '-ar', '16000',
    '-f', 'wav',
    outputWavPath
  ];

  return new Promise<AudioExtractionResult>((resolve, reject) => {
    let proc: ReturnType<typeof spawn>;
    let isFinished = false;

    const timer = setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        try {
          proc.kill('SIGKILL');
        } catch {}
        reject(new Error(`FFmpeg audio extraction timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    try {
      proc = spawn(ffmpegBin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    } catch (err: any) {
      clearTimeout(timer);
      return reject(new Error(`Failed to spawn FFmpeg: ${err?.message || err}`));
    }

    let stderr = '';
    proc.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err) => {
      if (!isFinished) {
        isFinished = true;
        clearTimeout(timer);
        reject(new Error(`FFmpeg error: ${err.message}`));
      }
    });

    proc.on('close', (code) => {
      if (!isFinished) {
        isFinished = true;
        clearTimeout(timer);
        const elapsed = Date.now() - startTime;
        if (code === 0) {
          resolve({ durationMs: elapsed, outputWavPath });
        } else {
          Logger.warn(`FFmpeg exited with non-zero code ${code}: ${stderr.slice(-300)}`);
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      }
    });
  });
}
