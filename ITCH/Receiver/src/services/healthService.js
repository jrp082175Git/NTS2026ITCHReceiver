export class HealthService {
  constructor(client, storageStore, sequenceService, config) {
    this.client = client;
    this.storageStore = storageStore;
    this.sequenceService = sequenceService;
    this.config = config;
  }

  async getStatus() {
    let redisStatus = 'disabled';
    if (this.storageStore.redis && this.storageStore.redis.getClient()) {
       redisStatus = this.storageStore.redis.getClient().status;
    }

    return {
      status: 'UP',
      connectedToPse: this.client ? this.client.isConnected : false,
      isLoggedIn: this.client ? this.client.isLoggedIn : false,
      lastSequenceNo: this.sequenceService ? this.sequenceService.getLastSequenceNo() : 0,
      redisStatus: redisStatus,
      uptime: process.uptime()
    };
  }
}
