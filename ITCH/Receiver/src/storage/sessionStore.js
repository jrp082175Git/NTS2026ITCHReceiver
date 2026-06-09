export class SessionStore {
  constructor(redisClient, config, env, version) {
    this.redis = redisClient;
    this.enabled = config.redis.enabled;
    this.key = `${config.redis.keyPrefix || 'receiver'}:${env}:${version}:session`;
  }

  async storeSessionData(data) {
    if (!this.enabled || !this.redis) return;

    const pipeline = this.redis.pipeline();
    for (const [field, value] of Object.entries(data)) {
      pipeline.hset(this.key, field, String(value));
    }
    pipeline.hset(this.key, 'updatedAt', Date.now().toString());
    await pipeline.exec();
  }

  async updateLastSequence(sequenceNo) {
    if (!this.enabled || !this.redis) return;
    await this.redis.hset(this.key, 'lastSequenceNo', sequenceNo.toString(), 'updatedAt', Date.now().toString());
  }

  async getSessionData() {
    if (!this.enabled || !this.redis) return null;
    return await this.redis.hgetall(this.key);
  }

  async clearSession() {
    if (!this.enabled || !this.redis) return;
    await this.redis.del(this.key);
  }
}
