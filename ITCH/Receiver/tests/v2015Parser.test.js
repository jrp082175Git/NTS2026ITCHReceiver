import test from 'node:test';
import assert from 'node:assert';
import { ItchV2015Parser } from '../src/parsers/v2015/itchV2015Parser.js';

test('ItchV2015Parser parses Time Stamp Message', (t) => {
  const parser = new ItchV2015Parser();
  const buf = Buffer.alloc(5);
  buf.write('T', 0, 1, 'ascii');
  buf.writeUInt32BE(54321, 1);

  const parsed = parser.parse(buf);
  assert.strictEqual(parsed.version, 'V2015');
  assert.strictEqual(parsed.msgType, 'T');
  assert.strictEqual(parsed.fields.second, 54321);
});
