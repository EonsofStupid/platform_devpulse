/*
 * @file preflight/checks/check.domain-boundaries.ts
 * @description Verify domain API boundaries are respected
 *
 * RULE: Routes can only import from:
 *   - $lib/domains/{namespace}/{domain}/index.ts (public API)
 *   - $lib/domains/{namespace}/{domain}/pages/* (page components)
 *   - $lib/sys/* (system utilities)
 *   - $app/* (SvelteKit)
 *   - svelte/* (Svelte core)
 */

import { Project, SyntaxKind } from 'ts-morph';
import fs from 'fs';
import path from 'path';
import { registry } from '../engine/registry.js';
import type { Check, CheckContext, CheckResult } from '../types.js';

/** Allowed import patterns for route files */
const ALLOWED_IMPORTS = [
  // Domain public APIs
  /^\$lib\/domains\/[^/]+\/[^/]+\/index(\.js|\.ts)?$/,
  /^\$lib\/domains\/[^/]+\/[^/]+$/,  // Implicit index.ts

  // Explicit page imports
  /^\$lib\/domains\/.*\/pages\//,

  // System layer
  /^\$lib\/sys\//,
  /^\$lib\/layouts\//,

  // SvelteKit
  /^\$app\//,
  /^\$env\//,

  // Svelte
  /^svelte/,

  // Relative imports within routes (for shared route utilities)
  /^\.\.\//,
  /^\.\//,

  // Design system (allowed everywhere)
  /^\$lib\/design\//,
];

/** Forbidden import patterns - direct domain internals */
const FORBIDDEN_IMPORTS = [
  // Direct feature imports (bypassing index.ts)
  /^\$lib\/domains\/.*\/features\//,
  // Direct state imports (should go through index.ts)
  /^\$lib\/domains\/.*\/state\//,
  // Direct service imports (should go through index.ts)
  /^\$lib\/domains\/.*\/services\//,
  // Direct contract imports from domains
  /^\$lib\/domains\/.*\/contracts\//,
  // Direct utils imports from domains
  /^\$lib\/domains\/.*\/utils\//,
];

function isRouteFile(filePath: string): boolean {
  return filePath.includes('/routes/') || filePath.includes('\\routes\\');
}

function extractImportsFromSvelte(content: string): string[] {
  const imports: string[] = [];
  const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/g);

  if (scriptMatch) {
    for (const script of scriptMatch) {
      const importMatches = script.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
      for (const match of importMatches) {
        imports.push(match[1]);
      }
      // Also catch type imports
      const typeImportMatches = script.matchAll(/import\s+type\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
      for (const match of typeImportMatches) {
        imports.push(match[1]);
      }
    }
  }

  return imports;
}

function extractImportsFromTs(filePath: string, platformRoot: string): string[] {
  const imports: string[] = [];
  const absolutePath = path.join(platformRoot, filePath);

  if (!fs.existsSync(absolutePath)) {
    return imports;
  }

  const project = new Project({ useInMemoryFileSystem: false });
  const sourceFile = project.addSourceFileAtPath(absolutePath);

  for (const importDecl of sourceFile.getImportDeclarations()) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();
    imports.push(moduleSpecifier);
  }

  return imports;
}

function isAllowedImport(importPath: string): boolean {
  return ALLOWED_IMPORTS.some(pattern => pattern.test(importPath));
}

function isForbiddenImport(importPath: string): { forbidden: boolean; reason?: string } {
  for (const pattern of FORBIDDEN_IMPORTS) {
    if (pattern.test(importPath)) {
      if (importPath.includes('/features/')) {
        return { forbidden: true, reason: 'Direct feature import bypasses domain API' };
      }
      if (importPath.includes('/state/')) {
        return { forbidden: true, reason: 'State should be accessed through domain index.ts' };
      }
      if (importPath.includes('/services/')) {
        return { forbidden: true, reason: 'Services should be accessed through domain index.ts' };
      }
      if (importPath.includes('/contracts/')) {
        return { forbidden: true, reason: 'Domain contracts should be accessed through domain index.ts' };
      }
      if (importPath.includes('/utils/')) {
        return { forbidden: true, reason: 'Domain utils should be accessed through domain index.ts' };
      }
      return { forbidden: true, reason: 'Bypasses domain boundary' };
    }
  }
  return { forbidden: false };
}

function checkImports(imports: string[], filePath: string): CheckResult[] {
  const results: CheckResult[] = [];

  for (const importPath of imports) {
    // First check if it's explicitly forbidden
    const forbiddenCheck = isForbiddenImport(importPath);
    if (forbiddenCheck.forbidden) {
      results.push({
        checkId: 'domain-boundaries',
        status: 'fail',
        severity: 'error',
        message: `Forbidden import: "${importPath}"`,
        file: filePath,
        suggestion: forbiddenCheck.reason || 'Import from domain index.ts instead',
        autoFixable: false,
      });
      continue;
    }

    // Then check if it matches allowed patterns
    if (!isAllowedImport(importPath)) {
      // Check if it's a domain import that should use index.ts
      if (importPath.startsWith('$lib/domains/')) {
        results.push({
          checkId: 'domain-boundaries',
          status: 'fail',
          severity: 'error',
          message: `Invalid domain import: "${importPath}"`,
          file: filePath,
          suggestion: 'Import from the domain\'s index.ts or pages/** directory',
          autoFixable: false,
        });
      }
    }
  }

  return results;
}

const domainBoundariesCheck: Check = {
  id: 'domain-boundaries',
  name: 'Domain Boundaries',
  description: 'Verify routes only import from domain public APIs',

  async run(ctx: CheckContext): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    const routeFiles = ctx.files.filter(isRouteFile);

    if (routeFiles.length === 0) {
      results.push({
        checkId: 'domain-boundaries',
        status: 'pass',
        severity: 'info',
        message: 'No route files to check',
      });
      return results;
    }

    for (const file of routeFiles) {
      let imports: string[] = [];

      if (file.endsWith('.svelte')) {
        const absolutePath = path.join(ctx.platformRoot, file);
        if (fs.existsSync(absolutePath)) {
          const content = fs.readFileSync(absolutePath, 'utf-8');
          imports = extractImportsFromSvelte(content);
        }
      } else if (file.endsWith('.ts')) {
        imports = extractImportsFromTs(file, ctx.platformRoot);
      }

      const importResults = checkImports(imports, file);
      results.push(...importResults);
    }

    // If no failures, add a pass result
    if (!results.some(r => r.status === 'fail')) {
      results.push({
        checkId: 'domain-boundaries',
        status: 'pass',
        severity: 'info',
        message: `All ${routeFiles.length} route files respect domain boundaries`,
      });
    }

    return results;
  },
};

// Register the check
registry.registerCheck(domainBoundariesCheck);

export { domainBoundariesCheck };
