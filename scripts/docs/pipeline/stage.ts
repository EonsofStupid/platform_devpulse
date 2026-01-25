#!/usr/bin/env node
/**
 * @file pipeline/stage.ts
 * @description Stage documentation for publishing
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

interface StagedDoc {
  type: 'api' | 'component' | 'architecture' | 'adr' | 'diagram';
  name: string;
  path: string;
  content: string;
}

async function main() {
  const platformRoot = path.resolve(__dirname, '../..');
  const policyPath = path.join(platformRoot, 'scripts/docs/policy/cowlevel.policy.json');
  const policy = JSON.parse(fs.readFileSync(policyPath, 'utf-8'));
  const targetPath = policy.targetPath;

  console.log('');
  console.log(chalk.bold.cyan('DevPulse Documentation Stager'));
  console.log('');

  const stageDir = path.join(platformRoot, '.doc-stage');

  // Clean stage directory
  if (fs.existsSync(stageDir)) {
    fs.rmSync(stageDir, { recursive: true });
  }
  fs.mkdirSync(stageDir, { recursive: true });

  const staged: StagedDoc[] = [];

  // Stage API documentation
  const apiPath = path.join(platformRoot, '.doc-api.json');
  if (fs.existsSync(apiPath)) {
    const api = JSON.parse(fs.readFileSync(apiPath, 'utf-8'));
    const apiDoc = generateAPIMarkdown(api);
    const apiStagePath = path.join(stageDir, 'api.md');
    fs.writeFileSync(apiStagePath, apiDoc);
    staged.push({ type: 'api', name: 'API Reference', path: apiStagePath, content: apiDoc });
    console.log(chalk.green('  ✓ Staged API documentation'));
  }

  // Stage component documentation
  const propsPath = path.join(platformRoot, '.doc-props.json');
  if (fs.existsSync(propsPath)) {
    const props = JSON.parse(fs.readFileSync(propsPath, 'utf-8'));
    const componentsDoc = generateComponentsMarkdown(props);
    const componentsStagePath = path.join(stageDir, 'components.md');
    fs.writeFileSync(componentsStagePath, componentsDoc);
    staged.push({ type: 'component', name: 'Components', path: componentsStagePath, content: componentsDoc });
    console.log(chalk.green('  ✓ Staged component documentation'));
  }

  // Stage architecture documentation
  const archPath = path.join(platformRoot, targetPath, 'docs/ARCHITECTURE.md');
  if (fs.existsSync(archPath)) {
    const archContent = fs.readFileSync(archPath, 'utf-8');
    const archStagePath = path.join(stageDir, 'architecture.md');
    fs.writeFileSync(archStagePath, archContent);
    staged.push({ type: 'architecture', name: 'Architecture', path: archStagePath, content: archContent });
    console.log(chalk.green('  ✓ Staged architecture documentation'));
  }

  // Stage ADRs
  const adrDir = path.join(platformRoot, targetPath, 'docs/adr');
  if (fs.existsSync(adrDir)) {
    const adrs = fs.readdirSync(adrDir).filter(f => f.endsWith('.md'));
    for (const adr of adrs) {
      const adrContent = fs.readFileSync(path.join(adrDir, adr), 'utf-8');
      const adrStagePath = path.join(stageDir, 'adr', adr);
      fs.mkdirSync(path.dirname(adrStagePath), { recursive: true });
      fs.writeFileSync(adrStagePath, adrContent);
      staged.push({ type: 'adr', name: adr, path: adrStagePath, content: adrContent });
    }
    if (adrs.length > 0) {
      console.log(chalk.green(`  ✓ Staged ${adrs.length} ADR(s)`));
    }
  }

  // Generate index
  const indexContent = generateIndex(staged);
  fs.writeFileSync(path.join(stageDir, 'index.md'), indexContent);

  console.log('');
  console.log(chalk.bold('Staging Summary'));
  console.log(chalk.dim('─────────────────────────────────'));
  console.log(`  Total Staged: ${chalk.cyan(staged.length + 1)} files`);
  console.log(`  Output:       ${chalk.dim(stageDir)}`);
  console.log('');
}

function generateAPIMarkdown(api: any[]): string {
  const lines = ['# API Reference', ''];

  for (const module of api) {
    lines.push(`## ${module.name}`);
    if (module.description) {
      lines.push('', module.description);
    }
    lines.push('');

    for (const exp of module.exports) {
      lines.push(`### ${exp.name}`);
      lines.push('');
      lines.push(`**Kind:** ${exp.kind}`);
      if (exp.description) {
        lines.push('', exp.description);
      }
      if (exp.params && exp.params.length > 0) {
        lines.push('', '**Parameters:**');
        for (const param of exp.params) {
          lines.push(`- \`${param.name}\`: ${param.type}${param.optional ? ' (optional)' : ''}`);
        }
      }
      if (exp.returns) {
        lines.push('', `**Returns:** \`${exp.returns}\``);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

function generateComponentsMarkdown(components: any[]): string {
  const lines = ['# Component Reference', ''];

  for (const comp of components) {
    lines.push(`## ${comp.name}`);
    lines.push('');
    lines.push(`**Path:** \`${comp.path}\``);
    if (comp.description) {
      lines.push('', comp.description);
    }
    lines.push('');

    if (comp.props.length > 0) {
      lines.push('### Props');
      lines.push('');
      lines.push('| Name | Type | Required | Default |');
      lines.push('|------|------|----------|---------|');
      for (const prop of comp.props) {
        lines.push(`| ${prop.name} | \`${prop.type}\` | ${prop.required ? 'Yes' : 'No'} | ${prop.default || '-'} |`);
      }
      lines.push('');
    }

    if (comp.events.length > 0) {
      lines.push('### Events');
      lines.push('');
      for (const event of comp.events) {
        lines.push(`- \`${event}\``);
      }
      lines.push('');
    }

    if (comp.slots.length > 0) {
      lines.push('### Slots');
      lines.push('');
      for (const slot of comp.slots) {
        lines.push(`- \`${slot}\``);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

function generateIndex(staged: StagedDoc[]): string {
  const lines = [
    '# DevPulse Documentation',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Contents',
    '',
  ];

  const byType = new Map<string, StagedDoc[]>();
  for (const doc of staged) {
    const list = byType.get(doc.type) || [];
    list.push(doc);
    byType.set(doc.type, list);
  }

  const typeLabels: Record<string, string> = {
    api: 'API Reference',
    component: 'Components',
    architecture: 'Architecture',
    adr: 'Architecture Decision Records',
    diagram: 'Diagrams',
  };

  for (const [type, docs] of byType) {
    lines.push(`### ${typeLabels[type] || type}`);
    lines.push('');
    for (const doc of docs) {
      const relativePath = path.basename(doc.path);
      lines.push(`- [${doc.name}](./${relativePath})`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

main().catch(err => {
  console.error(chalk.red('Staging error:'), err);
  process.exit(1);
});
