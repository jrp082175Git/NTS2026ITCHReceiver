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

export function readUInt16BE(buffer, offset) {
  checkBounds(buffer, offset, 2);
  return buffer.readUInt16BE(offset);
}

export function readInt16BE(buffer, offset) {
  checkBounds(buffer, offset, 2);
  return buffer.readInt16BE(offset);
}

export function readUInt32BE(buffer, offset) {
  checkBounds(buffer, offset, 4);
  return buffer.readUInt32BE(offset);
}

export function readInt32BE(buffer, offset) {
  checkBounds(buffer, offset, 4);
  return buffer.readInt32BE(offset);
}

export function readBigInt64BE(buffer, offset) {
  checkBounds(buffer, offset, 8);
  return buffer.readBigInt64BE(offset);
}

export function readAscii(buffer, offset, length) {
  checkBounds(buffer, offset, length);
  return buffer.toString('ascii', offset, offset + length);
}

export function readAlphaTrim(buffer, offset, length) {
  return readAscii(buffer, offset, length).trim();
}

export function writeUInt16BE(buffer, value, offset) {
  buffer.writeUInt16BE(value, offset);
}

export function writeAsciiPadded(buffer, value, offset, length, padChar = ' ') {
  const str = String(value || '').substring(0, length).padEnd(length, padChar);
  buffer.write(str, offset, length, 'ascii');
}

export function writeNumericAsciiPadded(buffer, value, offset, length, padChar = ' ') {
  const str = String(value || '').substring(0, length).padStart(length, padChar);
  buffer.write(str, offset, length, 'ascii');
}
