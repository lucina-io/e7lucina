"use client";

import { useState } from "react";

// Greyscale + contrast boost so grey text (~130-190 brightness) becomes
// clearly white before Tesseract reads it.
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

// Pull 4-6 digit standalone integers out of OCR text.
// Filters out artifact levels (+18, +30) and percentage stats (?%).
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

export default function ScreenshotImport({ setT1, setT2 }) {
  const [status, setStatus] = useState("idle");
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("loading");
    setResults(null);
    setErrorMsg("");

    try {
      const bitmap = await createImageBitmap(file);
      const W = bitmap.width;
      const H = bitmap.height;
      const mainCanvas = document.createElement("canvas");
      mainCanvas.width = W;
      mainCanvas.height = H;
      mainCanvas.getContext("2d").drawImage(bitmap, 0, 0);

      // Divide image into 4 equal horizontal quarters.
      // Q1 (0–25%) = Round 1 enemy panel.
      // Q3 (50–75%) = Round 2 enemy panel.
      const qw = Math.floor(W / 4);
      const r1Canvas = preprocessCanvas(mainCanvas, 0, 0, qw, H);
      const r2Canvas = preprocessCanvas(mainCanvas, qw * 2, 0, qw, H);

      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, { logger: () => {} });
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789+%?,",
        tessedit_pageseg_mode: "6",
      });

      const [r1Result, r2Result] = await Promise.all([
        worker.recognize(r1Canvas),
        worker.recognize(r2Canvas),
      ]);
      await worker.terminate();

      const r1HP = extractHPValues(r1Result.data.text);
      const r2HP = extractHPValues(r2Result.data.text);

      setResults({ r1: r1HP, r2: r2HP });

      const fields = ["firstChar", "secondChar", "thirdChar"];
      const applyHP = (setter, hpValues) => {
        setter((prev) => {
          const next = structuredClone(prev);
          fields.forEach((field, i) => {
            if (hpValues[i]) next[field].hp = hpValues[i];
          });
          return next;
        });
      };

      applyHP(setT1, r1HP);
      applyHP(setT2, r2HP);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message ?? "Unknown error");
      setStatus("error");
    }

    e.target.value = "";
  };

  const fmt = (v) => (v ? v.toLocaleString() : "?");
  const anyMissing =
    results && (results.r1.length < 3 || results.r2.length < 3);

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
            Reading HP values…
          </span>
        )}
      </div>

      {status === "done" && results && (
        <div className="mt-2 text-sm text-green-400">
          ✓ Round 1: {results.r1.map(fmt).join(" / ")}
          {"  ·  "}
          Round 2: {results.r2.map(fmt).join(" / ")}
          {anyMissing &&
            " — some values could not be read, please fill in manually."}
        </div>
      )}

      {status === "error" && (
        <div className="mt-2 text-sm text-red-400">
          ✗ Could not read screenshot: {errorMsg}
        </div>
      )}
    </section>
  );
}
