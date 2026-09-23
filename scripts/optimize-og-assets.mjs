import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve('apps/sistema-og/assets/premium');
const output = resolve(root, 'optimized');
const iconOutput = resolve('apps/sistema-og/assets/icons');
await mkdir(output, { recursive: true });
await mkdir(iconOutput, { recursive: true });

const jobs = [
  ['07-hero-desktop-olho-de-gato-v2.png', 'hero-desktop-1920.webp', 1920, 82],
  ['07-hero-desktop-olho-de-gato-v2.png', 'hero-desktop-1280.webp', 1280, 80],
  ['08-hero-mobile-olho-de-gato-v2.png', 'hero-mobile-960.webp', 960, 82],
  ['08-hero-mobile-olho-de-gato-v2.png', 'hero-mobile-640.webp', 640, 80],
  ['09-produto-olho-de-gato-v2.png', 'produto-og-1280.webp', 1280, 82],
  ['09-produto-olho-de-gato-v2.png', 'produto-og-768.webp', 768, 80],
  ['04-caminhoes-pesados.png', 'caminhoes-pesados-960.webp', 960, 82],
  ['05-caminhoes-medios.png', 'caminhoes-medios-960.webp', 960, 82]
];

for (const [source, target, width, quality] of jobs) {
  await sharp(resolve(root, source))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 5, alphaQuality: 90 })
    .toFile(resolve(output, target));
  console.log(target);
}

for (const size of [192, 512]) {
  await sharp(resolve('apps/sistema-og/assets/logo-olho-de-gato.jpg'))
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png({ compressionLevel: 9 })
    .toFile(resolve(iconOutput, `icon-${size}.png`));
  console.log(`icon-${size}.png`);
}
