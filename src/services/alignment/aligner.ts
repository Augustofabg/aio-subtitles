import { spawn } from 'child_process';
import { Logger } from '../../utils/logger';
import { AlignmentToolStatus } from './types';
import { isFfmpegAvailable, getFfmpegPath } from './audioExtractor';

export function getAlassPath(): string {
  return process.env.ALASS_PATH || 'alass';
}

export function getFfsubsyncPath(): string {
  return process.env.FFSUBSYNC_PATH || 'ffsubsync';
}

export function isAlassAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const proc = spawn(getAlassPath(), ['--version']);
      proc.on('error', () => resolve(false));
      proc.on('close', (code) => resolve(code === 0));
    } catch {
      resolve(false);
    }
  });
}

export function isFfsubsyncAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const proc = spawn(getFfsubsyncPath(), ['--version']);
      proc.on('error', () => resolve(false));
      proc.on('close', (code) => resolve(code === 0));
    } catch {
      resolve(false);
    }
  });
}

export async function detectAvailableTools(): Promise<AlignmentToolStatus> {
  const [ffmpegAvailable, alassAvailable, ffsubsyncAvailable] = await Promise.all([
    isFfmpegAvailable(),
    isAlassAvailable(),
    isFfsubsyncAvailable()
  ]);

  return {
    ffmpegAvailable,
    alassAvailable,
    ffsubsyncAvailable,
    ffmpegPath: getFfmpegPath(),
    alassPath: getAlassPath(),
    ffsubsyncPath: getFfsubsyncPath()
  };
}

export interface AlignerExecutionResult {
  durationMs: number;
  toolUsed: string;
}

export async function runAlignmentTool(
  audioPath: string,
  candidateSrtPath: string,
  outputSrtPath: string,
  preferredTool: 'alass' | 'ffsubsync' | 'auto' = 'auto',
  timeoutMs: number = 5000
): Promise<AlignerExecutionResult> {
  const startTime = Date.now();
  let toolToUse: string;

  if (preferredTool === 'alass') {
    toolToUse = 'alass';
  } else if (preferredTool === 'ffsubsync') {
    toolToUse = 'ffsubsync';
  } else {
    // Auto-selection: favor alass (faster Rust binary) then ffsubsync
    const hasAlass = await isAlassAvailable();
    if (hasAlass) {
      toolToUse = 'alass';
    } else {
      const hasFfsubsync = await isFfsubsyncAvailable();
      if (hasFfsubsync) {
        toolToUse = 'ffsubsync';
      } else {
        throw new Error('Neither alass nor ffsubsync binary is installed or reachable in PATH');
      }
    }
  }

  const binary = toolToUse === 'alass' ? getAlassPath() : getFfsubsyncPath();
  const args = toolToUse === 'alass'
    ? [audioPath, candidateSrtPath, outputSrtPath]
    : [audioPath, '-i', candidateSrtPath, '-o', outputSrtPath];

  return new Promise<AlignerExecutionResult>((resolve, reject) => {
    let proc: ReturnType<typeof spawn>;
    let isFinished = false;

    const timer = setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        try {
          proc.kill('SIGKILL');
        } catch {}
        reject(new Error(`Alignment tool (${toolToUse}) timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    try {
      proc = spawn(binary, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    } catch (err: any) {
      clearTimeout(timer);
      return reject(new Error(`Failed to spawn alignment binary (${toolToUse}): ${err?.message || err}`));
    }

    let stderr = '';
    proc.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err) => {
      if (!isFinished) {
        isFinished = true;
        clearTimeout(timer);
        reject(new Error(`Alignment process error (${toolToUse}): ${err.message}`));
      }
    });

    proc.on('close', (code) => {
      if (!isFinished) {
        isFinished = true;
        clearTimeout(timer);
        const elapsed = Date.now() - startTime;
        if (code === 0) {
          resolve({ durationMs: elapsed, toolUsed: toolToUse });
        } else {
          Logger.warn(`Alignment tool (${toolToUse}) exited with code ${code}: ${stderr.slice(-300)}`);
          reject(new Error(`Alignment tool (${toolToUse}) exited with code ${code}`));
        }
      }
    });
  });
}
