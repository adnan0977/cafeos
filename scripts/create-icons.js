import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, r, g, b) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA color
  ihdrData.writeUInt8(0, 10); // Deflate
  ihdrData.writeUInt8(0, 11); // Filter
  ihdrData.writeUInt8(0, 12); // No interlace

  const ihdr = makeChunk('IHDR', ihdrData);

  // Raw image data: height scanlines, each scanline has 1 filter byte (0) + width * 4 RGBA bytes
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const offset = y * scanlineLength;
    rawData[offset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = offset + 1 + x * 4;
      // Amber icon circle or square on dark slate background
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      const radius = width * 0.42;

      if (dist < radius) {
        // Brand Amber (#d97706)
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
        rawData[pxOffset + 3] = 255;
      } else {
        // Dark slate background (#0f172a)
        rawData[pxOffset] = 15;
        rawData[pxOffset + 1] = 23;
        rawData[pxOffset + 2] = 42;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressedData);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcPayload = Buffer.concat([typeBuf, data]);
  const crc = crc32(crcPayload);

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// Simple CRC32 implementation
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    crc = crc ^ byte;
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Write icons to /public
fs.mkdirSync('./public', { recursive: true });
fs.writeFileSync('./public/pwa-192x192.png', createPNG(192, 192, 217, 119, 6));
fs.writeFileSync('./public/pwa-512x512.png', createPNG(512, 512, 217, 119, 6));
fs.writeFileSync('./public/pwa-maskable-512x512.png', createPNG(512, 512, 217, 119, 6));
fs.writeFileSync('./public/apple-touch-icon.png', createPNG(180, 180, 217, 119, 6));
fs.writeFileSync('./public/favicon.ico', createPNG(64, 64, 217, 119, 6));

console.log('Icons generated successfully.');
