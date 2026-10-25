import fs from "fs";
import path from "path";

function walk(dir, files = []) {
  for (const file of fs.readdirSync(dir)) {
    const fp = path.join(dir, file);
    if (file === "node_modules" || file === ".git") continue;
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) {
      walk(fp, files);
    } else if (/\.(svelte|ts|css|md|js|mjs|html)$/.test(file)) {
      files.push(fp);
    }
  }
  return files;
}

const files = walk(".");
console.log(`Scanning ${files.length} files for \\57081e pattern...`);

let found = 0;
for (const f of files) {
  const content = fs.readFileSync(f, "utf8");

  // Search for the specific pattern or any 6-digit hex > 0x10ffff
  const re = /\\([0-9a-fA-F]{5,6})/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const hex = m[1];
    const cp = parseInt(hex, 16);
    if (cp > 0x10ffff) {
      found++;
      const line = content.slice(0, m.index).split("\n").length;
      console.log(`FOUND: ${f}:${line}`);
      console.log(`  Pattern: ${m[0]} => codepoint ${cp} (0x${cp.toString(16)})`);
      const start = Math.max(0, m.index - 40);
      const end = Math.min(content.length, m.index + 40);
      console.log(`  Context: ...${content.slice(start, end).replace(/\n/g, "\\n")}...`);
    }
  }

  // Also check for literal string "57081e" in case it's not escaped
  if (content.includes("57081e") || content.includes("57081E")) {
    console.log(`CONTAINS "57081e": ${f}`);
  }
}

if (found === 0) {
  console.log("No invalid escapes found in source files.");
  console.log("The pattern may be generated at runtime by Svelte/Vite.");
}
