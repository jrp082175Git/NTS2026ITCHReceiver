import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { ApiServer } from '../src/servers/apiServer.js';

test('API /health endpoint returns expected status', async (t) => {
  // Mock logger
  const mockLogger = { info: () => {}, error: () => {} };

  // Mock config
  const config = { apiServer: { enabled: true, host: '127.0.0.1', port: 0 } };

  // Mock services
  const runtimeServices = {
    healthService: {
      getStatus: async () => ({ status: 'UP', isConnected: true })
    },
    storageStore: {},
    sequenceService: {},
    packetProcessor: {}
  };

  const apiServer = new ApiServer(config, runtimeServices, mockLogger);

  // We don't need to actually start the server to test express app directly using supertest
  const response = await request(apiServer.app).get('/health');

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.status, 'UP');
});
