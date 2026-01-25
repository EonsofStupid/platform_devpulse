#!/usr/bin/env node
/**
 * @file pipeline/extract/props.ts
 * @description Extract props from Svelte components (absorbed from tools/docgen)
 */

import { Project, SyntaxKind } from 'ts-morph';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

interface PropInfo {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description?: string;
}

interface ComponentDocs {
  name: string;
  path: string;
  description?: string;
  props: PropInfo[];
  events: string[];
  slots: string[];
}

function extractScriptContent(svelteContent: string): { script: string; isTs: boolean } {
  const match = svelteContent.match(/<script[^>]*lang=["']ts["'][^>]*>([\s\S]*?)<\/script>/);
  if (match) {
    return { script: match[1], isTs: true };
  }

  const jsMatch = svelteContent.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  if (jsMatch) {
    return { script: jsMatch[1], isTs: false };
  }

  return { script: '', isTs: false };
}

function extractPropsFromRunes(script: string): PropInfo[] {
  const props: PropInfo[] = [];

  // Match $props() destructuring: let { prop1, prop2 = default } = $props<Type>();
  const propsMatch = script.match(/let\s*\{([^}]+)\}\s*=\s*\$props/);
  if (propsMatch) {
    const propsString = propsMatch[1];

    // Parse each prop
    const propParts = propsString.split(',').map(p => p.trim());
    for (const part of propParts) {
      // Handle default values: prop = defaultValue
      const defaultMatch = part.match(/(\w+)\s*=\s*(.+)/);
      if (defaultMatch) {
        props.push({
          name: defaultMatch[1],
          type: 'unknown', // Would need type info from $props<Type>
          required: false,
          default: defaultMatch[2].trim(),
        });
      } else {
        // Simple prop without default
        const name = part.trim();
        if (name && !name.startsWith('...')) {
          props.push({
            name,
            type: 'unknown',
            required: true,
          });
        }
      }
    }
  }

  // Try to extract type from $props<Type>()
  const typeMatch = script.match(/\$props<([^>]+)>/);
  if (typeMatch) {
    // Parse the type to get prop types
    // This is a simplified version - full implementation would use ts-morph
    const typeContent = typeMatch[1];

    // Try to match inline interface
    const propTypeMatches = typeContent.matchAll(/(\w+)\s*[?:]?\s*:\s*([^;,}]+)/g);
    for (const match of propTypeMatches) {
      const propName = match[1];
      const propType = match[2].trim();
      const isOptional = typeContent.includes(`${propName}?`);

      const existingProp = props.find(p => p.name === propName);
      if (existingProp) {
        existingProp.type = propType;
        existingProp.required = !isOptional;
      } else {
        props.push({
          name: propName,
          type: propType,
          required: !isOptional,
        });
      }
    }
  }

  return props;
}

function extractEvents(svelteContent: string): string[] {
  const events: string[] = [];

  // Match dispatch calls
  const dispatchMatches = svelteContent.matchAll(/dispatch\s*\(\s*['"](\w+)['"]/g);
  for (const match of dispatchMatches) {
    if (!events.includes(match[1])) {
      events.push(match[1]);
    }
  }

  // Match on:eventname in template
  const onMatches = svelteContent.matchAll(/on:(\w+)/g);
  for (const match of onMatches) {
    if (!events.includes(match[1])) {
      events.push(match[1]);
    }
  }

  return events;
}

function extractSlots(svelteContent: string): string[] {
  const slots: string[] = [];

  // Match <slot> and <slot name="...">
  const slotMatches = svelteContent.matchAll(/<slot(?:\s+name=["'](\w+)["'])?\s*\/?>/g);
  for (const match of slotMatches) {
    const slotName = match[1] || 'default';
    if (!slots.includes(slotName)) {
      slots.push(slotName);
    }
  }

  return slots;
}

function extractComponentDescription(svelteContent: string): string | undefined {
  // Look for @description in component comment
  const descMatch = svelteContent.match(/@description\s*\n?\s*([^\n@]+)/);
  if (descMatch) {
    return descMatch[1].trim();
  }

  // Look for description in JSDoc-style comment at top
  const jsdocMatch = svelteContent.match(/<!--[\s\S]*?@description\s+([^\n]+)/);
  if (jsdocMatch) {
    return jsdocMatch[1].trim();
  }

  return undefined;
}

async function extractComponentDocs(filePath: string, platformRoot: string): Promise<ComponentDocs> {
  const absolutePath = path.join(platformRoot, filePath);
  const content = fs.readFileSync(absolutePath, 'utf-8');
  const { script, isTs } = extractScriptContent(content);

  const componentName = path.basename(filePath, '.svelte')
    .replace('.page', 'Page')
    .replace(/-([a-z])/g, (_, c) => c.toUpperCase());

  return {
    name: componentName,
    path: filePath,
    description: extractComponentDescription(content),
    props: extractPropsFromRunes(script),
    events: extractEvents(content),
    slots: extractSlots(content),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const platformRoot = path.resolve(__dirname, '../../..');
  const policyPath = path.join(platformRoot, 'scripts/docs/policy/cowlevel.policy.json');
  const policy = JSON.parse(fs.readFileSync(policyPath, 'utf-8'));
  const targetPath = policy.targetPath;

  console.log('');
  console.log(chalk.bold.cyan('DevPulse Props Extractor'));
  console.log(chalk.dim(`Target: ${targetPath}`));
  console.log('');

  // Find all Svelte components
  const { glob } = await import('glob');
  const files = await glob(`${targetPath}/**/*.svelte`.replace(/\\/g, '/'), {
    cwd: platformRoot,
    ignore: ['**/node_modules/**', '**/.svelte-kit/**'],
  });

  console.log(chalk.dim(`Found ${files.length} Svelte components`));

  const components: ComponentDocs[] = [];
  for (const file of files) {
    try {
      const docs = await extractComponentDocs(file, platformRoot);
      components.push(docs);
    } catch (err) {
      console.warn(chalk.yellow(`Warning: Could not extract from ${file}`));
    }
  }

  // Output
  const outputPath = path.join(platformRoot, '.doc-props.json');
  fs.writeFileSync(outputPath, JSON.stringify(components, null, 2));

  console.log('');
  console.log(chalk.bold('Extraction Summary'));
  console.log(chalk.dim('─────────────────────────────────'));
  console.log(`  Components:    ${chalk.cyan(components.length)}`);
  console.log(`  With Props:    ${chalk.cyan(components.filter(c => c.props.length > 0).length)}`);
  console.log(`  With Events:   ${chalk.cyan(components.filter(c => c.events.length > 0).length)}`);
  console.log(`  With Slots:    ${chalk.cyan(components.filter(c => c.slots.length > 0).length)}`);
  console.log('');
  console.log(chalk.dim(`Results written to ${outputPath}`));
  console.log('');
}

main().catch(err => {
  console.error(chalk.red('Extraction error:'), err);
  process.exit(1);
});
