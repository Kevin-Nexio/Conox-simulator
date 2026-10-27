// Independent bitwise CRC writer for synthetic frames. No real case data.
export function sealConoxFrame(bytes, offset = 0) {
  let crc = 0;
  for (let i = offset; i < offset + 1022; i++) {
    crc ^= bytes[i];
    for (let bit = 0; bit < 8; bit++)
      crc = crc & 1 ? (crc >>> 1) ^ 0xa001 : crc >>> 1;
  }
  bytes[offset + 1022] = crc >>> 8;
  bytes[offset + 1023] = crc & 255;
  return bytes;
}
