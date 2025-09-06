import { createWriteStream, type WriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { createLogger, format, transports } from 'winston';
import type winston from 'winston';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '../../../../');
const LOGS_DIR = path.join(PROJECT_ROOT, 'logs');

fs.ensureDirSync(LOGS_DIR);

export type LogLevel = 'silent' | 'normal' | 'verbose';

let logLevel: LogLevel = 'normal';

export function setLogLevel(level: LogLevel) {
  logLevel = level;
}

export function getLogLevel(): LogLevel {
  return logLevel;
}

// Legacy functions for backwards compatibility
export function getVerbose(): boolean {
  return logLevel === 'verbose';
}

export function isSilent(): boolean {
  return logLevel === 'silent';
}

export function isNormal(): boolean {
  return logLevel === 'normal';
}

export class Logger {
  private winston: winston.Logger;
  private logFile: string;
  private processLogStream?: WriteStream;

  constructor(_component: string) {
    // Always use a single, unified log file
    this.logFile = path.join(LOGS_DIR, 'emulator.log');

    this.winston = createLogger({
      level: 'debug',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `[${String(timestamp)}] [${level.toUpperCase()}] ${String(message)}${metaStr}`;
        })
      ),
      transports: [
        new transports.File({ filename: this.logFile }),
        ...(logLevel === 'verbose' ? [new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(({ _level, message }) => `${String(message)}`)
          ),
        })] : []),
      ],
    });
  }

  info(message: string, meta?: unknown) {
    this.winston.info(message, meta);
  }

  error(message: string, meta?: unknown) {
    // Always log errors to console unless in silent mode
    if (logLevel !== 'verbose' && logLevel !== 'silent') {
      console.error(message);
    }
    this.winston.error(message, meta);
  }

  warn(message: string, meta?: unknown) {
    this.winston.warn(message, meta);
  }

  debug(message: string, meta?: unknown) {
    this.winston.debug(message, meta);
  }

  createProcessLogger(processName: string): WriteStream {
    // Use the same unified log file for all process output
    this.processLogStream = createWriteStream(this.logFile, { flags: 'a' });

    if (logLevel === 'verbose') {
      this.info(`Process '${processName}' output will be logged to: ${this.logFile}`);
    }
    return this.processLogStream;
  }

  closeProcessLogger() {
    if (this.processLogStream) {
      this.processLogStream.end();
      this.processLogStream = undefined;
    }
  }

  getLogFile(): string {
    return this.logFile;
  }

  static getLogsDir(): string {
    return LOGS_DIR;
  }
}

export async function ensureLogsDir(): Promise<void> {
  await fs.ensureDir(LOGS_DIR);
}

export function getLogPath(_prefix: string): string {
  // Always return the same unified log file
  return path.join(LOGS_DIR, 'emulator.log');
}
