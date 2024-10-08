/* eslint-disable no-bitwise, no-plusplus, prefer-destructuring, no-multi-assign */
// Forked from https://github.com/alexvandesande/blockies
// The random number is a js implementation of the Xorshift PRNG
const randseed = new Array(4); // Xorshift: [x, y, z, w] 32 bit values

type IconOptions = {
  bgcolor?: string;
  color?: string;
  scale?: number;
  seed?: string;
  size?: number;
  spotcolor?: string;
};

function seedrand(seed: string) {
  for (let i = 0; i < randseed.length; i++) {
    randseed[i] = 0;
  }
  for (let i = 0; i < seed.length; i++) {
    randseed[i % 4] =
      (randseed[i % 4] << 5) - randseed[i % 4] + seed.charCodeAt(i);
  }
}

function rand() {
  // based on Java's String.hashCode(), expanded to 4 32bit values
  const t = randseed[0] ^ (randseed[0] << 11);

  randseed[0] = randseed[1];
  randseed[1] = randseed[2];
  randseed[2] = randseed[3];
  randseed[3] = randseed[3] ^ (randseed[3] >> 19) ^ t ^ (t >> 8);

  return (randseed[3] >>> 0) / ((1 << 31) >>> 0);
}

function createColor() {
  // saturation is the whole color spectrum
  const h = Math.floor(rand() * 360);
  // saturation goes from 40 to 100, it avoids greyish colors
  const s = `${rand() * 60 + 40}%`;
  // lightness can be anything from 0 to 100, but probabilities are a bell curve around 50%
  const l = `${(rand() + rand() + rand() + rand()) * 25}%`;

  const color = `hsl(${h},${s},${l})`;
  return color;
}

function createImageData(size: number) {
  const width = size; // Only support square icons for now
  const height = size;

  const dataWidth = Math.ceil(width / 2);
  const mirrorWidth = width - dataWidth;

  const data = [] as number[];
  for (let y = 0; y < height; y++) {
    let row = [] as number[];
    for (let x = 0; x < dataWidth; x++) {
      // this makes foreground and background color to have a 43% (1/2.3) probability
      // spot color has 13% chance
      row[x] = Math.floor(rand() * 2.3);
    }

    const r = row.slice(0, mirrorWidth);
    r.reverse();
    row = row.concat(r);

    for (let i = 0; i < row.length; i++) {
      data.push(row[i]);
    }
  }

  return data;
}

function createCanvas(imageData: string | any[], color: string | CanvasGradient | CanvasPattern, scale: number, bgcolor: string | CanvasGradient | CanvasPattern, spotcolor: string | CanvasGradient | CanvasPattern) {
  const c = document.createElement('canvas');
  const width = Math.sqrt(imageData.length);
  c.width = c.height = width * scale;

  const cc = c.getContext('2d');
  if (!cc) return undefined;
  cc.fillStyle = bgcolor;
  cc.fillRect(0, 0, c.width, c.height);
  cc.fillStyle = color;

  for (let i = 0; i < imageData.length; i++) {
    const row = Math.floor(i / width);
    const col = i % width;
    // if data is 2, choose spot color, if 1 choose foreground
    cc.fillStyle = imageData[i] === 1 ? color : spotcolor;

    // if data is 0, leave the background
    if (imageData[i]) {
      cc.fillRect(col * scale, row * scale, scale, scale);
    }
  }

  return c;
}

function createIcon(opts: IconOptions) {
  const defaultOpts = opts || {};
  const size = defaultOpts.size || 8;
  const scale = defaultOpts.scale || 4;
  const seed =
    defaultOpts.seed || Math.floor(Math.random() * 10 ** 16).toString(16);

  seedrand(seed);

  const color = defaultOpts.color || createColor();
  const bgcolor = defaultOpts.bgcolor || createColor();
  const spotcolor = defaultOpts.spotcolor || createColor();
  const imageData = createImageData(size);
  const canvas = createCanvas(imageData, color, scale, bgcolor, spotcolor);

  return canvas;
}

export default createIcon;
