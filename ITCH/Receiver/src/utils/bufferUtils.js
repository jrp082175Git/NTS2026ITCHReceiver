import os from 'os';

export class ParserError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ParserError';
  }
}

function checkBounds(buffer, offset, length) {
  if (offset + length > buffer.length) {
    throw new ParserError(`Buffer too short. Attempted to read ${length} bytes at offset ${offset}, but buffer length is ${buffer.length}`);
  }
}

const isLE = os.endianness() === 'LE';

// Per instructions, we implement manual byte swapping for multi-byte data types if the host is little-endian (small endian).
// This swaps the bytes to properly convert the Big-Endian network payload into the host's Little-Endian format before reading.
function readSwappedInt16(buffer, offset) {
  checkBounds(buffer, offset, 2);
  const swapped = Buffer.allocUnsafe(2);
  swapped[0] = buffer[offset + 1];
  swapped[1] = buffer[offset];
  return swapped.readInt16LE(0);
}

function readSwappedInt32(buffer, offset) {
  checkBounds(buffer, offset, 4);
  const swapped = Buffer.allocUnsafe(4);
  swapped[0] = buffer[offset + 3];
  swapped[1] = buffer[offset + 2];
  swapped[2] = buffer[offset + 1];
  swapped[3] = buffer[offset];
  return swapped.readInt32LE(0);
}

function readSwappedBigInt64(buffer, offset) {
  checkBounds(buffer, offset, 8);
  const swapped = Buffer.allocUnsafe(8);
  swapped[0] = buffer[offset + 7];
  swapped[1] = buffer[offset + 6];
  swapped[2] = buffer[offset + 5];
  swapped[3] = buffer[offset + 4];
  swapped[4] = buffer[offset + 3];
  swapped[5] = buffer[offset + 2];
  swapped[6] = buffer[offset + 1];
  swapped[7] = buffer[offset];
  return swapped.readBigInt64LE(0);
}

function readSwappedBigUInt64(buffer, offset) {
  checkBounds(buffer, offset, 8);
  const swapped = Buffer.allocUnsafe(8);
  swapped[0] = buffer[offset + 7];
  swapped[1] = buffer[offset + 6];
  swapped[2] = buffer[offset + 5];
  swapped[3] = buffer[offset + 4];
  swapped[4] = buffer[offset + 3];
  swapped[5] = buffer[offset + 2];
  swapped[6] = buffer[offset + 1];
  swapped[7] = buffer[offset];
  return swapped.readBigUInt64LE(0);
}

// We also keep UInt versions for compatibility, but we will use Int for V2015 fields
function readSwappedUInt16(buffer, offset) {
  checkBounds(buffer, offset, 2);
  const swapped = Buffer.allocUnsafe(2);
  swapped[0] = buffer[offset + 1];
  swapped[1] = buffer[offset];
  return swapped.readUInt16LE(0);
}

function readSwappedUInt32(buffer, offset) {
  checkBounds(buffer, offset, 4);
  const swapped = Buffer.allocUnsafe(4);
  swapped[0] = buffer[offset + 3];
  swapped[1] = buffer[offset + 2];
  swapped[2] = buffer[offset + 1];
  swapped[3] = buffer[offset];
  return swapped.readUInt32LE(0);
}

export function readUInt16BE(buffer, offset) {
  return isLE ? readSwappedUInt16(buffer, offset) : buffer.readUInt16BE(offset);
}

export function readInt16BE(buffer, offset) {
  return isLE ? readSwappedInt16(buffer, offset) : buffer.readInt16BE(offset);
}

export function readUInt32BE(buffer, offset) {
  return isLE ? readSwappedUInt32(buffer, offset) : buffer.readUInt32BE(offset);
}

export function readInt32BE(buffer, offset) {
  return isLE ? readSwappedInt32(buffer, offset) : buffer.readInt32BE(offset);
}

export function readBigInt64BE(buffer, offset) {
  return isLE ? readSwappedBigInt64(buffer, offset) : buffer.readBigInt64BE(offset);
}

export function readBigUInt64BE(buffer, offset) {
  return isLE ? readSwappedBigUInt64(buffer, offset) : buffer.readBigUInt64BE(offset);
}

export function readAscii(buffer, offset, length) {
  checkBounds(buffer, offset, length);
  return buffer.toString('ascii', offset, offset + length);
}

export function readAlphaTrim(buffer, offset, length) {
  return readAscii(buffer, offset, length).trim();
}

export function writeUInt16BE(buffer, value, offset) {
  if (isLE) {
    const temp = Buffer.allocUnsafe(2);
    temp.writeUInt16LE(value, 0);
    buffer[offset] = temp[1];
    buffer[offset + 1] = temp[0];
  } else {
    buffer.writeUInt16BE(value, offset);
  }
}

export function writeAsciiPadded(buffer, value, offset, length, padChar = ' ') {
  const str = String(value || '').substring(0, length).padEnd(length, padChar);
  buffer.write(str, offset, length, 'ascii');
}

export function writeNumericAsciiPadded(buffer, value, offset, length, padChar = ' ') {
  const str = String(value || '').substring(0, length).padStart(length, padChar);
  buffer.write(str, offset, length, 'ascii');
}
