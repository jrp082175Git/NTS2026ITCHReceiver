import net from 'net';
import { TcpStreamFramer } from './tcpStreamFramer.js';
import { parseSoupBinTcpPacket } from './soupPacketParser.js';
import { buildLoginRequestPacket, buildClientHeartbeatPacket, buildLogoutRequestPacket } from './soupPacketBuilder.js';

export class SoupBinTcpClient {
  constructor(config, env, logger, runtimeOptions, sequenceService, packetProcessor, sessionData) {
    this.config = config;
    this.envConfig = config.environments[env];
    this.soupConfig = config.soupBinTcp;
    this.logger = logger;
    this.runtimeOptions = runtimeOptions;
    this.sequenceService = sequenceService;
    this.packetProcessor = packetProcessor;
    this.sessionData = sessionData; // from START:N if applicable

    this.socket = null;
    this.framer = new TcpStreamFramer();

    this.lastOutboundTime = Date.now();
    this.lastInboundTime = Date.now();
    this.heartbeatInterval = null;
    this.timeoutInterval = null;

    this.isConnected = false;
    this.isLoggedIn = false;
  }

  connect() {
    this.logger.info(`Connecting to PSE ITCH Server at ${this.envConfig.host}:${this.envConfig.port}`);
    this.socket = new net.Socket();
    this.framer = new TcpStreamFramer();

    this.socket.connect(this.envConfig.port, this.envConfig.host, () => {
      this.isConnected = true;
      this.logger.info('TCP Connection established.');
      this.sendLoginRequest();
      this.startTimers();
    });

    this.socket.on('data', async (data) => {
      this.lastInboundTime = Date.now();
      this.framer.append(data);

      const packets = this.framer.extractPackets();
      for (const binaryPacket of packets) {
        try {
          const packetInfo = parseSoupBinTcpPacket(binaryPacket);
          if (packetInfo.packetType === 'A') this.isLoggedIn = true;
          if (packetInfo.packetType === 'J' || packetInfo.packetType === 'Z') this.isLoggedIn = false;

          await this.packetProcessor.processPacket(binaryPacket, packetInfo, this.runtimeOptions.version);
        } catch (err) {
          this.logger.error(`Failed to process packet: ${err.message}`);
        }
      }
    });

    this.socket.on('error', (err) => {
      this.logger.error(`TCP Socket Error: ${err.message}`);
    });

    this.socket.on('close', () => {
      this.isConnected = false;
      this.isLoggedIn = false;
      this.logger.info('TCP Connection closed.');
      this.stopTimers();

      // Auto-reconnect logic could go here
      setTimeout(() => {
        this.logger.info('Attempting to reconnect...');
        this.connect();
      }, this.envConfig.reconnectDelayMs);
    });
  }

  sendLoginRequest() {
    let requestedSession = '';
    let requestedSequenceNumber = 1;

    if (this.runtimeOptions.isStartModeY) {
      requestedSession = '          '; // 10 spaces
      requestedSequenceNumber = 1;
    } else {
      if (this.sessionData) {
        requestedSession = this.sessionData.currentSessionId || '';
        requestedSequenceNumber = this.sequenceService.getNextExpectedSequenceNo();
      }
    }

    const loginPacket = buildLoginRequestPacket(
      this.soupConfig.username,
      this.soupConfig.password,
      requestedSession,
      requestedSequenceNumber
    );

    this.send(loginPacket);
    this.logger.info(`Sent Login Request for session "${requestedSession}", seq ${requestedSequenceNumber}`);
  }

  sendClientHeartbeat() {
    if (this.isConnected && this.isLoggedIn) {
      const hbPacket = buildClientHeartbeatPacket();
      this.send(hbPacket);
      this.logger.info('Sent Client Heartbeat');
    }
  }

  logout() {
    if (this.isConnected && this.isLoggedIn) {
      const logoutPacket = buildLogoutRequestPacket();
      this.send(logoutPacket);
      this.logger.info('Sent Logout Request');
    }
    if (this.socket) {
       this.socket.destroy();
    }
  }

  send(buffer) {
    if (this.socket && this.isConnected) {
      this.socket.write(buffer);
      this.lastOutboundTime = Date.now();
    }
  }

  startTimers() {
    this.stopTimers();
    // 1-second heartbeat timer
    this.heartbeatInterval = setInterval(() => {
      if (Date.now() - this.lastOutboundTime > 1000) {
        this.sendClientHeartbeat();
      }
    }, 1000);

    // Timeout detection
    this.timeoutInterval = setInterval(() => {
      if (Date.now() - this.lastInboundTime > this.envConfig.connectTimeoutMs) {
        this.logger.error(`No inbound data for ${this.envConfig.connectTimeoutMs}ms. Dropping connection.`);
        this.socket.destroy(); // Will trigger 'close' event and reconnect
      }
    }, 1000);
  }

  stopTimers() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.timeoutInterval) clearInterval(this.timeoutInterval);
  }
}
