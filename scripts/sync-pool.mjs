#!/usr/bin/env node
// Keeps app/heroes.js and app/artifacts.js in sync with the live game.
//
// Sources:
//   CeciliaBot/CeciliaBot.github.io  – hand-maintained id → name data + banner timeline
//   CeciliaBot/E7Assets-Temp         – assets ripped from the client each patch
//
// A hero/artifact is added only when:
//   1. CeciliaBot has a name for it (not a placeholder),
//   2. its portrait/icon has shipped in the client (E7Assets-Temp),
//   3. it isn't sitting on a banner that hasn't started yet.
//
// Usage: node scripts/sync-pool.mjs [--dry-run]

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY_RUN = process.argv.includes("--dry-run");
const CB = "https://raw.githubusercontent.com/CeciliaBot/CeciliaBot.github.io/master/data/";
const ASSETS_TREE = "https://api.github.com/repos/CeciliaBot/E7Assets-Temp/git/trees/HEAD?recursive=1";

const overrides = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/pool-overrides.json"), "utf8"));

async function getJson(url) {
  const headers = { "User-Agent": "lucina-sync-pool" };
  if (url.includes("api.github.com") && process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

// Case/quote-insensitive key so CeciliaBot typos like "Butterfly's Baptism'"
// or "With A Little Friend" still match the existing entries.
const norm = (s) => s.toLowerCase().replace(/[’']/g, "'").replace(/^['"\s]+|['"\s]+$/g, "");

const readList = (file) =>
  [...fs.readFileSync(path.join(ROOT, file), "utf8").matchAll(/label: "(.*?)"/g)].map((m) => m[1]);

function writeList(file, varName, names) {
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  const body = sorted
    .map((n) => `  {\n    label: ${JSON.stringify(n)},\n    value: ${JSON.stringify(n)},\n  },`)
    .join("\n");
  fs.writeFileSync(path.join(ROOT, file), `const ${varName} = [\n${body}\n];\n\nexport default ${varName};\n`);
}

// Banner dates show up as epoch ms or as quoted ISO strings ("'2026-09-17T09:00:00Z'").
const toMs = (v) => (typeof v === "number" ? v : /^\d+$/.test(String(v)) ? Number(v) : Date.parse(String(v).replace(/'/g, "")));

function bannerStarts(timelines) {
  // _id → earliest start (ms) of any banner featuring it
  const starts = new Map();
  for (const entry of timelines.flat()) {
    const start = toMs(entry.dt?.[0]);
    if (!Number.isFinite(start)) continue;
    for (const unit of [...(entry.c ?? []), ...(entry.a ?? [])]) {
      if (!unit?.id) continue;
      starts.set(unit.id, Math.min(starts.get(unit.id) ?? Infinity, start));
    }
  }
  return starts;
}

function sync({ kind, file, varName, db, shipped, starts, cfg }) {
  const current = readList(file);
  const have = new Set(current.map(norm));
  const ignore = new Set(Object.keys(cfg.ignore ?? {}));
  const rename = cfg.rename ?? {};
  const now = Date.now();

  // Detect CeciliaBot copy-paste bugs: two ids sharing one name.
  const nameCount = {};
  for (const e of Object.values(db)) nameCount[norm(e.name ?? "")] = (nameCount[norm(e.name ?? "")] ?? 0) + 1;

  const added = [];
  const pending = [];
  for (const e of Object.values(db)) {
    if (ignore.has(e.id)) continue;
    const name = (rename[e.id] ?? e.name ?? "").trim();
    if (have.has(norm(name))) continue;

    const why =
      !name ? "no name yet"
      : e.role === e.id ? "placeholder data (kit not published)"
      : !rename[e.id] && nameCount[norm(name)] > 1 ? `name "${name}" is shared with another id — add a rename override`
      : !shipped.has(e.id) ? "not in the client yet (no asset in E7Assets-Temp)"
      : (starts.get(e._id) ?? 0) > now ? `banner starts ${new Date(starts.get(e._id)).toISOString().slice(0, 10)}`
      : null;

    if (why) pending.push(`${e.id} ${name || e._id} — ${why}`);
    else {
      added.push(name);
      have.add(norm(name));
    }
  }

  if (added.length && !DRY_RUN) writeList(file, varName, [...current, ...added]);
  console.log(`\n${kind}: ${added.length ? "added " + added.join(", ") : "nothing new"}`);
  for (const p of pending) console.log(`  pending: ${p}`);
  return added;
}

const [heroDb, artiDb, covenant, mystic, tree] = await Promise.all([
  getJson(CB + "HeroDatabase.json"),
  getJson(CB + "artifacts.json"),
  getJson(CB + "timeline/covenant.json"),
  getJson(CB + "timeline/mystic.json"),
  getJson(ASSETS_TREE),
]);
if (tree.truncated) console.warn("warning: E7Assets-Temp tree listing was truncated");

const shipped = new Set();
for (const { path: p } of tree.tree) {
  let m;
  if ((m = p.match(/^assets\/face\/(c\d+)_s\.png$/))) shipped.add(m[1]);
  if ((m = p.match(/^assets\/item_arti\/icon_(art[\w]+)\.png$/))) shipped.add(m[1]);
}
const starts = bannerStarts([covenant, mystic]);

const added = [
  ...sync({ kind: "Heroes", file: "app/heroes.js", varName: "heroes", db: heroDb, shipped, starts, cfg: overrides.heroes }),
  ...sync({ kind: "Artifacts", file: "app/artifacts.js", varName: "artifacts", db: artiDb, shipped, starts, cfg: overrides.artifacts }),
];

if (DRY_RUN) console.log("\n(dry run — no files written)");
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `added=${added.join(", ")}\n`);
