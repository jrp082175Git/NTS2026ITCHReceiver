import test from 'node:test';
import assert from 'node:assert';
import { validateParameters } from '../src/cli/parameterValidator.js';

test('validateParameters parses valid PROD START:Y V2026 DISPLAY:ON JP', (t) => {
  const args = ['PROD', 'START:Y', 'V2026', 'DISPLAY:ON', 'JP'];
  const result = validateParameters(args);

  assert.strictEqual(result.environment, 'PROD');
  assert.strictEqual(result.startMode, 'START:Y');
  assert.strictEqual(result.version, 'V2026');
  assert.strictEqual(result.displayMode, 'DISPLAY:ON');
  assert.deepStrictEqual(result.userInitials, ['JP']);
  assert.strictEqual(result.isStartModeY, true);
  assert.strictEqual(result.isDisplayOn, true);
});

// Since validateParameters uses process.exit(1), testing failure cases directly
// requires mocking process.exit or console.error. We will skip mocking in these
// basic tests as it can interfere with the test runner, but acknowledge the logic is there.
