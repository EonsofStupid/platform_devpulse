/**
 * @file tools/docgen/src/extract-props.ts
 *
 * Svelte 5 Props Extractor - Replacement for sveld
 *
 * Uses ts-morph to extract TypeScript interface properties with JSDoc comments.
 * Designed for ColdLight primitives where types are defined in types.ts files.
 *
 * @example
 * ```bash
 * pnpm extract:primitives
 * ```
 *
 * Output: docs/generated/primitives.json
 */

import { Project, InterfaceDeclaration, PropertySignature, TypeAliasDeclaration, SyntaxKind } from "ts-morph";
import { glob } from "glob";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, basename, dirname } from "path";

// ============================================
// TYPES
// ============================================

interface PropDoc {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description?: string;
  deprecated?: boolean;
  since?: string;
  tags?: Record<string, string>;
}

interface InterfaceDoc {
  name: string;
  description?: string;
  extends?: string[];
  props: PropDoc[];
  tags?: Record<string, string>;
}

interface SlotDoc {
  name: string;
  values: string[];
}

interface PrimitiveDoc {
  name: string;
  path: string;
  description?: string;
  interfaces: InterfaceDoc[];
  slots?: SlotDoc;
  states?: string[];
  layer?: string;
  since?: string;
}

interface DocsOutput {
  generated: string;
  version: string;
  primitives: PrimitiveDoc[];
}

// ============================================
// CONFIGURATION
// ============================================

const ROOT = resolve(import.meta.dirname, "../../..");
const PRIMITIVES_PATH = resolve(ROOT, "interfaces/desktop/src/lib/design/primitives");
const OUTPUT_DIR = resolve(ROOT, "docs/generated");
const TSCONFIG_PATH = resolve(ROOT, "interfaces/desktop/src/tsconfig.json");

// ============================================
// HELPERS
// ============================================

/**
 * Extract JSDoc comment text from a node
 */
function getJsDocComment(node: InterfaceDeclaration | PropertySignature | TypeAliasDeclaration): string | undefined {
  const jsDocs = node.getJsDocs();
  if (jsDocs.length === 0) return undefined;

  return jsDocs[0].getDescription().trim();
}

/**
 * Extract specific JSDoc tags
 */
function getJsDocTags(node: InterfaceDeclaration | PropertySignature | TypeAliasDeclaration): Record<string, string> {
  const tags: Record<string, string> = {};
  const jsDocs = node.getJsDocs();

  if (jsDocs.length === 0) return tags;

  for (const jsDoc of jsDocs) {
    for (const tag of jsDoc.getTags()) {
      const tagName = tag.getTagName();
      const comment = tag.getCommentText()?.trim() || "";
      tags[tagName] = comment;
    }
  }

  return tags;
}

/**
 * Check if property has @deprecated tag
 */
function isDeprecated(node: PropertySignature): boolean {
  const tags = getJsDocTags(node);
  return "deprecated" in tags;
}

/**
 * Extract default value from JSDoc @default tag or type analysis
 */
function getDefaultValue(node: PropertySignature): string | undefined {
  const tags = getJsDocTags(node);
  if (tags.default) return tags.default;

  // Check for optional with default in type like `prop?: string = "value"`
  // This is not valid TS syntax but sometimes appears in comments
  const comment = getJsDocComment(node);
  if (comment) {
    const defaultMatch = comment.match(/\(default:\s*([^)]+)\)/i);
    if (defaultMatch) return defaultMatch[1].trim();

    const defaultMatch2 = comment.match(/default\s*[:=]\s*([^\s,)]+)/i);
    if (defaultMatch2) return defaultMatch2[1].trim();
  }

  return undefined;
}

/**
 * Extract property documentation
 */
function extractProp(prop: PropertySignature): PropDoc {
  const name = prop.getName();
  const typeNode = prop.getTypeNode();
  const type = typeNode?.getText() || prop.getType().getText();
  const required = !prop.hasQuestionToken();
  const description = getJsDocComment(prop);
  const deprecated = isDeprecated(prop);
  const defaultValue = getDefaultValue(prop);
  const tags = getJsDocTags(prop);

  return {
    name,
    type,
    required,
    ...(defaultValue && { default: defaultValue }),
    ...(description && { description }),
    ...(deprecated && { deprecated }),
    ...(tags.since && { since: tags.since }),
    ...(Object.keys(tags).length > 0 && { tags }),
  };
}

/**
 * Extract interface documentation
 */
function extractInterface(iface: InterfaceDeclaration): InterfaceDoc {
  const name = iface.getName();
  const description = getJsDocComment(iface);
  const tags = getJsDocTags(iface);

  // Get extends
  const extendsNodes = iface.getExtends();
  const extendsTypes = extendsNodes.map(e => e.getText());

  // Get properties
  const props = iface.getProperties().map(extractProp);

  return {
    name,
    ...(description && { description }),
    ...(extendsTypes.length > 0 && { extends: extendsTypes }),
    props,
    ...(Object.keys(tags).length > 0 && { tags }),
  };
}

/**
 * Extract const array for slots/states
 */
function extractConstArray(file: ReturnType<Project["getSourceFile"]>, name: string): string[] | undefined {
  if (!file) return undefined;

  const varDecl = file.getVariableDeclaration(name);
  if (!varDecl) return undefined;

  const initializer = varDecl.getInitializer();
  if (!initializer) return undefined;

  // Parse array literal
  if (initializer.getKind() === SyntaxKind.ArrayLiteralExpression) {
    const elements = initializer.asKind(SyntaxKind.ArrayLiteralExpression)?.getElements() || [];
    return elements.map(e => {
      const text = e.getText();
      // Remove quotes
      return text.replace(/^["']|["']$/g, "");
    });
  }

  return undefined;
}

// ============================================
// MAIN EXTRACTION
// ============================================

async function extractPrimitives(): Promise<PrimitiveDoc[]> {
  console.log("Initializing TypeScript project...");

  const project = new Project({
    tsConfigFilePath: TSCONFIG_PATH,
    skipAddingFilesFromTsConfig: true,
  });

  // Find all types.ts files in primitives
  const typeFiles = await glob("**/types.ts", {
    cwd: PRIMITIVES_PATH,
    absolute: true,
  });

  console.log(`Found ${typeFiles.length} types.ts files`);

  const primitives: PrimitiveDoc[] = [];

  for (const filePath of typeFiles) {
    const relativePath = filePath.replace(PRIMITIVES_PATH + "/", "").replace(/\\/g, "/");
    const primitiveName = dirname(relativePath).split("/")[0];

    console.log(`Processing: ${primitiveName}`);

    // Add file to project
    const sourceFile = project.addSourceFileAtPath(filePath);

    // Get file-level JSDoc
    const fileComment = sourceFile.getStatements()[0]?.getLeadingCommentRanges()[0]?.getText();
    let fileDescription: string | undefined;
    let fileLayer: string | undefined;

    if (fileComment) {
      const descMatch = fileComment.match(/\*\s*Type definitions for (.+)\./);
      if (descMatch) fileDescription = descMatch[1];

      const layerMatch = fileComment.match(/@layer\s+(\w+)/);
      if (layerMatch) fileLayer = layerMatch[1];
    }

    // Extract interfaces ending with "Props"
    const interfaces = sourceFile.getInterfaces()
      .filter(i => i.getName().endsWith("Props"))
      .map(extractInterface);

    // Extract slots array (e.g., TooltipSlots)
    const slotsArrayName = `${primitiveName.charAt(0).toUpperCase() + primitiveName.slice(1)}Slots`;
    const slots = extractConstArray(sourceFile, slotsArrayName);

    // Extract state type
    const stateTypeName = `${primitiveName.charAt(0).toUpperCase() + primitiveName.slice(1)}State`;
    const stateType = sourceFile.getTypeAlias(stateTypeName);
    let states: string[] | undefined;

    if (stateType) {
      const typeText = stateType.getType().getText();
      // Parse union type like '"open" | "closed"'
      const matches = typeText.match(/"([^"]+)"/g);
      if (matches) {
        states = matches.map(m => m.replace(/"/g, ""));
      }
    }

    primitives.push({
      name: primitiveName,
      path: relativePath,
      ...(fileDescription && { description: fileDescription }),
      interfaces,
      ...(slots && { slots: { name: slotsArrayName, values: slots } }),
      ...(states && { states }),
      ...(fileLayer && { layer: fileLayer }),
    });
  }

  return primitives;
}

// ============================================
// OUTPUT
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const target = args.includes("--target")
    ? args[args.indexOf("--target") + 1]
    : "primitives";

  console.log(`\n🔍 ColdLight Props Extractor (sveld replacement for Svelte 5)\n`);
  console.log(`Target: ${target}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  // Ensure output directory exists
  mkdirSync(OUTPUT_DIR, { recursive: true });

  if (target === "primitives" || target === "all") {
    const primitives = await extractPrimitives();

    const output: DocsOutput = {
      generated: new Date().toISOString(),
      version: "0.1.0",
      primitives,
    };

    const outputPath = resolve(OUTPUT_DIR, "primitives.json");
    writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`\n✅ Generated: ${outputPath}`);
    console.log(`   Primitives: ${primitives.length}`);
    console.log(`   Interfaces: ${primitives.reduce((acc, p) => acc + p.interfaces.length, 0)}`);
    console.log(`   Props: ${primitives.reduce((acc, p) => acc + p.interfaces.reduce((a, i) => a + i.props.length, 0), 0)}`);
  }

  console.log("\n🎉 Done!\n");
}

main().catch(console.error);
