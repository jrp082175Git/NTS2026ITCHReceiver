export class MessageBroadcaster {
  constructor(socketIoServer, relayTcpServer) {
    this.socketIoServer = socketIoServer;
    this.relayTcpServer = relayTcpServer;
  }

  broadcastPacket(packetInfo, packetJsonStr) {
    if (this.socketIoServer) this.socketIoServer.broadcastPacket(packetInfo);
    if (this.relayTcpServer) this.relayTcpServer.broadcast(packetJsonStr);
  }

  broadcastMessage(parsedMessage, messageJsonStr) {
    if (this.socketIoServer) this.socketIoServer.broadcastMessage(parsedMessage);
    if (this.relayTcpServer) this.relayTcpServer.broadcast(messageJsonStr);
  }

  broadcastEvent(eventName, payload) {
    if (this.socketIoServer) this.socketIoServer.broadcastEvent(eventName, payload);
    if (this.relayTcpServer) this.relayTcpServer.broadcast(JSON.stringify({ event: eventName, payload }));
  }
}
