#!/usr/bin/env node
/**
 * @file pipeline/scan.ts
 * @description Codebase scanner - file discovery and metadata collection
 */

import { glob } from 'glob';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

interface FileMetadata {
  path: string;
  kind: 'route' | 'domain' | 'component' | 'state' | 'service' | 'contract' | 'other';
  size: number;
  lastModified: string;
  hasJSDoc: boolean;
  exports: string[];
}

interface DomainInfo {
  namespace: string;
  name: string;
  path: string;
  hasIndex: boolean;
  pages: string[];
  features: string[];
  state: string[];
  services: string[];
  contracts: string[];
}

interface ScanResult {
  timestamp: string;
  targetRoot: string;
  summary: {
    totalFiles: number;
    routes: number;
    domains: number;
    components: number;
    stateModules: number;
    services: number;
    contracts: number;
  };
  files: FileMetadata[];
  domains: DomainInfo[];
}

function determineFileKind(filePath: string): FileMetadata['kind'] {
  if (filePath.includes('/routes/')) return 'route';
  if (filePath.includes('/state/') && filePath.endsWith('.state.svelte.ts')) return 'state';
  if (filePath.includes('/services/') && filePath.endsWith('.svc.ts')) return 'service';
  if (filePath.includes('/contracts/') && filePath.endsWith('.contract.ts')) return 'contract';
  if (filePath.endsWith('.svelte')) return 'component';
  if (filePath.includes('/domains/')) return 'domain';
  return 'other';
}

function hasJSDocComment(content: string): boolean {
  return content.includes('/**') || content.includes('@description') || content.includes('@file');
}

function extractExports(content: string): string[] {
  const exports: string[] = [];

  // Match export statements
  const exportMatches = content.matchAll(/export\s+(const|let|function|class|type|interface)\s+(\w+)/g);
  for (const match of exportMatches) {
    exports.push(match[2]);
  }

  // Match default exports
  if (/export\s+default/.test(content)) {
    exports.push('default');
  }

  // Match re-exports
  const reExportMatches = content.matchAll(/export\s+\{\s*([^}]+)\s*\}/g);
  for (const match of reExportMatches) {
    const names = match[1].split(',').map(s => s.trim().split(' as ')[0].trim());
    exports.push(...names);
  }

  return exports;
}

async function scanFile(filePath: string, platformRoot: string): Promise<FileMetadata> {
  const absolutePath = path.join(platformRoot, filePath);
  const stats = fs.statSync(absolutePath);
  const content = fs.readFileSync(absolutePath, 'utf-8');

  return {
    path: filePath,
    kind: determineFileKind(filePath),
    size: stats.size,
    lastModified: stats.mtime.toISOString(),
    hasJSDoc: hasJSDocComment(content),
    exports: extractExports(content),
  };
}

async function scanDomains(platformRoot: string, targetPath: string): Promise<DomainInfo[]> {
  const domains: DomainInfo[] = [];
  const domainsRoot = path.join(platformRoot, targetPath, 'lib/domains');

  if (!fs.existsSync(domainsRoot)) {
    return domains;
  }

  // Find all domain directories (namespace/domain structure)
  const namespaces = fs.readdirSync(domainsRoot).filter(f =>
    fs.statSync(path.join(domainsRoot, f)).isDirectory()
  );

  for (const namespace of namespaces) {
    const namespacePath = path.join(domainsRoot, namespace);
    const domainDirs = fs.readdirSync(namespacePath).filter(f =>
      fs.statSync(path.join(namespacePath, f)).isDirectory()
    );

    for (const domainName of domainDirs) {
      const domainPath = path.join(namespacePath, domainName);
      const relativePath = `${targetPath}/lib/domains/${namespace}/${domainName}`;

      const domain: DomainInfo = {
        namespace,
        name: domainName,
        path: relativePath,
        hasIndex: fs.existsSync(path.join(domainPath, 'index.ts')),
        pages: [],
        features: [],
        state: [],
        services: [],
        contracts: [],
      };

      // Scan subdirectories
      const pagesDir = path.join(domainPath, 'pages');
      if (fs.existsSync(pagesDir)) {
        domain.pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.svelte'));
      }

      const featuresDir = path.join(domainPath, 'features');
      if (fs.existsSync(featuresDir)) {
        domain.features = fs.readdirSync(featuresDir).filter(f =>
          fs.statSync(path.join(featuresDir, f)).isDirectory()
        );
      }

      const stateDir = path.join(domainPath, 'state');
      if (fs.existsSync(stateDir)) {
        domain.state = fs.readdirSync(stateDir).filter(f => f.endsWith('.state.svelte.ts'));
      }

      const servicesDir = path.join(domainPath, 'services');
      if (fs.existsSync(servicesDir)) {
        domain.services = fs.readdirSync(servicesDir).filter(f => f.endsWith('.svc.ts'));
      }

      const contractsDir = path.join(domainPath, 'contracts');
      if (fs.existsSync(contractsDir)) {
        domain.contracts = fs.readdirSync(contractsDir).filter(f => f.endsWith('.contract.ts'));
      }

      domains.push(domain);
    }
  }

  return domains;
}

async function main() {
  const platformRoot = path.resolve(__dirname, '../..');
  const policyPath = path.join(platformRoot, 'scripts/docs/policy/cowlevel.policy.json');
  const policy = JSON.parse(fs.readFileSync(policyPath, 'utf-8'));
  const targetPath = policy.targetPath;

  console.log('');
  console.log(chalk.bold.cyan('DevPulse Codebase Scanner'));
  console.log(chalk.dim(`Target: ${targetPath}`));
  console.log('');

  // Find all source files
  const patterns = [
    `${targetPath}/**/*.ts`,
    `${targetPath}/**/*.svelte`,
  ];

  const excludePatterns = [
    '**/node_modules/**',
    '**/.svelte-kit/**',
    '**/dist/**',
    '**/*.d.ts',
  ];

  console.log(chalk.dim('Scanning files...'));

  const allFiles: string[] = [];
  for (const pattern of patterns) {
    const files = await glob(pattern.replace(/\\/g, '/'), {
      cwd: platformRoot,
      ignore: excludePatterns,
      nodir: true,
    });
    allFiles.push(...files);
  }

  console.log(chalk.dim(`Found ${allFiles.length} files`));

  // Scan each file
  console.log(chalk.dim('Analyzing files...'));
  const fileMetadata: FileMetadata[] = [];
  for (const file of allFiles) {
    const metadata = await scanFile(file, platformRoot);
    fileMetadata.push(metadata);
  }

  // Scan domains
  console.log(chalk.dim('Scanning domains...'));
  const domains = await scanDomains(platformRoot, targetPath);

  // Create result
  const result: ScanResult = {
    timestamp: new Date().toISOString(),
    targetRoot: targetPath,
    summary: {
      totalFiles: fileMetadata.length,
      routes: fileMetadata.filter(f => f.kind === 'route').length,
      domains: domains.length,
      components: fileMetadata.filter(f => f.kind === 'component').length,
      stateModules: fileMetadata.filter(f => f.kind === 'state').length,
      services: fileMetadata.filter(f => f.kind === 'service').length,
      contracts: fileMetadata.filter(f => f.kind === 'contract').length,
    },
    files: fileMetadata,
    domains,
  };

  // Output
  const outputPath = path.join(platformRoot, '.doc-scan.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

  // Print summary
  console.log('');
  console.log(chalk.bold('Scan Summary'));
  console.log(chalk.dim('─────────────────────────────────'));
  console.log(`  Total Files:    ${chalk.cyan(result.summary.totalFiles)}`);
  console.log(`  Routes:         ${chalk.cyan(result.summary.routes)}`);
  console.log(`  Domains:        ${chalk.cyan(result.summary.domains)}`);
  console.log(`  Components:     ${chalk.cyan(result.summary.components)}`);
  console.log(`  State Modules:  ${chalk.cyan(result.summary.stateModules)}`);
  console.log(`  Services:       ${chalk.cyan(result.summary.services)}`);
  console.log(`  Contracts:      ${chalk.cyan(result.summary.contracts)}`);
  console.log('');
  console.log(chalk.dim(`Results written to ${outputPath}`));
  console.log('');

  // Check for issues
  const domainsWithoutIndex = domains.filter(d => !d.hasIndex);
  if (domainsWithoutIndex.length > 0) {
    console.log(chalk.yellow('Domains missing index.ts:'));
    for (const domain of domainsWithoutIndex) {
      console.log(chalk.yellow(`  - ${domain.namespace}/${domain.name}`));
    }
    console.log('');
  }

  const filesWithoutJSDoc = fileMetadata.filter(f => !f.hasJSDoc && f.kind !== 'other');
  const jsdocCoverage = ((fileMetadata.length - filesWithoutJSDoc.length) / fileMetadata.length * 100).toFixed(1);
  console.log(`JSDoc Coverage: ${chalk.cyan(jsdocCoverage + '%')}`);
  console.log('');
}

main().catch(err => {
  console.error(chalk.red('Scan error:'), err);
  process.exit(1);
});
