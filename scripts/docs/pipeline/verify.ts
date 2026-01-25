#!/usr/bin/env node
/**
 * @file pipeline/verify.ts
 * @description Verify current state matches lockfile (determinism check)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';

interface LockEntry {
  path: string;
  hash: string;
  size: number;
  lastModified: string;
}

interface DocLockfile {
  version: '1.0.0';
  timestamp: string;
  entries: LockEntry[];
  summary: {
    totalFiles: number;
    totalSize: number;
    hash: string;
  };
}

interface VerifyResult {
  valid: boolean;
  mismatches: Mismatch[];
  missing: string[];
  extra: string[];
}

interface Mismatch {
  path: string;
  expected: string;
  actual: string;
  type: 'hash' | 'size';
}

function hashFile(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

async function main() {
  const platformRoot = path.resolve(__dirname, '../..');
  const stageDir = path.join(platformRoot, '.doc-stage');
  const lockfilePath = path.join(platformRoot, '.doc-coverage.lock.json');

  console.log('');
  console.log(chalk.bold.cyan('DevPulse Documentation Verify'));
  console.log('');

  if (!fs.existsSync(lockfilePath)) {
    console.error(chalk.red('Error: No lockfile found. Run `pnpm docs:lock` first.'));
    process.exit(1);
  }

  const lockfile: DocLockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf-8'));

  console.log(chalk.dim(`Lockfile: ${lockfile.timestamp}`));
  console.log(chalk.dim(`Expected: ${lockfile.summary.totalFiles} files, hash ${lockfile.summary.hash}`));
  console.log('');

  const result: VerifyResult = {
    valid: true,
    mismatches: [],
    missing: [],
    extra: [],
  };

  // Check each locked entry
  for (const entry of lockfile.entries) {
    let actualPath: string;

    if (entry.path.startsWith('.doc-')) {
      // JSON files in platform root
      actualPath = path.join(platformRoot, entry.path);
    } else {
      // Staged files
      actualPath = path.join(stageDir, entry.path);
    }

    if (!fs.existsSync(actualPath)) {
      result.missing.push(entry.path);
      result.valid = false;
      continue;
    }

    const content = fs.readFileSync(actualPath, 'utf-8');
    const actualHash = hashFile(content);
    const actualSize = fs.statSync(actualPath).size;

    if (actualHash !== entry.hash) {
      result.mismatches.push({
        path: entry.path,
        expected: entry.hash,
        actual: actualHash,
        type: 'hash',
      });
      result.valid = false;
    }

    if (actualSize !== entry.size) {
      result.mismatches.push({
        path: entry.path,
        expected: String(entry.size),
        actual: String(actualSize),
        type: 'size',
      });
      result.valid = false;
    }
  }

  // Check for extra files in stage directory
  if (fs.existsSync(stageDir)) {
    function walkDir(dir: string): string[] {
      const files: string[] = [];
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        if (fs.statSync(fullPath).isDirectory()) {
          files.push(...walkDir(fullPath));
        } else {
          files.push(path.relative(stageDir, fullPath));
        }
      }
      return files;
    }

    const currentFiles = new Set(walkDir(stageDir));
    const lockedFiles = new Set(
      lockfile.entries
        .filter(e => !e.path.startsWith('.doc-'))
        .map(e => e.path)
    );

    for (const file of currentFiles) {
      if (!lockedFiles.has(file)) {
        result.extra.push(file);
        result.valid = false;
      }
    }
  }

  // Output results
  console.log(chalk.bold('Verification Results'));
  console.log(chalk.dim('─────────────────────────────────'));

  if (result.missing.length > 0) {
    console.log('');
    console.log(chalk.red(`Missing Files (${result.missing.length}):`));
    for (const file of result.missing) {
      console.log(chalk.red(`  ✖ ${file}`));
    }
  }

  if (result.mismatches.length > 0) {
    console.log('');
    console.log(chalk.yellow(`Mismatches (${result.mismatches.length}):`));
    for (const mismatch of result.mismatches) {
      console.log(chalk.yellow(`  ⚠ ${mismatch.path}`));
      console.log(chalk.dim(`    ${mismatch.type}: expected ${mismatch.expected}, got ${mismatch.actual}`));
    }
  }

  if (result.extra.length > 0) {
    console.log('');
    console.log(chalk.blue(`Extra Files (${result.extra.length}):`));
    for (const file of result.extra) {
      console.log(chalk.blue(`  + ${file}`));
    }
  }

  console.log('');
  if (result.valid) {
    console.log(chalk.green.bold('✓ Documentation state is verified'));
    console.log(chalk.dim('  All files match lockfile'));
  } else {
    console.log(chalk.red.bold('✖ Documentation state does not match lockfile'));
    console.log(chalk.dim('  Run `pnpm docs:stage && pnpm docs:lock` to update'));
    process.exit(1);
  }
  console.log('');
}

main().catch(err => {
  console.error(chalk.red('Verify error:'), err);
  process.exit(1);
});
