/**
 * @file scripts/dev/file-schema.ts
 * @module @devpulse/scripts/dev/file-schema
 * @package @devpulse/scripts
 *
 * Master file schema for the entire DevPulse platform.
 * Every file pattern → required tags + header generator.
 *
 * Imported by: inject-headers.ts, scanner, doc generator, CI validators.
 *
 * @since 1.0.0
 */

import type { FileContext } from "./file-context.js";

// =============================================================================
// TYPES
// =============================================================================

export interface FileSchemaRule {
	/** Human-readable rule name */
	name: string;
	/** Regex tested against FileContext.localPath */
	match: RegExp;
	/** Namespace this rule applies to (null = any) */
	namespace: string | null;
	/** Language filter (null = any) */
	language: "typescript" | "svelte" | "rust" | "css" | null;
	/** Required JSDoc/doc tags */
	requiredTags: string[];
	/** Generate the complete file header string */
	generateHeader: (ctx: FileContext) => string;
}

// =============================================================================
// WAI-ARIA APG LINKS
// =============================================================================

const WAI_ARIA_LINKS: Record<string, string> = {
	accordion: "https://www.w3.org/WAI/ARIA/apg/patterns/accordion/",
	"alert-dialog": "https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/",
	button: "https://www.w3.org/WAI/ARIA/apg/patterns/button/",
	checkbox: "https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/",
	collapsible: "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
	combobox: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/",
	dialog: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
	"dropdown-menu": "https://www.w3.org/WAI/ARIA/apg/patterns/menubutton/",
	"context-menu": "https://www.w3.org/WAI/ARIA/apg/patterns/menubutton/",
	menubar: "https://www.w3.org/WAI/ARIA/apg/patterns/menubar/",
	"navigation-menu": "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
	popover: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
	progress: "https://www.w3.org/WAI/ARIA/apg/patterns/meter/",
	"radio-group": "https://www.w3.org/WAI/ARIA/apg/patterns/radio/",
	select: "https://www.w3.org/WAI/ARIA/apg/patterns/listbox/",
	sheet: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
	slider: "https://www.w3.org/WAI/ARIA/apg/patterns/slider/",
	tabs: "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/",
	toggle: "https://www.w3.org/WAI/ARIA/apg/patterns/button/",
	"toggle-group": "https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/",
	tooltip: "https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/",
	tree: "https://www.w3.org/WAI/ARIA/apg/patterns/treeview/",
	"file-upload": "https://www.w3.org/WAI/ARIA/apg/patterns/button/",
	"pin-input": "https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/",
	"tags-input": "https://www.w3.org/WAI/ARIA/apg/patterns/grid/",
};

function ariaLink(kind: string | null): string {
	if (!kind) return "";
	const link = WAI_ARIA_LINKS[kind];
	return link ? `\n * WAI-ARIA APG: ${link}` : "";
}

function providerLine(ctx: FileContext): string {
	const provider = ctx.ariaStateProvider ?? "coldlight";
	return `ariaStateProvider: "${provider}"`;
}

// =============================================================================
// COLDLIGHT — PRIMITIVES
// =============================================================================

const primitiveTypes: FileSchemaRule = {
	name: "primitive-types",
	match: /^primitives\/[^/]+\/types\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@kind", "@layer", "@package"],
	generateHeader: (ctx) => `/**
 * @file primitives/${ctx.kind}/types.ts
 * @kind ${ctx.kind}
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * ${ctx.kindPascal} primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ${providerLine(ctx)}${ariaLink(ctx.kind)}
 */

`,
};

const primitiveContract: FileSchemaRule = {
	name: "primitive-contract",
	match: /^primitives\/[^/]+\/contract\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@kind", "@layer", "@package"],
	generateHeader: (ctx) => `/**
 * @file primitives/${ctx.kind}/contract.ts
 * @kind ${ctx.kind}
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * ${ctx.kindPascal} PrimitiveContract — SSOT declaration for the ${ctx.kind} primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ${providerLine(ctx)}${ariaLink(ctx.kind)}
 */

`,
};

const primitiveSvelte: FileSchemaRule = {
	name: "primitive-svelte",
	match: /^primitives\/[^/]+\/[A-Z][^/]*\.svelte$/,
	namespace: "@devpulse/coldlight",
	language: "svelte",
	requiredTags: ["@component", "@file", "@kind", "@layer", "@package"],
	generateHeader: (ctx) => `<!--
  @component ${ctx.baseName}
  @file primitives/${ctx.kind}/${ctx.fileName}
  @kind ${ctx.kind}
  @layer primitives
  @package @devpulse/coldlight

  Structureless ${ctx.kind} primitive — semantic HTML with data attributes only.
  Contract: kind="${ctx.kind}", slot="root"

  Zero ARIA at primitive layer. ARIA applied by components/${ctx.kind}/.
  Styling applied by recipe class string from component layer.${ariaLink(ctx.kind)}
-->
`,
};

const primitiveTest: FileSchemaRule = {
	name: "primitive-test",
	match: /^primitives\/[^/]+\/[A-Z][^/]*\.test\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@kind", "@layer", "@package"],
	generateHeader: (ctx) => `/**
 * @file primitives/${ctx.kind}/${ctx.fileName}
 * @kind ${ctx.kind}
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * ${ctx.kindPascal} primitive browser tests.
 * Tests the STRUCTURAL contract — data attributes, HTML semantics, slot passthrough.
 * NOT testing ARIA (that belongs in components/${ctx.kind}/).
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

`,
};

const primitiveIndex: FileSchemaRule = {
	name: "primitive-index",
	match: /^primitives\/[^/]+\/index\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@kind", "@layer", "@package"],
	generateHeader: (ctx) => `/**
 * @file primitives/${ctx.kind}/index.ts
 * @kind ${ctx.kind}
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Public barrel for the ${ctx.kind} primitive.
 * Re-exports: types, contract, component(s).
 */

`,
};

const primitiveSchema: FileSchemaRule = {
	name: "primitive-schema",
	match: /^primitives\/_schema\/[^/]+\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@package"],
	generateHeader: (ctx) => `/**
 * @file primitives/_schema/${ctx.fileName}
 * @package @devpulse/coldlight
 *
 * Primitive schema infrastructure — ArkType validation for contracts and types.
 * Powers: scanner validation, dev tools, manifest generation.
 */

`,
};

// =============================================================================
// COLDLIGHT — ADAPTERS (_internal)
// =============================================================================

const internalFactory: FileSchemaRule = {
	name: "internal-factory",
	match: /^api\/adapters\/meltui\/_internal\/[^/]+\/factory\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@package", "@internal"],
	generateHeader: (ctx) => `/**
 * @file api/adapters/meltui/_internal/${ctx.kind}/factory.ts
 * @package @devpulse/coldlight
 * @internal
 *
 * MeltUI ${ctx.kindPascal} Factory — ONLY file that imports from \`melt\` for ${ctx.kind}.
 * Wraps melt v0.44 ${ctx.kindPascal} class (class-based builder API).
 *
 * ColdLight cloaks this entirely. Consumers NEVER import from melt or this file.
 * All access is via the transport layer (_transport/).
 *
 * @builder new ${ctx.kindPascal}()${ariaLink(ctx.kind)}
 */

`,
};

const internalTransportTypes: FileSchemaRule = {
	name: "internal-transport-types",
	match: /^api\/adapters\/meltui\/_internal\/[^/]+\/_transport\/types\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@package", "@internal"],
	generateHeader: (ctx) => `/**
 * @file api/adapters/meltui/_internal/${ctx.kind}/_transport/types.ts
 * @package @devpulse/coldlight
 * @internal
 *
 * Typed transport interface for the MeltUI ${ctx.kind} adapter.
 * Maps melt v0.44 ${ctx.kindPascal} API to ColdLight slot vocabulary.
 *
 * @transport ${ctx.kindPascal}Transport${ariaLink(ctx.kind)}
 */

`,
};

const internalTransportFactory: FileSchemaRule = {
	name: "internal-transport-factory",
	match: /^api\/adapters\/meltui\/_internal\/[^/]+\/_transport\/factory\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@package", "@internal"],
	generateHeader: (ctx) => `/**
 * @file api/adapters/meltui/_internal/${ctx.kind}/_transport/factory.ts
 * @package @devpulse/coldlight
 * @internal
 *
 * Creates a ColdLight ${ctx.kind} transport from melt v0.44 ${ctx.kindPascal}.
 * Maps melt ${ctx.kindPascal} getters to ColdLight slot vocabulary.
 */

`,
};

const internalTransportIndex: FileSchemaRule = {
	name: "internal-transport-index",
	match: /^api\/adapters\/meltui\/_internal\/[^/]+\/_transport\/index\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@package"],
	generateHeader: (ctx) => `/**
 * @file api/adapters/meltui/_internal/${ctx.kind}/_transport/index.ts
 * @package @devpulse/coldlight
 *
 * Transport barrel for the ${ctx.kind} MeltUI adapter.
 * Re-exports: factory function, all transport types.
 */

`,
};

const internalIndex: FileSchemaRule = {
	name: "internal-index",
	match: /^api\/adapters\/meltui\/_internal\/[^/]+\/index\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@package", "@internal"],
	generateHeader: (ctx) => `/**
 * @file api/adapters/meltui/_internal/${ctx.kind}/index.ts
 * @package @devpulse/coldlight
 * @internal
 *
 * Top-level barrel for the ${ctx.kind} MeltUI _internal adapter.
 * Re-exports transport layer. Import enforcement: components import from here only.
 */

`,
};

// =============================================================================
// COLDLIGHT — COLDLIGHT ADAPTER (_internal)
// =============================================================================

const coldlightAdapterSvelteTs: FileSchemaRule = {
	name: "coldlight-adapter-svelte-ts",
	match: /^api\/adapters\/coldlight\/_internal\/[^/]+\/[^/]+\.svelte\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@package", "@internal"],
	generateHeader: (ctx) => `/**
 * @file api/adapters/coldlight/_internal/${ctx.kind}/${ctx.fileName}
 * @package @devpulse/coldlight
 * @internal
 *
 * ColdLight ${ctx.kindPascal} builder — Svelte 5 rune-based state management.
 * ColdLight owns ARIA directly. No external adapter dependency.${ariaLink(ctx.kind)}
 */

`,
};

const coldlightAdapterTransportTypes: FileSchemaRule = {
	name: "coldlight-adapter-transport-types",
	match: /^api\/adapters\/coldlight\/_internal\/[^/]+\/_transport\/types\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@package", "@internal"],
	generateHeader: (ctx) => `/**
 * @file api/adapters/coldlight/_internal/${ctx.kind}/_transport/types.ts
 * @package @devpulse/coldlight
 * @internal
 *
 * Typed transport interface for the ColdLight ${ctx.kind ?? "shared"} adapter.
 */

`,
};

const coldlightAdapterTransportFactory: FileSchemaRule = {
	name: "coldlight-adapter-transport-factory",
	match: /^api\/adapters\/coldlight\/_internal\/[^/]+\/_transport\/factory\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@package", "@internal"],
	generateHeader: (ctx) => `/**
 * @file api/adapters/coldlight/_internal/${ctx.kind}/_transport/factory.ts
 * @package @devpulse/coldlight
 * @internal
 *
 * ColdLight ${ctx.kind ?? "shared"} transport factory — creates transport from rune state.
 */

`,
};

const coldlightAdapterTransportIndex: FileSchemaRule = {
	name: "coldlight-adapter-transport-index",
	match: /^api\/adapters\/coldlight\/_internal\/[^/]+\/_transport\/index\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@package"],
	generateHeader: (ctx) => `/**
 * @file api/adapters/coldlight/_internal/${ctx.kind}/_transport/index.ts
 * @package @devpulse/coldlight
 *
 * Transport barrel for the ColdLight ${ctx.kind ?? "shared"} adapter.
 */

`,
};

const coldlightAdapterIndex: FileSchemaRule = {
	name: "coldlight-adapter-index",
	match: /^api\/adapters\/coldlight\/_internal\/[^/]+\/index\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@package", "@internal"],
	generateHeader: (ctx) => `/**
 * @file api/adapters/coldlight/_internal/${ctx.kind}/index.ts
 * @package @devpulse/coldlight
 * @internal
 *
 * Top-level barrel for the ColdLight ${ctx.kind ?? "shared"} _internal adapter.
 */

`,
};

/** Shared transport utilities under coldlight/_internal/_transport/ (no kind) */
const coldlightSharedTransport: FileSchemaRule = {
	name: "coldlight-shared-transport",
	match: /^api\/adapters\/coldlight\/_internal\/_transport\/[^/]+\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@package", "@internal"],
	generateHeader: (ctx) => `/**
 * @file ${ctx.localPath}
 * @package @devpulse/coldlight
 * @internal
 *
 * ColdLight shared transport utility: ${ctx.baseName}.
 */

`,
};

// =============================================================================
// COLDLIGHT — COMPONENTS
// =============================================================================

const componentSvelte: FileSchemaRule = {
	name: "component-svelte",
	match: /^components\/[^/]+\/[A-Z][^/]*\.svelte$/,
	namespace: "@devpulse/coldlight",
	language: "svelte",
	requiredTags: ["@component", "@file", "@kind", "@layer", "@package"],
	generateHeader: (ctx) => `<!--
  @component ${ctx.baseName}
  @file components/${ctx.kind}/${ctx.fileName}
  @kind ${ctx.kind}
  @layer components
  @package @devpulse/coldlight

  Styled ${ctx.kind} component — primitive + recipe + ARIA.
  Composes primitives/${ctx.kind}/ with recipe styling and ARIA attributes.${ariaLink(ctx.kind)}
-->
`,
};

const componentTs: FileSchemaRule = {
	name: "component-ts",
	match: /^components\/[^/]+\/(?!index\.ts$)[^/]+\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@kind", "@layer", "@package"],
	generateHeader: (ctx) => `/**
 * @file components/${ctx.kind}/${ctx.fileName}
 * @kind ${ctx.kind}
 * @layer components
 * @package @devpulse/coldlight
 *
 * ${ctx.kindPascal} component ${ctx.baseName} — styled layer with ARIA application.
 */

`,
};

const componentIndex: FileSchemaRule = {
	name: "component-index",
	match: /^components\/[^/]+\/index\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@kind", "@layer", "@package"],
	generateHeader: (ctx) => `/**
 * @file components/${ctx.kind}/index.ts
 * @kind ${ctx.kind}
 * @layer components
 * @package @devpulse/coldlight
 *
 * Public barrel for the ${ctx.kind} component.
 */

`,
};

const componentSchema: FileSchemaRule = {
	name: "component-schema",
	match: /^components\/_schema\/[^/]+\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@package"],
	generateHeader: (ctx) => `/**
 * @file components/_schema/${ctx.fileName}
 * @package @devpulse/coldlight
 *
 * Component schema infrastructure — ARIA enforcement validation.
 */

`,
};

// =============================================================================
// COLDLIGHT — RECIPES
// =============================================================================

const recipeFile: FileSchemaRule = {
	name: "recipe-file",
	match: /^recipes\/(?:components|layouts)\/[^/]+\/[^/]+\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@layer", "@package"],
	generateHeader: (ctx) => {
		const recipeKind =
			ctx.localPath.match(/^recipes\/(?:components|layouts)\/([^/]+)\//)?.[1] ?? ctx.baseName;
		return `/**
 * @file ${ctx.localPath}
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe definition for ${recipeKind} — styling pattern applied via class prop.
 */

`;
	},
};

// =============================================================================
// COLDLIGHT — ACTIONS, UTILS, TOKENS, CONFIG
// =============================================================================

const actionFile: FileSchemaRule = {
	name: "action-file",
	match: /^actions\/use[A-Z][^/]*\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@package"],
	generateHeader: (ctx) => {
		const actionName = ctx.baseName.replace(/^use/, "");
		const camelName = actionName.charAt(0).toLowerCase() + actionName.slice(1);
		return `/**
 * @file actions/${ctx.fileName}
 * @package @devpulse/coldlight
 *
 * Svelte action: ${camelName} — use:${camelName} on DOM elements.
 */

`;
	},
};

const utilFile: FileSchemaRule = {
	name: "util-file",
	match: /^utils\/(?!index\.ts$)[^/]+\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@package"],
	generateHeader: (ctx) => `/**
 * @file utils/${ctx.fileName}
 * @package @devpulse/coldlight
 *
 * Utility: ${ctx.baseName}.
 */

`,
};

const tokenFile: FileSchemaRule = {
	name: "token-file",
	match: /^tokens\/(?!index\.ts$)[^/]+\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@layer"],
	generateHeader: (ctx) => `/**
 * @file tokens/${ctx.fileName}
 * @layer tokens
 * @package @devpulse/coldlight
 *
 * Design tokens — SD5 pipeline output. SSOT for all visual properties.
 */

`,
};

const tokenCss: FileSchemaRule = {
	name: "token-css",
	match: /^tokens\/[^/]+\.css$/,
	namespace: "@devpulse/coldlight",
	language: "css",
	requiredTags: ["@file", "@layer"],
	generateHeader: (ctx) => `/**
 * @file tokens/${ctx.fileName}
 * @layer tokens
 *
 * CSS custom properties — generated by SD5 token pipeline.
 * Do NOT edit manually. Regenerate with: pnpm tokens:build
 */

`,
};

const configFile: FileSchemaRule = {
	name: "config-file",
	match: /^config\/coldlight\/[^/]+\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@package"],
	generateHeader: (ctx) => `/**
 * @file config/coldlight/${ctx.fileName}
 * @package @devpulse/coldlight
 *
 * ColdLight configuration — ${ctx.baseName.replace(/\.cfg$/, "")}.
 * Config-driven: build tools and generators read from here.
 */

`,
};

const moleculeCss: FileSchemaRule = {
	name: "molecule-css",
	match: /^molecules\/[^/]+\.css$/,
	namespace: "@devpulse/coldlight",
	language: "css",
	requiredTags: ["@file", "@layer"],
	generateHeader: (ctx) => `/**
 * @file molecules/${ctx.fileName}
 * @layer molecules
 *
 * Visual effect layer: ${ctx.baseName}.
 * Composable CSS effect applied via ColdLight props.
 */

`,
};

// =============================================================================
// COLDLIGHT — BLUEPRINTS (same structure as recipes)
// =============================================================================

const blueprintFile: FileSchemaRule = {
	name: "blueprint-file",
	match: /^blueprints\/components\/[^/]+\/[^/]+\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@layer", "@package"],
	generateHeader: (ctx) => {
		const bpKind = ctx.localPath.match(/^blueprints\/components\/([^/]+)\//)?.[1] ?? ctx.baseName;
		return `/**
 * @file ${ctx.localPath}
 * @layer blueprints
 * @package @devpulse/coldlight
 *
 * Blueprint definition for ${bpKind}.
 */

`;
	},
};

const blueprintRootFile: FileSchemaRule = {
	name: "blueprint-root-file",
	match: /^blueprints\/[^/]+\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@layer", "@package"],
	generateHeader: (ctx) => `/**
 * @file ${ctx.localPath}
 * @layer blueprints
 * @package @devpulse/coldlight
 *
 * Blueprints layer: ${ctx.baseName}.
 */

`,
};

// =============================================================================
// COLDLIGHT — BLOCKS
// =============================================================================

const blockFile: FileSchemaRule = {
	name: "block-file",
	match: /^blocks\/[^/]+\/[^/]+\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@layer", "@package"],
	generateHeader: (ctx) => {
		const blockCategory = ctx.localPath.match(/^blocks\/([^/]+)\//)?.[1] ?? "blocks";
		return `/**
 * @file ${ctx.localPath}
 * @layer blocks
 * @package @devpulse/coldlight
 *
 * Block: ${blockCategory} — page-level composition.
 */

`;
	},
};

const blockSvelte: FileSchemaRule = {
	name: "block-svelte",
	match: /^blocks\/[^/]+\/[A-Z][^/]*\.svelte$/,
	namespace: "@devpulse/coldlight",
	language: "svelte",
	requiredTags: ["@component", "@file", "@layer", "@package"],
	generateHeader: (ctx) => {
		const blockCategory = ctx.localPath.match(/^blocks\/([^/]+)\//)?.[1] ?? "blocks";
		return `<!--
  @component ${ctx.baseName}
  @file ${ctx.localPath}
  @layer blocks
  @package @devpulse/coldlight

  Block: ${blockCategory}/${ctx.baseName} — page-level composition.
-->
`;
	},
};

// =============================================================================
// COLDLIGHT — PATTERNS
// =============================================================================

const patternFile: FileSchemaRule = {
	name: "pattern-file",
	match: /^patterns\/[^/]+\/[^/]+\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@package"],
	generateHeader: (ctx) => {
		const patternDomain = ctx.localPath.match(/^patterns\/([^/]+)\//)?.[1] ?? "patterns";
		return `/**
 * @file ${ctx.localPath}
 * @package @devpulse/coldlight
 *
 * Pattern: ${patternDomain} — reusable UI pattern composition.
 */

`;
	},
};

// =============================================================================
// COLDLIGHT — PLUGINS
// =============================================================================

const pluginTs: FileSchemaRule = {
	name: "plugin-ts",
	match: /^plugins\/[^/]+\/[^/]+\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@package"],
	generateHeader: (ctx) => {
		const pluginName = ctx.localPath.match(/^plugins\/([^/]+)\//)?.[1] ?? "plugin";
		return `/**
 * @file ${ctx.localPath}
 * @package @devpulse/coldlight
 *
 * Plugin: ${pluginName}.
 */

`;
	},
};

const pluginSvelte: FileSchemaRule = {
	name: "plugin-svelte",
	match: /^plugins\/[^/]+\/[A-Z][^/]*\.svelte$/,
	namespace: "@devpulse/coldlight",
	language: "svelte",
	requiredTags: ["@component", "@file", "@package"],
	generateHeader: (ctx) => {
		const pluginName = ctx.localPath.match(/^plugins\/([^/]+)\//)?.[1] ?? "plugin";
		return `<!--
  @component ${ctx.baseName}
  @file ${ctx.localPath}
  @package @devpulse/coldlight

  Plugin component: ${pluginName}/${ctx.baseName}.
-->
`;
	},
};

const pluginCss: FileSchemaRule = {
	name: "plugin-css",
	match: /^plugins\/[^/]+\/[^/]+\.css$/,
	namespace: "@devpulse/coldlight",
	language: "css",
	requiredTags: ["@file"],
	generateHeader: (ctx) => {
		const pluginName = ctx.localPath.match(/^plugins\/([^/]+)\//)?.[1] ?? "plugin";
		return `/**
 * @file ${ctx.localPath}
 *
 * Plugin styles: ${pluginName}.
 */

`;
	},
};

// =============================================================================
// COLDLIGHT — ROOT-LEVEL LAYER FILES (types.ts, utils.ts at layer root)
// =============================================================================

const primitiveRootFile: FileSchemaRule = {
	name: "primitive-root-file",
	match: /^primitives\/(?:types|index)\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@layer", "@package"],
	generateHeader: (ctx) => `/**
 * @file primitives/${ctx.fileName}
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Primitive layer: ${ctx.baseName} — shared across all primitives.
 */

`,
};

const componentRootFile: FileSchemaRule = {
	name: "component-root-file",
	match: /^components\/(?:types|schema|index)\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@layer", "@package"],
	generateHeader: (ctx) => `/**
 * @file components/${ctx.fileName}
 * @layer components
 * @package @devpulse/coldlight
 *
 * Component layer: ${ctx.baseName} — shared across all components.
 */

`,
};

const recipeRootFile: FileSchemaRule = {
	name: "recipe-root-file",
	match: /^recipes\/(?:types|utils|index)\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@layer", "@package"],
	generateHeader: (ctx) => `/**
 * @file recipes/${ctx.fileName}
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe layer: ${ctx.baseName} — shared across all recipes.
 */

`,
};

// =============================================================================
// COLDLIGHT — ROOT CSS
// =============================================================================

const coldlightRootCss: FileSchemaRule = {
	name: "coldlight-root-css",
	match: /^[^/]+\.css$/,
	namespace: "@devpulse/coldlight",
	language: "css",
	requiredTags: ["@file"],
	generateHeader: (ctx) => `/**
 * @file ${ctx.localPath}
 *
 * ColdLight design system — ${ctx.baseName} stylesheet.
 */

`,
};

// =============================================================================
// COLDLIGHT — API ACTIONS
// =============================================================================

const apiActionFile: FileSchemaRule = {
	name: "api-action-file",
	match: /^api\/actions\/[^/]+\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@package"],
	generateHeader: (ctx) => `/**
 * @file api/actions/${ctx.fileName}
 * @package @devpulse/coldlight
 *
 * API action: ${ctx.baseName} — ARIA/accessibility action helper.
 */

`,
};

// =============================================================================
// COLDLIGHT — CATCH-ALL INDEX AND ROOT FILES
// =============================================================================

const coldlightIndex: FileSchemaRule = {
	name: "coldlight-index",
	match:
		/^(?:actions|utils|tokens|recipes|blueprints|blocks|patterns|plugins|components|primitives|api(?:\/actions)?)\/index\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@package"],
	generateHeader: (ctx) => {
		const layerName = ctx.localPath.split("/")[0];
		return `/**
 * @file ${ctx.localPath}
 * @package @devpulse/coldlight
 *
 * Public barrel for the ${layerName} layer.
 */

`;
	},
};

const coldlightRootFile: FileSchemaRule = {
	name: "coldlight-root-file",
	match: /^[^/]+\.ts$/,
	namespace: "@devpulse/coldlight",
	language: "typescript",
	requiredTags: ["@file", "@package"],
	generateHeader: (ctx) => `/**
 * @file ${ctx.localPath}
 * @package @devpulse/coldlight
 *
 * ColdLight design system — ${ctx.baseName}.
 */

`,
};

// =============================================================================
// SYSTEM LAYER (sys/)
// =============================================================================

const sysFile: FileSchemaRule = {
	name: "sys-file",
	match: /\.ts$/,
	namespace: "@devpulse/sys",
	language: "typescript",
	requiredTags: ["@file", "@module", "@layer"],
	generateHeader: (ctx) => `/**
 * @file sys/${ctx.localPath}
 * @module @devpulse/sys/${ctx.localPath.replace(/\.ts$/, "")}
 * @layer ${ctx.layer}
 *
 * System layer: ${ctx.baseName}.
 */

`,
};

const sysRuneFile: FileSchemaRule = {
	name: "sys-rune-file",
	match: /\.svelte\.ts$/,
	namespace: "@devpulse/sys",
	language: "typescript",
	requiredTags: ["@file", "@module", "@layer"],
	generateHeader: (ctx) => `/**
 * @file sys/${ctx.localPath}
 * @module @devpulse/sys/${ctx.localPath.replace(/\.svelte\.ts$/, "")}
 * @layer state
 *
 * Svelte 5 rune state: ${ctx.baseName}. Uses $state/$derived, zero stores.
 */

`,
};

// =============================================================================
// DOMAINS
// =============================================================================

const domainSvelte: FileSchemaRule = {
	name: "domain-svelte",
	match: /\.svelte$/,
	namespace: null, // matches @devpulse/domains/*
	language: "svelte",
	requiredTags: ["@component", "@file", "@module"],
	generateHeader: (ctx) => {
		if (!ctx.namespace.startsWith("@devpulse/domains/")) return "";
		return `<!--
  @component ${ctx.baseName}
  @file domains/${ctx.localPath}
  @module ${ctx.namespace}

  ${ctx.layer === "pages" ? "Page" : "Component"}: ${ctx.baseName}.
-->
`;
	},
};

const domainTs: FileSchemaRule = {
	name: "domain-ts",
	match: /\.ts$/,
	namespace: null,
	language: "typescript",
	requiredTags: ["@file", "@module"],
	generateHeader: (ctx) => {
		if (!ctx.namespace.startsWith("@devpulse/domains/")) return "";
		return `/**
 * @file domains/${ctx.localPath}
 * @module ${ctx.namespace}
 *
 * Domain: ${ctx.domain} — ${ctx.baseName}.
 */

`;
	},
};

// =============================================================================
// ROUTES
// =============================================================================

const routeSvelte: FileSchemaRule = {
	name: "route-svelte",
	match: /\+(?:page|layout|error)\.svelte$/,
	namespace: "@devpulse/routes",
	language: "svelte",
	requiredTags: ["@component", "@file"],
	generateHeader: (ctx) => {
		const routeType = ctx.fileName.replace(".svelte", "").replace("+", "");
		return `<!--
  @component ${routeType}
  @file routes/${ctx.localPath}

  SvelteKit ${routeType}${ctx.routeGroup ? ` — route group (${ctx.routeGroup})` : ""}.
  Thin wrapper — delegates to domain components.
-->
`;
	},
};

const routeTs: FileSchemaRule = {
	name: "route-ts",
	match: /\+(?:page|layout|server)(?:\.server)?\.ts$/,
	namespace: "@devpulse/routes",
	language: "typescript",
	requiredTags: ["@file"],
	generateHeader: (ctx) => `/**
 * @file routes/${ctx.localPath}
 *
 * SvelteKit ${ctx.baseName.replace("+", "")} — load/server function.
 */

`,
};

// =============================================================================
// RUST — TAURI
// =============================================================================

const tauriRust: FileSchemaRule = {
	name: "tauri-rust",
	match: /\.rs$/,
	namespace: "@devpulse/tauri",
	language: "rust",
	requiredTags: ["@file", "@layer"],
	generateHeader: (ctx) => `//! @file ${ctx.localPath}
//! @layer ${ctx.layer}
//!
//! Tauri ${ctx.layer}: ${ctx.baseName}.

`,
};

// =============================================================================
// RUST — ENGINE
// =============================================================================

const engineRust: FileSchemaRule = {
	name: "engine-rust",
	match: /\.rs$/,
	namespace: "@devpulse/engine",
	language: "rust",
	requiredTags: ["@file", "@module"],
	generateHeader: (ctx) => `//! @file ${ctx.localPath}
//! @module @devpulse/engine
//!
//! Signal engine: ${ctx.baseName}.

`,
};

// =============================================================================
// RUST — MAESTRO
// =============================================================================

const maestroRust: FileSchemaRule = {
	name: "maestro-rust",
	match: /\.rs$/,
	namespace: "@devpulse/maestro",
	language: "rust",
	requiredTags: ["@file", "@module"],
	generateHeader: (ctx) => `//! @file ${ctx.localPath}
//! @module @devpulse/maestro
//!
//! AI orchestrator: ${ctx.baseName}.

`,
};

// =============================================================================
// SCRIPTS
// =============================================================================

const scriptFile: FileSchemaRule = {
	name: "script-file",
	match: /\.ts$/,
	namespace: "@devpulse/scripts",
	language: "typescript",
	requiredTags: ["@file", "@module"],
	generateHeader: (ctx) => `/**
 * @file ${ctx.localPath}
 * @module @devpulse/scripts/${ctx.localPath.replace(/\.ts$/, "")}
 *
 * Build/doc script: ${ctx.baseName}.
 */

`,
};

// =============================================================================
// REGISTRY — ordered by specificity (most specific first)
// =============================================================================

/**
 * All file schema rules, ordered by specificity.
 * The FIRST matching rule wins. More specific patterns MUST come before
 * catch-all patterns within the same namespace.
 */
export const FILE_SCHEMA: readonly FileSchemaRule[] = [
	// ── ColdLight Primitives ──────────────────────────────────────────────────
	primitiveSchema,
	primitiveTypes,
	primitiveContract,
	primitiveTest,
	primitiveSvelte,
	primitiveIndex,
	primitiveRootFile,

	// ── ColdLight Adapters: MeltUI (_internal) ───────────────────────────────
	internalTransportTypes,
	internalTransportFactory,
	internalTransportIndex,
	internalFactory,
	internalIndex,

	// ── ColdLight Adapters: ColdLight (_internal) ────────────────────────────
	coldlightAdapterSvelteTs,
	coldlightAdapterTransportTypes,
	coldlightAdapterTransportFactory,
	coldlightAdapterTransportIndex,
	coldlightAdapterIndex,
	coldlightSharedTransport,

	// ── ColdLight Components ──────────────────────────────────────────────────
	componentSchema,
	componentSvelte,
	componentIndex,
	componentTs,
	componentRootFile,

	// ── ColdLight Recipes ─────────────────────────────────────────────────────
	recipeFile,
	recipeRootFile,

	// ── ColdLight Blueprints ──────────────────────────────────────────────────
	blueprintFile,
	blueprintRootFile,

	// ── ColdLight Blocks ──────────────────────────────────────────────────────
	blockSvelte,
	blockFile,

	// ── ColdLight Patterns ────────────────────────────────────────────────────
	patternFile,

	// ── ColdLight Plugins ─────────────────────────────────────────────────────
	pluginSvelte,
	pluginTs,
	pluginCss,

	// ── ColdLight Actions / Utils / Tokens / Config ───────────────────────────
	actionFile,
	apiActionFile,
	utilFile,
	tokenFile,
	tokenCss,
	configFile,
	moleculeCss,

	// ── ColdLight Barrels + Root ──────────────────────────────────────────────
	coldlightIndex,
	coldlightRootCss,
	coldlightRootFile,

	// ── System Layer ──────────────────────────────────────────────────────────
	sysRuneFile,
	sysFile,

	// ── Domains ───────────────────────────────────────────────────────────────
	domainSvelte,
	domainTs,

	// ── Routes ────────────────────────────────────────────────────────────────
	routeSvelte,
	routeTs,

	// ── Rust ──────────────────────────────────────────────────────────────────
	tauriRust,
	engineRust,
	maestroRust,

	// ── Scripts ───────────────────────────────────────────────────────────────
	scriptFile,
];

// =============================================================================
// MATCHING ENGINE
// =============================================================================

/**
 * Find the first matching schema rule for a FileContext.
 * Returns null if no rule matches (file type not covered by schema).
 */
export function matchRule(ctx: FileContext): FileSchemaRule | null {
	for (const rule of FILE_SCHEMA) {
		// Namespace filter
		if (rule.namespace !== null && rule.namespace !== ctx.namespace) {
			// Special case: domain rules use null namespace but check inside generator
			continue;
		}

		// For null-namespace rules (domains), check if they apply
		if (rule.namespace === null) {
			// Domain rules only match domain namespaces
			if (rule.name.startsWith("domain-") && !ctx.namespace.startsWith("@devpulse/domains/")) {
				continue;
			}
		}

		// Language filter
		if (rule.language !== null && rule.language !== ctx.language) continue;

		// Pattern match against localPath
		if (rule.match.test(ctx.localPath)) {
			return rule;
		}
	}
	return null;
}

/**
 * Generate the correct header for a file, or null if no rule matches.
 */
export function generateHeader(ctx: FileContext): string | null {
	const rule = matchRule(ctx);
	if (!rule) return null;
	const header = rule.generateHeader(ctx);
	return header || null;
}
