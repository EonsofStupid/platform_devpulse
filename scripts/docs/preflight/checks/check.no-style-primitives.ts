import fs from 'fs';
import path from 'path';
import { registry } from '../engine/registry.js';
import type { Check, CheckContext, CheckResult } from '../types.js';

const primitiveNoStyleCheck: Check = {
  id: 'no-style-primitives',
  name: 'No Style Tags in Primitives',
  description: 'Primitives are unstyled structural shells. No <style> tags allowed.',

  async run(ctx: CheckContext): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    const primitivesDir = path.join(ctx.targetRoot, 'primitives');

    if (!fs.existsSync(primitivesDir)) {
      results.push({
        checkId: 'no-style-primitives',
        status: 'skip',
        severity: 'info',
        message: 'No primitives directory found',
      });
      return results;
    }

    const svelteFiles = ctx.files.filter(f =>
      f.includes('packages/coldlight/primitives/') &&
      f.endsWith('.svelte') &&
      !f.includes('_archive')
    );

    for (const file of svelteFiles) {
      const absolutePath = path.join(ctx.platformRoot, file);
      if (!fs.existsSync(absolutePath)) continue;

      const content = fs.readFileSync(absolutePath, 'utf-8');
      if (content.includes('<style')) {
        const line = content.substring(0, content.indexOf('<style')).split('\n').length;
        results.push({
          checkId: 'no-style-primitives',
          status: 'fail',
          severity: 'error',
          message: `Primitive has <style> tag — primitives must be unstyled`,
          file,
          line,
        });
      }
    }

    if (!results.some(r => r.status === 'fail')) {
      results.push({
        checkId: 'no-style-primitives',
        status: 'pass',
        severity: 'info',
        message: `${svelteFiles.length} primitive .svelte files are style-free`,
      });
    }

    return results;
  },
};

registry.registerCheck(primitiveNoStyleCheck);
export { primitiveNoStyleCheck };
