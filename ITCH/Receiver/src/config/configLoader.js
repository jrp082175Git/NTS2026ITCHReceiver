import fs from 'fs';
import path from 'path';

export function loadConfig(configPath = './config/receiver.config.json') {
  try {
    const rawData = fs.readFileSync(path.resolve(process.cwd(), configPath), 'utf8');
    const config = JSON.parse(rawData);

    // Basic validation to ensure expected keys exist
    const requiredSections = [
      'environments', 'soupBinTcp', 'redis', 'socketIo',
      'tcpRelay', 'tcpRetransmission', 'apiServer', 'logging',
      'runtime', 'parser'
    ];

    for (const section of requiredSections) {
      if (!config[section]) {
        throw new Error(`Missing required configuration section: ${section}`);
      }
    }

    if (!config.environments.PROD || !config.environments.DR) {
      throw new Error('Configuration must include both PROD and DR environments');
    }

    return config;
  } catch (error) {
    console.error(`Failed to load configuration from ${configPath}:`, error.message);
    process.exit(1);
  }
}
