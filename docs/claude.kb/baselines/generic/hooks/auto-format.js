#!/usr/bin/env node
// auto-format.js — PostToolUse hook for Write|Edit (Windows-compatible)
// Auto-detects formatter by file extension

const { execSync } = require('child_process');
const path = require('path');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const parsed = JSON.parse(input);
    const file = parsed.tool_input?.file_path
      || parsed.tool_input?.path
      || parsed.inputs?.file_path || '';
    if (!file) process.exit(0);

    const ext = path.extname(file).toLowerCase();
    const formatters = {
      '.rs': 'rustfmt "' + file + '"',
      '.ts': 'npx prettier --write "' + file + '"',
      '.tsx': 'npx prettier --write "' + file + '"',
      '.js': 'npx prettier --write "' + file + '"',
      '.jsx': 'npx prettier --write "' + file + '"',
      '.svelte': 'npx prettier --write "' + file + '"',
      '.css': 'npx prettier --write "' + file + '"',
      '.json': 'npx prettier --write "' + file + '"',
      '.md': 'npx prettier --write "' + file + '"',
      '.py': 'black -q "' + file + '"',
    };

    const cmd = formatters[ext];
    if (cmd) {
      try { execSync(cmd, { stdio: 'ignore', timeout: 10000 }); }
      catch { /* format failure is non-blocking */ }
    }
  } catch { /* parse failure is non-blocking */ }
  process.exit(0); // Never block on format failure
});
