export class MessageStore {
  constructor(redisClient, config, env, version) {
    this.redis = redisClient;
    this.enabled = config.redis.enabled;
    this.prefix = `${config.redis.keyPrefix || 'receiver'}:${env}:${version}:messages`;
    this.binaryKey = `${this.prefix}:binary`;
    this.jsonKey = `${this.prefix}:json`;
  }

  async storeMessage(sequenceNo, binaryBuffer, messageJsonStr) {
    if (!this.enabled || !this.redis) return;

    const pipeline = this.redis.pipeline();
    // Redis sorted set where score = sequenceNo
    pipeline.zadd(this.binaryKey, sequenceNo, binaryBuffer);
    pipeline.zadd(this.jsonKey, sequenceNo, messageJsonStr);

    // Optional direct key for exact lookup
    pipeline.set(`${this.prefix}:bySeq:${sequenceNo}`, messageJsonStr);

    await pipeline.exec();
  }

  async getMessagesBySequenceRange(beginningSequence, endingSequence) {
    if (!this.enabled || !this.redis) return [];

    // Use ZRANGEBYSCORE to get the range from sorted set
    const results = await this.redis.zrangebyscore(this.jsonKey, beginningSequence, endingSequence);
    return results;
  }

  async clearSessionMessages() {
    if (!this.enabled || !this.redis) return;

    // ZREMRANGEBYRANK to clear sorted sets
    await this.redis.del(this.binaryKey, this.jsonKey);
    // Also clear the individual keys pattern if needed, but standard DEL on main keys is most important
  }
}
