export class PacketStore {
  constructor(redisClient, config, env, version) {
    this.redis = redisClient;
    this.enabled = config.redis.enabled;
    this.prefix = `${config.redis.keyPrefix || 'receiver'}:${env}:${version}:packets`;
    this.binaryKey = `${this.prefix}:binary`;
    this.jsonKey = `${this.prefix}:json`;
  }

  async storePacket(binaryBuffer, packetJsonStr) {
    if (!this.enabled || !this.redis) return;

    const pipeline = this.redis.pipeline();
    // RPUSH is generally faster for binary appending, or XADD if streams are preferred.
    // Spec says "Redis stream or list"
    pipeline.rpush(this.binaryKey, binaryBuffer);
    pipeline.rpush(this.jsonKey, packetJsonStr);

    await pipeline.exec();
  }

  async clearSessionPackets() {
    if (!this.enabled || !this.redis) return;
    await this.redis.del(this.binaryKey, this.jsonKey);
  }
}
