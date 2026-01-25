#!/usr/bin/env node
/**
 * @file pipeline/lock.ts
 * @description Lock current documentation state (generate lockfile)
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

function hashFile(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

function hashLockfile(entries: LockEntry[]): string {
  const content = entries.map(e => `${e.path}:${e.hash}`).join('\n');
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 32);
}

async function main() {
  const platformRoot = path.resolve(__dirname, '../..');
  const stageDir = path.join(platformRoot, '.doc-stage');
  const lockfilePath = path.join(platformRoot, '.doc-coverage.lock.json');

  console.log('');
  console.log(chalk.bold.cyan('DevPulse Documentation Lock'));
  console.log('');

  if (!fs.existsSync(stageDir)) {
    console.error(chalk.red('Error: No staged documentation found. Run `pnpm docs:stage` first.'));
    process.exit(1);
  }

  // Collect all staged files
  const entries: LockEntry[] = [];

  function walkDir(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const relativePath = path.relative(stageDir, fullPath);

        entries.push({
          path: relativePath,
          hash: hashFile(content),
          size: stat.size,
          lastModified: stat.mtime.toISOString(),
        });
      }
    }
  }

  walkDir(stageDir);

  // Also include generated JSON files
  const jsonFiles = ['.doc-scan.json', '.doc-api.json', '.doc-props.json', '.doc-api-surface.json'];
  for (const jsonFile of jsonFiles) {
    const jsonPath = path.join(platformRoot, jsonFile);
    if (fs.existsSync(jsonPath)) {
      const content = fs.readFileSync(jsonPath, 'utf-8');
      const stat = fs.statSync(jsonPath);
      entries.push({
        path: jsonFile,
        hash: hashFile(content),
        size: stat.size,
        lastModified: stat.mtime.toISOString(),
      });
    }
  }

  // Sort entries for deterministic output
  entries.sort((a, b) => a.path.localeCompare(b.path));

  const totalSize = entries.reduce((a, e) => a + e.size, 0);
  const lockfile: DocLockfile = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    entries,
    summary: {
      totalFiles: entries.length,
      totalSize,
      hash: hashLockfile(entries),
    },
  };

  // Write lockfile
  fs.writeFileSync(lockfilePath, JSON.stringify(lockfile, null, 2));

  console.log(chalk.bold('Lock Summary'));
  console.log(chalk.dim('─────────────────────────────────'));
  console.log(`  Files Locked:  ${chalk.cyan(entries.length)}`);
  console.log(`  Total Size:    ${chalk.cyan(formatSize(totalSize))}`);
  console.log(`  Hash:          ${chalk.dim(lockfile.summary.hash)}`);
  console.log('');
  console.log(chalk.green(`✓ Lockfile written to ${lockfilePath}`));
  console.log('');
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

main().catch(err => {
  console.error(chalk.red('Lock error:'), err);
  process.exit(1);
});
