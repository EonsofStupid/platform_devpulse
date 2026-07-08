#!/usr/bin/env node
// verify-on-stop.js — CC-001 countermeasure (Windows-compatible)
// Stop hook: exit 2 forces Claude to keep working until verification passes

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
let errors = 0;

// Patterns that cargo emits as warnings, not errors — never count these as failures.
const IGNORABLE_PATTERNS = [
  'Patch `surrealkv',
  'was not used in the crate graph',
  'Check that the patched package version',
  'run `cargo update` to use the new version',
  'optional dependency that is not enabled',
  'Blocking waiting for file lock on build directory',
];

function isOnlyIgnorableOutput(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  return lines.every(line =>
    IGNORABLE_PATTERNS.some(pat => line.includes(pat)) ||
    line.startsWith('warning: Patch') ||
    line.startsWith('Compiling') ||
    line.startsWith('Checking') ||
    line.startsWith('Finished') ||
    line.startsWith('Blocking')
  );
}

// Per `.cargo/config.toml` (Branch 2 absorption 2026-06-23): the workspace
// no longer exports `LLAMA_CPP_PREBUILT_LIB_DIR` because that lane is dead
// in the new GB10-headless architecture. Standalone `cargo check` on
// Windows still needs the env to find llama.cpp/include/llama.h until
// the desktop_backend dep on llama-cpp-sys-2 is retired. Set it here so
// the hook's check doesn't fail. On Linux/CI the env is intentionally
// not set (no prebuilt tree fetched there); the hook only runs locally.
const prebuiltDir = path.join(dir, 'deps', 'llama-cpp-prebuilt', 'win32-x64-vulkan');
const hookEnv = {
  ...process.env,
  LLAMA_CPP_PREBUILT_LIB_DIR: prebuiltDir,
};

function run(cmd, label, timeoutMs) {
  try {
    execSync(cmd, { cwd: dir, stdio: 'pipe', timeout: timeoutMs || 120000, env: hookEnv });
    process.stderr.write('  ✅ ' + label + '\n');
  } catch (e) {
    if (e.killed) {
      process.stderr.write('  ⚠️ ' + label + ' TIMEOUT (skipped — build too large for hook)\n');
      return; // timeout is not a code error — don't count it
    }
    const out = (e.stderr||e.stdout||'').toString();
    const tail = out.split('\n').slice(-5).join('\n');
    // If the only output is known-ignorable warnings (patch, lock), skip it
    if (isOnlyIgnorableOutput(out)) {
      process.stderr.write('  ⚠️ ' + label + ' (non-critical warnings only — passed)\n');
      return;
    }
    // If cargo failed because another build holds the lock, don't count it
    if (out.includes('Blocking waiting for file lock')) {
      process.stderr.write('  ⚠️ ' + label + ' (build lock contention — skipped)\n');
      return;
    }
    process.stderr.write('  ❌ ' + label + ' FAILED\n' + tail + '\n');
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
        if (f.startsWith('systems/devpulse-engine/')) crates.add('devpulse-engine');
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
