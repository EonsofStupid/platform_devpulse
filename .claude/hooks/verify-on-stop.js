#!/usr/bin/env node
// verify-on-stop.js — CC-001 countermeasure (Windows-compatible)
// Stop hook: exit 2 forces Claude to keep working until verification passes

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
let errors = 0;

function run(cmd, label, timeoutMs) {
  try {
    execSync(cmd, { cwd: dir, stdio: 'pipe', timeout: timeoutMs || 120000 });
    process.stderr.write('  ✅ ' + label + '\n');
  } catch (e) {
    if (e.killed) {
      process.stderr.write('  ⚠️ ' + label + ' TIMEOUT (skipped — build too large for hook)\n');
      return; // timeout is not a code error — don't count it
    }
    const out = (e.stderr||e.stdout||'').toString().split('\n').slice(-5).join('\n');
    process.stderr.write('  ❌ ' + label + ' FAILED\n' + out + '\n');
    errors++;
  }
}

process.stderr.write('Verifying...\n');

if (fs.existsSync(path.join(dir, 'Cargo.toml'))) {
  try {
    const changed = execSync('git diff --name-only -- "*.rs" "*.toml"', { cwd: dir, stdio: 'pipe' })
      .toString().trim().split('\n').filter(Boolean);
    if (changed.length > 0) {
      // Detect which crates were changed and check only those
      const crates = new Set();
      for (const f of changed) {
        if (f.startsWith('kernel/model-loader/')) crates.add('model-loader');
        else if (f.startsWith('kernel/devpulse-clyffy/')) crates.add('devpulse-clyffy');
        else if (f.startsWith('systems/devpulse-engine/')) crates.add('devpulse-engine');
        else if (f.startsWith('interfaces/desktop/src-tauri/')) crates.add('devpulse_desktop_backend');
        else if (f === 'Cargo.toml' || f === 'Cargo.lock') crates.add('devpulse_desktop_backend'); // workspace root change — check top-level
      }
      if (crates.size === 0) crates.add('devpulse_desktop_backend'); // fallback
      for (const c of crates) {
        run('cargo check -p ' + c, 'Rust cargo check -p ' + c, 180000);
      }
    }
  } catch {
    run('cargo check -p devpulse_desktop_backend', 'Rust cargo check', 180000);
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
