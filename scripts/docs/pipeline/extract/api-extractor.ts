#!/usr/bin/env node
/**
 * @file pipeline/extract/api-extractor.ts
 * @description Extract public API surface from domains
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { Project, SyntaxKind, type SourceFile } from 'ts-morph';

interface APISurface {
  domain: string;
  namespace: string;
  exports: APIExport[];
  reexports: string[];
}

interface APIExport {
  name: string;
  kind: string;
  source: string;
  isDefault: boolean;
  isType: boolean;
}

async function extractDomainAPI(
  indexPath: string,
  platformRoot: string
): Promise<APISurface | null> {
  const absolutePath = path.join(platformRoot, indexPath);

  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  // Parse domain path
  const match = indexPath.match(/domains\/([^/]+)\/([^/]+)\/index\.ts/);
  if (!match) return null;

  const [, namespace, domain] = match;

  const project = new Project({ useInMemoryFileSystem: false });
  const sourceFile = project.addSourceFileAtPath(absolutePath);

  const surface: APISurface = {
    domain,
    namespace,
    exports: [],
    reexports: [],
  };

  // Analyze export declarations
  for (const exportDecl of sourceFile.getExportDeclarations()) {
    const moduleSpecifier = exportDecl.getModuleSpecifierValue();

    if (moduleSpecifier) {
      surface.reexports.push(moduleSpecifier);
    }

    for (const namedExport of exportDecl.getNamedExports()) {
      const name = namedExport.getName();
      const alias = namedExport.getAliasNode()?.getText();

      surface.exports.push({
        name: alias || name,
        kind: 'reexport',
        source: moduleSpecifier || 'local',
        isDefault: false,
        isType: exportDecl.isTypeOnly(),
      });
    }
  }

  // Analyze direct exports
  for (const func of sourceFile.getFunctions()) {
    if (func.isExported()) {
      surface.exports.push({
        name: func.getName() || 'anonymous',
        kind: 'function',
        source: 'local',
        isDefault: func.isDefaultExport(),
        isType: false,
      });
    }
  }

  for (const cls of sourceFile.getClasses()) {
    if (cls.isExported()) {
      surface.exports.push({
        name: cls.getName() || 'anonymous',
        kind: 'class',
        source: 'local',
        isDefault: cls.isDefaultExport(),
        isType: false,
      });
    }
  }

  for (const iface of sourceFile.getInterfaces()) {
    if (iface.isExported()) {
      surface.exports.push({
        name: iface.getName(),
        kind: 'interface',
        source: 'local',
        isDefault: false,
        isType: true,
      });
    }
  }

  for (const typeAlias of sourceFile.getTypeAliases()) {
    if (typeAlias.isExported()) {
      surface.exports.push({
        name: typeAlias.getName(),
        kind: 'type',
        source: 'local',
        isDefault: false,
        isType: true,
      });
    }
  }

  return surface.exports.length > 0 ? surface : null;
}

async function main() {
  const platformRoot = path.resolve(__dirname, '../../..');
  const policyPath = path.join(platformRoot, 'scripts/docs/policy/cowlevel.policy.json');
  const policy = JSON.parse(fs.readFileSync(policyPath, 'utf-8'));
  const targetPath = policy.targetPath;

  console.log('');
  console.log(chalk.bold.cyan('DevPulse API Surface Extractor'));
  console.log(chalk.dim(`Target: ${targetPath}`));
  console.log('');

  // Find all domain index.ts files
  const { glob } = await import('glob');
  const indexFiles = await glob(`${targetPath}/lib/domains/**/index.ts`.replace(/\\/g, '/'), {
    cwd: platformRoot,
  });

  console.log(chalk.dim(`Found ${indexFiles.length} domain index files`));

  const surfaces: APISurface[] = [];
  for (const file of indexFiles) {
    try {
      const surface = await extractDomainAPI(file, platformRoot);
      if (surface) {
        surfaces.push(surface);
      }
    } catch (err) {
      console.warn(chalk.yellow(`Warning: Could not extract from ${file}`));
    }
  }

  // Output
  const outputPath = path.join(platformRoot, '.doc-api-surface.json');
  fs.writeFileSync(outputPath, JSON.stringify(surfaces, null, 2));

  console.log('');
  console.log(chalk.bold('API Surface Summary'));
  console.log(chalk.dim('─────────────────────────────────'));
  console.log(`  Domains:       ${chalk.cyan(surfaces.length)}`);
  console.log(`  Total Exports: ${chalk.cyan(surfaces.reduce((a, s) => a + s.exports.length, 0))}`);
  console.log(`  Type Exports:  ${chalk.cyan(surfaces.reduce((a, s) => a + s.exports.filter(e => e.isType).length, 0))}`);
  console.log('');

  // Print per-domain summary
  for (const surface of surfaces) {
    console.log(`  ${chalk.cyan(surface.namespace)}/${chalk.bold(surface.domain)}: ${surface.exports.length} exports`);
  }

  console.log('');
  console.log(chalk.dim(`Results written to ${outputPath}`));
  console.log('');
}

main().catch(err => {
  console.error(chalk.red('API extraction error:'), err);
  process.exit(1);
});
