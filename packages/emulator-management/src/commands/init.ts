import chalk from 'chalk';
import { Logger } from '../utils/logger.js';
import { SignalHandler } from '../utils/signal.js';
import { createAVD } from './create.js';
import { installAnkiDroid } from './install-anki.js';
import { startEmulator } from './start.js';

export async function initializeEmulator(): Promise<void> {
  const logger = new Logger('emulator-init');
  const signalHandler = new SignalHandler();

  // Register cleanup
  signalHandler.register(() => {
    console.log(chalk.yellow('\n\n⚠️  Initialization interrupted by user'));
    logger.info('Initialization interrupted by user');
  });

  console.log(chalk.blue.bold('\n🚀 Initializing Android Emulator Environment\n'));
  logger.info('Starting emulator initialization process');

  const steps = [
    {
      name: 'Create AVD',
      action: async () => {
        console.log(chalk.cyan('\n📦 Step 1/3: Creating Android Virtual Device...'));
        await createAVD();
      },
    },
    {
      name: 'Start Emulator',
      action: async () => {
        console.log(chalk.cyan('\n🖥️  Step 2/3: Starting Android Emulator...'));
        await startEmulator();
      },
    },
    {
      name: 'Install AnkiDroid',
      action: async () => {
        console.log(chalk.cyan('\n📱 Step 3/3: Installing AnkiDroid...'));
        await installAnkiDroid(true); // Force reinstall to ensure clean state
      },
    },
  ];

  let completedSteps = 0;
  const totalSteps = steps.length;

  for (const step of steps) {
    try {
      await step.action();
      completedSteps++;
      console.log(chalk.green(`\n✅ Completed: ${step.name} (${completedSteps}/${totalSteps})`));
      logger.info(`Completed step: ${step.name}`);
    } catch (error) {
      console.error(chalk.red(`\n❌ Failed at step: ${step.name}`));
      logger.error(`Failed at step: ${step.name}`, error);
      console.error(
        chalk.red(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      );
      console.log(chalk.yellow(`\n📝 Check log file for details: ${logger.getLogFile()}`));

      // Ask if user wants to continue
      if (completedSteps < totalSteps - 1) {
        const readline = await import('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const answer = await new Promise<string>((resolve) => {
          rl.question('\nDo you want to continue with the remaining steps? (y/n) ', resolve);
        });
        rl.close();

        if (answer.toLowerCase() !== 'y') {
          console.log(chalk.yellow('\n⚠️  Initialization stopped by user'));
          logger.info('Initialization stopped by user after error');
          process.exit(1);
        }
      }
    }
  }

  // Final summary
  console.log(chalk.green.bold('\n🎉 Emulator initialization complete!\n'));
  console.log(chalk.white('You can now:'));
  console.log(chalk.gray('  • View the emulator via VNC on display :1 (port 5901)'));
  console.log(chalk.gray('  • Build and install your app with appropriate commands'));
  console.log(chalk.gray('  • Stop the emulator with: emu stop'));
  console.log(chalk.gray('\n📝 All logs saved to: ./logs/'));

  logger.info('Emulator initialization completed successfully');
}
