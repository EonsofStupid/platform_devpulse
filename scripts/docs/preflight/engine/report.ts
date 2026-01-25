/**
 * @file preflight/engine/report.ts
 * @description Report generation and formatting for preflight results
 */

import chalk from 'chalk';
import type { PreflightReport, CheckResult, FixResult, Severity } from '../types.js';

const SEVERITY_ICONS: Record<Severity, string> = {
  error: '✖',
  warning: '⚠',
  info: 'ℹ',
};

const SEVERITY_COLORS: Record<Severity, (text: string) => string> = {
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
};

export function createReport(
  mode: 'check' | 'fix' | 'dry-run',
  targetRoot: string,
  results: CheckResult[],
  fixes?: FixResult[]
): PreflightReport {
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail' && r.severity === 'error').length;
  const warnings = results.filter(r => r.status === 'fail' && r.severity === 'warning').length;
  const skipped = results.filter(r => r.status === 'skip').length;

  // Group by tier (derived from check naming convention)
  const byTier: PreflightReport['byTier'] = { 1: { total: 0, passed: 0, failed: 0 }, 2: { total: 0, passed: 0, failed: 0 }, 3: { total: 0, passed: 0, failed: 0 } };

  // We'd need tier info from policy - for now infer from severity
  results.forEach(r => {
    const tier = r.severity === 'error' ? 1 : r.severity === 'warning' ? 2 : 3;
    byTier[tier].total++;
    if (r.status === 'pass') byTier[tier].passed++;
    if (r.status === 'fail') byTier[tier].failed++;
  });

  return {
    timestamp: new Date().toISOString(),
    mode,
    targetRoot,
    summary: {
      total: results.length,
      passed,
      failed,
      warnings,
      skipped,
    },
    byTier,
    results,
    fixes,
  };
}

export function formatReport(report: PreflightReport): string {
  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push(chalk.bold.cyan('═══════════════════════════════════════════════════════════'));
  lines.push(chalk.bold.cyan(`  DevPulse Preflight Report - ${report.mode.toUpperCase()}`));
  lines.push(chalk.bold.cyan('═══════════════════════════════════════════════════════════'));
  lines.push('');
  lines.push(chalk.dim(`  Target: ${report.targetRoot}`));
  lines.push(chalk.dim(`  Time:   ${report.timestamp}`));
  lines.push('');

  // Summary
  lines.push(chalk.bold('  Summary'));
  lines.push(chalk.dim('  ───────────────────────────────────────'));
  lines.push(`  ${chalk.green('✓')} Passed:   ${chalk.green(report.summary.passed)}`);
  lines.push(`  ${chalk.red('✖')} Failed:   ${chalk.red(report.summary.failed)}`);
  lines.push(`  ${chalk.yellow('⚠')} Warnings: ${chalk.yellow(report.summary.warnings)}`);
  lines.push(`  ${chalk.dim('○')} Skipped:  ${chalk.dim(report.summary.skipped)}`);
  lines.push('');

  // Tier breakdown
  lines.push(chalk.bold('  By Tier'));
  lines.push(chalk.dim('  ───────────────────────────────────────'));
  for (const [tier, stats] of Object.entries(report.byTier)) {
    if (stats.total > 0) {
      const tierName = tier === '1' ? 'Critical' : tier === '2' ? 'Standard' : 'Advisory';
      const status = stats.failed > 0 ? chalk.red('✖') : chalk.green('✓');
      lines.push(`  ${status} Tier ${tier} (${tierName}): ${stats.passed}/${stats.total} passed`);
    }
  }
  lines.push('');

  // Failed checks
  const failures = report.results.filter(r => r.status === 'fail');
  if (failures.length > 0) {
    lines.push(chalk.bold.red('  Violations'));
    lines.push(chalk.dim('  ───────────────────────────────────────'));

    for (const result of failures) {
      const icon = SEVERITY_ICONS[result.severity];
      const color = SEVERITY_COLORS[result.severity];

      lines.push('');
      lines.push(`  ${color(icon)} ${color(result.checkId)}`);
      lines.push(`    ${result.message}`);

      if (result.file) {
        const location = result.line
          ? `${result.file}:${result.line}${result.column ? `:${result.column}` : ''}`
          : result.file;
        lines.push(`    ${chalk.dim('at')} ${chalk.cyan(location)}`);
      }

      if (result.suggestion) {
        lines.push(`    ${chalk.dim('→')} ${chalk.green(result.suggestion)}`);
      }

      if (result.autoFixable) {
        lines.push(`    ${chalk.dim('(auto-fixable)')}`);
      }
    }
    lines.push('');
  }

  // Fixes (if any)
  if (report.fixes && report.fixes.length > 0) {
    lines.push(chalk.bold.green('  Fixes'));
    lines.push(chalk.dim('  ───────────────────────────────────────'));

    for (const fix of report.fixes) {
      const status = fix.applied ? chalk.green('✓') : chalk.yellow('○');
      lines.push(`  ${status} ${fix.fixId}: ${fix.description}`);
      lines.push(`    ${chalk.dim('file:')} ${fix.file}`);
      if (fix.diff) {
        lines.push(chalk.dim('    diff:'));
        lines.push(fix.diff.split('\n').map(l => `      ${l}`).join('\n'));
      }
    }
    lines.push('');
  }

  // Footer
  const hasErrors = report.summary.failed > 0;
  lines.push(chalk.dim('───────────────────────────────────────────────────────────'));
  if (hasErrors) {
    lines.push(chalk.red.bold('  PREFLIGHT FAILED'));
    lines.push(chalk.dim('  Run `pnpm docs:preflight:fix` to attempt auto-fixes'));
  } else if (report.summary.warnings > 0) {
    lines.push(chalk.yellow.bold('  PREFLIGHT PASSED WITH WARNINGS'));
  } else {
    lines.push(chalk.green.bold('  PREFLIGHT PASSED'));
  }
  lines.push('');

  return lines.join('\n');
}

export function writeJsonReport(report: PreflightReport, path: string): void {
  const fs = require('fs');
  fs.writeFileSync(path, JSON.stringify(report, null, 2));
}
