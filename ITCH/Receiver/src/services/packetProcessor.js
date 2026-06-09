import { safeStringify } from '../utils/safeJson.js';

export class PacketProcessor {
  constructor(sequenceService, parsers, storageStore, broadcaster, logger, display) {
    this.sequenceService = sequenceService;
    this.parsers = parsers; // { V2026: ..., V2015: ... }
    this.storageStore = storageStore; // { packetStore, messageStore, sessionStore }
    this.broadcaster = broadcaster; // { socketIo, tcpRelay }
    this.logger = logger;
    this.display = display;

    // In-memory rolling buffers
    this.packetBuffer = [];
    this.packetJSONBuffer = [];
    this.messagesBuffer = [];
    this.messagesJSONBuffer = [];

    // Limits
    this.maxInMemoryPackets = 10000;
    this.maxInMemoryMessages = 10000;
  }

  setLimits(maxPackets, maxMessages) {
    this.maxInMemoryPackets = maxPackets;
    this.maxInMemoryMessages = maxMessages;
  }

  async processPacket(binaryPacket, packetInfo, activeVersion) {
    // 1. Convert to JSON string
    const packetJsonStr = safeStringify(packetInfo);

    // 2. Append to rolling buffers
    this.packetBuffer.push(binaryPacket);
    this.packetJSONBuffer.push(packetInfo);
    if (this.packetBuffer.length > this.maxInMemoryPackets) {
      this.packetBuffer.shift();
      this.packetJSONBuffer.shift();
    }

    // 3. Store to Redis
    if (this.storageStore.packetStore) {
      await this.storageStore.packetStore.storePacket(binaryPacket, packetJsonStr);
    }

    // 4. Broadcast
    if (this.broadcaster) {
      this.broadcaster.broadcastPacket(packetInfo, packetJsonStr);
    }

    // 5. Specific Behavior
    switch (packetInfo.packetType) {
      case 'A': // Login Accepted
        await this.handleLoginAccepted(packetInfo, packetJsonStr);
        break;
      case 'J': // Login Rejected
        await this.handleLoginRejected(packetInfo, packetJsonStr);
        break;
      case 'S': // Sequenced Data
        await this.handleSequencedData(binaryPacket, packetInfo, activeVersion);
        break;
      case 'U': // Unsequenced Data
        this.handleUnsequencedData(packetInfo, packetJsonStr);
        break;
      case 'H': // Server Heartbeat
        this.handleServerHeartbeat(packetInfo);
        break;
      case 'Z': // End of Session
        this.handleEndOfSession(packetInfo, packetJsonStr);
        break;
      case '+': // Debug Packet
        this.logger.info(`Debug Packet: ${packetJsonStr}`);
        if (this.display) this.display.log('Debug Packet received');
        break;
    }
  }

  async handleLoginAccepted(packetInfo, packetJsonStr) {
    // Handle 24x7 reset
    if (this.sequenceService.getLastSequenceNo() > 0 && packetInfo.sequenceNumber === 1) {
        this.logger.info("24x7 reset detected");
        // Reset sequence
        this.sequenceService.reset(1);
        if (this.storageStore.sessionStore) {
           await this.storageStore.sessionStore.updateLastSequence(0);
        }
    }

    this.sequenceService.setAcceptedSequenceNo(packetInfo.sequenceNumber);
    if (this.storageStore.sessionStore) {
      await this.storageStore.sessionStore.storeSessionData({
        currentSessionId: packetInfo.session,
        lastSequenceNo: this.sequenceService.getLastSequenceNo(),
        startedAt: Date.now()
      });
    }

    this.logger.info(`Login Accepted: ${packetJsonStr}`);
    if (this.display) this.display.log('Login Accepted');
    if (this.broadcaster) this.broadcaster.broadcastEvent('login_accepted', packetInfo);
  }

  async handleLoginRejected(packetInfo, packetJsonStr) {
    this.logger.error(`Login Rejected: ${packetJsonStr}`);
    if (this.display) this.display.log(`Login Rejected`);
    if (this.broadcaster) this.broadcaster.broadcastEvent('login_rejected', packetInfo);
  }

  async handleSequencedData(binaryPacket, packetInfo, activeVersion) {
    // payload starts at offset 3 for sequenced data (length 2 + type 1)
    const payload = binaryPacket.subarray(3);

    const parser = this.parsers[activeVersion];
    if (!parser) {
      this.logger.error(`No parser configured for version ${activeVersion}`);
      return;
    }

    try {
      const parsedMessage = parser.parse(payload);

      // Assign sequence number
      const sequenceNo = this.sequenceService.processSequencedPacket(packetInfo.sequenceNumber);
      parsedMessage.sequenceNo = sequenceNo;

      const messageJsonStr = safeStringify(parsedMessage);

      // Add to rolling buffers
      this.messagesBuffer.push(payload);
      this.messagesJSONBuffer.push(parsedMessage);
      if (this.messagesBuffer.length > this.maxInMemoryMessages) {
        this.messagesBuffer.shift();
        this.messagesJSONBuffer.shift();
      }

      // Store in Redis
      if (this.storageStore.messageStore) {
        await this.storageStore.messageStore.storeMessage(sequenceNo, payload, messageJsonStr);
      }

      if (this.storageStore.sessionStore) {
        await this.storageStore.sessionStore.updateLastSequence(sequenceNo);
      }

      // Broadcast message
      if (this.broadcaster) {
        this.broadcaster.broadcastMessage(parsedMessage, messageJsonStr);
      }

      this.logger.info(`Sequenced Data: ${messageJsonStr}`);
      if (this.display) this.display.log(`Sequence Data received sequenceNo=${sequenceNo}`);

    } catch (err) {
      this.logger.error(`Parser error on sequence parsing: ${err.message}`);
    }
  }

  handleUnsequencedData(packetInfo, packetJsonStr) {
    this.logger.info(`Unsequenced Data: ${packetJsonStr}`);
    // Unsequenced do not increment sequence, so we just log/broadcast
  }

  handleServerHeartbeat(packetInfo) {
    const heartbeatObj = {
      packetType: "H",
      packetTypeName: "Server Heartbeat",
      latestStoredSequenceNo: this.sequenceService.getLastSequenceNo()
    };
    const hbStr = safeStringify(heartbeatObj);
    this.logger.info(`Server Heartbeat: ${hbStr}`);
    if (this.broadcaster) this.broadcaster.broadcastEvent('heartbeat', heartbeatObj);
  }

  handleEndOfSession(packetInfo, packetJsonStr) {
    this.logger.info(`End of Session: ${packetJsonStr}`);
    if (this.display) this.display.log('End of Session');
    if (this.broadcaster) this.broadcaster.broadcastEvent('end_of_session', packetInfo);
  }
}
