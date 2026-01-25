/*
 * @file preflight/checks/check.state-vs-streams.ts
 * @description Verify state/streams separation
 *
 * RULE:
 *   - Rune state ($state, $derived) lives in domains/{ns}/{d}/state/*.state.svelte.ts
 *   - Streams/subscriptions live only in sys/streams/
 *   - Route files never own state
 */

import fs from 'fs';
import path from 'path';
import { registry } from '../engine/registry.js';
import type { Check, CheckContext, CheckResult } from '../types.js';

/** State patterns that should only be in state modules */
const STATE_PATTERNS = [
  { pattern: /\$state\s*[<(]/, name: '$state' },
  { pattern: /\$derived\s*[<(]/, name: '$derived' },
  { pattern: /\$effect\s*\(/, name: '$effect' },
  { pattern: /writable\s*\(/, name: 'writable store' },
  { pattern: /readable\s*\(/, name: 'readable store' },
  { pattern: /derived\s*\(/, name: 'derived store' },
];

/** Stream patterns that should only be in sys/streams */
const STREAM_PATTERNS = [
  { pattern: /new\s+Observable\s*[<(]/, name: 'Observable' },
  { pattern: /new\s+Subject\s*[<(]/, name: 'Subject' },
  { pattern: /new\s+BehaviorSubject\s*[<(]/, name: 'BehaviorSubject' },
  { pattern: /\.pipe\s*\(/, name: 'RxJS pipe' },
  { pattern: /\.subscribe\s*\(/, name: 'subscribe' },
  { pattern: /fromEvent\s*\(/, name: 'fromEvent' },
];

function isStateModule(filePath: string): boolean {
  return filePath.includes('/state/') && filePath.endsWith('.state.svelte.ts');
}

function isStreamsModule(filePath: string): boolean {
  return filePath.includes('/sys/streams/');
}

function isRouteFile(filePath: string): boolean {
  const basename = path.basename(filePath);
  return ['+page.svelte', '+page.ts', '+layout.svelte', '+layout.ts', '+server.ts'].includes(basename);
}

function isComponentFile(filePath: string): boolean {
  return filePath.endsWith('.svelte') && !isRouteFile(filePath);
}

function extractScriptContent(svelteContent: string): string {
  const scriptMatch = svelteContent.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
  if (!scriptMatch) return '';
  return scriptMatch.map(s => s.replace(/<\/?script[^>]*>/g, '')).join('\n');
}

function checkFile(filePath: string, content: string): CheckResult[] {
  const results: CheckResult[] = [];
  const lines = content.split('\n');

  // Check for state patterns in wrong locations
  for (const { pattern, name } of STATE_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        // $state/$derived in components is OK for local component state
        // But in route files it's not allowed
        if (isRouteFile(filePath)) {
          results.push({
            checkId: 'state-vs-streams',
            status: 'fail',
            severity: 'error',
            message: `${name} found in route file - routes should not own state`,
            file: filePath,
            line: i + 1,
            suggestion: 'Move state to domain state module (*.state.svelte.ts)',
          });
        }
        // For .ts files (not .svelte.ts state modules), flag stores
        else if (filePath.endsWith('.ts') && !isStateModule(filePath) && !filePath.endsWith('.svelte.ts')) {
          if (name.includes('store') || name.includes('writable') || name.includes('readable')) {
            results.push({
              checkId: 'state-vs-streams',
              status: 'fail',
              severity: 'error',
              message: `${name} found outside state module`,
              file: filePath,
              line: i + 1,
              suggestion: 'Move to domains/{namespace}/{domain}/state/*.state.svelte.ts',
            });
          }
        }
      }
    }
  }

  // Check for stream patterns in wrong locations
  for (const { pattern, name } of STREAM_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        if (!isStreamsModule(filePath)) {
          // .subscribe() in Svelte components is OK for consuming
          // But creating Observables/Subjects outside streams is not
          if (name !== 'subscribe' || filePath.endsWith('.ts')) {
            results.push({
              checkId: 'state-vs-streams',
              status: 'fail',
              severity: 'error',
              message: `${name} found outside sys/streams/`,
              file: filePath,
              line: i + 1,
              suggestion: 'Move stream logic to sys/streams/',
            });
          }
        }
      }
    }
  }

  return results;
}

const stateVsStreamsCheck: Check = {
  id: 'state-vs-streams',
  name: 'State vs Streams',
  description: 'Verify state lives in state modules, streams in sys/streams',

  async run(ctx: CheckContext): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    // Filter to source files
    const sourceFiles = ctx.files.filter(f =>
      f.endsWith('.ts') || f.endsWith('.svelte')
    );

    if (sourceFiles.length === 0) {
      results.push({
        checkId: 'state-vs-streams',
        status: 'pass',
        severity: 'info',
        message: 'No files to check',
      });
      return results;
    }

    let checkedCount = 0;

    for (const file of sourceFiles) {
      const absolutePath = path.join(ctx.platformRoot, file);

      if (!fs.existsSync(absolutePath)) {
        continue;
      }

      const rawContent = fs.readFileSync(absolutePath, 'utf-8');
      checkedCount++;

      let content: string;
      if (file.endsWith('.svelte')) {
        content = extractScriptContent(rawContent);
      } else {
        content = rawContent;
      }

      results.push(...checkFile(file, content));
    }

    // If no failures, add a pass result
    if (!results.some(r => r.status === 'fail')) {
      results.push({
        checkId: 'state-vs-streams',
        status: 'pass',
        severity: 'info',
        message: `${checkedCount} files checked - state/streams boundaries respected`,
      });
    }

    return results;
  },
};

// Register the check
registry.registerCheck(stateVsStreamsCheck);

export { stateVsStreamsCheck };
