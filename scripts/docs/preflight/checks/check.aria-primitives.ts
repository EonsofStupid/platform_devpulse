import fs from 'fs';
import path from 'path';
import { registry } from '../engine/registry.js';
import type { Check, CheckContext, CheckResult } from '../types.js';

const SEMANTIC_ELEMENTS = [
  'button', 'input', 'select', 'textarea', 'dialog', 'nav',
  'a', 'form', 'label', 'fieldset', 'legend', 'details', 'summary',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'meter', 'progress',
];

const ARIA_PATTERNS = [
  'use:aria',
  'role=',
  'aria-',
];

const ariaPrimitivesCheck: Check = {
  id: 'aria-primitives',
  name: 'ARIA on Primitives',
  description: 'Every primitive .svelte must use semantic HTML, role attributes, or use:aria action',

  async run(ctx: CheckContext): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    const svelteFiles = ctx.files.filter(f =>
      f.includes('lib/design/primitives/') &&
      f.endsWith('.svelte') &&
      !f.includes('_archive') &&
      !f.includes('.test.')
    );

    if (svelteFiles.length === 0) {
      results.push({
        checkId: 'aria-primitives',
        status: 'skip',
        severity: 'info',
        message: 'No primitive .svelte files found',
      });
      return results;
    }

    for (const file of svelteFiles) {
      const absolutePath = path.join(ctx.platformRoot, file);
      if (!fs.existsSync(absolutePath)) continue;

      const content = fs.readFileSync(absolutePath, 'utf-8');

      const hasAriaPattern = ARIA_PATTERNS.some(p => content.includes(p));
      const hasSemanticElement = SEMANTIC_ELEMENTS.some(el => {
        const regex = new RegExp(`<${el}[\\s>]`, 'i');
        return regex.test(content);
      });

      if (!hasAriaPattern && !hasSemanticElement) {
        results.push({
          checkId: 'aria-primitives',
          status: 'fail',
          severity: 'error',
          message: `No ARIA or semantic HTML found`,
          file,
          suggestion: 'Add use:aria action, role= attribute, or use semantic HTML elements',
        });
      }
    }

    if (!results.some(r => r.status === 'fail')) {
      results.push({
        checkId: 'aria-primitives',
        status: 'pass',
        severity: 'info',
        message: `${svelteFiles.length} primitive components have ARIA/semantic coverage`,
      });
    }

    return results;
  },
};

registry.registerCheck(ariaPrimitivesCheck);
export { ariaPrimitivesCheck };
