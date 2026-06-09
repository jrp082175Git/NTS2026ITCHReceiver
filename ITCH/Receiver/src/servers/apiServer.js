import express from 'express';

export class ApiServer {
  constructor(config, runtimeServices, logger) {
    this.config = config.apiServer;
    this.enabled = this.config.enabled;
    this.runtimeServices = runtimeServices;
    /* runtimeServices expects:
       { healthService, storageStore, sequenceService, packetProcessor }
    */
    this.logger = logger;
    this.app = express();
    this.server = null;
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.use(express.json());

    this.app.get('/health', async (req, res) => {
      const status = this.runtimeServices.healthService ? await this.runtimeServices.healthService.getStatus() : { status: 'unknown' };
      res.json(status);
    });

    this.app.get('/session', async (req, res) => {
      if (!this.runtimeServices.storageStore.sessionStore) {
        return res.status(503).json({ error: 'Session store unavailable' });
      }
      const data = await this.runtimeServices.storageStore.sessionStore.getSessionData();
      res.json(data || {});
    });

    this.app.get('/packets', async (req, res) => {
      // Simplistic return of memory buffer for demo purposes,
      // actual impl might query Redis streams using XRANGE
      if (this.runtimeServices.packetProcessor) {
         res.json({ packets: this.runtimeServices.packetProcessor.packetJSONBuffer.slice(-100) });
      } else {
         res.json({ packets: [] });
      }
    });

    this.app.get('/messages/range', async (req, res) => {
      try {
        const beginSeq = parseInt(req.query.beginningSequence, 10);
        const endSeq = parseInt(req.query.endingSequence, 10);

        if (isNaN(beginSeq) || isNaN(endSeq)) {
          return res.status(400).json({ error: 'beginningSequence and endingSequence are required query parameters' });
        }

        if (this.runtimeServices.storageStore.messageStore) {
          const messagesJsonStrs = await this.runtimeServices.storageStore.messageStore.getMessagesBySequenceRange(beginSeq, endSeq);
          const messages = messagesJsonStrs.map(str => JSON.parse(str));
          res.json({ count: messages.length, messages });
        } else {
           res.status(503).json({ error: 'Message store unavailable' });
        }
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    this.app.get('/stats', (req, res) => {
      res.json({
        uptime: process.uptime(),
        lastSequenceNo: this.runtimeServices.sequenceService ? this.runtimeServices.sequenceService.getLastSequenceNo() : 0,
        memoryPackets: this.runtimeServices.packetProcessor ? this.runtimeServices.packetProcessor.packetJSONBuffer.length : 0,
        memoryMessages: this.runtimeServices.packetProcessor ? this.runtimeServices.packetProcessor.messagesJSONBuffer.length : 0
      });
    });
  }

  start() {
    if (!this.enabled) return;
    this.server = this.app.listen(this.config.port, this.config.host, () => {
      this.logger.info(`REST API Server listening on ${this.config.host}:${this.config.port}`);
    });
  }

  stop() {
    if (this.enabled && this.server) {
      this.server.close();
    }
  }
}
