import test from 'node:test';
import assert from 'node:assert';
import { PacketProcessor } from '../src/services/packetProcessor.js';
import { SequenceService } from '../src/services/sequenceService.js';

test('Burst simulation processes packets in order', async (t) => {
  const seqService = new SequenceService('START:Y');

  // Mocks
  const parsers = {
    'V2026': {
      parse: (buf) => ({ msgType: 'S', version: 'V2026' })
    }
  };
  const storageStore = {
    packetStore: null,
    messageStore: null,
    sessionStore: null
  };
  const mockLogger = { info: () => {}, error: () => {} };

  const processor = new PacketProcessor(seqService, parsers, storageStore, null, mockLogger, null);

  // Process 1000 Sequenced packets quickly
  for (let i = 0; i < 1000; i++) {
    const buf = Buffer.alloc(10);
    // Pretend it's a valid sequenced packet
    const info = { packetType: 'S', sequenceNumber: 0 };
    await processor.processPacket(buf, info, 'V2026');
  }

  // Sequence should be 1001 (1 expected + 1000 processed)
  assert.strictEqual(seqService.getNextExpectedSequenceNo(), 1001);
  assert.strictEqual(seqService.getLastSequenceNo(), 1000);
  assert.strictEqual(processor.messagesJSONBuffer.length, 1000);
});
