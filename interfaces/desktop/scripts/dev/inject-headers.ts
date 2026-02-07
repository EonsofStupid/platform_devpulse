/**
 * @fileoverview File header injection script for COLD LIGHT Design System
 * @module @devpulse/scripts/dev/inject-headers
 * @layer scripts
 *
 * @description
 * Production-level script that automatically adds standardized headers to
 * source files. Handles existing headers, guards against re-injection,
 * and provides detailed reporting.
 *
 * Usage:
 *   pnpm headers:check    - Report files missing headers
 *   pnpm headers:inject   - Add headers to files missing them
 *   pnpm headers:fix      - Update existing headers to match standard
 *
 * @since 1.0.0
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ============================================
// CONFIGURATION
// ============================================

// Workspace roots
const WORKSPACE_ROOT = path.resolve(__dirname, "../..");
const SRC_ROOT = path.join(WORKSPACE_ROOT, "src");
const LIB_ROOT = path.join(SRC_ROOT, "lib");
const TAURI_ROOT = path.join(WORKSPACE_ROOT, "src-tauri");

// Layer detection from path
function detectLayer(filePath: string): string {
	const relative = path.relative(LIB_ROOT, filePath);

	if (relative.startsWith("design/tokens")) return "tokens";
	if (relative.startsWith("design/primitives")) return "primitives";
	if (relative.startsWith("design/semantics")) return "semantics";
	if (relative.startsWith("design/compositions")) return "compositions";
	if (relative.startsWith("design/plugins")) return "plugins";
	if (relative.startsWith("design/components")) return "components";
	if (relative.startsWith("sys/")) return "domains";
	if (relative.startsWith("domains/")) return "domains";

	// Check if it's a Tauri/Rust file
	const tauriRelative = path.relative(TAURI_ROOT, filePath);
	if (!tauriRelative.startsWith("..")) {
		if (tauriRelative.startsWith("src/commands")) return "commands";
		if (tauriRelative.startsWith("src/db")) return "database";
		if (tauriRelative.startsWith("src/")) return "core";
		return "tauri";
	}

	return "lib";
}

// Get FULL path from src/ root (what user asked for)
function getSrcPath(filePath: string): string {
	const relative = path.relative(SRC_ROOT, filePath);
	return `src/${relative.replace(/\\/g, "/")}`;
}

// Get module path from file path
function getModulePath(filePath: string): string {
	const relative = path.relative(LIB_ROOT, filePath);
	const withoutExt = relative.replace(/\.[^/.]+$/, "");
	return `@devpulse/${withoutExt.replace(/\\/g, "/")}`;
}

// Get filename for display
function getFileName(filePath: string): string {
	return path.basename(filePath);
}

// ============================================
// HEADER TEMPLATES - Production-level (5% codebase standard)
// ============================================

const TYPESCRIPT_HEADER = (filePath: string, layer: string): string => {
	const srcPath = getSrcPath(filePath);
	const modulePath = getModulePath(filePath);
	const fileName = getFileName(filePath);

	return `/**
 * @fileoverview ${fileName}
 * @file ${srcPath}
 * @module ${modulePath}
 * @layer ${layer}
 *
 * @description
 * [TODO: Describe the purpose and responsibility of this module]
 *
 * @dependencies
 * - [TODO: List imports this file depends on]
 *
 * @consumers
 * - [TODO: List modules that import this file]
 *
 * @vpb-editable [TODO: List props VPB can modify, or 'none']
 * @since 1.0.0
 */

`;
};

const CSS_HEADER = (filePath: string, layer: string): string => {
	const srcPath = getSrcPath(filePath);
	const fileName = getFileName(filePath);
	const cssLayer = layer === "tokens" ? "tokens" : "recipes";

	return `/**
 * @file ${srcPath}
 * @name ${fileName}
 * @layer ${cssLayer}
 *
 * @description
 * [TODO: Describe what this stylesheet defines]
 *
 * @contents
 * - [TODO: List major sections/categories]
 *
 * @vpb-editable [TODO: List token names VPB can modify, or 'all']
 * @since 1.0.0
 */

`;
};

const SVELTE_HEADER = (filePath: string, layer: string): string => {
	const srcPath = getSrcPath(filePath);
	const fileName = getFileName(filePath);
	const modulePath = getModulePath(filePath);

	return `<!--
  @file ${srcPath}
  @name ${fileName}
  @module ${modulePath}
  @layer ${layer}

  @description
  [TODO: Describe this component's purpose]

  @props
  - [TODO: propName]: [type] - [description]

  @dependencies
  - [TODO: List imports]

  @consumers
  - [TODO: List who uses this component]

  @vpb-editable [TODO: List editable props]
  @since 1.0.0
-->
`;
};

const RUST_HEADER = (filePath: string, layer: string): string => {
	// Get path relative to workspace
	const workspaceRelative = path.relative(WORKSPACE_ROOT, filePath);
	const fileName = getFileName(filePath);

	return `//! @file ${workspaceRelative.replace(/\\/g, "/")}
//! @name ${fileName}
//! @layer ${layer}
//!
//! # Description
//! [TODO: Describe this module's purpose]
//!
//! # Dependencies
//! - [TODO: List crate dependencies]
//!
//! # Consumers
//! - [TODO: List modules that use this]
//!
//! @since 1.0.0

`;
};

// ============================================
// HEADER DETECTION PATTERNS
// ============================================

const HEADER_PATTERNS: Record<string, RegExp> = {
	typescript: /^\/\*\*[\s\S]*?@fileoverview[\s\S]*?\*\//,
	css: /^\/\*\*[\s\S]*?@file[\s\S]*?\*\//,
	svelte: /^<!--[\s\S]*?@file[\s\S]*?-->/,
	rust: /^\/\/!\s*@file/,
};

// ============================================
// CORE FUNCTIONS
// ============================================

interface FileResult {
	path: string;
	status: "has_header" | "missing_header" | "injected" | "error";
	message?: string;
}

function hasHeader(content: string, ext: string): boolean {
	let pattern: RegExp;

	switch (ext) {
		case ".css":
			pattern = HEADER_PATTERNS.css;
			break;
		case ".svelte":
			pattern = HEADER_PATTERNS.svelte;
			break;
		case ".rs":
			pattern = HEADER_PATTERNS.rust;
			break;
		default:
			pattern = HEADER_PATTERNS.typescript;
	}

	return pattern.test(content.trim());
}

function getHeaderTemplate(ext: string): ((path: string, layer: string) => string) | null {
	switch (ext) {
		case ".ts":
		case ".js":
			return TYPESCRIPT_HEADER;
		case ".css":
			return CSS_HEADER;
		case ".svelte":
			return SVELTE_HEADER;
		case ".rs":
			return RUST_HEADER;
		default:
			return null;
	}
}

function processFile(filePath: string, inject: boolean): FileResult {
	try {
		const ext = path.extname(filePath);
		const template = getHeaderTemplate(ext);

		if (!template) {
			return { path: filePath, status: "error", message: "Unsupported file type" };
		}

		const content = fs.readFileSync(filePath, "utf-8");

		// Check if header already exists
		if (hasHeader(content, ext)) {
			return { path: filePath, status: "has_header" };
		}

		if (!inject) {
			return { path: filePath, status: "missing_header" };
		}

		// Inject header
		const layer = detectLayer(filePath);
		const header = template(filePath, layer);
		const newContent = header + content;

		fs.writeFileSync(filePath, newContent, "utf-8");

		return { path: filePath, status: "injected" };
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown error";
		return { path: filePath, status: "error", message };
	}
}

function walkDir(dir: string, extensions: string[]): string[] {
	const files: string[] = [];

	try {
		const entries = fs.readdirSync(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);

			// Skip node_modules, .git, etc.
			if (entry.name.startsWith(".") || entry.name === "node_modules") {
				continue;
			}

			if (entry.isDirectory()) {
				files.push(...walkDir(fullPath, extensions));
			} else if (extensions.includes(path.extname(entry.name))) {
				files.push(fullPath);
			}
		}
	} catch (err) {
		console.error(`Error reading directory ${dir}:`, err);
	}

	return files;
}

// ============================================
// CLI
// ============================================

function main(): void {
	const args = process.argv.slice(2);
	const command = args[0] || "check";
	const targetArg = args[1];

	// Supported extensions
	const extensions = [".ts", ".js", ".css", ".svelte", ".rs"];

	// Determine target directories
	let targetDirs: string[];
	if (targetArg) {
		// User specified a directory
		const fullPath = path.resolve(process.cwd(), targetArg);
		targetDirs = [fullPath];
	} else {
		// Default: scan both src/lib and src-tauri/src
		targetDirs = [LIB_ROOT];
		if (fs.existsSync(TAURI_ROOT)) {
			targetDirs.push(path.join(TAURI_ROOT, "src"));
		}
	}

	// Collect all files
	let allFiles: string[] = [];
	for (const dir of targetDirs) {
		if (fs.existsSync(dir)) {
			const files = walkDir(dir, extensions);
			allFiles = allFiles.concat(files);
		}
	}

	const results: FileResult[] = [];

	for (const file of allFiles) {
		const result = processFile(file, command === "inject");
		results.push(result);
	}

	// Report
	const missing = results.filter((r) => r.status === "missing_header");
	const _hasHeader = results.filter((r) => r.status === "has_header");
	const injected = results.filter((r) => r.status === "injected");
	const errors = results.filter((r) => r.status === "error");
	if (injected.length > 0) {
	}
	if (errors.length > 0) {
	}

	if (missing.length > 0 && command === "check") {
		for (const _r of missing) {
		}
	}

	if (injected.length > 0) {
		for (const _r of injected) {
		}
	}

	if (errors.length > 0) {
		for (const _r of errors) {
		}
	}
}

main();
