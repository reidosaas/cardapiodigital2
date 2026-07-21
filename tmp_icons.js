const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function createPNG(width, height, r, g, b) {
  const channels = 4;
  const rowSize = width * channels;
  const rawData = Buffer.alloc((rowSize + 1) * height);

  for (let y = 0; y < height; y++) {
    rawData[y * (rowSize + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const idx = y * (rowSize + 1) + 1 + x * channels;
      rawData[idx] = r;
      rawData[idx + 1] = g;
      rawData[idx + 2] = b;
      rawData[idx + 3] = 255;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function crc32(buf) {
    let c = -1;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
      }
    }
    return (c ^ -1) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeData = Buffer.concat([Buffer.from(type), data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(typeData));
    return Buffer.concat([len, typeData, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const icons = {
  admin: [30, 41, 59],
  lojista: [239, 68, 68],
  entregador: [239, 68, 68],
  cliente: [239, 68, 68],
  mld: [239, 68, 68],
};

const outDir = '/app/public/pwa/icons';
try { fs.mkdirSync(outDir, { recursive: true }); } catch {}

for (const [name, [r, g, b]] of Object.entries(icons)) {
  for (const size of [192, 512]) {
    const png = createPNG(size, size, r, g, b);
    fs.writeFileSync(path.join(outDir, `${name}-${size}.png`), png);
    console.log(`${name}-${size}.png (${png.length} bytes)`);
  }
}
console.log('Done!');
