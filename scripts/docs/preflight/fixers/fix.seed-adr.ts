/**
 * @file preflight/fixers/fix.seed-adr.ts
 * @description Seed ADR (Architecture Decision Record) files
 */

import fs from 'fs';
import path from 'path';
import { registry } from '../engine/registry.js';
import type { Fixer, CheckResult, CheckContext, FixResult } from '../types.js';

function generateADRContent(number: number, title: string): string {
  const date = new Date().toISOString().split('T')[0];

  return `# ADR ${String(number).padStart(4, '0')}: ${title}

## Status

Proposed

## Context

[Describe the context and problem that led to this decision]

## Decision

[Describe the decision that was made]

## Consequences

### Positive

- [Positive consequence 1]
- [Positive consequence 2]

### Negative

- [Negative consequence 1]

### Neutral

- [Neutral observation]

## Date

${date}

## Authors

- [Author name]
`;
}

const adrFixer: Fixer = {
  id: 'fix.seed-adr',
  name: 'ADR Seeder',
  description: 'Create Architecture Decision Record files',

  canFix(result: CheckResult): boolean {
    return result.message.includes('ADR') ||
      result.message.includes('decision record');
  },

  async preview(result: CheckResult, ctx: CheckContext): Promise<FixResult> {
    const adrDir = path.join(ctx.targetRoot, 'docs/adr');

    // Find the next ADR number
    let nextNumber = 1;
    if (fs.existsSync(adrDir)) {
      const files = fs.readdirSync(adrDir);
      const numbers = files
        .map(f => parseInt(f.match(/^(\d+)/)?.[1] || '0'))
        .filter(n => !isNaN(n));
      if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1;
      }
    }

    const filename = `${String(nextNumber).padStart(4, '0')}-untitled.md`;
    const targetPath = path.join(adrDir, filename);
    const content = generateADRContent(nextNumber, 'Untitled Decision');

    return {
      fixId: 'fix.seed-adr',
      file: targetPath.replace(ctx.platformRoot, '').replace(/^[/\\]/, ''),
      applied: false,
      description: `Create ADR #${nextNumber}`,
      diff: content,
    };
  },

  async apply(result: CheckResult, ctx: CheckContext): Promise<FixResult> {
    const preview = await this.preview(result, ctx);

    if (!preview.diff) {
      return { ...preview, applied: false };
    }

    const absolutePath = path.join(ctx.platformRoot, preview.file);
    const dir = path.dirname(absolutePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(absolutePath, preview.diff);

    return { ...preview, applied: true };
  },
};

registry.registerFixer(adrFixer);

export { adrFixer };
