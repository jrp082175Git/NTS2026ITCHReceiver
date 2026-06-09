import test from 'node:test';
import assert from 'node:assert';

// We will mock RedisConnection to simulate range retrieval without a real Redis instance
class MockMessageStore {
  constructor() {
    this.messages = new Map();
  }
  async storeMessage(sequenceNo, binaryBuffer, messageJsonStr) {
    this.messages.set(sequenceNo, messageJsonStr);
  }
  async getMessagesBySequenceRange(beginningSequence, endingSequence) {
    const results = [];
    for (let i = beginningSequence; i <= endingSequence; i++) {
      if (this.messages.has(i)) {
        results.push(this.messages.get(i));
      }
    }
    return results;
  }
}

test('MessageStore mock stores and retrieves range', async (t) => {
  const store = new MockMessageStore();
  await store.storeMessage(1, Buffer.alloc(0), '{"seq":1}');
  await store.storeMessage(2, Buffer.alloc(0), '{"seq":2}');
  await store.storeMessage(3, Buffer.alloc(0), '{"seq":3}');

  const range = await store.getMessagesBySequenceRange(2, 3);
  assert.strictEqual(range.length, 2);
  assert.strictEqual(JSON.parse(range[0]).seq, 2);
  assert.strictEqual(JSON.parse(range[1]).seq, 3);
});
