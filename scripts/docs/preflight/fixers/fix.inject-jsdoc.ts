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
  const dirname = path.dirname(filePath);
  const modulePath = dirname.replace(/.*src\/lib\//, '$lib/').replace(/\\/g, '/');

  return `/**
 * @file ${basename}
 * @module ${modulePath}/${basename.replace(/\.(ts|svelte)$/, '')}
 * @description [TODO: Describe this ${kind}]
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

  // Check for file-level JSDoc
  const firstStatement = sourceFile.getStatements()[0];
  if (firstStatement && !firstStatement.getLeadingCommentRanges().some(c =>
    c.getText().startsWith('/**')
  )) {
    // Determine file kind
    let kind = 'module';
    if (filePath.includes('/services/')) kind = 'service';
    else if (filePath.includes('/state/')) kind = 'state module';
    else if (filePath.includes('/contracts/')) kind = 'contract';

    const header = getFileJSDocHeader(filePath, kind);
    changes.push(`+ File header JSDoc`);
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

function injectJSDocIntoSvelte(filePath: string, platformRoot: string): { modified: boolean; diff: string } {
  const absolutePath = path.join(platformRoot, filePath);
  const content = fs.readFileSync(absolutePath, 'utf-8');

  // Check if file has a component header comment
  const hasHeader = content.includes('@file') || content.includes('@description');

  if (hasHeader) {
    return { modified: false, diff: 'Component already has header documentation' };
  }

  // Generate header for Svelte component
  const basename = path.basename(filePath);
  const dirname = path.dirname(filePath);
  const componentName = basename.replace('.svelte', '').replace('.page', '');

  let kind = 'component';
  if (filePath.includes('/pages/')) kind = 'page component';
  else if (filePath.includes('/features/')) kind = 'feature component';

  const header = `<!--
  @file ${basename}
  @module ${dirname.replace(/.*src\//, '').replace(/\\/g, '/')}
  @description [TODO: Describe this ${kind}]

  @props
  - [TODO: List props]

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
