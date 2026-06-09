import chalk from 'chalk';

export class ConsoleDisplay {
  constructor(displayMode) {
    this.displayMode = displayMode;
    this.isOn = displayMode === 'DISPLAY:ON';
  }

  log(message) {
    if (this.isOn) {
      console.log(message);
    }
  }

  logJson(prefix, jsonString) {
    if (this.isOn) {
      console.log(chalk.yellow(`${prefix}: ${jsonString}`));
    }
  }

  logEvent(eventName) {
    if (this.isOn) {
      console.log(chalk.cyan(`[EVENT] ${eventName}`));
    }
  }

  logError(errorMsg) {
    console.error(chalk.red(`[ERROR] ${errorMsg}`));
  }
}
