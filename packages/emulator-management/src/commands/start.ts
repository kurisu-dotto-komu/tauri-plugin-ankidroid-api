import type { Subprocess } from 'execa';
import ora from 'ora';
import { CONFIG, getAndroidPaths } from '../config.js';
import { spawn, exec, waitForCondition } from '../utils/exec.js';
import { Logger } from '../utils/logger.js';
import { SignalHandler, formatTime } from '../utils/signal.js';

export async function startEmulator(): Promise<void> {
  const logger = new Logger('emulator-start');
  const paths = getAndroidPaths();
  const spinner = ora();
  let emulatorProcess: Subprocess | null = null;
  const signalHandler = new SignalHandler();

  // Register cleanup for logger
  signalHandler.register(() => {
    logger.closeProcessLogger();
  });

  try {
    logger.info('Starting emulator launch process');

    spinner.start('Checking if emulator is already running...');
    const { stdout: psOutput } = await exec('pgrep', ['-f', `emulator.*${CONFIG.avd.name}`], {
      logger,
      silent: true,
    });

    if (psOutput) {
      spinner.info('Emulator is already running');
      console.log(
        `Connect via VNC on display ${CONFIG.emulator.display} (port ${CONFIG.emulator.vncPort})`
      );
      return;
    }
    spinner.succeed('No running emulator found');

    spinner.start('Checking if AVD exists...');
    const { stdout: avdList } = await exec(paths.avdmanager, ['list', 'avd'], {
      logger,
      silent: true,
    });

    if (!avdList.includes(CONFIG.avd.name)) {
      spinner.fail(`AVD ${CONFIG.avd.name} not found`);
      console.error(`\nRun 'emu create' first`);
      process.exit(1);
    }
    spinner.succeed('AVD found');

    spinner.start(`Starting Android emulator on display ${CONFIG.emulator.display} (VNC)...`);
    logger.info('Launching emulator process');

    const emulatorLogStream = logger.createProcessLogger('emulator-output');

    const emulatorArgs = [
      '-avd',
      CONFIG.avd.name,
      '-memory',
      CONFIG.avd.ramSize.toString(),
      '-gpu',
      CONFIG.avd.gpu.mode,
    ];

    if (CONFIG.emulator.options.noAudio) emulatorArgs.push('-no-audio');
    if (CONFIG.emulator.options.noBootAnim) emulatorArgs.push('-no-boot-anim');
    if (CONFIG.emulator.options.noMetrics) emulatorArgs.push('-no-metrics');

    emulatorProcess = spawn(paths.emulatorBin, emulatorArgs, {
      logger,
      env: {
        ...process.env,
        DISPLAY: CONFIG.emulator.display,
        ANDROID_HOME: paths.androidHome,
      },
      detached: true,
      stdio: 'pipe',
    });

    if (emulatorProcess.stdout) {
      emulatorProcess.stdout.pipe(emulatorLogStream);
    }
    if (emulatorProcess.stderr) {
      emulatorProcess.stderr.pipe(emulatorLogStream);
    }

    const pid = emulatorProcess.pid;
    logger.info(`Emulator started with PID: ${pid}`);
    spinner.succeed(`Emulator process started (PID: ${pid})`);

    // Register emulator process for cleanup
    signalHandler.registerProcess(emulatorProcess, 'emulator');

    spinner.start(`Waiting for emulator to boot (timeout: ${CONFIG.emulator.bootTimeout}s)...`);
    logger.info('Waiting for device to appear in ADB');

    const deviceReady = await waitForCondition(
      async () => {
        const { stdout } = await exec(paths.adb, ['devices'], {
          logger,
          silent: true,
        });
        return stdout.includes('emulator') && stdout.includes('device');
      },
      CONFIG.emulator.bootTimeout * 1000,
      CONFIG.emulator.bootCheckInterval * 1000,
      logger,
      (remainingSeconds) => {
        spinner.text = `Waiting for emulator to boot (${formatTime(remainingSeconds)} remaining)...`;
      }
    );

    if (!deviceReady) {
      spinner.fail('Emulator failed to start within timeout');
      logger.error('Emulator boot timeout');

      if (emulatorProcess) {
        emulatorProcess.kill();
      }

      console.error(`\n📝 Check log file for details: ${logger.getLogFile()}`);
      process.exit(1);
    }

    spinner.text = 'Device detected, checking boot status...';
    logger.info('Device detected in ADB, checking boot completion');

    const bootComplete = await waitForCondition(
      async () => {
        const { stdout: bootStatus } = await exec(
          paths.adb,
          ['shell', 'getprop', 'sys.boot_completed'],
          { logger, silent: true }
        );
        return bootStatus.trim() === '1';
      },
      60000,
      2000,
      logger,
      (remainingSeconds) => {
        spinner.text = `Checking boot completion (${formatTime(remainingSeconds)} remaining)...`;
      }
    );

    if (!bootComplete) {
      spinner.warn('Boot not fully completed, but device is responsive');
      logger.warn('Boot completion check timed out');
    } else {
      spinner.succeed('Emulator booted successfully!');
      logger.info('Boot completed successfully');

      spinner.start('Setting 3-button navigation mode...');
      await exec(
        paths.adb,
        ['shell', 'cmd', 'overlay', 'enable', 'com.android.internal.systemui.navbar.threebutton'],
        { logger }
      );
      spinner.succeed('Navigation mode configured');
    }

    logger.closeProcessLogger();

    console.log(`\n✅ Emulator started successfully!`);
    console.log(
      `🖥️  Connect via VNC to view the emulator (display ${CONFIG.emulator.display}, port ${CONFIG.emulator.vncPort})`
    );
    console.log(`📝 Log file: ${logger.getLogFile()}`);
    console.log(`\nRun 'emu install-anki' to install AnkiDroid`);

    if (emulatorProcess) {
      emulatorProcess.unref();
    }
  } catch (error) {
    spinner.fail('Failed to start emulator');
    logger.error('Emulator start failed', error);
    logger.closeProcessLogger();

    if (emulatorProcess) {
      emulatorProcess.kill();
    }

    console.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(`📝 Check log file for details: ${logger.getLogFile()}`);
    process.exit(1);
  }
}

export async function stopEmulator(): Promise<void> {
  const logger = new Logger('emulator-stop');
  const paths = getAndroidPaths();
  const spinner = ora();

  try {
    logger.info('Stopping emulator');
    spinner.start('Stopping emulator...');

    await exec(paths.adb, ['emu', 'kill'], { logger, silent: true });

    await exec('pkill', ['-f', `emulator.*${CONFIG.avd.name}`], {
      logger,
      silent: true,
    });

    spinner.succeed('Emulator stopped');
    logger.info('Emulator stopped successfully');
    console.log(`📝 Log file: ${logger.getLogFile()}`);
  } catch (error) {
    spinner.fail('Failed to stop emulator');
    logger.error('Failed to stop emulator', error);
    console.error(`\n⚠️  Emulator may not have been running`);
    console.error(`📝 Check log file for details: ${logger.getLogFile()}`);
  }
}
