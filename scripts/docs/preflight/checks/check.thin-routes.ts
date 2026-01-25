/*
 * @file preflight/checks/check.thin-routes.ts
 * @description Verify routes are adapters only - no feature logic
 *
 * RULE: Route files (+page.svelte, +page.ts, +layout.svelte, +layout.ts)
 * must only:
 *   - Import from domains (index.ts or pages/)
 *   - Render domain components
 *   - Call services via load/action
 *   - NOT contain feature logic, state management, or complex business logic
 */

import { Project, SyntaxKind, type SourceFile } from 'ts-morph';
import fs from 'fs';
import path from 'path';
import { registry } from '../engine/registry.js';
import type { Check, CheckContext, CheckResult } from '../types.js';

/** Patterns that indicate feature logic in routes (forbidden) */
const FORBIDDEN_PATTERNS = [
  // State management
  /\$state\s*\(/,
  /\$derived\s*\(/,
  /writable\s*\(/,
  /readable\s*\(/,
  /createStore\s*\(/,
  /useState\s*\(/,

  // Complex logic indicators
  /class\s+\w+\s*\{/, // Class definitions
  /async\s+function\s+\w+/, // Named async functions (more than 2)
  /\.subscribe\s*\(/, // Direct subscriptions

  // Business logic
  /fetch\s*\(/, // Direct fetch (should be in services)
  /axios\s*[.(]/, // Direct axios
  /new\s+WebSocket\s*\(/, // Direct WebSocket
];

/** Allowed patterns in route files */
const ALLOWED_IMPORTS = [
  /^\$lib\/domains\/.*\/index(\.js|\.ts)?$/,
  /^\$lib\/domains\/.*\/pages\//,
  /^\$lib\/sys\//,
  /^\$app\//,
  /^svelte/,
  /^\.\.\//,
  /^\.\//,
];

function isRouteFile(filePath: string): boolean {
  const basename = path.basename(filePath);
  return ['+page.svelte', '+page.ts', '+layout.svelte', '+layout.ts', '+server.ts'].includes(basename);
}

function extractScriptContent(svelteContent: string): string {
  const scriptMatch = svelteContent.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
  if (!scriptMatch) return '';
  return scriptMatch.map(s => s.replace(/<\/?script[^>]*>/g, '')).join('\n');
}

function checkForForbiddenPatterns(content: string, filePath: string): CheckResult[] {
  const results: CheckResult[] = [];
  const lines = content.split('\n');

  for (const pattern of FORBIDDEN_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        results.push({
          checkId: 'thin-routes',
          status: 'fail',
          severity: 'error',
          message: `Feature logic detected in route file: ${pattern.source}`,
          file: filePath,
          line: i + 1,
          suggestion: 'Move this logic to a domain service or state module',
        });
      }
    }
  }

  return results;
}

function checkTsFile(project: Project, filePath: string, platformRoot: string): CheckResult[] {
  const results: CheckResult[] = [];
  const absolutePath = path.join(platformRoot, filePath);

  if (!fs.existsSync(absolutePath)) {
    return results;
  }

  const sourceFile = project.addSourceFileAtPath(absolutePath);

  // Check for forbidden patterns in the source
  const text = sourceFile.getText();
  results.push(...checkForForbiddenPatterns(text, filePath));

  // Check function count (routes should be simple)
  const functions = sourceFile.getFunctions();
  const arrowFunctions = sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction);

  // Allow load, actions, but flag if there are many helper functions
  const helperFunctions = functions.filter(f => {
    const name = f.getName();
    return name && !['load', 'actions'].includes(name);
  });

  if (helperFunctions.length > 2) {
    results.push({
      checkId: 'thin-routes',
      status: 'fail',
      severity: 'warning',
      message: `Route file has ${helperFunctions.length} helper functions - consider moving to domain`,
      file: filePath,
      suggestion: 'Route files should be thin adapters. Move helper functions to domain services.',
    });
  }

  // Check for complex arrow functions (more than 10 lines)
  for (const arrow of arrowFunctions) {
    const lineCount = arrow.getEndLineNumber() - arrow.getStartLineNumber();
    if (lineCount > 15) {
      results.push({
        checkId: 'thin-routes',
        status: 'fail',
        severity: 'warning',
        message: `Arrow function spans ${lineCount} lines - too complex for route file`,
        file: filePath,
        line: arrow.getStartLineNumber(),
        suggestion: 'Extract this logic to a domain service',
      });
    }
  }

  return results;
}

function checkSvelteFile(filePath: string, platformRoot: string): CheckResult[] {
  const results: CheckResult[] = [];
  const absolutePath = path.join(platformRoot, filePath);

  if (!fs.existsSync(absolutePath)) {
    return results;
  }

  const content = fs.readFileSync(absolutePath, 'utf-8');
  const scriptContent = extractScriptContent(content);

  // Check for forbidden patterns
  results.push(...checkForForbiddenPatterns(scriptContent, filePath));

  // Check script length (Svelte route components should be minimal)
  const scriptLines = scriptContent.split('\n').filter(l => l.trim()).length;
  if (scriptLines > 50) {
    results.push({
      checkId: 'thin-routes',
      status: 'fail',
      severity: 'warning',
      message: `Route component has ${scriptLines} lines of script - should be minimal`,
      file: filePath,
      suggestion: 'Route components should only import and render domain components',
    });
  }

  // Check template complexity (count reactive statements)
  const reactiveStatements = (content.match(/\{#each|\{#if|\{#await/g) || []).length;
  if (reactiveStatements > 5) {
    results.push({
      checkId: 'thin-routes',
      status: 'fail',
      severity: 'warning',
      message: `Route template has ${reactiveStatements} control flow statements - too complex`,
      file: filePath,
      suggestion: 'Move complex rendering logic to domain page components',
    });
  }

  return results;
}

const thinRoutesCheck: Check = {
  id: 'thin-routes',
  name: 'Thin Routes',
  description: 'Verify route files are adapters only - no feature logic',

  async run(ctx: CheckContext): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    const project = new Project({ useInMemoryFileSystem: false });

    const routeFiles = ctx.files.filter(isRouteFile);

    if (routeFiles.length === 0) {
      results.push({
        checkId: 'thin-routes',
        status: 'pass',
        severity: 'info',
        message: 'No route files to check',
      });
      return results;
    }

    for (const file of routeFiles) {
      if (file.endsWith('.svelte')) {
        results.push(...checkSvelteFile(file, ctx.platformRoot));
      } else if (file.endsWith('.ts')) {
        results.push(...checkTsFile(project, file, ctx.platformRoot));
      }
    }

    // If no failures, add a pass result
    if (!results.some(r => r.status === 'fail')) {
      results.push({
        checkId: 'thin-routes',
        status: 'pass',
        severity: 'info',
        message: `All ${routeFiles.length} route files are thin adapters`,
      });
    }

    return results;
  },
};

// Register the check
registry.registerCheck(thinRoutesCheck);

export { thinRoutesCheck };
