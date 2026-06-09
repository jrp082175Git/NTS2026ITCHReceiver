import { itchV2026Schemas } from './itchV2026Schemas.js';

export function getV2026Schema(msgType) {
  return itchV2026Schemas[msgType];
}
