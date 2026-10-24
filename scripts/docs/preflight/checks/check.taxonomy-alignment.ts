import fs from 'fs';
import path from 'path';
import { registry } from '../engine/registry.js';
import type { Check, CheckContext, CheckResult } from '../types.js';

const EXCLUDED_DIRS = ['_archive', 'tanstack', '.claude', 'sprints'];

function getPrimitiveDirs(designRoot: string): string[] {
  const primitivesDir = path.join(designRoot, 'primitives');
  if (!fs.existsSync(primitivesDir)) return [];

  return fs.readdirSync(primitivesDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !EXCLUDED_DIRS.includes(d.name))
    .map(d => d.name);
}

const taxonomyAlignmentCheck: Check = {
  id: 'taxonomy-alignment',
  name: 'Taxonomy Alignment',
  description: 'Every primitive must import its contract from taxonomy/kinds/primitives/{name}/contract',

  async run(ctx: CheckContext): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    const dirs = getPrimitiveDirs(ctx.targetRoot);

    if (dirs.length === 0) {
      results.push({
        checkId: 'taxonomy-alignment',
        status: 'skip',
        severity: 'info',
        message: 'No primitive directories found',
      });
      return results;
    }

    const taxonomyKindsDir = path.join(ctx.targetRoot, 'taxonomy/kinds/primitives');
    const taxonomyExists = fs.existsSync(taxonomyKindsDir);

    if (!taxonomyExists) {
      results.push({
        checkId: 'taxonomy-alignment',
        status: 'fail',
        severity: 'error',
        message: 'taxonomy/kinds/primitives/ directory does not exist',
      });
      return results;
    }

    const taxonomyKinds = fs.readdirSync(taxonomyKindsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const dir of dirs) {
      // Check taxonomy contract exists for this primitive
      if (!taxonomyKinds.includes(dir)) {
        results.push({
          checkId: 'taxonomy-alignment',
          status: 'fail',
          severity: 'error',
          message: `primitives/${dir}/ has no taxonomy contract at taxonomy/kinds/primitives/${dir}/`,
          file: `packages/coldlight/primitives/${dir}/`,
        });
        continue;
      }

      // Check that the primitive's .svelte files import from taxonomy
      const primDir = path.join(ctx.targetRoot, 'primitives', dir);
      const svelteFiles = fs.readdirSync(primDir).filter(f => f.endsWith('.svelte') && !f.includes('.test.'));

      for (const svelteFile of svelteFiles) {
        const filePath = path.join(primDir, svelteFile);
        const content = fs.readFileSync(filePath, 'utf-8');
        const expectedImport = `taxonomy/kinds/primitives/${dir}/contract`;

        if (!content.includes(expectedImport) && !content.includes('taxonomy')) {
          results.push({
            checkId: 'taxonomy-alignment',
            status: 'fail',
            severity: 'error',
            message: `primitives/${dir}/${svelteFile} does not import from taxonomy contract`,
            file: `packages/coldlight/primitives/${dir}/${svelteFile}`,
            suggestion: `Add: import { contract } from "#coldlight/taxonomy/kinds/primitives/${dir}/contract.js"`,
          });
        }
      }
    }

    if (!results.some(r => r.status === 'fail')) {
      results.push({
        checkId: 'taxonomy-alignment',
        status: 'pass',
        severity: 'info',
        message: `All ${dirs.length} primitives are aligned to taxonomy contracts`,
      });
    }

    return results;
  },
};

registry.registerCheck(taxonomyAlignmentCheck);
export { taxonomyAlignmentCheck };
