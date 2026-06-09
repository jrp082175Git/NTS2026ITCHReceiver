import test from 'node:test';
import assert from 'node:assert';
import { SequenceService } from '../src/services/sequenceService.js';

test('SequenceService START:Y starts at 1', (t) => {
  const seq = new SequenceService('START:Y');
  assert.strictEqual(seq.getNextExpectedSequenceNo(), 1);
  assert.strictEqual(seq.getLastSequenceNo(), 0);

  const assigned = seq.processSequencedPacket(null);
  assert.strictEqual(assigned, 1);
  assert.strictEqual(seq.getNextExpectedSequenceNo(), 2);
  assert.strictEqual(seq.getLastSequenceNo(), 1);
});

test('SequenceService START:N starts at last + 1', (t) => {
  const seq = new SequenceService('START:N', 10);
  assert.strictEqual(seq.getNextExpectedSequenceNo(), 11);
  assert.strictEqual(seq.getLastSequenceNo(), 10);
});
