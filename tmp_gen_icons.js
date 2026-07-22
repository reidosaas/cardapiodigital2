const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function createPNG(width, height, r, g, b) {
  const raw = [];
  for (let y = 0; y < height; y++) {
    raw.push(0);
    for (let x = 0; x < width; x++) {
      raw.push(r, g, b, 255);
    }
  }
  const buf = Buffer.from(raw);
  const deflated = zlib.deflateSync(buf);

  function crc32(buf) {
    let c = 0xFFFFFFFF;
    const table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let v = n;
      for (let k = 0; k < 8; k++) v = (v & 1) ? (0xEDB88320 ^ (v >>> 1)) : (v >>> 1);
      table[n] = v;
    }
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeData));
    return Buffer.concat([len, typeData, crc]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflated),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const icons = [
  { name: 'mld', text: '❤', r: 239, g: 68, b: 68 },
  { name: 'lojista', text: 'L', r: 239, g: 68, b: 68 },
  { name: 'admin', text: 'A', r: 30, g: 41, b: 59 },
  { name: 'entregador', text: 'E', r: 239, g: 68, b: 68 },
  { name: 'cliente', text: 'C', r: 239, g: 68, b: 68 },
];

const dir = path.join(__dirname, 'frontend', 'public', 'pwa', 'icons');

icons.forEach(icon => {
  [192, 512].forEach(size => {
    const png = createPNG(size, size, icon.r, icon.g, icon.b);
    const filePath = path.join(dir, icon.name + '-' + size + '.png');
    fs.writeFileSync(filePath, png);
    console.log('Created: ' + filePath + ' (' + png.length + ' bytes)');
  });
});

console.log('Done!');
