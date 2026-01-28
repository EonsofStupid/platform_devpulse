#!/usr/bin/env node
/**
 * @file pipeline/extract/typedoc.ts
 * @description TypeDoc integration for API documentation
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { Project, SyntaxKind, VariableDeclarationKind } from 'ts-morph';

interface ModuleDoc {
  name: string;
  path: string;
  description?: string;
  exports: ExportDoc[];
}

interface ExportDoc {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'type' | 'const' | 'variable';
  description?: string;
  signature?: string;
  params?: ParamDoc[];
  returns?: string;
}

interface ParamDoc {
  name: string;
  type: string;
  description?: string;
  optional?: boolean;
}

function extractJSDocDescription(jsdoc: string): string | undefined {
  const lines = jsdoc.split('\n');
  const descriptionLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.replace(/^\s*\*\s?/, '').trim();
    if (trimmed.startsWith('@')) break;
    if (trimmed && trimmed !== '/**' && trimmed !== '*/') {
      descriptionLines.push(trimmed);
    }
  }

  return descriptionLines.length > 0 ? descriptionLines.join(' ') : undefined;
}

async function extractModuleDocs(filePath: string, platformRoot: string): Promise<ModuleDoc | null> {
  const absolutePath = path.join(platformRoot, filePath);

  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  const project = new Project({ useInMemoryFileSystem: false });
  const sourceFile = project.addSourceFileAtPath(absolutePath);

  const moduleName = path.basename(filePath, '.ts').replace(/\.(svc|contract|state\.svelte)$/, '');

  const moduleDoc: ModuleDoc = {
    name: moduleName,
    path: filePath,
    exports: [],
  };

  // Get file-level JSDoc
  const firstStatement = sourceFile.getStatements()[0];
  if (firstStatement) {
    const comments = firstStatement.getLeadingCommentRanges();
    for (const comment of comments) {
      const text = comment.getText();
      if (text.startsWith('/**')) {
        moduleDoc.description = extractJSDocDescription(text);
        break;
      }
    }
  }

  // Extract exported functions
  for (const func of sourceFile.getFunctions()) {
    if (!func.isExported()) continue;

    const name = func.getName() || 'anonymous';
    const jsdocs = func.getJsDocs();
    const description = jsdocs.length > 0
      ? extractJSDocDescription(jsdocs[0].getText())
      : undefined;

    const params: ParamDoc[] = func.getParameters().map(p => ({
      name: p.getName(),
      type: p.getType().getText(),
      optional: p.isOptional(),
    }));

    moduleDoc.exports.push({
      name,
      kind: 'function',
      description,
      signature: func.getSignature()?.getDeclaration().getText(),
      params,
      returns: func.getReturnType().getText(),
    });
  }

  // Extract exported classes
  for (const cls of sourceFile.getClasses()) {
    if (!cls.isExported()) continue;

    const name = cls.getName() || 'anonymous';
    const jsdocs = cls.getJsDocs();
    const description = jsdocs.length > 0
      ? extractJSDocDescription(jsdocs[0].getText())
      : undefined;

    moduleDoc.exports.push({
      name,
      kind: 'class',
      description,
    });
  }

  // Extract exported interfaces
  for (const iface of sourceFile.getInterfaces()) {
    if (!iface.isExported()) continue;

    const name = iface.getName();
    const jsdocs = iface.getJsDocs();
    const description = jsdocs.length > 0
      ? extractJSDocDescription(jsdocs[0].getText())
      : undefined;

    moduleDoc.exports.push({
      name,
      kind: 'interface',
      description,
    });
  }

  // Extract exported type aliases
  for (const typeAlias of sourceFile.getTypeAliases()) {
    if (!typeAlias.isExported()) continue;

    const name = typeAlias.getName();
    const jsdocs = typeAlias.getJsDocs();
    const description = jsdocs.length > 0
      ? extractJSDocDescription(jsdocs[0].getText())
      : undefined;

    moduleDoc.exports.push({
      name,
      kind: 'type',
      description,
    });
  }

  // Extract exported variables/constants
  for (const variable of sourceFile.getVariableDeclarations()) {
    const statement = variable.getVariableStatement();
    if (!statement?.isExported()) continue;

    const name = variable.getName();
    const jsdocs = statement.getJsDocs();
    const description = jsdocs.length > 0
      ? extractJSDocDescription(jsdocs[0].getText())
      : undefined;

    const isConst = statement.getDeclarationKind() === VariableDeclarationKind.Const;

    moduleDoc.exports.push({
      name,
      kind: isConst ? 'const' : 'variable',
      description,
    });
  }

  return moduleDoc.exports.length > 0 ? moduleDoc : null;
}

async function main() {
  const platformRoot = path.resolve(__dirname, '../../..');
  const policyPath = path.join(platformRoot, 'scripts/docs/policy/cowlevel.policy.json');
  const policy = JSON.parse(fs.readFileSync(policyPath, 'utf-8'));
  const targetPath = policy.targetPath;

  console.log('');
  console.log(chalk.bold.cyan('DevPulse TypeDoc Extractor'));
  console.log(chalk.dim(`Target: ${targetPath}`));
  console.log('');

  // Find TypeScript files
  const { glob } = await import('glob');
  const files = await glob(`${targetPath}/**/*.ts`.replace(/\\/g, '/'), {
    cwd: platformRoot,
    ignore: [
      '**/node_modules/**',
      '**/.svelte-kit/**',
      '**/*.d.ts',
      '**/*.test.ts',
      '**/*.spec.ts',
    ],
  });

  console.log(chalk.dim(`Found ${files.length} TypeScript files`));

  const modules: ModuleDoc[] = [];
  for (const file of files) {
    try {
      const doc = await extractModuleDocs(file, platformRoot);
      if (doc) {
        modules.push(doc);
      }
    } catch (err) {
      console.warn(chalk.yellow(`Warning: Could not extract from ${file}`));
    }
  }

  // Output
  const outputPath = path.join(platformRoot, '.doc-api.json');
  fs.writeFileSync(outputPath, JSON.stringify(modules, null, 2));

  console.log('');
  console.log(chalk.bold('Extraction Summary'));
  console.log(chalk.dim('─────────────────────────────────'));
  console.log(`  Modules:       ${chalk.cyan(modules.length)}`);
  console.log(`  Exports:       ${chalk.cyan(modules.reduce((a, m) => a + m.exports.length, 0))}`);
  console.log(`  Functions:     ${chalk.cyan(modules.reduce((a, m) => a + m.exports.filter(e => e.kind === 'function').length, 0))}`);
  console.log(`  Classes:       ${chalk.cyan(modules.reduce((a, m) => a + m.exports.filter(e => e.kind === 'class').length, 0))}`);
  console.log(`  Types:         ${chalk.cyan(modules.reduce((a, m) => a + m.exports.filter(e => e.kind === 'type' || e.kind === 'interface').length, 0))}`);
  console.log('');
  console.log(chalk.dim(`Results written to ${outputPath}`));
  console.log('');
}

main().catch(err => {
  console.error(chalk.red('TypeDoc extraction error:'), err);
  process.exit(1);
});
