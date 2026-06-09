import { readUInt16BE, readAscii, readAlphaTrim } from '../utils/bufferUtils.js';

export function parseSoupBinTcpPacket(buffer) {
  if (buffer.length < 3) {
    throw new Error('Buffer too short to be a valid SoupBinTCP packet');
  }

  const packetLength = readUInt16BE(buffer, 0);
  const packetTypeChar = readAscii(buffer, 2, 1);
  const payloadLength = packetLength - 1; // 1 byte for packet type

  const packetInfo = {
    packetType: packetTypeChar,
    packetLength: packetLength,
    payloadLength: payloadLength,
    rawHex: buffer.toString('hex'),
    receivedAt: Date.now()
  };

  switch (packetTypeChar) {
    case '+':
      packetInfo.packetTypeName = 'Debug Packet';
      break;
    case 'A':
      packetInfo.packetTypeName = 'Login Accepted Packet';
      packetInfo.session = readAlphaTrim(buffer, 3, 10);
      packetInfo.sequenceNumber = parseInt(readAlphaTrim(buffer, 13, 20), 10);
      break;
    case 'J':
      packetInfo.packetTypeName = 'Login Rejected Packet';
      const rejectCode = readAscii(buffer, 3, 1);
      packetInfo.rejectReasonCode = rejectCode;
      if (rejectCode === 'A') packetInfo.rejectReason = 'Not Authorized';
      else if (rejectCode === 'S') packetInfo.rejectReason = 'Session not available';
      else packetInfo.rejectReason = 'Unknown';
      break;
    case 'S':
      packetInfo.packetTypeName = 'Sequenced Data Packet';
      break;
    case 'U':
      packetInfo.packetTypeName = 'Unsequenced Data Packet';
      break;
    case 'H':
      packetInfo.packetTypeName = 'Server Heartbeat Packet';
      break;
    case 'Z':
      packetInfo.packetTypeName = 'End of Session Packet';
      break;
    default:
      packetInfo.packetTypeName = 'Unknown Packet Type';
      break;
  }

  return packetInfo;
}
