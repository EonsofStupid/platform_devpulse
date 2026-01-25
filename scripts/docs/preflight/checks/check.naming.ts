/**
 * @file preflight/checks/check.naming.ts
 * @description Verify naming conventions
 *
 * RULES:
 * - Domain pages: *.page.svelte
 * - Rune state modules: *.state.svelte.ts
 * - Services: *.svc.ts
 * - Contracts: *.contract.ts
 * - Registries: *.registry.ts
 */

import fs from 'fs';
import path from 'path';
import { registry } from '../engine/registry.js';
import type { Check, CheckContext, CheckResult } from '../types.js';

interface NamingRule {
  location: RegExp;
  patterns: { expected: RegExp; actual: RegExp; description: string; suggestion: string }[];
}

const NAMING_RULES: NamingRule[] = [
  {
    // Domain pages should be *.page.svelte
    location: /\/domains\/.*\/pages\//,
    patterns: [
      {
        expected: /\.page\.svelte$/,
        actual: /\.svelte$/,
        description: 'Domain page component',
        suggestion: 'Rename to *.page.svelte',
      },
    ],
  },
  {
    // State modules should be *.state.svelte.ts
    location: /\/domains\/.*\/state\//,
    patterns: [
      {
        expected: /\.state\.svelte\.ts$/,
        actual: /\.ts$/,
        description: 'State module',
        suggestion: 'Rename to *.state.svelte.ts',
      },
    ],
  },
  {
    // Services should be *.svc.ts
    location: /\/domains\/.*\/services\//,
    patterns: [
      {
        expected: /\.svc\.ts$/,
        actual: /\.ts$/,
        description: 'Service module',
        suggestion: 'Rename to *.svc.ts',
      },
    ],
  },
  {
    // Contracts in domains should be *.contract.ts
    location: /\/domains\/.*\/contracts\//,
    patterns: [
      {
        expected: /\.contract\.ts$/,
        actual: /\.ts$/,
        description: 'Contract module',
        suggestion: 'Rename to *.contract.ts',
      },
    ],
  },
  {
    // System contracts should be *.contract.ts
    location: /\/sys\/contracts\//,
    patterns: [
      {
        expected: /\.contract\.ts$/,
        actual: /\.ts$/,
        description: 'System contract',
        suggestion: 'Rename to *.contract.ts',
      },
    ],
  },
  {
    // Registries should be *.registry.ts
    location: /\/sys\/registries\//,
    patterns: [
      {
        expected: /\.registry\.ts$/,
        actual: /\.ts$/,
        description: 'Registry module',
        suggestion: 'Rename to *.registry.ts',
      },
    ],
  },
];

/** Files to skip in naming checks */
const SKIP_FILES = [
  'index.ts',
  'index.js',
  'types.ts',
  'types.d.ts',
  'constants.ts',
  'utils.ts',
];

function shouldSkip(filePath: string): boolean {
  const basename = path.basename(filePath);

  // Skip non-source files
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.svelte')) {
    return true;
  }

  // Skip common utility files
  if (SKIP_FILES.includes(basename)) {
    return true;
  }

  // Skip test files
  if (basename.includes('.test.') || basename.includes('.spec.')) {
    return true;
  }

  // Skip type declaration files
  if (basename.endsWith('.d.ts')) {
    return true;
  }

  return false;
}

function checkFileName(filePath: string): CheckResult | null {
  if (shouldSkip(filePath)) {
    return null;
  }

  const basename = path.basename(filePath);

  for (const rule of NAMING_RULES) {
    if (!rule.location.test(filePath)) {
      continue;
    }

    for (const pattern of rule.patterns) {
      // Check if file matches the actual pattern (e.g., ends with .ts)
      if (pattern.actual.test(basename)) {
        // Check if it DOESN'T match the expected pattern
        if (!pattern.expected.test(basename)) {
          const expectedName = basename.replace(
            pattern.actual,
            pattern.expected.source.replace(/\\\./g, '.').replace(/\$$/, '')
          );

          return {
            checkId: 'naming-conventions',
            status: 'fail',
            severity: 'warning',
            message: `${pattern.description} "${basename}" does not follow naming convention`,
            file: filePath,
            suggestion: `${pattern.suggestion} (e.g., ${expectedName})`,
            autoFixable: true,
          };
        }
      }
    }
  }

  return null;
}

const namingCheck: Check = {
  id: 'naming-conventions',
  name: 'Naming Conventions',
  description: 'Verify file naming conventions are followed',

  async run(ctx: CheckContext): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    if (ctx.files.length === 0) {
      results.push({
        checkId: 'naming-conventions',
        status: 'pass',
        severity: 'info',
        message: 'No files to check',
      });
      return results;
    }

    let checkedCount = 0;
    let violations = 0;

    for (const file of ctx.files) {
      const absolutePath = path.join(ctx.platformRoot, file);

      if (!fs.existsSync(absolutePath)) {
        continue;
      }

      checkedCount++;
      const result = checkFileName(file);

      if (result) {
        results.push(result);
        violations++;
      }
    }

    // Add summary
    if (violations === 0) {
      results.push({
        checkId: 'naming-conventions',
        status: 'pass',
        severity: 'info',
        message: `${checkedCount} files checked - all follow naming conventions`,
      });
    } else {
      // Add a summary result
      results.push({
        checkId: 'naming-conventions',
        status: 'fail',
        severity: 'warning',
        message: `${violations} naming convention violations found in ${checkedCount} files`,
      });
    }

    return results;
  },
};

// Register the check
registry.registerCheck(namingCheck);

export { namingCheck };
