#!/usr/bin/env node
// Frequency analysis on the cleaned prompts. Surfaces likely cluster
// candidates before the subagent semantic pass.
//
// Outputs:
//  - Top n-gram (1, 2, 3-word) phrases by document-frequency
//  - Top hashtag-style topic markers (file paths, command names)
//  - Length histogram

const fs = require("fs");

const IN = "d:/localdev/platform_devpulse/docs/chat-modes/_raw/all-prompts.txt";
const OUT = "d:/localdev/platform_devpulse/docs/chat-modes/_raw/freq.json";

const text = fs.readFileSync(IN, "utf8");
const docs = text.split(/\n\n---\n\n/);
console.error(`docs: ${docs.length}`);

// Stop words — drop the obvious filler so n-grams are signal.
const STOP = new Set(
  `the a an and or but of to in for on at by with as is are was were be been being do does did done have has had it its this that these those if then else when while where who whom whose what which why how can could should would will shall may might must from up down out into onto off over under above below not no nor my me i you your they them their our we us so just also too very much more most less least very only own same each every any all some such own most many few here there now then okay yes`.split(
    /\s+/,
  ),
);

const tokenize = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9_/.\-{}\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP.has(w));

function countNgrams(n) {
  const docFreq = new Map();
  for (const doc of docs) {
    const toks = tokenize(doc);
    const seen = new Set();
    for (let i = 0; i <= toks.length - n; i++) {
      const gram = toks.slice(i, i + n).join(" ");
      if (gram.split(" ").every((t) => t.length < 3)) continue;
      if (!seen.has(gram)) {
        docFreq.set(gram, (docFreq.get(gram) || 0) + 1);
        seen.add(gram);
      }
    }
  }
  return [...docFreq.entries()].sort((a, b) => b[1] - a[1]);
}

const unigrams = countNgrams(1).slice(0, 60);
const bigrams = countNgrams(2).slice(0, 80);
const trigrams = countNgrams(3).slice(0, 80);

// Length histogram
const buckets = { "<50": 0, "50-200": 0, "200-500": 0, "500-1k": 0, "1k+": 0 };
for (const d of docs) {
  const n = d.length;
  if (n < 50) buckets["<50"]++;
  else if (n < 200) buckets["50-200"]++;
  else if (n < 500) buckets["200-500"]++;
  else if (n < 1000) buckets["500-1k"]++;
  else buckets["1k+"]++;
}

const out = {
  total_docs: docs.length,
  length_histogram: buckets,
  top_unigrams: unigrams.map(([w, c]) => ({ w, c })),
  top_bigrams: bigrams.map(([w, c]) => ({ w, c })),
  top_trigrams: trigrams.map(([w, c]) => ({ w, c })),
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

// Also print readable top-N to stderr for quick inspection.
const fmt = (entries, label) => {
  console.error(`\n=== ${label} ===`);
  for (const { w, c } of entries.slice(0, 30))
    console.error(`  ${String(c).padStart(4)}  ${w}`);
};
fmt(out.top_unigrams, "unigrams (top 30)");
fmt(out.top_bigrams, "bigrams (top 30)");
fmt(out.top_trigrams, "trigrams (top 30)");
console.error(`\nwritten to ${OUT}`);
