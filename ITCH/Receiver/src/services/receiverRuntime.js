import { loadConfig } from '../config/configLoader.js';
import { validateParameters } from '../cli/parameterValidator.js';
import { LogService } from './logService.js';
import { ConsoleDisplay } from '../utils/consoleDisplay.js';
import { logEndianness } from '../protocol/endian.js';
import { SequenceService } from './sequenceService.js';
import { PacketProcessor } from './packetProcessor.js';
import { MessageBroadcaster } from './messageBroadcaster.js';
import { RedisConnection } from '../storage/redisClient.js';
import { PacketStore } from '../storage/packetStore.js';
import { MessageStore } from '../storage/messageStore.js';
import { SessionStore } from '../storage/sessionStore.js';
import { SoupBinTcpClient } from '../protocol/soupBinTcpClient.js';
import { SocketIoServer } from '../servers/socketIoServer.js';
import { RelayTcpServer } from '../servers/relayTcpServer.js';
import { RetransmissionTcpServer } from '../servers/retransmissionTcpServer.js';
import { RetransmissionService } from './retransmissionService.js';
import { ApiServer } from '../servers/apiServer.js';
import { ItchV2026Parser } from '../parsers/v2026/itchV2026Parser.js';
import { ItchV2015Parser } from '../parsers/v2015/itchV2015Parser.js';
import { ReferenceDataCache } from './referenceDataCache.js';
import { HealthService } from './healthService.js';

export class ReceiverRuntime {
  async start(args) {
    const runtimeOptions = validateParameters(args);
    const config = loadConfig();

    const logService = new LogService(config, runtimeOptions.userInitials);
    const logger = logService.getLogger();

    const display = new ConsoleDisplay(runtimeOptions.displayMode);

    logger.info(`Starting Receiver with options: ${JSON.stringify(runtimeOptions)}`);
    logEndianness(logger);

    // Redis Setup
    const redisConn = new RedisConnection(config);
    await redisConn.connect();

    const packetStore = new PacketStore(redisConn.getClient(), config, runtimeOptions.environment, runtimeOptions.version);
    const messageStore = new MessageStore(redisConn.getClient(), config, runtimeOptions.environment, runtimeOptions.version);
    const sessionStore = new SessionStore(redisConn.getClient(), config, runtimeOptions.environment, runtimeOptions.version);

    const storageStore = { redis: redisConn, packetStore, messageStore, sessionStore };

    let sessionData = null;
    let initialSequenceNo = 0;

    if (runtimeOptions.isStartModeY) {
      logger.info('START:Y mode - clearing session state');
      await packetStore.clearSessionPackets();
      await messageStore.clearSessionMessages();
      await sessionStore.clearSession();
    } else {
      logger.info('START:N mode - recovering session state');
      sessionData = await sessionStore.getSessionData();
      if (sessionData && sessionData.lastSequenceNo) {
         initialSequenceNo = parseInt(sessionData.lastSequenceNo, 10);
      }
    }

    const sequenceService = new SequenceService(runtimeOptions.startMode, initialSequenceNo);

    // Servers
    const socketIoServer = new SocketIoServer(config, messageStore, logger);
    socketIoServer.start();

    const relayTcpServer = new RelayTcpServer(config, logger);
    relayTcpServer.start();

    const retransmissionService = new RetransmissionService(messageStore);
    const retransmissionTcpServer = new RetransmissionTcpServer(config, retransmissionService, socketIoServer, logger);
    retransmissionTcpServer.start();

    // Parsers
    const referenceDataCache = new ReferenceDataCache();
    const parsers = {
      'V2026': new ItchV2026Parser(referenceDataCache),
      'V2015': new ItchV2015Parser(referenceDataCache)
    };

    const broadcaster = new MessageBroadcaster(socketIoServer, relayTcpServer);

    const packetProcessor = new PacketProcessor(
      sequenceService,
      parsers,
      storageStore,
      broadcaster,
      logger,
      display
    );
    packetProcessor.setLimits(config.runtime.maxInMemoryPackets, config.runtime.maxInMemoryMessages);

    // SoupBinTCP Client
    const client = new SoupBinTcpClient(
      config,
      runtimeOptions.environment,
      logger,
      runtimeOptions,
      sequenceService,
      packetProcessor,
      sessionData
    );

    // API Server
    const healthService = new HealthService(client, storageStore, sequenceService, config);
    const apiServer = new ApiServer(config, { healthService, storageStore, sequenceService, packetProcessor }, logger);
    apiServer.start();

    client.connect();

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      client.logout();
      apiServer.stop();
      retransmissionTcpServer.stop();
      relayTcpServer.stop();
      socketIoServer.stop();
      await redisConn.disconnect();
      process.exit(0);
    });
  }
}
