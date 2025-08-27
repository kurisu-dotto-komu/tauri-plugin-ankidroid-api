import { createWriteStream, unlink } from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import ora from 'ora';
import { CONFIG, getAndroidPaths, getAnkidroidApkUrl } from '../config.js';
import { exec } from '../utils/exec.js';
import { Logger } from '../utils/logger.js';

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

export async function installAnkiDroid(reinstall: boolean = false): Promise<void> {
  const logger = new Logger('ankidroid-install');
  const paths = getAndroidPaths();
  const spinner = ora();

  try {
    logger.info('Starting AnkiDroid installation process');

    spinner.start('Checking if emulator is running...');
    const { stdout: devices } = await exec(paths.adb, ['devices'], {
      logger,
      silent: true,
    });

    if (!devices.includes('emulator') || !devices.includes('device')) {
      spinner.fail('No emulator found');
      console.error(`\nPlease start the emulator first with 'emu start'`);
      process.exit(1);
    }
    spinner.succeed('Emulator is running');

    spinner.start('Checking if AnkiDroid is already installed...');
    const { stdout: packages } = await exec(paths.adb, ['shell', 'pm', 'list', 'packages'], {
      logger,
      silent: true,
    });

    if (packages.includes(CONFIG.ankidroid.packageName)) {
      spinner.info('AnkiDroid is already installed');

      if (!reinstall) {
        const readline = await import('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const answer = await new Promise<string>((resolve) => {
          rl.question('Do you want to reinstall? (y/n) ', resolve);
        });
        rl.close();

        if (answer.toLowerCase() !== 'y') {
          logger.info('User chose not to reinstall');
          process.exit(0);
        }
      }

      spinner.start('Uninstalling existing AnkiDroid...');
      logger.info('Uninstalling existing AnkiDroid');
      await exec(paths.adb, ['uninstall', CONFIG.ankidroid.packageName], { logger });
      spinner.succeed('Existing AnkiDroid uninstalled');
    } else {
      spinner.succeed('AnkiDroid not currently installed');
    }

    const apkDir = path.join(PROJECT_ROOT, CONFIG.ankidroid.apkDir);
    await fs.ensureDir(apkDir);

    const apkFile = path.join(apkDir, `AnkiDroid-${CONFIG.ankidroid.version}.apk`);

    if (await fs.pathExists(apkFile)) {
      spinner.info(`Using existing AnkiDroid APK v${CONFIG.ankidroid.version}`);
      logger.info(`APK already exists: ${apkFile}`);
    } else {
      spinner.start(`Downloading AnkiDroid v${CONFIG.ankidroid.version} from GitHub...`);
      logger.info(`Downloading APK from: ${getAnkidroidApkUrl()}`);

      try {
        await downloadFile(getAnkidroidApkUrl(), apkFile);
        spinner.succeed(`Downloaded AnkiDroid v${CONFIG.ankidroid.version}`);
        logger.info(`APK downloaded to: ${apkFile}`);
      } catch (error) {
        spinner.fail('Failed to download AnkiDroid APK');
        throw error;
      }
    }

    spinner.start('Installing AnkiDroid on emulator...');
    logger.info('Installing APK on device');

    const { exitCode: installCode } = await exec(paths.adb, ['install', apkFile], { logger });

    if (installCode !== 0) {
      throw new Error('Failed to install AnkiDroid APK');
    }
    spinner.succeed('AnkiDroid installed successfully');

    // Grant file management permissions to AnkiDroid
    spinner.start('Granting file management permissions to AnkiDroid...');
    logger.info('Granting file management permissions');

    // Grant MANAGE_EXTERNAL_STORAGE permission
    await exec(
      paths.adb,
      ['shell', 'appops', 'set', CONFIG.ankidroid.packageName, 'MANAGE_EXTERNAL_STORAGE', 'allow'],
      { logger, silent: true }
    );

    // Also grant regular storage permissions
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
    spinner.succeed('File management permissions granted');

    spinner.start('Launching AnkiDroid...');
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
    spinner.succeed('AnkiDroid launched');

    console.log(`\n✅ AnkiDroid installed and running!`);
    console.log(
      `🖥️  View it through VNC on display ${CONFIG.emulator.display} (port ${CONFIG.emulator.vncPort})`
    );
    console.log(`📝 Log file: ${logger.getLogFile()}`);
  } catch (error) {
    spinner.fail('Failed to install AnkiDroid');
    logger.error('AnkiDroid installation failed', error);
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(`📝 Check log file for details: ${logger.getLogFile()}`);
    process.exit(1);
  }
}
