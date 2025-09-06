#!/usr/bin/env node
import chalk from 'chalk';
import { program } from 'commander';
import { ankiInstall, ankiPermissions, ankiUninstall } from './commands/anki.js';
import { grantAppPermissions } from './commands/app-permissions.js';
import { createAVD } from './commands/create.js';
import { initializeEmulator } from './commands/init.js';
import { installAnkiDroid } from './commands/install-anki.js';
import { takeScreenshot } from './commands/screenshot.js';
import { startEmulator, stopEmulator } from './commands/start.js';
import { Logger, setLogLevel } from './utils/logger.js';

program
  .name('emu')
  .description('Android emulator management CLI for Tauri AnkiDroid plugin development')
  .version('0.1.0')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-s, --silent', 'Suppress all output except errors');

program
  .command('init')
  .description('Initialize complete emulator environment (create, start, install AnkiDroid)')
  .action(async () => {
    const opts = program.opts();
    setLogLevel(opts.silent ? 'silent' : opts.verbose ? 'verbose' : 'normal');
    if (!opts.silent) console.log(chalk.blue('Initializing Android emulator environment...'));
    await initializeEmulator();
  });

program
  .command('create')
  .description('Create a new Pixel 7 AVD for testing')
  .action(async () => {
    const opts = program.opts();
    setLogLevel(opts.silent ? 'silent' : opts.verbose ? 'verbose' : 'normal');
    if (!opts.silent) console.log(chalk.blue('Creating Android Virtual Device...'));
    await createAVD();
  });

program
  .command('start')
  .description('Start the Android emulator with VNC display')
  .action(async () => {
    const opts = program.opts();
    setLogLevel(opts.silent ? 'silent' : opts.verbose ? 'verbose' : 'normal');
    if (!opts.silent) console.log(chalk.blue('Starting Android emulator...'));
    await startEmulator();
  });

program
  .command('stop')
  .description('Stop the running Android emulator')
  .action(async () => {
    const opts = program.opts();
    setLogLevel(opts.silent ? 'silent' : opts.verbose ? 'verbose' : 'normal');
    if (!opts.silent) console.log(chalk.blue('Stopping Android emulator...'));
    await stopEmulator();
  });

program
  .command('install-anki')
  .description('Install AnkiDroid on the running emulator')
  .option('-r, --reinstall', 'Force reinstall even if already installed')
  .action(async (options: { reinstall?: boolean }) => {
    const opts = program.opts();
    setLogLevel(opts.silent ? 'silent' : opts.verbose ? 'verbose' : 'normal');
    if (!opts.silent) console.log(chalk.blue('Installing AnkiDroid...'));
    await installAnkiDroid(options.reinstall ?? false);
  });

program
  .command('logs')
  .description('Show the logs directory path')
  .action(() => {
    const opts = program.opts();
    setLogLevel(opts.silent ? 'silent' : opts.verbose ? 'verbose' : 'normal');
    console.log(chalk.blue('Logs directory:'), Logger.getLogsDir());
  });

program
  .command('screenshot')
  .description('Take a screenshot of the running emulator')
  .argument('[filename]', 'Optional filename for the screenshot (default: timestamped)')
  .action(async (filename?: string) => {
    const opts = program.opts();
    setLogLevel(opts.silent ? 'silent' : opts.verbose ? 'verbose' : 'normal');
    await takeScreenshot(filename);
  });

program
  .command('app-permissions')
  .description('Grant AnkiDroid database permissions to the Tauri app')
  .action(async () => {
    const opts = program.opts();
    setLogLevel(opts.silent ? 'silent' : opts.verbose ? 'verbose' : 'normal');
    await grantAppPermissions();
  });

const ankiCommand = program
  .command('anki')
  .description('Manage AnkiDroid installation and permissions');

ankiCommand
  .command('install')
  .description('Install AnkiDroid with all required permissions')
  .action(async () => {
    const opts = program.opts();
    setLogLevel(opts.silent ? 'silent' : opts.verbose ? 'verbose' : 'normal');
    if (!opts.silent) console.log(chalk.blue('Installing AnkiDroid with auto-permissions...'));
    await ankiInstall();
  });

ankiCommand
  .command('uninstall')
  .description('Uninstall AnkiDroid from the emulator')
  .action(async () => {
    const opts = program.opts();
    setLogLevel(opts.silent ? 'silent' : opts.verbose ? 'verbose' : 'normal');
    if (!opts.silent) console.log(chalk.blue('Uninstalling AnkiDroid...'));
    await ankiUninstall();
  });

ankiCommand
  .command('permissions')
  .description('Grant AnkiDroid API permissions to the Tauri app')
  .action(async () => {
    const opts = program.opts();
    setLogLevel(opts.silent ? 'silent' : opts.verbose ? 'verbose' : 'normal');
    if (!opts.silent) console.log(chalk.blue('Granting AnkiDroid API permissions to Tauri app...'));
    await ankiPermissions();
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
