import type { Subprocess } from 'execa';

export class SignalHandler {
  private cleanupFunctions: Array<() => void | Promise<void>> = [];
  private isCleaningUp = false;

  constructor() {
    // Register signal handlers
    process.on('SIGINT', () => void this.cleanup('SIGINT'));
    process.on('SIGTERM', () => void this.cleanup('SIGTERM'));
    process.on('SIGHUP', () => void this.cleanup('SIGHUP'));
  }

  register(fn: () => void | Promise<void>) {
    this.cleanupFunctions.push(fn);
  }

  registerProcess(process: Subprocess | null, name?: string) {
    if (process && process.pid) {
      this.register(() => {
        if (process.pid) {
          console.log(`\n🛑 Stopping ${name || 'process'} (PID: ${process.pid})...`);
          process.kill('SIGTERM');
        }
      });
    }
  }

  private async cleanup(signal: string) {
    if (this.isCleaningUp) {
      return;
    }
    this.isCleaningUp = true;

    console.log(`\n\n⚠️  Received ${signal}, cleaning up...`);

    // Execute all cleanup functions
    for (const fn of this.cleanupFunctions) {
      try {
        await fn();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }

    console.log('✅ Cleanup complete');
    process.exit(0);
  }
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}
