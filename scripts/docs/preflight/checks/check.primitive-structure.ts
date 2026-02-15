import fs from 'fs';
import path from 'path';
import { registry } from '../engine/registry.js';
import type { Check, CheckContext, CheckResult } from '../types.js';

const REQUIRED_FILES = ['types.ts', 'index.ts'];
const EXCLUDED_DIRS = ['_archive', 'tanstack', '.claude', 'sprints'];

function getPrimitiveDirs(designRoot: string): string[] {
  const primitivesDir = path.join(designRoot, 'lib/design/primitives');
  if (!fs.existsSync(primitivesDir)) return [];

  return fs.readdirSync(primitivesDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !EXCLUDED_DIRS.includes(d.name))
    .map(d => d.name);
}

const primitiveStructureCheck: Check = {
  id: 'primitive-structure',
  name: 'Primitive Folder Structure',
  description: 'Every primitive folder must have types.ts, index.ts, and at least one .svelte file',

  async run(ctx: CheckContext): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    const dirs = getPrimitiveDirs(ctx.targetRoot);

    if (dirs.length === 0) {
      results.push({
        checkId: 'primitive-structure',
        status: 'skip',
        severity: 'info',
        message: 'No primitive directories found',
      });
      return results;
    }

    for (const dir of dirs) {
      const primDir = path.join(ctx.targetRoot, 'lib/design/primitives', dir);
      const files = fs.readdirSync(primDir);

      for (const required of REQUIRED_FILES) {
        if (!files.includes(required)) {
          results.push({
            checkId: 'primitive-structure',
            status: 'fail',
            severity: 'error',
            message: `primitives/${dir}/ missing required file: ${required}`,
            file: `lib/design/primitives/${dir}/${required}`,
          });
        }
      }

      const hasSvelte = files.some(f => f.endsWith('.svelte'));
      if (!hasSvelte) {
        results.push({
          checkId: 'primitive-structure',
          status: 'fail',
          severity: 'error',
          message: `primitives/${dir}/ has no .svelte component file`,
          file: `lib/design/primitives/${dir}/`,
        });
      }
    }

    if (!results.some(r => r.status === 'fail')) {
      results.push({
        checkId: 'primitive-structure',
        status: 'pass',
        severity: 'info',
        message: `All ${dirs.length} primitive folders have required structure`,
      });
    }

    return results;
  },
};

registry.registerCheck(primitiveStructureCheck);
export { primitiveStructureCheck };
