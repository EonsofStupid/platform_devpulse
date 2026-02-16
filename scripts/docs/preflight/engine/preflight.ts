#!/usr/bin/env node
/**
 * @file preflight/engine/preflight.ts
 * @description Main preflight runner - orchestrates checks and fixes
 */

import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import chalk from 'chalk';
import prompts from 'prompts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { registry } from './registry.js';
import { createReport, formatReport, writeJsonReport } from './report.js';
import type { CheckContext, CheckResult, FixResult, PolicyConfig, DryRunState } from '../types.js';

// Import all checks to register them
import '../checks/check.domain-boundaries.js';
import '../checks/check.typed-routes.js';
import '../checks/check.naming.js';
import '../checks/check.primitive-structure.js';
import '../checks/check.no-style-primitives.js';
import '../checks/check.aria-primitives.js';

// Import all fixers
import '../fixers/fix.domain-index.js';
import '../fixers/fix.inject-jsdoc.js';

const DRY_RUN_STATE_FILE = '.preflight-dry-run.json';

interface PreflightOptions {
  mode: 'check' | 'fix' | 'dry-run';
  interactive: boolean;
  jsonOutput?: string;
  checks?: string[];
}

async function loadPolicy(platformRoot: string): Promise<PolicyConfig> {
  const policyPath = path.join(platformRoot, 'scripts/docs/policy/cowlevel.policy.json');
  const content = fs.readFileSync(policyPath, 'utf-8');
  return JSON.parse(content) as PolicyConfig;
}

async function getFilesForScope(platformRoot: string, targetRoot: string, scopes: string[]): Promise<string[]> {
  const allFiles = new Set<string>();

  for (const scope of scopes) {
    const pattern = path.join(targetRoot, scope).replace(/\\/g, '/');
    const files = await glob(pattern, {
      cwd: platformRoot,
      absolute: false,
      nodir: true
    });
    files.forEach(f => allFiles.add(f));
  }

  return Array.from(allFiles);
}

async function runChecks(
  platformRoot: string,
  policy: PolicyConfig,
  options: PreflightOptions
): Promise<CheckResult[]> {
  const allResults: CheckResult[] = [];
  const targetRoot = path.join(platformRoot, policy.targetPath);
  const checksToRun = options.checks || registry.getCheckIds();

  for (const checkId of checksToRun) {
    const check = registry.getCheck(checkId);
    if (!check) {
      console.warn(chalk.yellow(`Warning: Check "${checkId}" not found in registry`));
      continue;
    }

    // Find matching rule in policy
    const ruleKey = Object.keys(policy.rules).find(k =>
      k === checkId || k.replace(/-/g, '') === checkId.replace(/-/g, '')
    );

    if (!ruleKey) {
      console.warn(chalk.yellow(`Warning: No policy rule for check "${checkId}"`));
      continue;
    }

    const config = policy.rules[ruleKey];
    const files = await getFilesForScope(platformRoot, policy.targetPath, config.scope);

    if (files.length === 0) {
      allResults.push({
        checkId,
        status: 'skip',
        severity: config.enforcement,
        message: 'No files matched scope',
      });
      continue;
    }

    console.log(chalk.dim(`  Running ${checkId}...`));

    const ctx: CheckContext = {
      targetRoot,
      platformRoot,
      files,
      config,
      dryRun: options.mode === 'dry-run',
    };

    const results = await check.run(ctx);
    allResults.push(...results);
  }

  return allResults;
}

async function runFixes(
  platformRoot: string,
  results: CheckResult[],
  options: PreflightOptions
): Promise<FixResult[]> {
  const fixResults: FixResult[] = [];
  const fixableResults = results.filter(r => r.status === 'fail' && r.autoFixable);

  if (fixableResults.length === 0) {
    console.log(chalk.dim('  No auto-fixable issues found'));
    return fixResults;
  }

  // Check for dry-run state if in apply mode
  if (options.mode === 'fix' && !options.interactive) {
    const dryRunPath = path.join(platformRoot, DRY_RUN_STATE_FILE);
    if (!fs.existsSync(dryRunPath)) {
      console.error(chalk.red('Error: Cannot auto-apply fixes without a prior dry-run.'));
      console.error(chalk.dim('Run `pnpm docs:preflight:dry-run` first, then `pnpm docs:preflight:fix`'));
      process.exit(1);
    }
  }

  for (const result of fixableResults) {
    const fixers = registry.findFixersFor(result.checkId);

    for (const fixer of fixers) {
      if (!fixer.canFix(result)) continue;

      const ctx: CheckContext = {
        targetRoot: path.join(platformRoot, 'interfaces/desktop/src'),
        platformRoot,
        files: result.file ? [result.file] : [],
        config: {} as any,
        dryRun: options.mode === 'dry-run',
      };

      if (options.mode === 'dry-run') {
        const preview = await fixer.preview(result, ctx);
        fixResults.push(preview);
        console.log(chalk.yellow(`  Would fix: ${preview.description}`));
      } else if (options.interactive) {
        const preview = await fixer.preview(result, ctx);
        console.log('');
        console.log(chalk.cyan(`Fix available: ${preview.description}`));
        console.log(chalk.dim(`  File: ${preview.file}`));
        if (preview.diff) {
          console.log(chalk.dim('  Preview:'));
          console.log(preview.diff.split('\n').map(l => `    ${l}`).join('\n'));
        }

        const response = await prompts({
          type: 'confirm',
          name: 'apply',
          message: 'Apply this fix?',
          initial: true,
        });

        if (response.apply) {
          const fixResult = await fixer.apply(result, ctx);
          fixResults.push(fixResult);
          console.log(chalk.green(`  ✓ Applied: ${fixResult.description}`));
        } else {
          fixResults.push({ ...preview, applied: false });
          console.log(chalk.dim('  Skipped'));
        }
      } else {
        // Non-interactive apply (requires prior dry-run)
        const fixResult = await fixer.apply(result, ctx);
        fixResults.push(fixResult);
        console.log(chalk.green(`  ✓ Applied: ${fixResult.description}`));
      }
    }
  }

  // Save dry-run state
  if (options.mode === 'dry-run' && fixResults.length > 0) {
    const dryRunState: DryRunState = {
      generated: true,
      timestamp: new Date().toISOString(),
      hash: Buffer.from(JSON.stringify(fixResults)).toString('base64').slice(0, 16),
      fixes: fixResults,
    };
    fs.writeFileSync(
      path.join(platformRoot, DRY_RUN_STATE_FILE),
      JSON.stringify(dryRunState, null, 2)
    );
    console.log(chalk.dim(`  Dry-run state saved to ${DRY_RUN_STATE_FILE}`));
  }

  return fixResults;
}

async function main() {
  const args = process.argv.slice(2);

  const options: PreflightOptions = {
    mode: 'check',
    interactive: true,
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--check':
        options.mode = 'check';
        break;
      case '--fix':
        options.mode = 'fix';
        break;
      case '--dry-run':
        options.mode = 'dry-run';
        break;
      case '--no-interactive':
        options.interactive = false;
        break;
      case '--json':
        options.jsonOutput = args[++i];
        break;
      case '--checks':
        options.checks = args[++i].split(',');
        break;
      case '--help':
        console.log(`
DevPulse Preflight - Architecture Enforcement

Usage:
  preflight.ts [options]

Options:
  --check           Run checks only (default)
  --fix             Run checks and apply fixes (interactive by default)
  --dry-run         Show what would be fixed without applying
  --no-interactive  Apply fixes without prompting (requires prior dry-run)
  --json <path>     Output report as JSON to specified path
  --checks <ids>    Comma-separated list of check IDs to run
  --help            Show this help message

Examples:
  pnpm preflight:check              # Run all checks
  pnpm preflight:dry-run            # Preview fixes
  pnpm preflight:fix                # Interactively apply fixes
  pnpm preflight:fix --no-interactive  # Apply all fixes (after dry-run)
`);
        process.exit(0);
    }
  }

  // Determine platform root (engine is 4 levels down: engine -> preflight -> docs -> scripts -> root)
  const platformRoot = path.resolve(__dirname, '../../../..');

  console.log('');
  console.log(chalk.bold.cyan('DevPulse Preflight'));
  console.log(chalk.dim(`Mode: ${options.mode}`));
  console.log('');

  // Load policy
  console.log(chalk.dim('Loading policy...'));
  const policy = await loadPolicy(platformRoot);

  // Run checks
  console.log(chalk.dim('Running checks...'));
  const results = await runChecks(platformRoot, policy, options);

  // Run fixes if in fix or dry-run mode
  let fixes: FixResult[] | undefined;
  if (options.mode === 'fix' || options.mode === 'dry-run') {
    console.log('');
    console.log(chalk.dim('Processing fixes...'));
    fixes = await runFixes(platformRoot, results, options);
  }

  // Generate report
  const report = createReport(options.mode, policy.targetPath, results, fixes);

  // Output
  console.log(formatReport(report));

  if (options.jsonOutput) {
    writeJsonReport(report, options.jsonOutput);
    console.log(chalk.dim(`JSON report written to ${options.jsonOutput}`));
  }

  // Exit with error code if failures
  if (report.summary.failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(chalk.red('Preflight error:'), err);
  process.exit(1);
});
