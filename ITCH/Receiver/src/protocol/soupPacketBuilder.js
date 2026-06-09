import { writeUInt16BE, writeAsciiPadded, writeNumericAsciiPadded } from '../utils/bufferUtils.js';

export function buildLoginRequestPacket(username, password, requestedSession, requestedSequenceNumber) {
  // L (1) + username (6) + password (10) + requested_session (10) + requested_sequence_number (20)
  const payloadLength = 1 + 6 + 10 + 10 + 20;
  const packetLength = payloadLength; // SoupBinTCP packet length is payload length
  const fullLength = 2 + packetLength;

  const buffer = Buffer.alloc(fullLength);

  writeUInt16BE(buffer, packetLength, 0);
  buffer.write('L', 2, 1, 'ascii');
  writeAsciiPadded(buffer, username, 3, 6, ' ');
  writeAsciiPadded(buffer, password, 9, 10, ' ');

  // requested session blank or padded with spaces
  const sessionStr = requestedSession ? requestedSession : '';
  writeAsciiPadded(buffer, sessionStr, 19, 10, ' ');

  // sequence number padded with spaces on the left, but standard says padded?
  // Document says "requested sequence number length 20, ASCII numeric, left padded"
  writeNumericAsciiPadded(buffer, requestedSequenceNumber.toString(), 29, 20, ' ');

  return buffer;
}

export function buildClientHeartbeatPacket() {
  const buffer = Buffer.alloc(3);
  writeUInt16BE(buffer, 1, 0); // length is 1
  buffer.write('R', 2, 1, 'ascii');
  return buffer;
}

export function buildLogoutRequestPacket() {
  const buffer = Buffer.alloc(3);
  writeUInt16BE(buffer, 1, 0); // length is 1
  buffer.write('O', 2, 1, 'ascii');
  return buffer;
}

export function buildUnsequencedDataPacket(payloadBuffer) {
  const packetLength = 1 + payloadBuffer.length;
  const fullLength = 2 + packetLength;
  const buffer = Buffer.alloc(fullLength);

  writeUInt16BE(buffer, packetLength, 0);
  buffer.write('U', 2, 1, 'ascii');
  payloadBuffer.copy(buffer, 3);
  return buffer;
}
