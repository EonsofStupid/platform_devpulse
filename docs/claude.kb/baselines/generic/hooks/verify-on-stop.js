#!/usr/bin/env node
// verify-on-stop.js — CC-001 countermeasure (generic, Windows-compatible)
// Exit 2 forces Claude to keep working until verification passes

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
let errors = 0;

function run(cmd, label) {
  try {
    execSync(cmd, { cwd: dir, stdio: 'pipe', timeout: 45000 });
    process.stderr.write('  ✅ ' + label + '\n');
  } catch (e) {
    const out = (e.stderr||e.stdout||'').toString().split('\n').slice(-3).join('\n');
    process.stderr.write('  ❌ ' + label + ': ' + out + '\n');
    errors++;
  }
}

process.stderr.write('Verifying...\n');

if (fs.existsSync(path.join(dir, 'Cargo.toml'))) {
  run('cargo check', 'Rust');
}
if (fs.existsSync(path.join(dir, 'tsconfig.json'))) {
  run('npx tsc --noEmit', 'TypeScript');
}
if (fs.existsSync(path.join(dir, 'pyproject.toml')) || fs.existsSync(path.join(dir, 'setup.py'))) {
  try {
    const changed = execSync('git diff --name-only -- *.py', { cwd: dir, stdio: 'pipe' })
      .toString().trim().split('\n').filter(Boolean);
    for (const f of changed.slice(0, 5)) {
      run('python -m py_compile "' + f + '"', 'Python: ' + f);
    }
  } catch { /* no git or no changes */ }
}

if (errors > 0) {
  process.stderr.write('\n❌ FAILED (' + errors + '). Fix before completing.\n');
  process.exit(2);
}
process.stderr.write('\n✅ Passed.\n');
process.exit(0);
