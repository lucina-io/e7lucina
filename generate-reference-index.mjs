#!/usr/bin/env node

// generate-reference-index.mjs
//
// Usage:
//   npm install sharp
//   node generate-reference-index.mjs \
//     --heroes <folder> <HeroDatabase.json> \
//     --artifacts <folder> <artifacts.json> \
//     --output <reference-index.json>

import fs from "fs";
import path from "path";
import sharp from "sharp";

// ── pHash ─────────────────────────────────────────────────────────────────────
// Resize to 32x32 greyscale, run 2D DCT, threshold top-left 8x8 at median.

async function computeHash(imagePath) {
  // sharp outputs raw greyscale pixels — one byte per pixel, no alpha issues
  const { data } = await sharp(imagePath)
    .resize(32, 32, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Float64Array(32 * 32);
  for (let i = 0; i < 32 * 32; i++) pixels[i] = data[i];

  const N = 32;
  const dct = new Float64Array(N * N);

  for (let u = 0; u < N; u++) {
    for (let v = 0; v < N; v++) {
      let sum = 0;
      for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
          sum +=
            pixels[x * N + y] *
            Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N)) *
            Math.cos(((2 * y + 1) * v * Math.PI) / (2 * N));
        }
      }
      const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
      const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
      dct[u * N + v] = (cu * cv * sum) / 4;
    }
  }

  // Top-left 8x8, skip [0][0] DC component
  const vals = [];
  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      if (u === 0 && v === 0) continue;
      vals.push(dct[u * N + v]);
    }
  }

  const median = [...vals].sort((a, b) => a - b)[Math.floor(vals.length / 2)];
  return vals.map((v) => (v > median ? "1" : "0")).join("");
}

// ── Arg parsing ───────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  let i = 0;
  while (i < args.length) {
    if (args[i] === "--heroes") {
      result.heroFolder = args[i + 1];
      result.heroDb = args[i + 2];
      i += 3;
    } else if (args[i] === "--artifacts") {
      result.artifactFolder = args[i + 1];
      result.artifactDb = args[i + 2];
      i += 3;
    } else if (args[i] === "--output") {
      result.output = args[i + 1];
      i += 2;
    } else {
      i++;
    }
  }
  return result;
}

// ── DB lookups ────────────────────────────────────────────────────────────────

function buildHeroLookup(dbPath) {
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  const lookup = {};
  for (const entry of Object.values(db)) {
    lookup[entry.id] = {
      label: entry.name,
      value: entry.name,
      type: "hero",
      role: entry.role ?? null,
    };
  }
  return lookup;
}

function buildArtifactLookup(dbPath) {
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  const lookup = {};
  for (const entry of Object.values(db)) {
    lookup[entry.id] = {
      label: entry.name,
      value: entry.name,
      type: "artifact",
      role: entry.role ?? null,
    };
  }
  return lookup;
}

function heroIdFromFilename(filename) {
  const m = filename.match(/^(c\d+)/);
  return m ? m[1] : null;
}

function artifactIdFromFilename(filename) {
  const m = filename.match(/art[0-9][^.]+/);
  return m ? m[0] : null;
}

// ── Process folder ────────────────────────────────────────────────────────────

async function processFolder(folder, lookup, idExtractor, index) {
  const files = fs.readdirSync(folder).filter((f) => f.endsWith(".png")).sort();
  let matched = 0;
  let unmatched = 0;

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filepath = path.join(folder, filename);
    const id = idExtractor(filename);

    if (!id || !lookup[id]) {
      unmatched++;
      continue;
    }

    try {
      const hash = await computeHash(filepath);
      index[hash] = lookup[id];
      matched++;
    } catch (err) {
      process.stderr.write(`  Warning: could not hash ${filename}: ${err.message}\n`);
      unmatched++;
    }

    if ((i + 1) % 50 === 0) {
      process.stdout.write(`  ${i + 1}/${files.length} processed…\n`);
    }
  }

  return { matched, unmatched };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();

  if (!args.heroFolder && !args.artifactFolder) {
    console.error(
      "Usage: node generate-reference-index.mjs \\\n" +
      "  --heroes <folder> <HeroDatabase.json> \\\n" +
      "  --artifacts <folder> <artifacts.json> \\\n" +
      "  --output <reference-index.json>"
    );
    process.exit(1);
  }

  const outputFile = args.output ?? "reference-index.json";
  const index = {};

  if (args.heroFolder) {
    process.stdout.write(`Processing heroes from ${args.heroFolder}…\n`);
    const lookup = buildHeroLookup(args.heroDb);
    const { matched, unmatched } = await processFolder(args.heroFolder, lookup, heroIdFromFilename, index);
    process.stdout.write(`  Done: ${matched} matched, ${unmatched} skipped.\n`);
  }

  if (args.artifactFolder) {
    process.stdout.write(`Processing artifacts from ${args.artifactFolder}…\n`);
    const lookup = buildArtifactLookup(args.artifactDb);
    const { matched, unmatched } = await processFolder(args.artifactFolder, lookup, artifactIdFromFilename, index);
    process.stdout.write(`  Done: ${matched} matched, ${unmatched} skipped.\n`);
  }

  fs.writeFileSync(outputFile, JSON.stringify(index, null, 2));
  process.stdout.write(`\nWrote ${Object.keys(index).length} entries to ${outputFile}\n`);
  process.stdout.write(`Drop this file into your e7lucina/public/ folder.\n`);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
