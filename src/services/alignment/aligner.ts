import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { Logger } from '../../utils/logger';
import { AlignmentToolStatus } from './types';
import { isFfmpegAvailable, getFfmpegPath } from './audioExtractor';

export function getAlassPath(): string {
  if (process.env.ALASS_PATH) return process.env.ALASS_PATH;
  const isWin = process.platform === 'win32';
  const localCandidates = isWin
    ? ['alass.exe', 'alass-cli.exe', 'alass.bat']
    : ['alass', 'alass-cli'];

  for (const name of localCandidates) {
    const localBin = path.join(process.cwd(), 'bin', name);
    if (fs.existsSync(localBin)) return localBin;
  }

  return 'alass';
}

export function getFfsubsyncPath(): string {
  if (process.env.FFSUBSYNC_PATH) return process.env.FFSUBSYNC_PATH;
  const localBin = path.join(process.cwd(), 'bin', process.platform === 'win32' ? 'ffsubsync.exe' : 'ffsubsync');
  if (fs.existsSync(localBin)) return localBin;
  return 'ffsubsync';
}

function testBinaryExecution(bin: string, args: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const proc = spawn(bin, args);
      proc.on('error', () => resolve(false));
      proc.on('close', (code) => resolve(code === 0));
    } catch {
      resolve(false);
    }
  });
}

export async function isAlassAvailable(): Promise<boolean> {
  const currentPath = getAlassPath();
  // 1. Try with --version
  if (await testBinaryExecution(currentPath, ['--version'])) return true;
  // 2. Try with --help
  if (await testBinaryExecution(currentPath, ['--help'])) return true;

  // 3. If standard 'alass' wasn't found in PATH, check 'alass-cli' in PATH
  if (currentPath === 'alass') {
    if (await testBinaryExecution('alass-cli', ['--version'])) return true;
    if (await testBinaryExecution('alass-cli', ['--help'])) return true;
  }

  return false;
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
