import { getAndroidPaths } from '../config.js';
import { exec } from '../utils/exec.js';
import { Logger } from '../utils/logger.js';

export async function grantAppPermissions(): Promise<void> {
  const logger = new Logger('app-permissions');
  const paths = getAndroidPaths();
  const tauriAppPackage = 'com.demo.tauri_app';
  const ankiPermission = 'com.ichi2.anki.permission.READ_WRITE_DATABASE';

  try {
    logger.info('Granting app permissions');

    const { stdout: devices } = await exec(paths.adb, ['devices'], {
      logger,
      silent: true,
    });

    if (!devices.includes('emulator') || !devices.includes('device')) {
      console.error(`No running emulator found. Run 'emu start' first`);
      process.exit(1);
    }

    logger.info(`Granting ${ankiPermission} to ${tauriAppPackage}`);

    await exec(paths.adb, ['shell', 'pm', 'grant', tauriAppPackage, ankiPermission], {
      logger,
      silent: true,
    });

    logger.info('Permission granted successfully');
    console.log(`Granted ${ankiPermission} to ${tauriAppPackage}`);
  } catch (error) {
    logger.error('Failed to grant permissions', error);
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(`Check log file for details: ${logger.getLogFile()}`);
    process.exit(1);
  }
}
