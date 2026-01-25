/**
 * @file preflight/fixers/fix.seed-architecture.ts
 * @description Seed architecture documentation from templates
 */

import fs from 'fs';
import path from 'path';
import { registry } from '../engine/registry.js';
import type { Fixer, CheckResult, CheckContext, FixResult } from '../types.js';

const architectureFixer: Fixer = {
  id: 'fix.seed-architecture',
  name: 'Architecture Doc Seeder',
  description: 'Create architecture documentation from templates',

  canFix(result: CheckResult): boolean {
    return result.message.includes('architecture') ||
      result.message.includes('ARCHITECTURE.md');
  },

  async preview(result: CheckResult, ctx: CheckContext): Promise<FixResult> {
    const templatePath = path.join(ctx.platformRoot, 'scripts/docs/templates/docs/architecture.md');
    const targetPath = path.join(ctx.targetRoot, 'docs/ARCHITECTURE.md');

    if (fs.existsSync(targetPath)) {
      return {
        fixId: 'fix.seed-architecture',
        file: targetPath.replace(ctx.platformRoot, ''),
        applied: false,
        description: 'ARCHITECTURE.md already exists',
      };
    }

    let template = '';
    if (fs.existsSync(templatePath)) {
      template = fs.readFileSync(templatePath, 'utf-8');
    } else {
      template = `# Architecture

## Overview
[TODO: High-level architecture description]

## Layers
[TODO: Describe system layers]

## Data Flow
[TODO: Describe data flow]
`;
    }

    return {
      fixId: 'fix.seed-architecture',
      file: targetPath.replace(ctx.platformRoot, '').replace(/^[/\\]/, ''),
      applied: false,
      description: 'Create ARCHITECTURE.md from template',
      diff: template,
    };
  },

  async apply(result: CheckResult, ctx: CheckContext): Promise<FixResult> {
    const preview = await this.preview(result, ctx);

    if (!preview.diff || preview.description.includes('already exists')) {
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

registry.registerFixer(architectureFixer);

export { architectureFixer };
