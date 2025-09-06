import ora from 'ora';
import { getLogLevel, type LogLevel } from './logger.js';

export class Progress {
  private spinner: ReturnType<typeof ora> | null;
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = getLogLevel();
    this.spinner = this.logLevel === 'verbose' ? ora() : null;
  }

  start(message: string) {
    if (this.spinner) {
      this.spinner.start(message);
    }
    // In normal mode, don't show "starting" messages
  }

  succeed(message: string) {
    if (this.spinner) {
      this.spinner.succeed(message);
    } else if (this.logLevel === 'normal') {
      console.log(`✔ ${message}`);
    }
  }

  fail(message: string) {
    if (this.spinner) {
      this.spinner.fail(message);
    } else if (this.logLevel !== 'silent') {
      console.error(`✖ ${message}`);
    }
  }

  info(message: string) {
    if (this.spinner) {
      this.spinner.info(message);
    } else if (this.logLevel === 'normal') {
      console.log(`ℹ ${message}`);
    }
  }

  warn(message: string) {
    if (this.spinner) {
      this.spinner.warn(message);
    } else if (this.logLevel !== 'silent') {
      console.warn(`⚠ ${message}`);
    }
  }

  text(message: string) {
    if (this.spinner) {
      this.spinner.text = message;
    }
    // In normal mode, don't update progress text
  }

  log(message: string, level: 'always' | 'normal' | 'verbose' = 'normal') {
    const shouldLog = 
      level === 'always' ||
      (level === 'normal' && this.logLevel !== 'silent') ||
      (level === 'verbose' && this.logLevel === 'verbose');
    
    if (shouldLog) {
      console.log(message);
    }
  }

  error(message: string, level: 'always' | 'normal' | 'verbose' = 'always') {
    const shouldLog = 
      level === 'always' ||
      (level === 'normal' && this.logLevel !== 'silent') ||
      (level === 'verbose' && this.logLevel === 'verbose');
    
    if (shouldLog) {
      console.error(message);
    }
  }

  stop() {
    if (this.spinner) {
      this.spinner.stop();
    }
  }
}