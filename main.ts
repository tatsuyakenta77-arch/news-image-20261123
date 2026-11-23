// news-image-20261123: write the day's front page to the output directory.
// The image is entry.png, a newspaper front page generated in this session
// from the real news of Monday 23 November 2026. This program only copies
// it, so every run writes exactly the same bytes. No network, no randomness.
import { copyFileSync, mkdirSync, readFileSync, renameSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const src = join(here, "entry.png");
const dst = join(outDir, "entry.png");

// The shipped file is a JPEG (JFIF) named entry.png: confirm it really is
// one, and that its frame is exactly 1024x1024, before anything is copied.
// A corrupt or wrong-sized source must fail loudly here, never ship silent.
function validateSource(path) {
  const bytes = readFileSync(path);
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error("entry.png is not a JPEG (missing SOI marker)");
  }
  let i = 2;
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = bytes[i + 1];
    if (marker === 0xd9) break; // EOI: no frame found
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      const h = bytes.readUInt16BE(i + 5);
      const w = bytes.readUInt16BE(i + 7);
      if (w !== 1024 || h !== 1024) {
        throw new Error(`entry.png is ${w}x${h}, expected 1024x1024`);
      }
      return;
    }
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    i += 2 + bytes.readUInt16BE(i + 2);
  }
  throw new Error("entry.png has no JPEG frame (SOF marker not found)");
}

mkdirSync(outDir, { recursive: true });
validateSource(src);

// Copy atomically and verify integrity: write to a temp file first, check
// its SHA-256 matches the source, and only then rename it into place, so
// the final path never holds a partial or corrupted copy.
const tmp = join(outDir, `.entry.png.tmp-${process.pid}`);
copyFileSync(src, tmp);
const sha256 = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
if (sha256(tmp) !== sha256(src)) {
  throw new Error("entry.png copy failed integrity check");
}
renameSync(tmp, dst);
