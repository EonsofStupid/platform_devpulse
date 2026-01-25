/**
 * @file preflight/fixers/fix.domain-index.ts
 * @description Generate missing domain index.ts files
 *
 * Creates index.ts files that export the public API for domains
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { registry } from '../engine/registry.js';
import type { Fixer, CheckResult, CheckContext, FixResult } from '../types.js';

interface ExportInfo {
  name: string;
  type: 'component' | 'function' | 'type' | 'const';
  from: string;
}

async function findDomainExports(domainPath: string): Promise<ExportInfo[]> {
  const exports: ExportInfo[] = [];

  // Find page components
  const pages = await glob('pages/**/*.page.svelte', { cwd: domainPath });
  for (const page of pages) {
    const name = path.basename(page, '.page.svelte');
    exports.push({
      name: `${name}Page`,
      type: 'component',
      from: `./${page.replace(/\\/g, '/')}`,
    });
  }

  // Find state modules
  const states = await glob('state/**/*.state.svelte.ts', { cwd: domainPath });
  for (const state of states) {
    const name = path.basename(state, '.state.svelte.ts');
    exports.push({
      name: `${name}State`,
      type: 'const',
      from: `./${state.replace(/\\/g, '/').replace('.ts', '')}`,
    });
  }

  // Find services
  const services = await glob('services/**/*.svc.ts', { cwd: domainPath });
  for (const service of services) {
    const name = path.basename(service, '.svc.ts');
    exports.push({
      name: `${name}Service`,
      type: 'const',
      from: `./${service.replace(/\\/g, '/').replace('.ts', '')}`,
    });
  }

  // Find contracts (re-export types)
  const contracts = await glob('contracts/**/*.contract.ts', { cwd: domainPath });
  for (const contract of contracts) {
    const name = path.basename(contract, '.contract.ts');
    exports.push({
      name: `type ${name}Contract`,
      type: 'type',
      from: `./${contract.replace(/\\/g, '/').replace('.ts', '')}`,
    });
  }

  return exports;
}

function generateIndexContent(domainName: string, exports: ExportInfo[]): string {
  const lines: string[] = [
    `/**`,
    ` * @file ${domainName}/index.ts`,
    ` * @description Public API for ${domainName} domain`,
    ` * @module @devpulse/domains/${domainName}`,
    ` *`,
    ` * This file is the ONLY entry point for this domain.`,
    ` * All imports from outside must use this index.`,
    ` */`,
    ``,
  ];

  // Group exports by type
  const components = exports.filter(e => e.type === 'component');
  const functions = exports.filter(e => e.type === 'function' || e.type === 'const');
  const types = exports.filter(e => e.type === 'type');

  if (components.length > 0) {
    lines.push(`// Page Components`);
    for (const exp of components) {
      lines.push(`export { default as ${exp.name} } from '${exp.from}';`);
    }
    lines.push(``);
  }

  if (functions.length > 0) {
    lines.push(`// State & Services`);
    for (const exp of functions) {
      lines.push(`export { ${exp.name.replace(/^(type |const )/, '')} } from '${exp.from}';`);
    }
    lines.push(``);
  }

  if (types.length > 0) {
    lines.push(`// Types`);
    for (const exp of types) {
      const typeName = exp.name.replace('type ', '');
      lines.push(`export type { ${typeName} } from '${exp.from}';`);
    }
    lines.push(``);
  }

  if (exports.length === 0) {
    lines.push(`// TODO: Add exports for this domain`);
    lines.push(`// export { ComponentName } from './pages/ComponentName.page.svelte';`);
    lines.push(`// export { stateName } from './state/name.state.svelte';`);
    lines.push(`// export { serviceName } from './services/name.svc';`);
    lines.push(``);
  }

  return lines.join('\n');
}

const domainIndexFixer: Fixer = {
  id: 'fix.domain-index',
  name: 'Domain Index Generator',
  description: 'Generate missing domain index.ts files',

  canFix(result: CheckResult): boolean {
    // Can fix domain boundary issues that stem from missing index.ts
    return result.checkId === 'domain-boundaries' &&
      result.message.includes('index.ts');
  },

  async preview(result: CheckResult, ctx: CheckContext): Promise<FixResult> {
    // Extract domain path from the error
    const match = result.file?.match(/domains\/([^/]+)\/([^/]+)/);
    if (!match) {
      return {
        fixId: 'fix.domain-index',
        file: result.file || 'unknown',
        applied: false,
        description: 'Could not determine domain path',
      };
    }

    const [, namespace, domain] = match;
    const domainPath = path.join(ctx.targetRoot, 'lib/domains', namespace, domain);
    const indexPath = path.join(domainPath, 'index.ts');

    // Check if index.ts already exists
    if (fs.existsSync(indexPath)) {
      return {
        fixId: 'fix.domain-index',
        file: indexPath,
        applied: false,
        description: 'index.ts already exists',
      };
    }

    const exports = await findDomainExports(domainPath);
    const content = generateIndexContent(domain, exports);

    return {
      fixId: 'fix.domain-index',
      file: indexPath.replace(ctx.platformRoot, '').replace(/^[/\\]/, ''),
      applied: false,
      description: `Generate index.ts for ${namespace}/${domain} domain`,
      diff: content,
    };
  },

  async apply(result: CheckResult, ctx: CheckContext): Promise<FixResult> {
    const preview = await this.preview(result, ctx);

    if (!preview.diff || preview.description.includes('already exists')) {
      return { ...preview, applied: false };
    }

    const absolutePath = path.join(ctx.platformRoot, preview.file);

    // Ensure directory exists
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(absolutePath, preview.diff);

    return {
      ...preview,
      applied: true,
    };
  },
};

// Register the fixer
registry.registerFixer(domainIndexFixer);

export { domainIndexFixer };
