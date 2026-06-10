import { readUInt16BE, readUInt32BE, readBigInt64BE, readBigUInt64BE, readAlphaTrim, readAscii } from '../../utils/bufferUtils.js';
import { getV2015Schema } from './itchV2015MessageRegistry.js';

export class ItchV2015Parser {
  constructor(referenceDataCache = null) {
    this.referenceDataCache = referenceDataCache;
  }

  parse(buffer) {
    if (buffer.length < 1) {
      throw new Error('Buffer too short for V2015 message');
    }

    const msgType = readAscii(buffer, 0, 1);
    const schema = getV2015Schema(msgType);

    if (!schema) {
      return {
        version: 'V2015',
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
        // use BigInt for 8-byte ints
        parsedFields[field.name] = readBigUInt64BE(buffer, offset).toString();
        offset += 8;
      } else if (field.type === 'uint32_price') {
        const rawValue = readUInt32BE(buffer, offset);
        parsedFields[`${field.name}_raw`] = rawValue;

        let decimals = 4; // Default if not found in cache
        if (this.referenceDataCache && parsedFields.orderBookId) {
            const cacheEntry = this.referenceDataCache.get(parsedFields.orderBookId);
            if (cacheEntry && cacheEntry.priceDecimals !== undefined) {
                decimals = cacheEntry.priceDecimals;
            }
        }

        parsedFields[field.name] = rawValue / Math.pow(10, decimals);
        offset += 4;
      } else if (field.type === 'alpha') {
        parsedFields[field.name] = readAlphaTrim(buffer, offset, field.length);
        offset += field.length;
      } else if (field.type === 'ascii') {
        parsedFields[field.name] = readAscii(buffer, offset, field.length);
        offset += field.length;
      }
    }

    return {
      version: 'V2015',
      msgType: msgType,
      messageName: schema.name,
      fields: parsedFields,
      rawHex: buffer.toString('hex'),
      parsedAt: Date.now()
    };
  }
}
