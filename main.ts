// news-image-20261123: write the day's front page to the output directory.
// The image is entry.png, a newspaper front page generated in this session
// from the real news of Monday 23 November 2026. This program only copies
// it, so every run writes exactly the same bytes. No network, no randomness.
import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const src = join(here, "entry.png");
const dst = join(outDir, "entry.png");

mkdirSync(outDir, { recursive: true });
copyFileSync(src, dst);

// Fail loudly if the copy is ever short, so a bad run never passes silent.
if (statSync(dst).size !== statSync(src).size) {
  throw new Error("entry.png copy is incomplete");
}
