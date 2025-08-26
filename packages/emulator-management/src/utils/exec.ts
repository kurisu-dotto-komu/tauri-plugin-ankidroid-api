import { execa, type Options as ExecaOptions, Subprocess } from 'execa';
import { Logger } from './logger.js';

export interface ExecOptions extends ExecaOptions {
  logger?: Logger;
  logOutput?: boolean;
  silent?: boolean;
}

export async function exec(
  command: string,
  args: string[] = [],
  options: ExecOptions = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const { logger, logOutput = true, silent = false, ...execaOptions } = options;

  if (logger && !silent) {
    logger.debug(`Executing: ${command} ${args.join(' ')}`);
  }

  try {
    const result = await execa(command, args, {
      ...execaOptions,
      reject: false,
      all: true,
    });

    if (logger && logOutput && result.all) {
      const allOutput = typeof result.all === 'string' ? result.all : '';
      const lines = allOutput.split('\n').filter((line) => line.trim());
      lines.forEach((line) => logger.debug(`[${command}] ${line}`));
    }

    if (result.exitCode !== 0 && logger) {
      logger.warn(`Command exited with code ${result.exitCode}: ${command} ${args.join(' ')}`);
      if (result.stderr) {
        logger.error(`stderr: ${String(result.stderr)}`);
      }
    }

    return {
      stdout: typeof result.stdout === 'string' ? result.stdout : '',
      stderr: typeof result.stderr === 'string' ? result.stderr : '',
      exitCode: result.exitCode || 0,
    };
  } catch (error) {
    if (logger) {
      logger.error(`Failed to execute: ${command} ${args.join(' ')}`, error);
    }
    throw error;
  }
}

export function spawn(command: string, args: string[] = [], options: ExecOptions = {}): Subprocess {
  const { logger, silent = false, ...execaOptions } = options;

  if (logger && !silent) {
    logger.info(`Starting process: ${command} ${args.join(' ')}`);
  }

  const child = execa(command, args, {
    ...execaOptions,
    reject: false,
    buffer: false,
  });

  if (logger && child.stdout) {
    child.stdout.on('data', (data: Buffer) => {
      const lines = data
        .toString()
        .split('\n')
        .filter((line: string) => line.trim());
      lines.forEach((line: string) => {
        if (!silent) {
          logger.info(`[${command}] ${line}`);
        }
      });
    });
  }

  if (logger && child.stderr) {
    child.stderr.on('data', (data: Buffer) => {
      const lines = data
        .toString()
        .split('\n')
        .filter((line: string) => line.trim());
      lines.forEach((line: string) => {
        if (line.match(/(ERROR|FATAL|WARNING|Failed)/i)) {
          logger.error(`[${command}] ${line}`);
        } else if (!silent) {
          logger.debug(`[${command}] ${line}`);
        }
      });
    });
  }

  return child;
}

export async function waitForCondition(
  checkFn: () => Promise<boolean>,
  timeoutMs: number,
  intervalMs: number = 1000,
  logger?: Logger,
  progressCallback?: (remainingSeconds: number) => void
): Promise<boolean> {
  const startTime = Date.now();
  const timeoutSeconds = Math.floor(timeoutMs / 1000);
  let lastProgressUpdate = 0;

  while (Date.now() - startTime < timeoutMs) {
    if (await checkFn()) {
      return true;
    }

    // Update progress every second
    if (progressCallback) {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      if (elapsedSeconds !== lastProgressUpdate) {
        lastProgressUpdate = elapsedSeconds;
        const remainingSeconds = timeoutSeconds - elapsedSeconds;
        progressCallback(remainingSeconds);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  if (logger) {
    logger.warn(`Condition not met within ${timeoutMs}ms timeout`);
  }

  return false;
}
