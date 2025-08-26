#!/usr/bin/env node
import chalk from 'chalk';
import { program } from 'commander';
import { createAVD } from './commands/create.js';
import { initializeEmulator } from './commands/init.js';
import { installAnkiDroid } from './commands/install-anki.js';
import { startEmulator, stopEmulator } from './commands/start.js';
import { Logger } from './utils/logger.js';

program
  .name('emu')
  .description('Android emulator management CLI for Tauri AnkiDroid plugin development')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize complete emulator environment (create, start, install AnkiDroid)')
  .action(async () => {
    console.log(chalk.blue('Initializing Android emulator environment...'));
    await initializeEmulator();
  });

program
  .command('create')
  .description('Create a new Pixel 7 AVD for testing')
  .action(async () => {
    console.log(chalk.blue('Creating Android Virtual Device...'));
    await createAVD();
  });

program
  .command('start')
  .description('Start the Android emulator with VNC display')
  .action(async () => {
    console.log(chalk.blue('Starting Android emulator...'));
    await startEmulator();
  });

program
  .command('stop')
  .description('Stop the running Android emulator')
  .action(async () => {
    console.log(chalk.blue('Stopping Android emulator...'));
    await stopEmulator();
  });

program
  .command('install-anki')
  .description('Install AnkiDroid on the running emulator')
  .option('-r, --reinstall', 'Force reinstall even if already installed')
  .action(async (options: { reinstall?: boolean }) => {
    console.log(chalk.blue('Installing AnkiDroid...'));
    await installAnkiDroid(options.reinstall ?? false);
  });

program
  .command('logs')
  .description('Show the logs directory path')
  .action(() => {
    console.log(chalk.blue('Logs directory:'), Logger.getLogsDir());
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
