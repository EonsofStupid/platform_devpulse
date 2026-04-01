#!/usr/bin/env node
// verify-on-stop.js — CC-001 countermeasure (Windows-compatible)
// Stop hook: exit 2 forces Claude to keep working until verification passes

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
    const out = (e.stderr||e.stdout||'').toString().split('\n').slice(-5).join('\n');
    process.stderr.write('  ❌ ' + label + ' FAILED\n' + out + '\n');
    errors++;
  }
}

process.stderr.write('Verifying...\n');

if (fs.existsSync(path.join(dir, 'Cargo.toml'))) {
  try {
    const changed = execSync('git diff --name-only -- *.rs', { cwd: dir, stdio: 'pipe' })
      .toString().trim().split('\n').filter(Boolean);
    if (changed.length > 0) {
      run('cargo check', 'Rust cargo check');
    }
  } catch {
    run('cargo check', 'Rust cargo check');
  }
}

const desktopPkg = path.join(dir, 'interfaces', 'desktop', 'package.json');
if (fs.existsSync(desktopPkg)) {
  const pkg = JSON.parse(fs.readFileSync(desktopPkg, 'utf8'));
  if (pkg.scripts && pkg.scripts['svelte-check']) {
    run('pnpm svelte-check', 'Svelte check');
  }
}

if (errors > 0) {
  process.stderr.write('\n❌ Verification FAILED (' + errors + ' errors). Fix before completing.\n');
  process.exit(2);
}
process.stderr.write('\n✅ Verification passed.\n');
process.exit(0);
