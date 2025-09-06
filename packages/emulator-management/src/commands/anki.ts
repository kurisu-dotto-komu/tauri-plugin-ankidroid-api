import { createWriteStream, unlink } from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { CONFIG, getAndroidPaths, getAnkidroidApkUrl } from '../config.js';
import { exec } from '../utils/exec.js';
import { Logger } from '../utils/logger.js';
import { Progress } from '../utils/progress.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../../');

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);

    https
      .get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            file.close();
            void downloadFile(redirectUrl, dest).then(resolve).catch(reject);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        unlink(dest, () => {});
        reject(err);
      });
  });
}

export async function ankiInstall(): Promise<void> {
  const logger = new Logger('anki-install');
  const paths = getAndroidPaths();
  const progress = new Progress();

  try {
    logger.info('Starting AnkiDroid installation with auto-permissions');

    progress.start('Checking if emulator is running...');
    const { stdout: devices } = await exec(paths.adb, ['devices'], {
      logger,
      silent: true,
    });

    if (!devices.includes('emulator') || !devices.includes('device')) {
      progress.fail('No emulator found');
      console.error(`\nPlease start the emulator first with 'emu start'`);
      process.exit(1);
    }
    progress.succeed('Emulator is running');

    progress.start('Checking if AnkiDroid is already installed...');
    const { stdout: packages } = await exec(paths.adb, ['shell', 'pm', 'list', 'packages'], {
      logger,
      silent: true,
    });

    if (packages.includes(CONFIG.ankidroid.packageName)) {
      progress.start('Uninstalling existing AnkiDroid...');
      logger.info('Uninstalling existing AnkiDroid');
      await exec(paths.adb, ['uninstall', CONFIG.ankidroid.packageName], { logger });
      progress.succeed('Existing AnkiDroid uninstalled');
    } else {
      progress.succeed('AnkiDroid not currently installed');
    }

    const apkDir = path.join(PROJECT_ROOT, CONFIG.ankidroid.apkDir);
    await fs.ensureDir(apkDir);

    const apkFile = path.join(apkDir, `AnkiDroid-${CONFIG.ankidroid.version}.apk`);

    if (await fs.pathExists(apkFile)) {
      progress.info(`Using existing AnkiDroid APK v${CONFIG.ankidroid.version}`);
      logger.info(`APK already exists: ${apkFile}`);
    } else {
      progress.start(`Downloading AnkiDroid v${CONFIG.ankidroid.version} from GitHub...`);
      logger.info(`Downloading APK from: ${getAnkidroidApkUrl()}`);

      try {
        await downloadFile(getAnkidroidApkUrl(), apkFile);
        progress.succeed(`Downloaded AnkiDroid v${CONFIG.ankidroid.version}`);
        logger.info(`APK downloaded to: ${apkFile}`);
      } catch (error) {
        progress.fail('Failed to download AnkiDroid APK');
        throw error;
      }
    }

    progress.start('Installing AnkiDroid on emulator...');
    logger.info('Installing APK on device');

    const { exitCode: installCode } = await exec(paths.adb, ['install', apkFile], { logger });

    if (installCode !== 0) {
      throw new Error('Failed to install AnkiDroid APK');
    }
    progress.succeed('AnkiDroid installed successfully');

    progress.start('Granting all required permissions to AnkiDroid...');
    logger.info('Granting all required permissions');

    await exec(
      paths.adb,
      ['shell', 'appops', 'set', CONFIG.ankidroid.packageName, 'MANAGE_EXTERNAL_STORAGE', 'allow'],
      { logger, silent: true }
    );

    await exec(
      paths.adb,
      [
        'shell',
        'pm',
        'grant',
        CONFIG.ankidroid.packageName,
        'android.permission.READ_EXTERNAL_STORAGE',
      ],
      { logger, silent: true }
    );
    
    await exec(
      paths.adb,
      [
        'shell',
        'pm',
        'grant',
        CONFIG.ankidroid.packageName,
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ],
      { logger, silent: true }
    );
    
    progress.succeed('All permissions granted');

    progress.start('Launching AnkiDroid...');
    logger.info('Launching AnkiDroid application');

    await exec(
      paths.adb,
      [
        'shell',
        'monkey',
        '-p',
        CONFIG.ankidroid.packageName,
        '-c',
        'android.intent.category.LAUNCHER',
        '1',
      ],
      { logger }
    );
    progress.succeed('AnkiDroid launched');

    progress.log(`\n✅ AnkiDroid installed with all permissions!`);
    progress.log(
      `🖥️  View it through VNC on display ${CONFIG.emulator.display} (port ${CONFIG.emulator.vncPort})`,
      'verbose'
    );
    progress.log(`📝 Log file: ${logger.getLogFile()}`, 'verbose');
  } catch (error) {
    progress.fail('Failed to install AnkiDroid');
    logger.error('AnkiDroid installation failed', error);
    progress.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    progress.error(`📝 Check log file for details: ${logger.getLogFile()}`, 'verbose');
    process.exit(1);
  }
}

export async function ankiUninstall(): Promise<void> {
  const logger = new Logger('anki-uninstall');
  const paths = getAndroidPaths();
  const progress = new Progress();

  try {
    logger.info('Starting AnkiDroid uninstallation');

    progress.start('Checking if emulator is running...');
    const { stdout: devices } = await exec(paths.adb, ['devices'], {
      logger,
      silent: true,
    });

    if (!devices.includes('emulator') || !devices.includes('device')) {
      progress.fail('No emulator found');
      console.error(`\nPlease start the emulator first with 'emu start'`);
      process.exit(1);
    }
    progress.succeed('Emulator is running');

    progress.start('Checking if AnkiDroid is installed...');
    const { stdout: packages } = await exec(paths.adb, ['shell', 'pm', 'list', 'packages'], {
      logger,
      silent: true,
    });

    if (!packages.includes(CONFIG.ankidroid.packageName)) {
      progress.info('AnkiDroid is not installed');
      process.exit(0);
    }
    progress.succeed('AnkiDroid found');

    progress.start('Uninstalling AnkiDroid...');
    logger.info('Uninstalling AnkiDroid');
    
    const { exitCode } = await exec(paths.adb, ['uninstall', CONFIG.ankidroid.packageName], { logger });
    
    if (exitCode !== 0) {
      throw new Error('Failed to uninstall AnkiDroid');
    }
    
    progress.succeed('AnkiDroid uninstalled successfully');
    progress.log(`\n✅ AnkiDroid has been uninstalled`);
    progress.log(`📝 Log file: ${logger.getLogFile()}`, 'verbose');
  } catch (error) {
    progress.fail('Failed to uninstall AnkiDroid');
    logger.error('AnkiDroid uninstallation failed', error);
    progress.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    progress.error(`📝 Check log file for details: ${logger.getLogFile()}`, 'verbose');
    process.exit(1);
  }
}

export async function ankiPermissions(): Promise<void> {
  const logger = new Logger('anki-permissions');
  const paths = getAndroidPaths();
  const progress = new Progress();
  const tauriAppPackage = 'com.demo.tauri_app';
  const ankiPermission = 'com.ichi2.anki.permission.READ_WRITE_DATABASE';

  try {
    logger.info('Granting AnkiDroid API permissions to Tauri app');

    progress.start('Checking if emulator is running...');
    const { stdout: devices } = await exec(paths.adb, ['devices'], {
      logger,
      silent: true,
    });

    if (!devices.includes('emulator') || !devices.includes('device')) {
      progress.fail('No emulator found');
      console.error(`\nPlease start the emulator first with 'emu start'`);
      process.exit(1);
    }
    progress.succeed('Emulator is running');

    progress.start('Checking if AnkiDroid is installed...');
    const { stdout: packages } = await exec(paths.adb, ['shell', 'pm', 'list', 'packages'], {
      logger,
      silent: true,
    });

    if (!packages.includes(CONFIG.ankidroid.packageName)) {
      progress.fail('AnkiDroid is not installed');
      console.error(`\nPlease install AnkiDroid first with 'emu anki install'`);
      process.exit(1);
    }
    progress.succeed('AnkiDroid is installed');

    progress.start('Checking if Tauri app is installed');
    if (!packages.includes(tauriAppPackage)) {
      progress.fail('Tauri app is not installed');
      console.error(`\nPlease run 'npm run dev' or 'npm run test' to install the Tauri app first`);
      process.exit(1);
    }
    progress.succeed('Tauri app is installed');

    progress.start(`Granting AnkiDroid API permission to Tauri app...`);
    logger.info(`Granting ${ankiPermission} to ${tauriAppPackage}`);

    await exec(paths.adb, ['shell', 'pm', 'grant', tauriAppPackage, ankiPermission], {
      logger,
      silent: true,
    });

    progress.succeed('Permission granted successfully');
    progress.log(`\n✅ Granted AnkiDroid API permission to Tauri app`);
    progress.log(`   ${ankiPermission} → ${tauriAppPackage}`);
    progress.log(`📝 Log file: ${logger.getLogFile()}`, 'verbose');
  } catch (error) {
    progress.fail('Failed to grant permissions');
    logger.error('Failed to grant AnkiDroid API permissions', error);
    progress.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    progress.error(`📝 Check log file for details: ${logger.getLogFile()}`, 'verbose');
    process.exit(1);
  }
}