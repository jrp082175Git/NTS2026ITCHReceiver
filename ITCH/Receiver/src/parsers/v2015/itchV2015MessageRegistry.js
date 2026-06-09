import { itchV2015Schemas } from './itchV2015Schemas.js';

export function getV2015Schema(msgType) {
  return itchV2015Schemas[msgType];
}
