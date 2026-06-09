import Redis from 'ioredis';

export class RedisConnection {
  constructor(config) {
    this.config = config.redis;
    this.enabled = this.config.enabled;
    this.client = null;
    if (this.enabled) {
      this.client = new Redis({
        host: this.config.host || '127.0.0.1',
        port: this.config.port || 6379,
        password: this.config.password || undefined,
        db: this.config.db || 0,
        lazyConnect: true
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error', err);
      });
    }
  }

  async connect() {
    if (this.enabled && this.client) {
      await this.client.connect();
      console.log(`Connected to Redis at ${this.config.host}:${this.config.port}`);
    }
  }

  async disconnect() {
    if (this.enabled && this.client) {
      await this.client.quit();
    }
  }

  getClient() {
    return this.client;
  }
}
