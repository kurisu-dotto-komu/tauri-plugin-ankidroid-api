import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import { CONFIG, getAndroidPaths } from '../config.js';
import { exec } from '../utils/exec.js';
import { Logger } from '../utils/logger.js';

export async function createAVD(): Promise<void> {
  const logger = new Logger('emulator-create');
  const paths = getAndroidPaths();
  const spinner = ora();

  try {
    logger.info('Starting AVD creation process');

    spinner.start('Checking for existing AVD...');
    const { stdout: avdList } = await exec(paths.avdmanager, ['list', 'avd'], {
      logger,
      silent: true,
    });

    if (avdList.includes(CONFIG.avd.name)) {
      spinner.info(`AVD ${CONFIG.avd.name} already exists. Deleting and recreating...`);
      logger.info('Deleting existing AVD');

      await exec(paths.avdmanager, ['delete', 'avd', '-n', CONFIG.avd.name], {
        logger,
        silent: true,
      });
    } else {
      spinner.succeed('No existing AVD found');
    }

    spinner.start('Installing system image...');
    logger.info(`Installing system image: ${CONFIG.avd.systemImage}`);

    const { exitCode: sdkExitCode } = await exec(paths.sdkmanager, [CONFIG.avd.systemImage], {
      logger,
      env: {
        ...process.env,
        JAVA_HOME: process.env.JAVA_HOME || '/usr/lib/jvm/java-11-openjdk-amd64',
      },
    });

    if (sdkExitCode !== 0) {
      throw new Error('Failed to install system image');
    }
    spinner.succeed('System image installed');

    spinner.start(`Creating AVD: ${CONFIG.avd.name} (Pixel 7)...`);
    logger.info('Creating new AVD');

    const { exitCode: createExitCode } = await exec(
      paths.avdmanager,
      [
        'create',
        'avd',
        '-n',
        CONFIG.avd.name,
        '-k',
        CONFIG.avd.packagePath,
        '-c',
        CONFIG.avd.sdCardSize,
        '--force',
      ],
      {
        logger,
        input: 'no\n',
      }
    );

    if (createExitCode !== 0) {
      throw new Error('Failed to create AVD');
    }

    spinner.succeed('AVD created successfully');

    spinner.start('Configuring AVD for optimal performance...');
    const avdConfigDir = path.join(CONFIG.paths.avdHome, `${CONFIG.avd.name}.avd`);
    const configFile = path.join(avdConfigDir, 'config.ini');

    if (await fs.pathExists(configFile)) {
      logger.info('Updating AVD configuration');

      const configAdditions = `
hw.ramSize=${CONFIG.avd.ramSize}
hw.gpu.enabled=${CONFIG.avd.gpu.enabled ? 'yes' : 'no'}
hw.gpu.mode=${CONFIG.avd.gpu.mode}
hw.keyboard=yes
hw.mainKeys=yes
showDeviceFrame=no
`;

      await fs.appendFile(configFile, configAdditions);
      spinner.succeed('AVD configured for optimal performance');
    } else {
      spinner.warn('Could not find AVD config file, using defaults');
      logger.warn(`Config file not found: ${configFile}`);
    }

    console.log(`\n✅ AVD ${CONFIG.avd.name} created successfully!`);
    console.log(`📝 Log file: ${logger.getLogFile()}`);
    console.log(`\nRun 'emu start' to launch the emulator`);
  } catch (error) {
    spinner.fail('Failed to create AVD');
    logger.error('AVD creation failed', error);
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(`📝 Check log file for details: ${logger.getLogFile()}`);
    process.exit(1);
  }
}
