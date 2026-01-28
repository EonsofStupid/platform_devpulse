#!/usr/bin/env node
/**
 * @file pipeline/validate.ts
 * @description Validate scan results against policy
 */

import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  rule: string;
  message: string;
  path?: string;
}

interface ValidationWarning {
  rule: string;
  message: string;
  suggestion?: string;
}

async function main() {
  const platformRoot = path.resolve(__dirname, '../..');
  const scanPath = path.join(platformRoot, '.doc-scan.json');
  const policyPath = path.join(platformRoot, 'scripts/docs/policy/cowlevel.policy.json');
  const coveragePath = path.join(platformRoot, 'scripts/docs/policy/doc-coverage.gates.json');

  console.log('');
  console.log(chalk.bold.cyan('DevPulse Policy Validator'));
  console.log('');

  // Load scan results
  if (!fs.existsSync(scanPath)) {
    console.error(chalk.red('Error: No scan results found. Run `pnpm docs:scan` first.'));
    process.exit(1);
  }

  const scan = JSON.parse(fs.readFileSync(scanPath, 'utf-8'));
  const policy = JSON.parse(fs.readFileSync(policyPath, 'utf-8'));
  const coverageGates = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));

  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  console.log(chalk.dim('Validating against policy...'));

  // Validate domain structure
  for (const domain of scan.domains) {
    // Check for index.ts
    if (!domain.hasIndex) {
      result.errors.push({
        rule: 'domain-boundaries',
        message: `Domain ${domain.namespace}/${domain.name} missing index.ts`,
        path: domain.path,
      });
      result.valid = false;
    }

    // Check page naming
    for (const page of domain.pages) {
      if (!page.endsWith('.page.svelte')) {
        result.warnings.push({
          rule: 'naming-conventions',
          message: `Page ${page} should be named *.page.svelte`,
          suggestion: `Rename to ${page.replace('.svelte', '.page.svelte')}`,
        });
      }
    }

    // Check state naming
    for (const state of domain.state) {
      if (!state.endsWith('.state.svelte.ts')) {
        result.warnings.push({
          rule: 'naming-conventions',
          message: `State module ${state} should be named *.state.svelte.ts`,
        });
      }
    }

    // Check service naming
    for (const service of domain.services) {
      if (!service.endsWith('.svc.ts')) {
        result.warnings.push({
          rule: 'naming-conventions',
          message: `Service ${service} should be named *.svc.ts`,
        });
      }
    }
  }

  // Validate coverage thresholds
  const totalDocs = scan.files.filter((f: any) => f.hasJSDoc).length;
  const totalFiles = scan.files.length;
  const coverage = (totalDocs / totalFiles) * 100;

  const thresholdValues = Object.values(coverageGates.gates.minimum.thresholds) as number[];
  const minThreshold = thresholdValues.reduce((a, b) => a + b, 0) / thresholdValues.length;

  if (coverage < minThreshold) {
    result.warnings.push({
      rule: 'doc-coverage',
      message: `Documentation coverage (${coverage.toFixed(1)}%) below minimum threshold (${minThreshold}%)`,
      suggestion: 'Add JSDoc comments to exported modules',
    });
  }

  // Output results
  console.log('');
  console.log(chalk.bold('Validation Results'));
  console.log(chalk.dim('─────────────────────────────────'));

  if (result.errors.length > 0) {
    console.log('');
    console.log(chalk.red.bold(`${result.errors.length} Error(s)`));
    for (const error of result.errors) {
      console.log(chalk.red(`  ✖ [${error.rule}] ${error.message}`));
      if (error.path) {
        console.log(chalk.dim(`    at ${error.path}`));
      }
    }
  }

  if (result.warnings.length > 0) {
    console.log('');
    console.log(chalk.yellow.bold(`${result.warnings.length} Warning(s)`));
    for (const warning of result.warnings) {
      console.log(chalk.yellow(`  ⚠ [${warning.rule}] ${warning.message}`));
      if (warning.suggestion) {
        console.log(chalk.dim(`    → ${warning.suggestion}`));
      }
    }
  }

  console.log('');
  if (result.valid && result.warnings.length === 0) {
    console.log(chalk.green.bold('✓ All validations passed'));
  } else if (result.valid) {
    console.log(chalk.yellow.bold('⚠ Validation passed with warnings'));
  } else {
    console.log(chalk.red.bold('✖ Validation failed'));
  }
  console.log('');

  // Write validation report
  const reportPath = path.join(platformRoot, '.doc-validation.json');
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
  console.log(chalk.dim(`Report written to ${reportPath}`));
  console.log('');

  if (!result.valid) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(chalk.red('Validation error:'), err);
  process.exit(1);
});
