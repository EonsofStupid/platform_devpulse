import fs from "node:fs";

const file = process.argv[2] ?? "app.css";
const s = fs.readFileSync(file, "utf8");

function idxToLineCol(str, idx) {
  let line = 1, col = 1;
  for (let i = 0; i < idx; i++) {
    if (str[i] === "\n") { line++; col = 1; }
    else col++;
  }
  return { line, col };
}

const checks = [
  { name: "JS-style \\u{...}", re: /\\u\{([0-9a-fA-F]+)\}/g },
  { name: "CSS hex escape \\XXXXXX", re: /\\([0-9a-fA-F]{1,6})(\s)?/g },
];

let found = 0;

for (const { name, re } of checks) {
  let m;
  while ((m = re.exec(s)) !== null) {
    const hex = m[1];
    const cp = parseInt(hex, 16);
    if (!Number.isFinite(cp)) continue;

    if (cp > 0x10ffff) {
      found++;
      const pos = idxToLineCol(s, m.index);
      const start = Math.max(0, m.index - 50);
      const end = Math.min(s.length, m.index + 80);
      const snippet = s.slice(start, end).replace(/\n/g, "\\n");

      console.log(`\n[INVALID] ${name}`);
      console.log(`  at ${file}:${pos.line}:${pos.col}`);
      console.log(`  \\${hex} => ${cp} (0x${cp.toString(16)})`);
      console.log(`  ...${snippet}...`);
    }
  }
}

if (!found) {
  console.log("No invalid unicode escapes (> U+10FFFF) found.");
  process.exit(0);
}

process.exit(1);