import fs from 'fs';
import path from 'path';
import { registry } from '../engine/registry.js';
import type { Check, CheckContext, CheckResult } from '../types.js';

const REQUIRED_FILES = ['schema.ts', 'context.ts', 'types.ts', 'index.ts'];
const EXCLUDED_DIRS = ['.claude', 'sprints', '_transport'];

function getComponentDirs(designRoot: string): string[] {
  const componentsDir = path.join(designRoot, 'lib/design/components');
  if (!fs.existsSync(componentsDir)) return [];

  return fs.readdirSync(componentsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !EXCLUDED_DIRS.includes(d.name))
    .map(d => d.name);
}

const componentStructureCheck: Check = {
  id: 'component-structure',
  name: 'Component Folder Structure',
  description: 'Every component folder must have schema.ts, context.ts, types.ts, index.ts, and at least one .svelte file',

  async run(ctx: CheckContext): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    const dirs = getComponentDirs(ctx.targetRoot);

    if (dirs.length === 0) {
      results.push({
        checkId: 'component-structure',
        status: 'skip',
        severity: 'info',
        message: 'No component directories found',
      });
      return results;
    }

    for (const dir of dirs) {
      const compDir = path.join(ctx.targetRoot, 'lib/design/components', dir);
      const files = fs.readdirSync(compDir);

      for (const required of REQUIRED_FILES) {
        if (!files.includes(required)) {
          results.push({
            checkId: 'component-structure',
            status: 'fail',
            severity: 'error',
            message: `components/${dir}/ missing required file: ${required}`,
            file: `lib/design/components/${dir}/${required}`,
          });
        }
      }

      const hasSvelte = files.some(f => f.endsWith('.svelte') && !f.includes('.test.'));
      if (!hasSvelte) {
        results.push({
          checkId: 'component-structure',
          status: 'fail',
          severity: 'error',
          message: `components/${dir}/ has no .svelte component file`,
          file: `lib/design/components/${dir}/`,
        });
      }
    }

    if (!results.some(r => r.status === 'fail')) {
      results.push({
        checkId: 'component-structure',
        status: 'pass',
        severity: 'info',
        message: `All ${dirs.length} component folders have required structure`,
      });
    }

    return results;
  },
};

registry.registerCheck(componentStructureCheck);
export { componentStructureCheck };
