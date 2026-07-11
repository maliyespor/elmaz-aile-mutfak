// Generates simple PWA icon PNGs (fridge silhouette) without any image-library dependency.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

const BG = [0x2f, 0x6f, 0x4f];
const FG = [0xff, 0xff, 0xff];

function buildPixels(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const bodyX0 = Math.round(size * 0.28);
  const bodyX1 = Math.round(size * 0.72);
  const bodyY0 = Math.round(size * 0.16);
  const bodyY1 = Math.round(size * 0.84);
  const doorLineY0 = Math.round(size * 0.4);
  const doorLineY1 = Math.round(size * 0.44);
  const handle1Y0 = Math.round(size * 0.24);
  const handle1Y1 = Math.round(size * 0.34);
  const handle2Y0 = Math.round(size * 0.48);
  const handle2Y1 = Math.round(size * 0.62);
  const handleX0 = Math.round(size * 0.34);
  const handleX1 = Math.round(size * 0.38);
  const radius = Math.round(size * 0.18);

  function inRoundedRect(x, y) {
    if (x < bodyX0 || x >= bodyX1 || y < bodyY0 || y >= bodyY1) return false;
    const cornerR = Math.round(size * 0.06);
    const corners = [
      [bodyX0 + cornerR, bodyY0 + cornerR],
      [bodyX1 - cornerR, bodyY0 + cornerR],
      [bodyX0 + cornerR, bodyY1 - cornerR],
      [bodyX1 - cornerR, bodyY1 - cornerR],
    ];
    if (x < bodyX0 + cornerR && y < bodyY0 + cornerR) {
      return Math.hypot(x - corners[0][0], y - corners[0][1]) <= cornerR;
    }
    if (x >= bodyX1 - cornerR && y < bodyY0 + cornerR) {
      return Math.hypot(x - corners[1][0], y - corners[1][1]) <= cornerR;
    }
    if (x < bodyX0 + cornerR && y >= bodyY1 - cornerR) {
      return Math.hypot(x - corners[2][0], y - corners[2][1]) <= cornerR;
    }
    if (x >= bodyX1 - cornerR && y >= bodyY1 - cornerR) {
      return Math.hypot(x - corners[3][0], y - corners[3][1]) <= cornerR;
    }
    return true;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let color = BG;
      // outer rounded rect (app icon background corner rounding)
      const cr = radius;
      const corners = [
        [cr, cr],
        [size - cr, cr],
        [cr, size - cr],
        [size - cr, size - cr],
      ];
      let outside = false;
      if (x < cr && y < cr) outside = Math.hypot(x - corners[0][0], y - corners[0][1]) > cr;
      else if (x >= size - cr && y < cr) outside = Math.hypot(x - corners[1][0], y - corners[1][1]) > cr;
      else if (x < cr && y >= size - cr) outside = Math.hypot(x - corners[2][0], y - corners[2][1]) > cr;
      else if (x >= size - cr && y >= size - cr) outside = Math.hypot(x - corners[3][0], y - corners[3][1]) > cr;

      if (inRoundedRect(x, y)) {
        color = FG;
        if (y >= doorLineY0 && y < doorLineY1) color = BG;
        if (x >= handleX0 && x < handleX1 && ((y >= handle1Y0 && y < handle1Y1) || (y >= handle2Y0 && y < handle2Y1))) {
          color = BG;
        }
      }

      const idx = (y * size + x) * 4;
      if (outside) {
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
      } else {
        pixels[idx] = color[0];
        pixels[idx + 1] = color[1];
        pixels[idx + 2] = color[2];
        pixels[idx + 3] = 255;
      }
    }
  }
  return pixels;
}

function encodePng(size) {
  const pixels = buildPixels(size);
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter type: none
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = zlib.deflateSync(raw);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

for (const size of [192, 512]) {
  const png = encodePng(size);
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), png);
  console.log(`wrote icon-${size}.png`);
}

const apple = encodePng(180);
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), apple);
console.log('wrote apple-touch-icon.png');
