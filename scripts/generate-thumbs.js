// scripts/generate-thumbs.js
// Generates thumbnails for images in ./pictures, writing to ./pictures/thumbs
// Skips files that are already smaller than the requested max dimension.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const repoRoot = path.join(__dirname, '..');
const srcDir = path.join(repoRoot, 'pictures');
const outDir = path.join(srcDir, 'thumbs');
const MAX_DIM = 200; // max thumbnail width/height in px
const QUALITY = 78;

if (!fs.existsSync(srcDir)) {
  console.error('Source pictures directory not found:', srcDir);
  process.exit(1);
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(srcDir).filter(f => /\.(jpe?g|png)$/i.test(f));
if (!files.length) {
  console.log('No image files found in', srcDir);
  process.exit(0);
}

(async () => {
  for (const file of files) {
    try {
      const inPath = path.join(srcDir, file);
      const outPath = path.join(outDir, file);

      // Skip if thumbnail already exists and is newer
      if (fs.existsSync(outPath)) {
        const inStat = fs.statSync(inPath);
        const outStat = fs.statSync(outPath);
        if (outStat.mtimeMs >= inStat.mtimeMs) {
          console.log('Skipping (up-to-date):', file);
          continue;
        }
      }

      const metadata = await sharp(inPath).metadata();

      // If the source is already small, copy it (or downscale slightly)
      if (metadata.width <= MAX_DIM && metadata.height <= MAX_DIM) {
        // Copy with moderate compression to ensure consistent format/quality
        await sharp(inPath)
          .resize(Math.min(metadata.width, MAX_DIM), Math.min(metadata.height, MAX_DIM), { fit: 'inside' })
          .jpeg({ quality: QUALITY })
          .toFile(outPath);
        console.log('Copied/small-resized:', file);
        continue;
      }

      // Otherwise, resize to fit within MAX_DIM
      await sharp(inPath)
        .resize(MAX_DIM, MAX_DIM, { fit: 'inside' })
        .jpeg({ quality: QUALITY })
        .toFile(outPath);

      console.log('Thumbnail created:', file);
    } catch (err) {
      console.error('Error processing', file, err.message || err);
    }
  }
  console.log('Done. Thumbnails written to', outDir);
})();
