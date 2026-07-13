const fs = require('fs');
const path = require('path');

// Minimal PNG generator for solid color icons
function createPNG(size) {
  // Create a simple PNG with a purple background (#6366f1) and a white "C"
  // This is a minimal PNG with IDAT chunk (uncompressed filter+raw data)
  // We'll use a simpler approach: create a 1-pixel PNG and scale via <img>
  
  const width = size;
  const height = size;
  
  // PNG specification constants
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);  // width
  ihdrData.writeUInt32BE(height, 4); // height
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  const ihdr = createChunk('IHDR', ihdrData);
  
  // IDAT chunk - raw pixel data with filter byte (0 = None) per row
  const rawData = [];
  const r = 0x63, g = 0x66, b = 0xF1; // indigo-500
  
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte
    const center = size / 2;
    const radius = size * 0.35;
    for (let x = 0; x < width; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        // Circle area - slightly lighter
        rawData.push(Math.min(255, r + 10), Math.min(255, g + 15), Math.min(255, b + 20));
      } else {
        rawData.push(r, g, b);
      }
    }
  }
  
  const rawBuffer = Buffer.from(rawData);
  
  // Compress using simple approach - for simplicity, use zlib if available
  let compressed;
  try {
    const zlib = require('zlib');
    compressed = zlib.deflateSync(rawBuffer);
  } catch {
    // Store uncompressed (not valid PNG but let's try)
    compressed = rawBuffer;
  }
  
  const idat = createChunk('IDAT', compressed);
  
  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type, 'ascii');
  
  // CRC32
  const crc = crc32(Buffer.concat([typeBuffer, data]));
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc);
  
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) crc = (crc >>> 1) ^ 0xEDB88320;
      else crc = crc >>> 1;
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

[192, 512].forEach(size => {
  const png = createPNG(size);
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), png);
  console.log(`Created icon-${size}.png (${png.length} bytes)`);
});
