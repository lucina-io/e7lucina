"use client";

import { useState } from "react";
import Image from "next/image";

// ── HP OCR ────────────────────────────────────────────────────────────────────

function preprocessCanvas(srcCanvas, x, y, w, h) {
  const SCALE = 2;
  const dst = document.createElement("canvas");
  dst.width = w * SCALE;
  dst.height = h * SCALE;
  const ctx = dst.getContext("2d");
  ctx.drawImage(srcCanvas, x, y, w, h, 0, 0, dst.width, dst.height);
  const imageData = ctx.getImageData(0, 0, dst.width, dst.height);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const grey = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const boosted = Math.min(255, Math.max(0, (grey - 80) * 2.2));
    d[i] = d[i + 1] = d[i + 2] = boosted;
  }
  ctx.putImageData(imageData, 0, 0);
  return dst;
}

function extractHPValues(text) {
  const normalised = text.replace(/,/g, "");
  const matches = [];
  const re = /(?<![+\d])(\d{4,6})(?!\d|%)/g;
  let m;
  while ((m = re.exec(normalised)) !== null) {
    const n = Number(m[1]);
    if (n >= 1000 && n <= 999999) matches.push(n);
    if (matches.length === 3) break;
  }
  return matches;
}

// ── Portrait detection via vertical grey line ─────────────────────────────────
//
// Strategy:
// 1. Scan the leftmost 8% of the image column by column looking for a vertical
//    grey line — the connector bar between side-panel portraits. Grey = all RGB
//    channels similar and 70-160 in value. The first column with a continuous
//    grey run longer than 15% of image height is the portrait column.
//
// 2. Scan downward from where the line starts, looking for red pixels
//    (R>150, G<100, B<100) within a 6%-wide window centred on that column.
//    Cluster consecutive red rows (gap ≤8px = same ring). Clusters shorter
//    than 2% of image height are noise.
//
// 3. Take the first 3 clusters — those are the 3 enemy portrait rings.
//    Use cluster height/2 as the crop radius, with a floor of 3% of height
//    (handles JPEG-compressed images where the ring is fragmented).
//
// The same logic runs on a horizontally-flipped version for the right strip.

function findVerticalLine(pixels, W, H, maxX) {
  for (let x = 5; x < maxX; x++) {
    let run = 0,
      maxRun = 0,
      runStart = 0,
      bestStart = 0;
    for (let y = 0; y < H; y++) {
      const idx = (y * W + x) * 4;
      const r = pixels[idx],
        g = pixels[idx + 1],
        b = pixels[idx + 2];
      const isGrey =
        Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && r > 70 && r < 160;
      if (isGrey) {
        if (run === 0) runStart = y;
        run++;
        if (run > maxRun) {
          maxRun = run;
          bestStart = runStart;
        }
      } else {
        run = 0;
      }
    }
    if (maxRun > H * 0.15) return { lineX: x, lineStart: bestStart };
  }
  return null;
}

function findPortraitClusters(pixels, W, H, lineX, lineStart) {
  const scanHalf = Math.floor(W * 0.03);
  const xStart = Math.max(0, lineX - scanHalf);
  const xEnd = Math.min(W, lineX + scanHalf);
  const minClusterH = H * 0.02;
  const minRadius = Math.floor(H * 0.03);
  const maxRadius = Math.floor(H * 0.05);

  const redRows = [];
  for (let y = lineStart; y < H; y++) {
    let count = 0;
    for (let x = xStart; x < xEnd; x++) {
      const idx = (y * W + x) * 4;
      if (pixels[idx] > 150 && pixels[idx + 1] < 100 && pixels[idx + 2] < 100)
        count++;
    }
    if (count > 2) redRows.push(y);
  }

  const clusters = [];
  if (!redRows.length) return clusters;

  let s = redRows[0],
    p = redRows[0];
  for (let i = 1; i < redRows.length; i++) {
    const y = redRows[i];
    if (y - p > 8) {
      if (p - s >= minClusterH)
        clusters.push({
          cy: (s + p) >> 1,
          radius: Math.max(minRadius, Math.min((p - s) >> 1, maxRadius)),
        });
      s = y;
    }
    p = y;
  }
  if (p - s >= minClusterH)
    clusters.push({
      cy: (s + p) >> 1,
      radius: Math.max(minRadius, Math.min((p - s) >> 1, maxRadius)),
    });

  return clusters.slice(0, 3);
}

function findPortraits(pixels, W, H, fromRight = false) {
  // Build a temporary pixel array for the strip we're searching
  const stripW = Math.floor(W * 0.08);
  const tempPixels = new Uint8ClampedArray(H * W * 4);
  if (fromRight) {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const srcIdx = (y * W + (W - 1 - x)) * 4;
        const dstIdx = (y * W + x) * 4;
        tempPixels[dstIdx] = pixels[srcIdx];
        tempPixels[dstIdx + 1] = pixels[srcIdx + 1];
        tempPixels[dstIdx + 2] = pixels[srcIdx + 2];
        tempPixels[dstIdx + 3] = pixels[srcIdx + 3];
      }
    }
  } else {
    tempPixels.set(pixels);
  }

  const line = findVerticalLine(tempPixels, W, H, stripW);
  if (!line) return [];

  const clusters = findPortraitClusters(
    tempPixels,
    W,
    H,
    line.lineX,
    line.lineStart,
  );

  // Convert lineX back to original image coords
  return clusters.map(({ cy, radius }) => ({
    cy,
    cx: fromRight ? W - 1 - line.lineX : line.lineX,
    radius,
  }));
}

// ── pHash ─────────────────────────────────────────────────────────────────────

function cropPortraitToCanvas(srcCanvas, cx, cy, radius, outSize = 32) {
  const dst = document.createElement("canvas");
  dst.width = outSize;
  dst.height = outSize;
  const ctx = dst.getContext("2d");
  ctx.drawImage(
    srcCanvas,
    cx - radius,
    cy - radius,
    radius * 2,
    radius * 2,
    0,
    0,
    outSize,
    outSize,
  );
  const id = ctx.getImageData(0, 0, outSize, outSize);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    d[i] = d[i + 1] = d[i + 2] = g;
  }
  ctx.putImageData(id, 0, 0);
  return { canvas: dst, ctx };
}

function computeHash({ canvas, ctx }) {
  const SIZE = 32;
  const id = ctx.getImageData(0, 0, SIZE, SIZE);
  const d = id.data;
  const px = new Float64Array(SIZE * SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) px[i] = d[i * 4];
  const N = SIZE;
  const dct = new Float64Array(N * N);
  for (let u = 0; u < N; u++) {
    for (let v = 0; v < N; v++) {
      let sum = 0;
      for (let x = 0; x < N; x++)
        for (let y = 0; y < N; y++)
          sum +=
            px[x * N + y] *
            Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N)) *
            Math.cos(((2 * y + 1) * v * Math.PI) / (2 * N));
      const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
      const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
      dct[u * N + v] = (cu * cv * sum) / 4;
    }
  }
  const vals = [];
  for (let u = 0; u < 8; u++)
    for (let v = 0; v < 8; v++) if (u || v) vals.push(dct[u * N + v]);
  const median = [...vals].sort((a, b) => a - b)[Math.floor(vals.length / 2)];
  return vals.map((v) => (v > median ? "1" : "0")).join("");
}

function hammingDistance(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

function findBestMatch(hash, index, threshold = 12) {
  let best = null,
    bestDist = Infinity;
  for (const [refHash, entry] of Object.entries(index)) {
    const dist = hammingDistance(hash, refHash);
    if (dist < bestDist) {
      bestDist = dist;
      best = entry;
    }
  }
  return bestDist <= threshold ? best : null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ScreenshotImport({ setT1, setT2 }) {
  const [status, setStatus] = useState("idle");
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDebug, setShowDebug] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("loading");
    setResults(null);
    setErrorMsg("");

    try {
      const bitmap = await createImageBitmap(file);
      const W = bitmap.width,
        H = bitmap.height;
      const mainCanvas = document.createElement("canvas");
      mainCanvas.width = W;
      mainCanvas.height = H;
      mainCanvas.getContext("2d").drawImage(bitmap, 0, 0);
      const pixels = mainCanvas.getContext("2d").getImageData(0, 0, W, H).data;

      // HP OCR — Q1 and Q3 quarters
      const qw = Math.floor(W / 4);
      const r1OcrCanvas = preprocessCanvas(mainCanvas, 0, 0, qw, H);
      const r2OcrCanvas = preprocessCanvas(mainCanvas, qw * 2, 0, qw, H);
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, { logger: () => {} });
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789+%?,",
        tessedit_pageseg_mode: "6",
      });
      const [r1Ocr, r2Ocr] = await Promise.all([
        worker.recognize(r1OcrCanvas),
        worker.recognize(r2OcrCanvas),
      ]);
      await worker.terminate();
      const r1HP = extractHPValues(r1Ocr.data.text);
      const r2HP = extractHPValues(r2Ocr.data.text);

      // Portrait detection via vertical line
      const leftPortraits = findPortraits(pixels, W, H, false);
      const rightPortraits = findPortraits(pixels, W, H, true);

      // Debug crops
      const debugPortraits = {
        r1: leftPortraits.map(({ cy, cx, radius }) =>
          cropPortraitToCanvas(
            mainCanvas,
            cx,
            cy,
            radius,
            80,
          ).canvas.toDataURL(),
        ),
        r2: rightPortraits.map(({ cy, cx, radius }) =>
          cropPortraitToCanvas(
            mainCanvas,
            cx,
            cy,
            radius,
            80,
          ).canvas.toDataURL(),
        ),
      };

      // Hash and match
      let r1Names = [null, null, null];
      let r2Names = [null, null, null];
      try {
        const indexRes = await fetch("/reference-index.json");
        if (indexRes.ok) {
          const refIndex = await indexRes.json();
          r1Names = leftPortraits.map(({ cy, cx, radius }) =>
            findBestMatch(
              computeHash(cropPortraitToCanvas(mainCanvas, cx, cy, radius)),
              refIndex,
            ),
          );
          r2Names = rightPortraits.map(({ cy, cx, radius }) =>
            findBestMatch(
              computeHash(cropPortraitToCanvas(mainCanvas, cx, cy, radius)),
              refIndex,
            ),
          );
        }
      } catch {
        /* no index */
      }

      setResults({ r1HP, r2HP, r1Names, r2Names, debugPortraits });

      const emptyChar = { name: "", artifact: "", hp: "", sets: [], misc: "" };
      const emptyTeam = {
        firstChar: { ...emptyChar },
        secondChar: { ...emptyChar },
        thirdChar: { ...emptyChar },
      };

      const fields = ["firstChar", "secondChar", "thirdChar"];
      const applyAll = (setter, hpValues, names) => {
        setter(() => {
          const next = structuredClone(emptyTeam);
          fields.forEach((field, i) => {
            if (hpValues[i]) next[field].hp = hpValues[i];
            if (names[i])
              next[field].name = {
                label: names[i].label,
                value: names[i].value,
              };
          });
          return next;
        });
      };
      applyAll(setT1, r1HP, r1Names);
      applyAll(setT2, r2HP, r2Names);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message ?? "Unknown error");
      setStatus("error");
    }
    e.target.value = "";
  };

  const fmt = (v) => (v ? v.toLocaleString() : "?");
  const fmtName = (n) => n?.label ?? "?";
  const anyMissing =
    results &&
    (results.r1HP.length < 3 ||
      results.r2HP.length < 3 ||
      results.r1Names.some((n) => !n) ||
      results.r2Names.some((n) => !n));

  return (
    <section className="mt-4 border border-dashed border-[#393E46] rounded-sm p-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-sm text-gray-400 shrink-0">
          Import from screenshot
        </label>
        <input
          type="file"
          accept="image/*"
          className="text-sm file:mr-3 file:border file:px-2 file:py-1 file:rounded-sm file:cursor-pointer file:hover:bg-[#393E46] file:bg-transparent file:text-white"
          onChange={handleFile}
          disabled={status === "loading"}
        />
        {status === "loading" && (
          <span className="text-sm text-gray-400 animate-pulse">
            Reading screenshot…
          </span>
        )}
      </div>

      {status === "done" && results && (
        <div className="mt-2 space-y-2">
          <div className="text-sm text-green-400">
            R1: {results.r1Names.map(fmtName).join(" / ")} &middot;{" "}
            {results.r1HP.map(fmt).join(" / ")} HP
          </div>
          <div className="text-sm text-green-400">
            R2: {results.r2Names.map(fmtName).join(" / ")} &middot;{" "}
            {results.r2HP.map(fmt).join(" / ")} HP
          </div>
          {anyMissing && (
            <div className="text-xs text-yellow-500">
              Some values could not be read — please fill in manually.
            </div>
          )}
          <button
            onClick={() => setShowDebug((v) => !v)}
            className="text-xs text-gray-500 underline"
          >
            {showDebug ? "Hide" : "Show"} debug portraits
          </button>
          {showDebug && results.debugPortraits && (
            <div className="mt-2 space-y-3">
              {[
                ["R1", results.debugPortraits.r1, results.r1Names],
                ["R2", results.debugPortraits.r2, results.r2Names],
              ].map(([label, portraits, names]) => (
                <div key={label}>
                  <div className="text-xs text-gray-500 mb-1">
                    {label} — {portraits.length} detected
                  </div>
                  <div className="flex gap-2">
                    {portraits.map((src, i) => (
                      <div key={i} className="text-center">
                        <Image
                          src={src}
                          alt=""
                          width={64}
                          height={64}
                          className="rounded border border-[#393E46]"
                          unoptimized
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {fmtName(names[i])}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="mt-2 text-sm text-red-400">
          Could not read screenshot: {errorMsg}
        </div>
      )}
    </section>
  );
}
