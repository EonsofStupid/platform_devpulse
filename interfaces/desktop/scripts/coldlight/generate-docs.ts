#!/usr/bin/env npx tsx
/**
 * @file generate-docs.ts
 * @description Intelligent documentation generator for ColdLight design system.
 *
 * This script dynamically:
 * 1. Reads package.json exports map to discover entry points
 * 2. Filters to TypeScript files only (ignores CSS, .d.ts)
 * 3. Generates TypeDoc config on the fly
 * 4. Outputs to .cowlevel/ directory for aggregation
 *
 * Usage: pnpm coldlight:docs
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ============================================================================
// ESM Compatibility
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Path Utilities (Windows → POSIX)
// ============================================================================

/**
 * Convert Windows paths to POSIX format for TypeDoc compatibility
 */
function toPosix(p: string): string {
	return p.replace(/\\/g, "/");
}

// ============================================================================
// Configuration
// ============================================================================

const COLDLIGHT_ROOT = toPosix(path.resolve(__dirname, "../../src/lib/design"));
const OUTPUT_DIR = toPosix(path.join(COLDLIGHT_ROOT, ".cowlevel"));
const TYPEDOC_OUTPUT = toPosix(path.join(OUTPUT_DIR, "typedoc"));
const TYPEDOC_JSON = toPosix(path.join(OUTPUT_DIR, "api.json"));

// Exports to skip (config files that cause TypeDoc issues)
const SKIP_EXPORTS = new Set(["./config", "./vite-plugin", "./tailwind-preset"]);

// File patterns to exclude
const EXCLUDE_PATTERNS = ["**/node_modules/**", "**/.cowlevel/**", "**/*.test.ts", "**/*.spec.ts"];

// ============================================================================
// Types
// ============================================================================

interface PackageJson {
	name: string;
	version: string;
	description?: string;
	exports?: Record<string, ExportEntry | string>;
}

type ExportEntry =
	| {
			types?: string;
			import?: string;
			svelte?: string;
			default?: string;
	  }
	| string;

interface EntryPoint {
	name: string;
	relativePath: string;
	absolutePath: string;
}

// ============================================================================
// Core Functions
// ============================================================================

function readPackageJson(): PackageJson {
	const pkgPath = path.join(COLDLIGHT_ROOT, "package.json");
	if (!fs.existsSync(pkgPath)) {
		throw new Error(`package.json not found: ${pkgPath}`);
	}
	return JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
}

function extractEntryPoints(pkg: PackageJson): EntryPoint[] {
	const exports = pkg.exports;
	if (!exports) {
		console.warn("⚠️  No exports map, using index.ts");
		const absPath = toPosix(path.join(COLDLIGHT_ROOT, "index.ts"));
		return [{ name: ".", relativePath: "./index.ts", absolutePath: absPath }];
	}

	const entries: EntryPoint[] = [];

	for (const [name, value] of Object.entries(exports)) {
		// Skip config exports
		if (SKIP_EXPORTS.has(name)) {
			continue;
		}

		// Extract import path
		let importPath: string | undefined;
		if (typeof value === "string") {
			importPath = value;
		} else if (value && typeof value === "object") {
			importPath = value.import || value.svelte || value.default;
		}

		if (!importPath) continue;

		// Skip non-TS and .d.ts files
		if (!importPath.endsWith(".ts") || importPath.endsWith(".d.ts")) {
			continue;
		}

		const absolutePath = toPosix(path.resolve(COLDLIGHT_ROOT, importPath));

		// Verify exists
		if (!fs.existsSync(absolutePath)) {
			console.warn(`⚠️  Missing: ${absolutePath}`);
			continue;
		}

		entries.push({ name, relativePath: importPath, absolutePath });
	}

	return entries;
}

function ensureDir(dir: string): void {
	const winPath = dir.replace(/\//g, path.sep);
	if (!fs.existsSync(winPath)) {
		fs.mkdirSync(winPath, { recursive: true });
	}
}

function generateConfig(pkg: PackageJson, entries: EntryPoint[]): object {
	return {
		$schema: "https://typedoc.org/schema.json",
		entryPoints: entries.map((e) => e.absolutePath),
		entryPointStrategy: "expand",
		out: TYPEDOC_OUTPUT,
		json: TYPEDOC_JSON,
		name: pkg.name,
		includeVersion: true,
		excludePrivate: true,
		excludeInternal: true,
		exclude: EXCLUDE_PATTERNS,
		skipErrorChecking: true,
		readme: toPosix(path.join(COLDLIGHT_ROOT, "README.md")),
		validation: {
			notExported: false,
			invalidLink: true,
			notDocumented: false,
		},
		categorizeByGroup: true,
		categoryOrder: ["Tokens", "Taxonomy", "Recipes", "Primitives", "Patterns", "Blocks", "*"],
		sort: ["source-order"],
	};
}

function runTypedoc(config: object): void {
	const configPath = toPosix(path.join(OUTPUT_DIR, "typedoc.config.json"));
	const winConfigPath = configPath.replace(/\//g, path.sep);

	fs.writeFileSync(winConfigPath, JSON.stringify(config, null, 2));

	try {
		// Use POSIX path in the command for TypeDoc
		execSync(`npx typedoc --options "${configPath}"`, {
			cwd: COLDLIGHT_ROOT.replace(/\//g, path.sep),
			stdio: "inherit",
		});
	} catch {
		console.error("\n❌ TypeDoc failed");
		process.exit(1);
	}
}

function writeManifest(pkg: PackageJson, entries: EntryPoint[]): void {
	const manifest = {
		generatedAt: new Date().toISOString(),
		package: pkg.name,
		version: pkg.version,
		entryPoints: entries.map((e) => ({ export: e.name, file: e.relativePath })),
		outputs: { html: TYPEDOC_OUTPUT, json: TYPEDOC_JSON },
	};

	const manifestPath = path.join(OUTPUT_DIR.replace(/\//g, path.sep), "manifest.json");
	fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
	const pkg = readPackageJson();

	const entries = extractEntryPoints(pkg);
	if (entries.length === 0) {
		console.error("❌ No entry points found");
		process.exit(1);
	}

	ensureDir(OUTPUT_DIR);
	const config = generateConfig(pkg, entries);
	runTypedoc(config);
	writeManifest(pkg, entries);
}

main();
