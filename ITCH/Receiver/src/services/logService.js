import pino from 'pino';
import path from 'path';
import fs from 'fs';

export class LogService {
  constructor(config, userInitials) {
    this.config = config.logging;
    const dateStr = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '');
    const initialsStr = userInitials.join('-');

    const filename = this.config.filenamePattern
      .replace('{USER_INITIAL}', initialsStr)
      .replace('{MMDDYYYY}', dateStr);

    const logPath = path.join(process.cwd(), this.config.logFolder, filename);

    // Ensure log directory exists
    if (!fs.existsSync(path.join(process.cwd(), this.config.logFolder))) {
        fs.mkdirSync(path.join(process.cwd(), this.config.logFolder), { recursive: true });
    }

    const transportList = [];

    // File transport
    transportList.push({
      target: 'pino/file',
      options: { destination: logPath, append: true }
    });

    if (this.config.enableConsole) {
       transportList.push({
           target: 'pino/file',
           options: { destination: 1 } // stdout
       });
    }

    this.logger = pino({
      level: this.config.level || 'info',
      timestamp: pino.stdTimeFunctions.isoTime
    }, pino.transport({ targets: transportList }));
  }

  getLogger() {
    return this.logger;
  }
}
