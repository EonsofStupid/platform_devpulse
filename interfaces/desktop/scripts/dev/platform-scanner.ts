/**
 * @file scripts/dev/platform-scanner.ts
 * @module @devpulse/scripts/dev/platform-scanner
 * @package @devpulse/scripts
 *
 * Platform-wide filesystem scanner for the entire DevPulse platform.
 * Scans every namespace, categorizes files using file-schema rules,
 * checks header compliance, loads primitive contracts, checks adapter parity,
 * and produces a full DevPulseManifest.
 *
 * Uses file-context.ts for path resolution and file-schema.ts for categorization.
 * Pure filesystem scanner — no dynamic imports, no compilation needed.
 *
 * Usage:
 *   pnpm platform:scan             — Scan all, print report
 *   pnpm platform:scan --json      — Output manifest JSON
 *   pnpm platform:scan --write     — Write devpulse.manifest.json
 *
 * @since 1.0.0
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOTS, resolveFileContext } from "./file-context.js";
import { matchRule } from "./file-schema.js";
import type {
	AdapterKindSummary,
	BlockSummary,
	BlueprintSummary,
	BuilderKindSummary,
	ComponentKindSummary,
	DevPulseManifest,
	FileSummary,
	HeaderComplianceReport,
	NamespaceSummary,
	PatternSummary,
	PlatformScanResult,
	PlatformStats,
	PluginSummary,
	PrimitiveCategory,
	PrimitiveSummary,
	RecipeSummary,
	ScanError,
} from "./platform-scanner.types.js";

// =============================================================================
// CONSTANTS
// =============================================================================

const SUPPORTED_EXTENSIONS = new Set([".ts", ".js", ".svelte", ".css", ".rs"]);

const SKIP_PATTERNS = [
	/node_modules/,
	/\.git[/\\]/,
	/\.cowlevel/,
	/\.generated/,
	/\.svelte-kit/,
	/dist[/\\]/,
	/build[/\\]/,
	/coverage[/\\]/,
	/target[/\\]/,
	/\.d\.ts$/,
	/\.gen\.ts$/,
];

/** Header detection patterns (same as inject-headers.ts) */
const HEADER_PATTERNS: Record<string, RegExp> = {
	typescript: /^\/\*\*[\s\S]*?\*\//,
	svelte: /^<!--[\s\S]*?-->/,
	rust: /^(?:\/\/!.*(?:\n|$))+/,
	css: /^\/\*\*[\s\S]*?\*\//,
};

// =============================================================================
// PRIMITIVE CATEGORY CLASSIFICATION
// =============================================================================

/** Map of kind → category, from the master inventory */
const CATEGORY_MAP: Record<string, PrimitiveCategory> = {
	// Compound / high-interaction primitives (ColdLight-owned headless)
	accordion: "compound",
	avatar: "compound",
	collapsible: "compound",
	combobox: "compound",
	dialog: "compound",
	"file-upload": "compound",
	"pin-input": "compound",
	popover: "compound",
	progress: "compound",
	"radio-group": "compound",
	select: "compound",
	slider: "compound",
	tabs: "compound",
	toaster: "compound",
	toggle: "compound",
	tooltip: "compound",
	tree: "compound",

	// Interactive (22)
	button: "interactive",
	checkbox: "interactive",
	switch: "interactive",
	label: "interactive",
	separator: "interactive",
	"alert-dialog": "interactive",
	"dropdown-menu": "interactive",
	"context-menu": "interactive",
	menubar: "interactive",
	"toggle-group": "interactive",
	toolbar: "interactive",
	"tags-input": "interactive",
	"link-preview": "interactive",
	"scroll-area": "interactive",
	pagination: "interactive",
	"table-of-contents": "interactive",
	calendar: "interactive",
	"date-field": "interactive",
	"date-picker": "interactive",
	"date-range-field": "interactive",
	"date-range-picker": "interactive",
	"range-calendar": "interactive",

	// Layout (11)
	box: "layout",
	flex: "layout",
	stack: "layout",
	hstack: "layout",
	grid: "layout",
	container: "layout",
	center: "layout",
	spacer: "layout",
	divider: "layout",
	"aspect-ratio": "layout",
	sticky: "layout",

	// Typography (5)
	text: "typography",
	heading: "typography",
	code: "typography",
	kbd: "typography",
	prose: "typography",

	// Data Display (9)
	badge: "data-display",
	card: "data-display",
	table: "data-display",
	"data-table": "data-display",
	skeleton: "data-display",
	"empty-state": "data-display",
	list: "data-display",
	"description-list": "data-display",
	stat: "data-display",

	// Feedback (6)
	alert: "feedback",
	spinner: "feedback",
	banner: "feedback",
	callout: "feedback",
	"inline-message": "feedback",
	"loading-overlay": "feedback",

	// Form (8)
	input: "form",
	textarea: "form",
	"form-field": "form",
	form: "form",
	"input-group": "form",
	"number-input": "form",
	"search-input": "form",
	"color-input": "form",

	// Navigation (6)
	breadcrumb: "navigation",
	nav: "navigation",
	"nav-item": "navigation",
	sidebar: "navigation",
	steps: "navigation",
	"skip-link": "navigation",

	// Overlay (3+)
	sheet: "overlay",
	"command-palette": "overlay",
	"notification-center": "overlay",
	command: "overlay",

	// Uncategorized primitives (in filesystem but not in inventory)
	"color-picker": "form",
	"navigation-menu": "navigation",
	"visually-hidden": "interactive",
};

// =============================================================================
// FILESYSTEM HELPERS
// =============================================================================

function toForwardSlash(p: string): string {
	return p.replace(/\\/g, "/");
}

function toPascalCase(s: string): string {
	return s
		.split(/[-_]/)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join("");
}

function shouldSkip(filePath: string): boolean {
	return SKIP_PATTERNS.some((p) => p.test(filePath));
}

function walkDir(dir: string): string[] {
	const files: string[] = [];
	try {
		const entries = fs.readdirSync(dir, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "target") {
				continue;
			}
			if (entry.isDirectory()) {
				files.push(...walkDir(fullPath));
			} else {
				const ext = path.extname(entry.name);
				if (SUPPORTED_EXTENSIONS.has(ext) && !shouldSkip(fullPath)) {
					files.push(fullPath);
				}
			}
		}
	} catch {
		// Directory doesn't exist or not readable
	}
	return files;
}

function listSubfolders(dir: string): string[] {
	try {
		return fs
			.readdirSync(dir, { withFileTypes: true })
			.filter((e) => e.isDirectory() && !e.name.startsWith("."))
			.map((e) => e.name);
	} catch {
		return [];
	}
}

function listFiles(dir: string): string[] {
	try {
		return fs
			.readdirSync(dir, { withFileTypes: true })
			.filter((e) => e.isFile())
			.map((e) => e.name);
	} catch {
		return [];
	}
}

function fileExists(filePath: string): boolean {
	return fs.existsSync(filePath);
}

// =============================================================================
// HEADER COMPLIANCE CHECK
// =============================================================================

function checkHeaderCompliance(filePath: string): {
	status: "ok" | "missing" | "wrong";
	missingTags: string[];
} {
	try {
		const ctx = resolveFileContext(filePath);
		const rule = matchRule(ctx);

		if (!rule) {
			return { status: "ok", missingTags: [] }; // No rule = no requirements
		}

		const raw = fs.readFileSync(filePath, "utf-8");
		const pattern = HEADER_PATTERNS[ctx.language];
		if (!pattern) return { status: "ok", missingTags: [] };

		// Strip BOM
		let body = raw;
		if (body.startsWith("\uFEFF")) body = body.slice(1);
		// Strip shebang
		if (body.startsWith("#!")) {
			const nl = body.indexOf("\n");
			if (nl !== -1) body = body.slice(nl + 1);
		}

		const trimmed = body.trimStart();
		const match = trimmed.match(pattern);

		if (!match) {
			return { status: "missing", missingTags: rule.requiredTags };
		}

		const header = match[0];
		const missing = rule.requiredTags.filter((tag) => !header.includes(tag));

		if (missing.length > 0) {
			return { status: "wrong", missingTags: missing };
		}

		return { status: "ok", missingTags: [] };
	} catch {
		return { status: "missing", missingTags: [] };
	}
}

// =============================================================================
// CONTRACT LOADING (text-based, no dynamic import)
// =============================================================================

function readAriaStateProvider(contractPath: string): "coldlight" | null {
	try {
		const content = fs.readFileSync(contractPath, "utf-8");
		const match = content.match(/ariaStateProvider:\s*["'](coldlight)["']/);
		return match ? "coldlight" : null;
	} catch {
		return null;
	}
}

// =============================================================================
// COLDLIGHT — PRIMITIVE SCANNING
// =============================================================================

function scanPrimitives(): PrimitiveSummary[] {
	const primitivesRoot = path.join(ROOTS.design, "primitives");
	const coldlightAdapterRoot = path.join(ROOTS.design, "api/adapters/coldlight/_internal");
	const buildersRoot = path.join(ROOTS.design, "builders");

	const kinds = listSubfolders(primitivesRoot).filter((k) => !k.startsWith("_"));
	const results: PrimitiveSummary[] = [];

	for (const kind of kinds) {
		const kindDir = path.join(primitivesRoot, kind);
		const files = listFiles(kindDir);

		const hasContract = files.includes("contract.ts");
		const hasTypes = files.includes("types.ts");
		const hasIndex = files.includes("index.ts");
		const svelteFiles = files.filter((f) => f.endsWith(".svelte"));
		const hasSvelte = svelteFiles.length > 0;
		const hasTest = files.some((f) => f.endsWith(".test.ts"));

		const hasColdlightAdapter = fileExists(path.join(coldlightAdapterRoot, kind));
		const hasBuilder = fileExists(path.join(buildersRoot, kind));

		// Read ariaStateProvider from contract
		const contractPath = path.join(kindDir, "contract.ts");
		const ariaStateProvider = hasContract ? readAriaStateProvider(contractPath) : null;

		const hasParity = ariaStateProvider === "coldlight" && hasContract && hasSvelte;

		const category = CATEGORY_MAP[kind] ?? "interactive";

		results.push({
			kind,
			kindPascal: toPascalCase(kind),
			ariaStateProvider,
			category,
			hasContract,
			hasTypes,
			hasIndex,
			hasSvelte,
			hasTest,
			hasColdlightAdapter,
			hasBuilder,
			hasParity,
			svelteFiles,
		});
	}

	return results.sort((a, b) => a.kind.localeCompare(b.kind));
}

// =============================================================================
// COLDLIGHT — ADAPTER SCANNING
// =============================================================================

function scanAdapterKinds(adapterRoot: string): AdapterKindSummary[] {
	const kinds = listSubfolders(adapterRoot).filter((k) => !k.startsWith("_"));
	const results: AdapterKindSummary[] = [];

	for (const kind of kinds) {
		const kindDir = path.join(adapterRoot, kind);
		const files = listFiles(kindDir);
		const transportDir = path.join(kindDir, "_transport");
		const transportFiles = listFiles(transportDir);

		const hasFactory = files.includes("factory.ts") || files.some((f) => f.endsWith(".svelte.ts"));
		const hasIndex = files.includes("index.ts");
		const hasTransport = fileExists(transportDir);
		const hasTransportTypes = transportFiles.includes("types.ts");
		const hasTransportFactory = transportFiles.includes("factory.ts");
		const hasTransportIndex = transportFiles.includes("index.ts");

		const isComplete =
			hasFactory &&
			hasIndex &&
			hasTransport &&
			hasTransportTypes &&
			hasTransportFactory &&
			hasTransportIndex;

		results.push({
			kind,
			hasFactory,
			hasIndex,
			hasTransport,
			hasTransportTypes,
			hasTransportFactory,
			hasTransportIndex,
			isComplete,
		});
	}

	return results.sort((a, b) => a.kind.localeCompare(b.kind));
}

// =============================================================================
// COLDLIGHT — BUILDER SCANNING
// =============================================================================

function scanBuilders(): BuilderKindSummary[] {
	const buildersRoot = path.join(ROOTS.design, "builders");
	const kinds = listSubfolders(buildersRoot).filter((k) => !k.startsWith("_"));
	const results: BuilderKindSummary[] = [];

	for (const kind of kinds) {
		const kindDir = path.join(buildersRoot, kind);
		const files = listFiles(kindDir);

		const hasFactory = files.includes("factory.ts");
		const hasTypes = files.includes("types.ts");
		const hasIndex = files.includes("index.ts");
		const hasTest = files.some((f) => f.endsWith(".test.ts"));
		const isComplete = hasFactory && hasTypes && hasIndex;

		results.push({ kind, hasFactory, hasTypes, hasIndex, hasTest, isComplete });
	}

	return results.sort((a, b) => a.kind.localeCompare(b.kind));
}

// =============================================================================
// COLDLIGHT — COMPONENT SCANNING
// =============================================================================

function scanComponents(): ComponentKindSummary[] {
	const componentsRoot = path.join(ROOTS.design, "components");
	const kinds = listSubfolders(componentsRoot).filter((k) => !k.startsWith("_"));
	const results: ComponentKindSummary[] = [];

	for (const kind of kinds) {
		const kindDir = path.join(componentsRoot, kind);
		const files = listFiles(kindDir);

		const svelteFiles = files.filter((f) => f.endsWith(".svelte"));

		results.push({
			kind,
			hasSvelte: svelteFiles.length > 0,
			hasTypes: files.includes("types.ts"),
			hasContract: files.includes("contract.ts"),
			hasIndex: files.includes("index.ts"),
			hasRecipe: files.includes("recipe.ts"),
			svelteFiles,
		});
	}

	return results.sort((a, b) => a.kind.localeCompare(b.kind));
}

// =============================================================================
// COLDLIGHT — RECIPE / BLUEPRINT SCANNING
// =============================================================================

function scanRecipes(): RecipeSummary[] {
	const recipesRoot = path.join(ROOTS.design, "recipes");
	const results: RecipeSummary[] = [];

	for (const group of ["components", "layouts"] as const) {
		const groupDir = path.join(recipesRoot, group);
		const kinds = listSubfolders(groupDir);

		for (const kind of kinds) {
			const kindDir = path.join(groupDir, kind);
			const files = listFiles(kindDir);
			const variants = files.filter(
				(f) => f !== "index.ts" && f !== "types.ts" && f.endsWith(".ts"),
			);

			results.push({
				kind,
				group,
				variants,
				hasIndex: files.includes("index.ts"),
				hasTypes: files.includes("types.ts"),
			});
		}
	}

	return results;
}

function scanBlueprints(): BlueprintSummary[] {
	const bpRoot = path.join(ROOTS.design, "blueprints/components");
	const kinds = listSubfolders(bpRoot);
	const results: BlueprintSummary[] = [];

	for (const kind of kinds) {
		const kindDir = path.join(bpRoot, kind);
		const files = listFiles(kindDir);
		const variants = files.filter((f) => f !== "index.ts" && f !== "types.ts" && f.endsWith(".ts"));

		results.push({
			kind,
			variants,
			hasIndex: files.includes("index.ts"),
			hasTypes: files.includes("types.ts"),
		});
	}

	return results;
}

// =============================================================================
// COLDLIGHT — BLOCKS / PATTERNS / PLUGINS SCANNING
// =============================================================================

function scanBlocks(): BlockSummary[] {
	const blocksRoot = path.join(ROOTS.design, "blocks");
	const categories = listSubfolders(blocksRoot);
	const results: BlockSummary[] = [];

	for (const cat of categories) {
		const catDir = path.join(blocksRoot, cat);
		const files = listFiles(catDir).filter((f) => SUPPORTED_EXTENSIONS.has(path.extname(f)));

		results.push({ category: cat, files });
	}

	return results;
}

function scanPatterns(): PatternSummary[] {
	const patternsRoot = path.join(ROOTS.design, "patterns");
	const categories = listSubfolders(patternsRoot);
	const results: PatternSummary[] = [];

	for (const cat of categories) {
		const catDir = path.join(patternsRoot, cat);
		const files = listFiles(catDir).filter((f) => SUPPORTED_EXTENSIONS.has(path.extname(f)));

		results.push({ category: cat, files });
	}

	return results;
}

function scanPlugins(): PluginSummary[] {
	const pluginsRoot = path.join(ROOTS.design, "plugins");
	const names = listSubfolders(pluginsRoot);
	const results: PluginSummary[] = [];

	for (const name of names) {
		const pluginDir = path.join(pluginsRoot, name);
		const files = listFiles(pluginDir).filter((f) => SUPPORTED_EXTENSIONS.has(path.extname(f)));

		results.push({ name, files });
	}

	return results;
}

// =============================================================================
// COLDLIGHT — SIMPLE FILE LISTS (actions, utils, tokens, config, molecules)
// =============================================================================

function scanFileList(dir: string): FileSummary[] {
	const files = walkDir(dir);
	const results: FileSummary[] = [];

	for (const file of files) {
		const { status, missingTags } = checkHeaderCompliance(file);
		const ctx = resolveFileContext(file);
		const rule = matchRule(ctx);

		results.push({
			localPath: toForwardSlash(path.relative(dir, file)),
			rule: rule?.name ?? null,
			headerStatus: status,
			missingTags,
		});
	}

	return results.sort((a, b) => a.localPath.localeCompare(b.localPath));
}

// =============================================================================
// NAMESPACE SCANNING (sys, domains, routes, tauri, engine, scripts)
// =============================================================================

function scanNamespace(rootDir: string): NamespaceSummary {
	if (!fs.existsSync(rootDir)) {
		return { fileCount: 0, files: [] };
	}

	const files = walkDir(rootDir);
	const summaries: FileSummary[] = [];

	for (const file of files) {
		const { status, missingTags } = checkHeaderCompliance(file);
		const ctx = resolveFileContext(file);
		const rule = matchRule(ctx);

		summaries.push({
			localPath: toForwardSlash(path.relative(rootDir, file)),
			rule: rule?.name ?? null,
			headerStatus: status,
			missingTags,
		});
	}

	return {
		fileCount: summaries.length,
		files: summaries.sort((a, b) => a.localPath.localeCompare(b.localPath)),
	};
}

function scanDomains(): Record<string, NamespaceSummary> {
	const domainsRoot = ROOTS.domains;
	if (!fs.existsSync(domainsRoot)) {
		return {};
	}

	const result: Record<string, NamespaceSummary> = {};
	const domainNames = listSubfolders(domainsRoot);

	for (const domain of domainNames) {
		const domainDir = path.join(domainsRoot, domain);
		result[domain] = scanNamespace(domainDir);
	}

	return result;
}

// =============================================================================
// HEADER COMPLIANCE AGGREGATION
// =============================================================================

function aggregateHeaderCompliance(): HeaderComplianceReport {
	// Scan ALL platform directories
	const targetDirs = [
		ROOTS.design,
		ROOTS.sys,
		ROOTS.domains,
		ROOTS.routes,
		path.join(ROOTS.tauri, "src"),
		path.join(ROOTS.engine, "src"),
		ROOTS.scripts,
		ROOTS.desktopScripts,
	].filter((d) => fs.existsSync(d));

	let allFiles: string[] = [];
	for (const dir of targetDirs) {
		allFiles = allFiles.concat(walkDir(dir));
	}
	allFiles = Array.from(new Set(allFiles.map((f) => path.resolve(f))));

	let ok = 0;
	let missing = 0;
	let wrong = 0;
	let skipped = 0;
	let errors = 0;

	for (const file of allFiles) {
		try {
			const ctx = resolveFileContext(file);
			const rule = matchRule(ctx);

			if (!rule) {
				skipped++;
				continue;
			}

			const { status } = checkHeaderCompliance(file);
			if (status === "ok") ok++;
			else if (status === "missing") missing++;
			else if (status === "wrong") wrong++;
		} catch {
			errors++;
		}
	}

	return {
		totalFiles: allFiles.length,
		ok,
		missing,
		wrong,
		skipped,
		errors,
	};
}

// =============================================================================
// STATISTICS COMPUTATION
// =============================================================================

function computeStats(
	manifest: Omit<DevPulseManifest, "stats" | "headerCompliance">,
): PlatformStats {
	// File counts by namespace
	const byNamespace: Record<string, number> = {
		"@devpulse/coldlight": 0,
		"@devpulse/sys": manifest.sys.fileCount,
		"@devpulse/routes": manifest.routes.fileCount,
		"@devpulse/tauri": manifest.tauri.fileCount,
		"@devpulse/engine": manifest.engine.fileCount,
		"@devpulse/scripts": manifest.scripts.fileCount,
	};

	for (const [, ns] of Object.entries(manifest.domains)) {
		byNamespace["@devpulse/domains"] = (byNamespace["@devpulse/domains"] ?? 0) + ns.fileCount;
	}

	// Count ColdLight files
	const coldlightFileCount =
		manifest.coldlight.actions.length +
		manifest.coldlight.utils.length +
		manifest.coldlight.tokens.length +
		manifest.coldlight.config.length +
		manifest.coldlight.molecules.length;

	byNamespace["@devpulse/coldlight"] = coldlightFileCount;

	// ColdLight-specific stats
	const prims = manifest.coldlight.primitives;

	const coldlightStats = {
		totalPrimitives: prims.length,
		primitivesWithSvelte: prims.filter((p) => p.hasSvelte).length,
		primitivesWithContract: prims.filter((p) => p.hasContract).length,
		primitivesWithParity: prims.filter((p) => p.hasParity).length,
		coldlightAdapters: manifest.coldlight.adapters.coldlight.length,
		builders: manifest.coldlight.builders.length,
		components: manifest.coldlight.components.length,
		actions: manifest.coldlight.actions.length,
		utils: manifest.coldlight.utils.length,
		recipes: manifest.coldlight.recipes.length,
		blueprints: manifest.coldlight.blueprints.length,
		blocks: manifest.coldlight.blocks.length,
		patterns: manifest.coldlight.patterns.length,
		plugins: manifest.coldlight.plugins.length,
		molecules: manifest.coldlight.molecules.length,
	};

	// File counts by layer (approximation from categories)
	const byLayer: Record<string, number> = {
		primitives: prims.length,
		adapters: manifest.coldlight.adapters.coldlight.length,
		builders: manifest.coldlight.builders.length,
		components: manifest.coldlight.components.length,
		recipes: manifest.coldlight.recipes.length,
		blueprints: manifest.coldlight.blueprints.length,
		blocks: manifest.coldlight.blocks.length,
		patterns: manifest.coldlight.patterns.length,
		plugins: manifest.coldlight.plugins.length,
		actions: manifest.coldlight.actions.length,
		utils: manifest.coldlight.utils.length,
		tokens: manifest.coldlight.tokens.length,
		config: manifest.coldlight.config.length,
		molecules: manifest.coldlight.molecules.length,
	};

	return {
		byNamespace,
		byLayer,
		coldlight: coldlightStats,
	};
}

// =============================================================================
// MAIN SCANNER
// =============================================================================

export function scanPlatform(): PlatformScanResult {
	const errors: ScanError[] = [];

	// ── ColdLight ────────────────────────────────────────────────────────────
	const primitives = scanPrimitives();
	const coldlightAdapters = scanAdapterKinds(
		path.join(ROOTS.design, "api/adapters/coldlight/_internal"),
	);
	const builders = scanBuilders();
	const components = scanComponents();
	const recipes = scanRecipes();
	const blueprints = scanBlueprints();
	const blocks = scanBlocks();
	const patterns = scanPatterns();
	const plugins = scanPlugins();
	const actions = scanFileList(path.join(ROOTS.design, "actions"));
	const utils = scanFileList(path.join(ROOTS.design, "utils"));
	const tokens = scanFileList(path.join(ROOTS.design, "tokens"));
	const config = scanFileList(path.join(ROOTS.design, "config/coldlight"));
	const molecules = scanFileList(path.join(ROOTS.design, "molecules"));

	// ── Other Namespaces ─────────────────────────────────────────────────────
	const sys = scanNamespace(ROOTS.sys);
	const domains = scanDomains();
	const routes = scanNamespace(ROOTS.routes);
	const tauri = scanNamespace(path.join(ROOTS.tauri, "src"));
	const engine = scanNamespace(path.join(ROOTS.engine, "src"));
	// No clyffy namespace — the AI layer left this repo with the kernel cut.
	const scripts = scanNamespace(ROOTS.scripts);

	// ── Header Compliance ────────────────────────────────────────────────────
	const headerCompliance = aggregateHeaderCompliance();

	// ── Build manifest (without stats first) ─────────────────────────────────
	const partialManifest = {
		version: "0.1.0",
		generatedAt: new Date().toISOString(),
		coldlight: {
			primitives,
			adapters: { coldlight: coldlightAdapters },
			builders,
			components,
			recipes,
			blueprints,
			blocks,
			patterns,
			plugins,
			actions,
			utils,
			tokens,
			config,
			molecules,
		},
		sys,
		domains,
		routes,
		tauri,
		engine,
		scripts,
	};

	const stats = computeStats(partialManifest);

	const manifest: DevPulseManifest = {
		...partialManifest,
		stats,
		headerCompliance,
	};

	return { manifest, errors };
}

// =============================================================================
// REPORTING
// =============================================================================

function printReport(result: PlatformScanResult): void {
	const { manifest } = result;
	const cl = manifest.coldlight;
	const stats = manifest.stats;

	console.log("\n========================================");
	console.log("  DevPulse Platform Scanner Report");
	console.log("========================================\n");

	// ── ColdLight Primitives ─────────────────────────────────────────────────
	console.log("─── ColdLight Primitives ───────────────────────────────────\n");

	const categories: PrimitiveCategory[] = [
		"compound",
		"interactive",
		"layout",
		"typography",
		"data-display",
		"feedback",
		"form",
		"navigation",
		"overlay",
	];

	for (const cat of categories) {
		const prims = cl.primitives.filter((p) => p.category === cat);
		if (prims.length === 0) continue;

		const withSvelte = prims.filter((p) => p.hasSvelte).length;
		const withContract = prims.filter((p) => p.hasContract).length;
		const withParity = prims.filter((p) => p.hasParity).length;

		console.log(`  ${cat.toUpperCase()} (${prims.length})`);
		console.log(`    .svelte:  ${withSvelte}/${prims.length}`);
		console.log(`    contract: ${withContract}/${prims.length}`);
		console.log(`    parity:   ${withParity}/${prims.length}`);

		// List primitives missing .svelte
		const missingSvelte = prims.filter((p) => !p.hasSvelte);
		if (missingSvelte.length > 0 && missingSvelte.length <= 10) {
			console.log(`    missing .svelte: ${missingSvelte.map((p) => p.kind).join(", ")}`);
		}
		console.log();
	}

	// ── ColdLight Adapters ───────────────────────────────────────────────────
	console.log("─── ColdLight Adapters ─────────────────────────────────────\n");
	const clComplete = cl.adapters.coldlight.filter((a) => a.isComplete).length;
	console.log(`  ColdLight adapters:  ${clComplete}/${cl.adapters.coldlight.length} complete\n`);

	// ── ColdLight Builders ──────────────────────────────────────────────────
	console.log("─── ColdLight Builders ─────────────────────────────────────\n");
	const buildersComplete = cl.builders.filter((b) => b.isComplete).length;
	console.log(`  Builders:   ${buildersComplete}/${cl.builders.length} complete`);
	if (cl.builders.length > 0) {
		console.log(`  Kinds:      ${cl.builders.map((b) => b.kind).join(", ")}`);
	}
	console.log();

	// ── ColdLight Components ─────────────────────────────────────────────────
	console.log("─── ColdLight Components ───────────────────────────────────\n");
	const compWithSvelte = cl.components.filter((c) => c.hasSvelte).length;
	console.log(`  Kinds: ${cl.components.length}  (${compWithSvelte} with .svelte)\n`);

	// ── ColdLight Layers ─────────────────────────────────────────────────────
	console.log("─── ColdLight Layer Counts ─────────────────────────────────\n");
	console.log(`  Actions:    ${cl.actions.length}`);
	console.log(`  Utils:      ${cl.utils.length}`);
	console.log(`  Tokens:     ${cl.tokens.length}`);
	console.log(`  Config:     ${cl.config.length}`);
	console.log(`  Recipes:    ${cl.recipes.length}`);
	console.log(`  Blueprints: ${cl.blueprints.length}`);
	console.log(`  Blocks:     ${cl.blocks.length}`);
	console.log(`  Patterns:   ${cl.patterns.length}`);
	console.log(`  Plugins:    ${cl.plugins.length}`);
	console.log(`  Molecules:  ${cl.molecules.length}\n`);

	// ── Other Namespaces ─────────────────────────────────────────────────────
	console.log("─── Other Namespaces ───────────────────────────────────────\n");
	console.log(`  sys:     ${manifest.sys.fileCount} files`);
	for (const [domain, ns] of Object.entries(manifest.domains)) {
		console.log(`  domains/${domain}: ${ns.fileCount} files`);
	}
	console.log(`  routes:  ${manifest.routes.fileCount} files`);
	console.log(`  tauri:   ${manifest.tauri.fileCount} files`);
	console.log(`  engine:  ${manifest.engine.fileCount} files`);
	console.log(`  scripts: ${manifest.scripts.fileCount} files\n`);

	// ── Header Compliance ────────────────────────────────────────────────────
	const hc = manifest.headerCompliance;
	console.log("─── Header Compliance ──────────────────────────────────────\n");
	console.log(`  Total:   ${hc.totalFiles}`);
	console.log(`  OK:      ${hc.ok}`);
	console.log(`  Missing: ${hc.missing}`);
	console.log(`  Wrong:   ${hc.wrong}`);
	console.log(`  Skipped: ${hc.skipped}`);
	if (hc.errors > 0) console.log(`  Errors:  ${hc.errors}`);
	console.log();

	// ── Totals ───────────────────────────────────────────────────────────────
	console.log("─── Totals ─────────────────────────────────────────────────\n");
	console.log(`  Total Primitives:       ${stats.coldlight.totalPrimitives}`);
	console.log(`  With .svelte:           ${stats.coldlight.primitivesWithSvelte}`);
	console.log(`  With Contract:          ${stats.coldlight.primitivesWithContract}`);
	console.log(`  With Parity:            ${stats.coldlight.primitivesWithParity}`);
	console.log(`  ColdLight Adapters:     ${stats.coldlight.coldlightAdapters}`);
	console.log(`  ColdLight Builders:     ${stats.coldlight.builders}`);
	console.log(`  Component Layer Kinds:  ${stats.coldlight.components}`);
	console.log();
}

// =============================================================================
// CLI
// =============================================================================

function main(): void {
	const args = process.argv.slice(2);
	const jsonFlag = args.includes("--json");
	const writeFlag = args.includes("--write");

	const result = scanPlatform();

	if (jsonFlag) {
		console.log(JSON.stringify(result.manifest, null, 2));
		return;
	}

	printReport(result);

	if (writeFlag) {
		const outputPath = path.join(ROOTS.desktop, "devpulse.manifest.json");
		fs.writeFileSync(outputPath, `${JSON.stringify(result.manifest, null, 2)}\n`);
		console.log(`  Manifest written to: ${outputPath}\n`);
	}
}

// Only run CLI when executed directly (not when imported)
const __scannerFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(__scannerFile) === path.resolve(process.argv[1])) {
	main();
}
