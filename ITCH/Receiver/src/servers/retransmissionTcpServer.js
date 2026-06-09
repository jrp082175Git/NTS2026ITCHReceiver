import net from 'net';

export class RetransmissionTcpServer {
  constructor(config, retransmissionService, socketIoServer, logger) {
    this.config = config.tcpRetransmission;
    this.enabled = this.config.enabled;
    this.retransmissionService = retransmissionService;
    this.socketIoServer = socketIoServer; // Optional, to emit to socketIo client if matching socketID
    this.logger = logger;
    this.server = null;
  }

  start() {
    if (!this.enabled) return;

    this.server = net.createServer((socket) => {
      this.logger.info(`Retransmission TCP client connected: ${socket.remoteAddress}:${socket.remotePort}`);
      let buffer = '';

      socket.on('data', async (data) => {
        buffer += data.toString();
        let newlineIndex;

        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);

          if (line.length === 0) continue;

          try {
            const requestObj = JSON.parse(line);
            const responseObj = await this.retransmissionService.processRequest(requestObj);

            // Send back to TCP client
            socket.write(JSON.stringify(responseObj) + '\n');

            // Emit to socket IO client if exists
            if (this.socketIoServer && this.socketIoServer.io && requestObj.socketID) {
              const targetSocket = this.socketIoServer.io.sockets.sockets.get(requestObj.socketID);
              if (targetSocket) {
                  targetSocket.emit('retransmitResponse', responseObj);
              }
            }
          } catch (err) {
            const errObj = { error: err.message };
            socket.write(JSON.stringify(errObj) + '\n');
            this.logger.error(`Retransmission error: ${err.message}`);
          }
        }
      });

      socket.on('error', (err) => {
        this.logger.error(`Retransmission TCP client error: ${err.message}`);
      });

      socket.on('close', () => {
        this.logger.info(`Retransmission TCP client disconnected: ${socket.remoteAddress}:${socket.remotePort}`);
      });
    });

    this.server.listen(this.config.port, this.config.host, () => {
      this.logger.info(`Retransmission TCP server listening on ${this.config.host}:${this.config.port}`);
    });
  }

  stop() {
    if (this.enabled && this.server) {
      this.server.close();
    }
  }
}
