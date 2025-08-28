import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { getAndroidPaths } from '../config.js';
import { exec } from '../utils/exec.js';
import { Logger } from '../utils/logger.js';

export async function takeScreenshot(filename?: string): Promise<void> {
  const logger = new Logger('emulator-screenshot');
  const paths = getAndroidPaths();

  try {
    logger.info('Taking screenshot');

    const { stdout: devices } = await exec(paths.adb, ['devices'], {
      logger,
      silent: true,
    });

    if (!devices.includes('emulator') || !devices.includes('device')) {
      console.error(`No running emulator found. Run 'emu start' first`);
      process.exit(1);
    }

    const screenshotsDir = path.join(process.cwd(), 'screenshots');
    if (!existsSync(screenshotsDir)) {
      mkdirSync(screenshotsDir, { recursive: true });
      logger.info(`Created screenshots directory at ${screenshotsDir}`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const outputFilename = filename || `screenshot-${timestamp}.png`;
    const outputPath = path.join(screenshotsDir, outputFilename);
    const devicePath = '/sdcard/screenshot.png';

    await exec(paths.adb, ['shell', 'screencap', '-p', devicePath], {
      logger,
      silent: true,
    });

    await exec(paths.adb, ['pull', devicePath, outputPath], {
      logger,
      silent: true,
    });

    await exec(paths.adb, ['shell', 'rm', devicePath], {
      logger,
      silent: true,
    });

    logger.info(`Screenshot saved to ${outputPath}`);
    console.log(outputPath);
  } catch (error) {
    logger.error('Screenshot failed', error);
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(`Check log file for details: ${logger.getLogFile()}`);
    process.exit(1);
  }
}
