import test from 'node:test';
import assert from 'node:assert';
import { TcpStreamFramer } from '../src/protocol/tcpStreamFramer.js';
import { parseSoupBinTcpPacket } from '../src/protocol/soupPacketParser.js';
import { buildLoginRequestPacket } from '../src/protocol/soupPacketBuilder.js';

test('TcpStreamFramer extracts one complete packet', (t) => {
  const framer = new TcpStreamFramer();
  const buf = Buffer.alloc(5);
  buf.writeUInt16BE(3, 0); // length 3
  buf.write('A', 2, 1, 'ascii'); // packet type A

  framer.append(buf);
  const packets = framer.extractPackets();

  assert.strictEqual(packets.length, 1);
  assert.strictEqual(packets[0].length, 5);
});

test('TcpStreamFramer handles packet split across two TCP chunks', (t) => {
  const framer = new TcpStreamFramer();
  const chunk1 = Buffer.alloc(2);
  chunk1.writeUInt16BE(3, 0); // length 3 (needs 5 bytes total)

  const chunk2 = Buffer.alloc(3);
  chunk2.write('A12', 0, 3, 'ascii');

  framer.append(chunk1);
  let packets = framer.extractPackets();
  assert.strictEqual(packets.length, 0); // Incomplete

  framer.append(chunk2);
  packets = framer.extractPackets();
  assert.strictEqual(packets.length, 1);
  assert.strictEqual(packets[0].toString('ascii', 2, 5), 'A12');
});

test('TcpStreamFramer extracts multiple packets in one chunk', (t) => {
  const framer = new TcpStreamFramer();
  const buf = Buffer.alloc(10);
  // Packet 1
  buf.writeUInt16BE(3, 0);
  buf.write('A12', 2, 3, 'ascii');
  // Packet 2
  buf.writeUInt16BE(3, 5);
  buf.write('H  ', 7, 3, 'ascii');

  framer.append(buf);
  const packets = framer.extractPackets();
  assert.strictEqual(packets.length, 2);
});

test('SoupPacketParser parses Login Accepted', (t) => {
  const buf = Buffer.alloc(33);
  buf.writeUInt16BE(31, 0);
  buf.write('A', 2, 1, 'ascii');
  buf.write('SESSION123', 3, 10, 'ascii');
  buf.write('                   5', 13, 20, 'ascii'); // pad left

  const info = parseSoupBinTcpPacket(buf);
  assert.strictEqual(info.packetType, 'A');
  assert.strictEqual(info.session, 'SESSION123');
  assert.strictEqual(info.sequenceNumber, 5);
});

test('SoupPacketBuilder builds Login Request', (t) => {
  const buf = buildLoginRequestPacket('user', 'pass', 'SESS1', 10);
  // Length is 2 bytes + 47 bytes payload = 49 bytes
  assert.strictEqual(buf.length, 49);
  assert.strictEqual(buf.readUInt16BE(0), 47);
  assert.strictEqual(buf.toString('ascii', 2, 3), 'L');
  assert.strictEqual(buf.toString('ascii', 3, 9), 'user  ');
  assert.strictEqual(buf.toString('ascii', 9, 19), 'pass      ');
  assert.strictEqual(buf.toString('ascii', 19, 29), 'SESS1     ');
  assert.strictEqual(buf.toString('ascii', 29, 49), '                  10');
});
