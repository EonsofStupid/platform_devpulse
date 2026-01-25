/**
 * @file preflight/checks/check.typed-routes.ts
 * @description Verify no raw string routes - must use typed route helpers
 *
 * RULE: All navigation must use typed routes from $lib/sys/generated/ROUTES.ts
 * Raw string paths like href="/foo" or goto('/bar') are forbidden.
 *
 * Exceptions:
 * - Route generators themselves
 * - Inventory/scanning scripts
 * - Allowlisted paths
 */

import fs from 'fs';
import path from 'path';
import { registry } from '../engine/registry.js';
import type { Check, CheckContext, CheckResult } from '../types.js';

/** Patterns that indicate raw string routes */
const RAW_ROUTE_PATTERNS = [
  // href with string literal starting with /
  /href\s*=\s*["']\/[^"']*["']/g,
  // goto with string literal
  /goto\s*\(\s*["']\/[^"']*["']/g,
  // redirect with string literal
  /redirect\s*\(\s*\d+\s*,\s*["']\/[^"']*["']/g,
  // push/replace with string literal
  /\.push\s*\(\s*["']\/[^"']*["']/g,
  /\.replace\s*\(\s*["']\/[^"']*["']/g,
  // navigate with string literal
  /navigate\s*\(\s*["']\/[^"']*["']/g,
];

/** Patterns that are allowed (route helper usage) */
const ALLOWED_PATTERNS = [
  // Using route() helper
  /href\s*=\s*\{?\s*route\s*\(/,
  /goto\s*\(\s*route\s*\(/,
  /redirect\s*\(\s*\d+\s*,\s*route\s*\(/,
];

/** Files/paths that are exempt from this check */
const EXEMPT_PATTERNS = [
  /scripts\/docs\//,
  /generated\/ROUTES/,
  /\.inventory\./,
  /route\.generator/,
  /\.test\./,
  /\.spec\./,
];

function isExempt(filePath: string, allowlist?: string[]): boolean {
  // Check built-in exemptions
  if (EXEMPT_PATTERNS.some(p => p.test(filePath))) {
    return true;
  }

  // Check policy allowlist
  if (allowlist) {
    for (const pattern of allowlist) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      if (regex.test(filePath)) {
        return true;
      }
    }
  }

  return false;
}

function extractScriptAndTemplate(content: string): { script: string; template: string } {
  let script = '';
  let template = content;

  // Extract script content
  const scriptMatches = content.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g);
  for (const match of scriptMatches) {
    script += match[1] + '\n';
    template = template.replace(match[0], '');
  }

  // Remove style tags from template
  template = template.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');

  return { script, template };
}

function findRawRoutes(content: string, filePath: string): CheckResult[] {
  const results: CheckResult[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip if line uses allowed patterns
    if (ALLOWED_PATTERNS.some(p => p.test(line))) {
      continue;
    }

    // Check for raw route patterns
    for (const pattern of RAW_ROUTE_PATTERNS) {
      pattern.lastIndex = 0; // Reset regex
      let match;
      while ((match = pattern.exec(line)) !== null) {
        results.push({
          checkId: 'typed-routes',
          status: 'fail',
          severity: 'error',
          message: `Raw string route detected: "${match[0].trim()}"`,
          file: filePath,
          line: i + 1,
          suggestion: 'Use route() helper from $lib/sys/generated/ROUTES',
          autoFixable: false,
        });
      }
    }
  }

  return results;
}

const typedRoutesCheck: Check = {
  id: 'typed-routes',
  name: 'Typed Routes',
  description: 'Verify all navigation uses typed route helpers',

  async run(ctx: CheckContext): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    const allowlist = ctx.config.allowlist;

    // Filter to source files only
    const sourceFiles = ctx.files.filter(f =>
      (f.endsWith('.ts') || f.endsWith('.svelte')) &&
      !isExempt(f, allowlist)
    );

    if (sourceFiles.length === 0) {
      results.push({
        checkId: 'typed-routes',
        status: 'pass',
        severity: 'info',
        message: 'No files to check for raw routes',
      });
      return results;
    }

    let checkedCount = 0;

    for (const file of sourceFiles) {
      const absolutePath = path.join(ctx.platformRoot, file);

      if (!fs.existsSync(absolutePath)) {
        continue;
      }

      const content = fs.readFileSync(absolutePath, 'utf-8');
      checkedCount++;

      if (file.endsWith('.svelte')) {
        const { script, template } = extractScriptAndTemplate(content);
        results.push(...findRawRoutes(script, file));
        results.push(...findRawRoutes(template, file));
      } else {
        results.push(...findRawRoutes(content, file));
      }
    }

    // If no failures, add a pass result
    if (!results.some(r => r.status === 'fail')) {
      results.push({
        checkId: 'typed-routes',
        status: 'pass',
        severity: 'info',
        message: `${checkedCount} files checked - all routes are typed`,
      });
    }

    return results;
  },
};

// Register the check
registry.registerCheck(typedRoutesCheck);

export { typedRoutesCheck };
