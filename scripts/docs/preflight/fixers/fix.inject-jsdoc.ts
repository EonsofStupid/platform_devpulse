/**
 * @file preflight/fixers/fix.inject-jsdoc.ts
 * @description Auto-inject JSDoc comments into files
 *
 * Adds missing JSDoc to exported functions, classes, and components
 */

import { Project, SyntaxKind, type FunctionDeclaration, type ClassDeclaration } from 'ts-morph';
import fs from 'fs';
import path from 'path';
import { registry } from '../engine/registry.js';
import type { Fixer, CheckResult, CheckContext, FixResult } from '../types.js';

interface JSDocTemplate {
  description: string;
  params?: { name: string; type: string }[];
  returns?: string;
}

function generateJSDoc(template: JSDocTemplate): string {
  const lines = ['/**'];
  lines.push(` * ${template.description}`);

  if (template.params && template.params.length > 0) {
    lines.push(' *');
    for (const param of template.params) {
      lines.push(` * @param ${param.name} - ${param.type}`);
    }
  }

  if (template.returns) {
    lines.push(' *');
    lines.push(` * @returns ${template.returns}`);
  }

  lines.push(' */');
  return lines.join('\n');
}

function getFileJSDocHeader(filePath: string, kind: string): string {
  const basename = path.basename(filePath);
  const relativePath = filePath.replace(/\\/g, '/').replace(/.*?(src\/)/, '$1');

  // Extract path after src/lib/ or src/
  const match = filePath.match(/src\/(lib\/)?(.+)$/);
  const modulePath = match
    ? `@devpulse/${match[2].replace(/\\/g, '/').replace(/\.(ts|js)$/, '').replace(/\/index$/, '')}`
    : `@devpulse/${basename.replace(/\.(ts|js)$/, '')}`;

  // Determine layer
  let layer = 'lib';
  if (filePath.includes('/sys/')) layer = 'sys';
  else if (filePath.includes('/routes/')) layer = 'routes';
  else if (filePath.includes('/test/')) layer = 'test';

  return `/**
 * @file ${relativePath}
 * @name ${basename}
 * @module ${modulePath}
 * @layer ${layer}
 *
 * @description
 * [TODO: Describe this ${kind}]
 *
 * @exports
 * - [TODO: List exports]
 *
 * @dependencies
 * - [TODO: List imports]
 *
 * @consumers
 * - [TODO: List who uses this module]
 *
 * @since 1.0.0
 */`;
}

function generateFunctionJSDoc(func: FunctionDeclaration): string {
  const name = func.getName() || 'anonymous';
  const params = func.getParameters().map(p => ({
    name: p.getName(),
    type: p.getType().getText() || 'unknown',
  }));
  const returnType = func.getReturnType().getText();

  return generateJSDoc({
    description: `[TODO: Describe ${name}]`,
    params,
    returns: returnType !== 'void' ? returnType : undefined,
  });
}

function injectJSDocIntoTs(filePath: string, platformRoot: string): { modified: boolean; diff: string } {
  const absolutePath = path.join(platformRoot, filePath);
  const originalContent = fs.readFileSync(absolutePath, 'utf-8');

  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile('temp.ts', originalContent);

  let modified = false;
  const changes: string[] = [];

  // Check for file-level JSDoc with complete header
  const firstStatement = sourceFile.getStatements()[0];
  const hasCompleteHeader = firstStatement?.getLeadingCommentRanges().some(c => {
    const text = c.getText();
    return text.startsWith('/**') &&
      text.includes('@file') &&
      text.includes('@name') &&
      text.includes('@module') &&
      text.includes('@layer') &&
      text.includes('@description');
  }) ?? false;

  if (!hasCompleteHeader) {
    // Determine file kind
    let kind = 'module';
    if (filePath.includes('/services/') || filePath.endsWith('.svc.ts')) kind = 'service';
    else if (filePath.includes('/state/') || filePath.endsWith('.state.svelte.ts')) kind = 'state module';
    else if (filePath.includes('/contracts/') || filePath.endsWith('.contract.ts')) kind = 'contract';
    else if (filePath.includes('/registry/') || filePath.endsWith('.registry.ts')) kind = 'registry';
    else if (filePath.includes('/types/') || filePath.endsWith('.types.ts')) kind = 'types';
    else if (filePath.includes('/manifest/') || filePath.endsWith('.manifest.ts')) kind = 'manifest';

    const header = getFileJSDocHeader(filePath, kind);
    changes.push(`+ File header JSDoc (complete)`);
    modified = true;
  }

  // Check exported functions
  const functions = sourceFile.getFunctions().filter(f => f.isExported());
  for (const func of functions) {
    const hasJSDoc = func.getJsDocs().length > 0;
    if (!hasJSDoc) {
      const jsdoc = generateFunctionJSDoc(func);
      changes.push(`+ JSDoc for function: ${func.getName()}`);
      modified = true;
    }
  }

  // Check exported classes
  const classes = sourceFile.getClasses().filter(c => c.isExported());
  for (const cls of classes) {
    const hasJSDoc = cls.getJsDocs().length > 0;
    if (!hasJSDoc) {
      changes.push(`+ JSDoc for class: ${cls.getName()}`);
      modified = true;
    }
  }

  // Check exported variables/constants
  const variables = sourceFile.getVariableDeclarations().filter(v => {
    const statement = v.getVariableStatement();
    return statement?.isExported() ?? false;
  });

  for (const variable of variables) {
    const statement = variable.getVariableStatement();
    if (statement && statement.getJsDocs().length === 0) {
      changes.push(`+ JSDoc for: ${variable.getName()}`);
      modified = true;
    }
  }

  return {
    modified,
    diff: changes.length > 0 ? changes.join('\n') : 'No changes needed',
  };
}

/**
 * Determine the layer based on file path.
 */
function determineLayer(filePath: string): string {
  if (filePath.includes('/routes/')) return 'routes';
  if (filePath.includes('/lib/')) return 'lib';
  if (filePath.includes('/sys/')) return 'sys';
  return 'app';
}

/**
 * Determine component kind based on file path.
 */
function determineComponentKind(filePath: string): string {
  if (filePath.includes('/pages/')) return 'page';
  if (filePath.includes('/features/')) return 'feature';
  if (filePath.includes('/components/')) return 'component';
  if (filePath.includes('/layouts/')) return 'layout';
  if (filePath.includes('/primitives/')) return 'primitive';
  if (filePath.includes('/blocks/')) return 'block';
  return 'component';
}

/**
 * Generate @devpulse/ module path from file path.
 */
function generateModulePath(filePath: string, basename: string): string {
  // Extract path after src/lib/ or src/routes/
  const match = filePath.match(/src\/(lib|routes)\/(.+)$/);
  if (!match) {
    return `@devpulse/${basename.replace(/\.(ts|svelte)$/, '')}`;
  }

  const [, root, rest] = match;
  const modulePath = rest
    .replace(/\\/g, '/')
    .replace(/\.(ts|svelte)$/, '')
    .replace(/\/index$/, '');

  return `@devpulse/${modulePath}`;
}

function injectJSDocIntoSvelte(filePath: string, platformRoot: string): { modified: boolean; diff: string } {
  const absolutePath = path.join(platformRoot, filePath);
  const content = fs.readFileSync(absolutePath, 'utf-8');

  // Check if file has a complete component header
  const hasCompleteHeader = content.includes('@file') &&
    content.includes('@name') &&
    content.includes('@module') &&
    content.includes('@layer') &&
    content.includes('@description');

  if (hasCompleteHeader) {
    return { modified: false, diff: 'Component already has complete header documentation' };
  }

  // Generate header for Svelte component
  const basename = path.basename(filePath);
  const relativePath = filePath.replace(/\\/g, '/').replace(/.*?(src\/)/, '$1');
  const layer = determineLayer(filePath);
  const kind = determineComponentKind(filePath);
  const modulePath = generateModulePath(filePath, basename);

  const header = `<!--
  @file ${relativePath}
  @name ${basename}
  @module ${modulePath}
  @layer ${layer}

  @description
  [TODO: Describe this ${kind}]

  @props
  - [TODO: propName]: [type] - [description]

  @dependencies
  - [TODO: List imports]

  @consumers
  - [TODO: List who uses this component]

  @vpb-editable [TODO: List editable props]
  @since 1.0.0
-->`;

  return {
    modified: true,
    diff: `+ Component header:\n${header}`,
  };
}

const injectJSDocFixer: Fixer = {
  id: 'fix.inject-jsdoc',
  name: 'JSDoc Injector',
  description: 'Auto-inject missing JSDoc comments',

  canFix(result: CheckResult): boolean {
    // Can fix documentation-related issues
    return result.message.includes('JSDoc') ||
      result.message.includes('documentation') ||
      result.message.includes('@description');
  },

  async preview(result: CheckResult, ctx: CheckContext): Promise<FixResult> {
    if (!result.file) {
      return {
        fixId: 'fix.inject-jsdoc',
        file: 'unknown',
        applied: false,
        description: 'No file specified',
      };
    }

    let analysis: { modified: boolean; diff: string };

    if (result.file.endsWith('.svelte')) {
      analysis = injectJSDocIntoSvelte(result.file, ctx.platformRoot);
    } else if (result.file.endsWith('.ts')) {
      analysis = injectJSDocIntoTs(result.file, ctx.platformRoot);
    } else {
      return {
        fixId: 'fix.inject-jsdoc',
        file: result.file,
        applied: false,
        description: 'Unsupported file type',
      };
    }

    return {
      fixId: 'fix.inject-jsdoc',
      file: result.file,
      applied: false,
      description: analysis.modified ? 'Inject missing JSDoc comments' : 'No changes needed',
      diff: analysis.diff,
    };
  },

  async apply(result: CheckResult, ctx: CheckContext): Promise<FixResult> {
    const preview = await this.preview(result, ctx);

    if (!preview.diff || preview.description === 'No changes needed') {
      return { ...preview, applied: false };
    }

    // For now, we'll just report what would be done
    // Full implementation would actually modify the files
    // This is safer as it requires user review

    return {
      ...preview,
      applied: false,
      description: 'JSDoc injection requires manual review - see diff for suggested changes',
    };
  },
};

// Register the fixer
registry.registerFixer(injectJSDocFixer);

export { injectJSDocFixer };
