import os from 'os';

export function detectEndianness() {
  const endianness = os.endianness();
  return {
    endianness,
    isBigEndian: endianness === 'BE',
    isLittleEndian: endianness === 'LE'
  };
}

export function logEndianness(logger) {
  const { endianness } = detectEndianness();
  if (logger && typeof logger.info === 'function') {
      logger.info(`Diagnostic: System endianness is ${endianness}. Receiver uses big-endian for all SoupBinTCP/ITCH protocol buffers.`);
  } else {
      console.log(`Diagnostic: System endianness is ${endianness}. Receiver uses big-endian for all SoupBinTCP/ITCH protocol buffers.`);
  }
}
