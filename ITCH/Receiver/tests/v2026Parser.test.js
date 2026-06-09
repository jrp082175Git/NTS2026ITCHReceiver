import test from 'node:test';
import assert from 'node:assert';
import { ItchV2026Parser } from '../src/parsers/v2026/itchV2026Parser.js';

test('ItchV2026Parser parses System Event Message', (t) => {
  const parser = new ItchV2026Parser();
  const buf = Buffer.alloc(2);
  buf.write('S', 0, 1, 'ascii'); // msgType
  buf.write('O', 1, 1, 'ascii'); // eventCode

  const parsed = parser.parse(buf);
  assert.strictEqual(parsed.version, 'V2026');
  assert.strictEqual(parsed.msgType, 'S');
  assert.strictEqual(parsed.fields.eventCode, 'O');
});

test('ItchV2026Parser parses Seconds Message', (t) => {
  const parser = new ItchV2026Parser();
  const buf = Buffer.alloc(5);
  buf.write('T', 0, 1, 'ascii');
  buf.writeUInt32BE(12345, 1);

  const parsed = parser.parse(buf);
  assert.strictEqual(parsed.msgType, 'T');
  assert.strictEqual(parsed.fields.second, 12345);
});
