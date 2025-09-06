import type { Subprocess } from 'execa';
import ora from 'ora';
import { CONFIG, getAndroidPaths } from '../config.js';
import { spawn, exec, waitForCondition } from '../utils/exec.js';
import { Logger, getLogLevel } from '../utils/logger.js';
import { SignalHandler, formatTime } from '../utils/signal.js';

export async function startEmulator(): Promise<void> {
  const logger = new Logger('emulator-start');
  const paths = getAndroidPaths();
  const spinner = getLogLevel() === 'verbose' ? ora() : null;
  let emulatorProcess: Subprocess | null = null;
  const signalHandler = new SignalHandler();

  // Register cleanup for logger
  signalHandler.register(() => {
    logger.closeProcessLogger();
  });

  try {
    logger.info('Starting emulator launch process');

    if (spinner) spinner.start('Checking if emulator is already running...');
    const { stdout: psOutput } = await exec('pgrep', ['-f', `emulator.*${CONFIG.avd.name}`], {
      logger,
      silent: true,
    });

    if (psOutput) {
      if (spinner) spinner.info('Emulator is already running');
      if (getLogLevel() !== 'silent') {
        console.log(
          `🖥️  Emulator already running. Connect via VNC on display ${CONFIG.emulator.display} (port ${CONFIG.emulator.vncPort})`
        );
      }
      return;
    }
    if (spinner) spinner.succeed('No running emulator found');

    if (spinner) spinner.start('Checking if AVD exists...');
    const { stdout: avdList } = await exec(paths.avdmanager, ['list', 'avd'], {
      logger,
      silent: true,
    });

    if (!avdList.includes(CONFIG.avd.name)) {
      if (spinner) spinner.fail(`AVD ${CONFIG.avd.name} not found`);
      console.error(`\nRun 'emu init' first`);
      process.exit(1);
    }
    if (spinner) spinner.succeed('AVD found');

    if (spinner) spinner.start(`Starting Android emulator on display ${CONFIG.emulator.display} (VNC)...`);
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
    if (spinner) spinner.succeed(`Emulator process started (PID: ${pid}`);

    // Register emulator process for cleanup
    signalHandler.registerProcess(emulatorProcess, 'emulator');

    if (spinner) spinner.start(`Waiting for emulator to boot (timeout: ${CONFIG.emulator.bootTimeout}s)...`);
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
        if (spinner) spinner.text = `Waiting for emulator to boot (${formatTime(remainingSeconds)} remaining)...`;
      }
    );

    if (!deviceReady) {
      if (spinner) spinner.fail('Emulator failed to start within timeout');
      logger.error('Emulator boot timeout');

      if (emulatorProcess) {
        emulatorProcess.kill();
      }

      if (getLogLevel() === 'verbose') console.error(`\n📝 Check log file for details: ${logger.getLogFile()}`);
      process.exit(1);
    }

    if (spinner) spinner.text = 'Device detected, checking boot status...';
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
        if (spinner) spinner.text = `Checking boot completion (${formatTime(remainingSeconds)} remaining)...`;
      }
    );

    if (!bootComplete) {
      if (spinner) spinner.warn('Boot not fully completed, but device is responsive');
      logger.warn('Boot completion check timed out');
    } else {
      if (spinner) spinner.succeed('Emulator booted successfully!');
      logger.info('Boot completed successfully');

      // Configure 3-button navigation
      if (spinner) spinner.start('Setting 3-button navigation mode...');
      await exec(
        paths.adb,
        ['shell', 'cmd', 'overlay', 'enable', 'com.android.internal.systemui.navbar.threebutton'],
        { logger, silent: true }
      );
      if (spinner) spinner.succeed('Navigation mode configured');
    }

    logger.closeProcessLogger();

    if (getLogLevel() !== 'silent') {
      console.log(`✅ Emulator started successfully!`);
      console.log(
        `🖥️  Connect via VNC to view the emulator (display ${CONFIG.emulator.display}, port ${CONFIG.emulator.vncPort})`
      );
      if (getLogLevel() === 'verbose') {
        console.log(`📝 Log file: ${logger.getLogFile()}`);
      }
    }

    if (emulatorProcess) {
      emulatorProcess.unref();
      if (getLogLevel() === 'verbose') {
        console.log('🏋 Running in background...');
        console.log('   Run "emu stop" to shut down the emulator');
      }

      // Clean exit - detach from emulator process
      signalHandler.detachAll();
      process.exit(0);
    }
  } catch (error) {
    if (spinner) spinner.fail('Failed to start emulator');
    logger.error('Emulator start failed', error);
    logger.closeProcessLogger();

    if (emulatorProcess) {
      emulatorProcess.kill();
    }

    console.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    if (getLogLevel() === 'verbose') console.error(`📝 Check log file for details: ${logger.getLogFile()}`);
    process.exit(1);
  }
}

export async function stopEmulator(): Promise<void> {
  const logger = new Logger('emulator-stop');
  const paths = getAndroidPaths();
  const spinner = getLogLevel() === 'verbose' ? ora() : null;

  try {
    logger.info('Stopping emulator');
    if (spinner) spinner.start('Stopping emulator...');

    await exec(paths.adb, ['emu', 'kill'], { logger, silent: true });

    await exec('pkill', ['-f', `emulator.*${CONFIG.avd.name}`], {
      logger,
      silent: true,
    });

    if (spinner) spinner.succeed('Emulator stopped');
    logger.info('Emulator stopped successfully');
    if (getLogLevel() !== 'silent') {
      console.log(`✅ Emulator stopped successfully`);
      if (getLogLevel() === 'verbose') {
        console.log(`📝 Log file: ${logger.getLogFile()}`);
      }
    }
  } catch (error) {
    if (spinner) spinner.fail('Failed to stop emulator');
    logger.error('Failed to stop emulator', error);
    console.error(`\n⚠️  Emulator may not have been running`);
    if (getLogLevel() === 'verbose') console.error(`📝 Check log file for details: ${logger.getLogFile()}`);
  }
}
