import { readUInt16BE, readUInt32BE, readBigInt64BE, readAlphaTrim, readAscii } from '../../utils/bufferUtils.js';
import { getV2026Schema } from './itchV2026MessageRegistry.js';

export class ItchV2026Parser {
  constructor(referenceDataCache = null) {
    this.referenceDataCache = referenceDataCache;
  }

  parse(buffer) {
    if (buffer.length < 1) {
      throw new Error('Buffer too short for V2026 message');
    }

    const msgType = readAscii(buffer, 0, 1);
    const schema = getV2026Schema(msgType);

    if (!schema) {
      return {
        version: 'V2026',
        msgType: msgType,
        messageName: 'Unknown Message',
        rawHex: buffer.toString('hex'),
        parsedAt: Date.now()
      };
    }

    const parsedFields = {};
    let offset = 1;

    for (const field of schema.fields) {
      if (field.type === 'uint16') {
        parsedFields[field.name] = readUInt16BE(buffer, offset);
        offset += 2;
      } else if (field.type === 'uint32') {
        parsedFields[field.name] = readUInt32BE(buffer, offset);
        offset += 4;
      } else if (field.type === 'uint64') {
        parsedFields[field.name] = readBigInt64BE(buffer, offset).toString();
        offset += 8;
      } else if (field.type === 'int64') {
        const rawValue = readBigInt64BE(buffer, offset);
        parsedFields[`${field.name}_raw`] = rawValue.toString();

        // Decode Price fields as signed 8-byte numeric values
        let decimals = 4; // Default if not found in cache
        if (this.referenceDataCache && parsedFields.orderBookId) {
            const cacheEntry = this.referenceDataCache.get(parsedFields.orderBookId);
            if (cacheEntry && cacheEntry.priceDecimals !== undefined) {
                decimals = cacheEntry.priceDecimals;
            }
        }

        parsedFields[field.name] = Number(rawValue) / Math.pow(10, decimals);
        offset += 8;
      } else if (field.type === 'alpha') {
        parsedFields[field.name] = readAlphaTrim(buffer, offset, field.length);
        offset += field.length;
      } else if (field.type === 'ascii') {
        parsedFields[field.name] = readAscii(buffer, offset, field.length);
        offset += field.length;
      }
    }

    return {
      version: 'V2026',
      msgType: msgType,
      messageName: schema.name,
      fields: parsedFields,
      rawHex: buffer.toString('hex'),
      parsedAt: Date.now()
    };
  }
}
