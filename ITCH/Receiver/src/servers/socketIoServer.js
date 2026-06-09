import { Server } from 'socket.io';

export class SocketIoServer {
  constructor(config, messageStore, logger) {
    this.config = config.socketIo;
    this.enabled = this.config.enabled;
    this.messageStore = messageStore;
    this.logger = logger;
    this.io = null;
  }

  start() {
    if (!this.enabled) return;

    this.io = new Server(this.config.port, {
      cors: this.config.cors
    });

    this.logger.info(`Socket.IO server started on port ${this.config.port}`);

    this.io.on('connection', (socket) => {
      this.logger.info(`Socket.IO client connected: ${socket.id}`);

      socket.on('retransmitRequest', async (req) => {
        try {
          if (!req.socketID || req.socketID !== socket.id) {
            socket.emit('error', { message: 'Invalid socketID in request' });
            return;
          }
          if (!req.beginningSequence || !req.endingSequence || req.beginningSequence < 1 || req.endingSequence < req.beginningSequence) {
            socket.emit('error', { message: 'Invalid sequence range' });
            return;
          }

          if (this.messageStore) {
            const messagesJsonStrs = await this.messageStore.getMessagesBySequenceRange(req.beginningSequence, req.endingSequence);
            const messages = messagesJsonStrs.map(str => JSON.parse(str));

            socket.emit('retransmitResponse', {
              socketID: req.socketID,
              beginningSequence: req.beginningSequence,
              endingSequence: req.endingSequence,
              count: messages.length,
              messages: messages
            });
          } else {
             socket.emit('error', { message: 'Message store not available' });
          }

        } catch (err) {
          this.logger.error(`Error handling retransmitRequest from ${socket.id}: ${err.message}`);
          socket.emit('error', { message: 'Internal server error during retransmission' });
        }
      });

      socket.on('disconnect', () => {
        this.logger.info(`Socket.IO client disconnected: ${socket.id}`);
      });
    });
  }

  stop() {
    if (this.enabled && this.io) {
      this.io.close();
    }
  }

  broadcastPacket(packetInfo) {
    if (this.enabled && this.io) {
      this.io.emit('packet', packetInfo);
    }
  }

  broadcastMessage(messageObj) {
    if (this.enabled && this.io) {
      this.io.emit('message', messageObj);
    }
  }

  broadcastEvent(eventName, payload) {
    if (this.enabled && this.io) {
      this.io.emit(eventName, payload);
    }
  }
}
