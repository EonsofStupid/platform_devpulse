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
const _SKIP_EXPORTS = new Set(["./config", "./vite-plugin", "./tailwind-preset"]);

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

function extractEntryPoints(_pkg: PackageJson): EntryPoint[] {
	const entries: EntryPoint[] = [];

	// Scan known ColdLight directories for index.ts entry points
	const SCAN_DIRS = ["style-macro", "behaviors", "components", "blocks", "primitives", "utils"];

	for (const dir of SCAN_DIRS) {
		const dirPath = path.join(COLDLIGHT_ROOT, dir);
		if (!fs.existsSync(dirPath)) continue;

		// Check for top-level index.ts
		const topIndex = toPosix(path.join(dirPath, "index.ts"));
		if (fs.existsSync(topIndex)) {
			entries.push({
				name: `./${dir}`,
				relativePath: `./${dir}/index.ts`,
				absolutePath: topIndex,
			});
		}

		// Check for per-kind index.ts files
		const subDirs = fs
			.readdirSync(dirPath, { withFileTypes: true })
			.filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."));

		for (const sub of subDirs) {
			const subIndex = toPosix(path.join(dirPath, sub.name, "index.ts"));
			if (fs.existsSync(subIndex)) {
				entries.push({
					name: `./${dir}/${sub.name}`,
					relativePath: `./${dir}/${sub.name}/index.ts`,
					absolutePath: subIndex,
				});
			}
		}
	}

	// Also check coldlight.config.ts
	const configPath = toPosix(path.join(COLDLIGHT_ROOT, "coldlight.config.ts"));
	if (fs.existsSync(configPath)) {
		entries.push({
			name: "./config",
			relativePath: "./coldlight.config.ts",
			absolutePath: configPath,
		});
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
