#!/usr/bin/env node
// Slice the corpus into early/mid/late thirds (fresh → tired) and
// classify each high-quality prompt into one of the 8 recognition
// families. Output: per-family count per third + 2 representative
// samples from the EARLY third.

const fs = require("fs");

const text = fs.readFileSync("docs/chat-modes/_raw/all-prompts.txt", "utf8");
const docs = text.split(/\n\n---\n\n/);

// Prompts are concatenated in chronological session order. Earliest
// third = fresh-era. (44 sessions span 14 days; first ~15 sessions are
// the energized window before the burnout slope.)
const third = Math.floor(docs.length / 3);
const early = docs.slice(0, third);
const mid = docs.slice(third, 2 * third);
const late = docs.slice(2 * third);

// Quality marker: 2+ structural signals.
const hasMd = (d) => /^#{1,3} /m.test(d) || /^- /m.test(d);
const hasTable = (d) => /\|---/.test(d);
const hasCodeFence = (d) => /```/.test(d);
const hasFiletree = (d) => /[├└]──/.test(d);
const hasBoxArt = (d) => /[│┌┐└┘─├┤]/.test(d);
const hasCheckbox = (d) => /\[ \]|\[x\]/i.test(d);
const hasPhase = (d) => /\bPhase\s+[0-9A-Z]/.test(d);
const hasPubItem = (d) => /\bpub\s+(struct|enum|trait|fn)\b/.test(d);
const hasError = (d) => /\berror\[E\d{3,}|process didn|svelte-check|Compiling devpulse/.test(d);
const hasFrozen = (d) => /\b(do not touch|out of scope|deferred)\b/i.test(d);
const hasFork = (d) =>
  /\bbest practice\b|\bam i wrong\b|\bmy thought\b|right\?/i.test(d);

const qualityScore = (d) => {
  let n = 0;
  if (hasMd(d)) n++;
  if (hasTable(d)) n++;
  if (hasCodeFence(d)) n++;
  if (hasFiletree(d)) n++;
  if (hasBoxArt(d)) n++;
  if (hasCheckbox(d)) n++;
  if (hasPhase(d)) n++;
  if (hasPubItem(d)) n++;
  if (hasError(d)) n++;
  if (hasFrozen(d)) n++;
  if (/\|---/.test(d)) n++;
  return n;
};

const families = {
  "ascii-architecture-diagram": (d) =>
    hasCodeFence(d) && (hasBoxArt(d) || hasFiletree(d)),
  "ssot-comparison-table": (d) => hasTable(d),
  "rust-shape-as-spec": (d) => hasCodeFence(d) && hasPubItem(d),
  "phased-execution-plan": (d) => hasPhase(d) && hasMd(d),
  "verification-checklist-close": (d) =>
    hasCheckbox(d) && /verification/i.test(d),
  "frozen-surface": (d) => hasFrozen(d) && hasMd(d),
  "diagnostic-paste-triage": (d) => hasError(d) && d.length > 200,
  "fork-with-stated-hypothesis": (d) => hasFork(d) && d.length < 600,
};

function classify(slice, label) {
  const tally = Object.fromEntries(
    Object.keys(families).map((k) => [k, []]),
  );
  for (const d of slice) {
    if (qualityScore(d) < 2) continue;
    for (const [name, test] of Object.entries(families)) {
      if (test(d)) tally[name].push(d);
    }
  }
  console.log(`\n=== ${label} (${slice.length} prompts) ===`);
  for (const [name, hits] of Object.entries(tally))
    console.log(`  ${String(hits.length).padStart(4)}  ${name}`);
  return tally;
}

const earlyTally = classify(early, "EARLY (fresh-era)");
classify(mid, "MID");
classify(late, "LATE (burnout-era)");

// Sample 2 from each family in the EARLY tally — these are what we
// extract templates from.
console.log(`\n\n══════════════════════════════════════════════════════`);
console.log(`EARLY-WINDOW SAMPLES (2 per family)`);
console.log(`══════════════════════════════════════════════════════`);
for (const [name, hits] of Object.entries(earlyTally)) {
  if (hits.length === 0) {
    console.log(`\n--- ${name} ---  (no early-era hits)`);
    continue;
  }
  const picks = hits.slice(0, 2);
  for (let i = 0; i < picks.length; i++) {
    console.log(`\n--- ${name} sample ${i + 1} (${picks[i].length} chars) ---`);
    console.log(picks[i].slice(0, 1100));
  }
}
