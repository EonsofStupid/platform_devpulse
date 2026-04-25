#!/usr/bin/env node
// Self-audit: validate claimed trigger phrases against the cleaned corpus.
const fs = require("fs");

const text = fs.readFileSync("docs/chat-modes/_raw/all-prompts.txt", "utf8");
const docs = text.split(/\n\n---\n\n/);

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const probe = (phrase) => {
  const re = new RegExp(escape(phrase), "i");
  return docs.filter((d) => re.test(d)).length;
};

const probes = [
  ["direct-action-no-preamble-no-apology", ["just do it", "stop talking", "execute", "ship it", "go go go", "DO IT NOW", "stop apologizing", "do your job"]],
  ["verify-runtime-not-just-compile", ["cargo check -p", "cargo xtask run-dev", "verification gate", "actually working", "real tests", "where is my app"]],
  ["no-stubs-no-half-finished-progress", ["half ass", "stub", "TODO", "you reverted", "fake progress", "junior dev", "you didn't do anything"]],
  ["research-then-execute-no-loops", ["parking lot", "research notes", "SSOT", "stay in planning", "stop guessing", "circle jerking"]],
  ["model-loader-locked", ["Qwen", "Harrier", "HF browse", "blue tint", "layman friendly", "click loads full model"]],
  ["all-warnings-non-fatal", ["all warnings", "non-fatal", "missing documentation", "clippy", "specta note"]],
  ["paste-build-failure", ["error[E", "process didn", "exit code", "Compiling devpulse", "could not compile"]],
  ["honest-realtime-ui-state", ["honest state", "transparent", "rune", "$state", "$derived", "mock"]],
  ["design-system-tokens", ["SD5", "oklch", "ColdLight", "fluid clamp", "no raw values", "renderForge"]],
  ["wai-aria-apg", ["WAI-ARIA", "APG", "react-aria", "base component"]],
];

console.log(`docs total: ${docs.length}\n`);
let totalReportedHits = 0;
let totalEmptyTriggers = 0;
for (const [theme, phrases] of probes) {
  console.log(`=== ${theme} ===`);
  for (const p of phrases) {
    const n = probe(p);
    if (n === 0) totalEmptyTriggers++;
    totalReportedHits += n;
    const flag = n === 0 ? " ← ZERO HITS" : n < 5 ? " ← weak" : "";
    console.log(`  ${String(n).padStart(4)}  "${p}"${flag}`);
  }
  console.log("");
}
console.log(`empty-hit triggers (probably noise): ${totalEmptyTriggers}`);
