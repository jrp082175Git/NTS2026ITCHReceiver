import { readUInt16BE } from '../utils/bufferUtils.js';

export class TcpStreamFramer {
  constructor() {
    this.pendingBuffer = Buffer.alloc(0);
  }

  append(data) {
    this.pendingBuffer = Buffer.concat([this.pendingBuffer, data]);
  }

  extractPackets() {
    const packets = [];

    while (this.pendingBuffer.length >= 2) {
      // Read the first 2 bytes as big-endian packetLength via the safe endian reader
      const packetLength = readUInt16BE(this.pendingBuffer, 0);

      // Calculate full logical packet length as 2 + packetLength
      const fullLength = 2 + packetLength;

      // Protection against invalid packetLength
      if (packetLength === 0) {
        throw new Error('Invalid SoupBinTCP packet length: 0');
      }

      // If pending Buffer has less than full logical packet length, wait for the next data chunk
      if (this.pendingBuffer.length < fullLength) {
        break;
      }

      // If complete, slice one full logical packet and emit it
      const packet = this.pendingBuffer.subarray(0, fullLength);
      packets.push(Buffer.from(packet));

      // Preserve remaining incomplete bytes
      this.pendingBuffer = this.pendingBuffer.subarray(fullLength);
    }

    return packets;
  }
}
