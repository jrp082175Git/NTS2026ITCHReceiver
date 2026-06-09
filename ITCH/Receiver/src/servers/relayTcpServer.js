import net from 'net';

export class RelayTcpServer {
  constructor(config, logger) {
    this.config = config.tcpRelay;
    this.enabled = this.config.enabled;
    this.logger = logger;
    this.server = null;
    this.clients = new Set();
  }

  start() {
    if (!this.enabled) return;

    this.server = net.createServer((socket) => {
      this.logger.info(`Relay TCP client connected: ${socket.remoteAddress}:${socket.remotePort}`);
      this.clients.add(socket);

      socket.on('error', (err) => {
        this.logger.error(`Relay TCP client error: ${err.message}`);
      });

      socket.on('close', () => {
        this.logger.info(`Relay TCP client disconnected: ${socket.remoteAddress}:${socket.remotePort}`);
        this.clients.delete(socket);
      });
    });

    this.server.listen(this.config.port, this.config.host, () => {
      this.logger.info(`Relay TCP server listening on ${this.config.host}:${this.config.port}`);
    });
  }

  stop() {
    if (this.enabled && this.server) {
      for (const client of this.clients) {
        client.destroy();
      }
      this.server.close();
    }
  }

  broadcast(jsonStr) {
    if (!this.enabled || this.clients.size === 0) return;

    const payload = jsonStr + '\n';
    for (const client of this.clients) {
      if (client.writable) {
        // Backpressure handling: if buffer is too full, we might just drop or disconnect slow clients
        if (client.writableLength > 1024 * 1024) { // 1MB buffer limit
          this.logger.error(`Disconnecting slow relay client ${client.remoteAddress}:${client.remotePort}`);
          client.destroy();
          this.clients.delete(client);
        } else {
          client.write(payload);
        }
      }
    }
  }
}
