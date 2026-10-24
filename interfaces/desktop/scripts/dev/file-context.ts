/**
 * @file scripts/dev/file-context.ts
 * @module @devpulse/scripts/dev/file-context
 * @package @devpulse/scripts
 *
 * Resolves FileContext from a filesystem path.
 * Given any file in the DevPulse platform, produces the metadata
 * needed by file-schema rules to generate correct headers.
 *
 * @since 1.0.0
 */

import * as path from "node:path";
import { fileURLToPath } from "node:url";

// =============================================================================
// PLATFORM ROOTS
// =============================================================================

/** Resolve from this file's location (scripts/dev/) up to interfaces/desktop/ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DESKTOP_ROOT = path.resolve(__dirname, "../..");

/** All root paths anchored to the platform monorepo */
export const ROOTS = {
	/** Monorepo root (platform_devpulse/) */
	platform: path.resolve(DESKTOP_ROOT, "../.."),
	/** Desktop app root (interfaces/desktop/) */
	desktop: DESKTOP_ROOT,
	/** SvelteKit src */
	src: path.join(DESKTOP_ROOT, "src"),
	/** Lib root */
	lib: path.join(DESKTOP_ROOT, "src/lib"),
	/** ColdLight design system */
	design: path.join(DESKTOP_ROOT, "../../packages/coldlight"),
	/** System layer */
	sys: path.join(DESKTOP_ROOT, "src/lib/sys"),
	/** Feature domains */
	domains: path.join(DESKTOP_ROOT, "src/lib/domains"),
	/** SvelteKit routes */
	routes: path.join(DESKTOP_ROOT, "src/routes"),
	/** Tauri Rust commands */
	tauri: path.join(DESKTOP_ROOT, "src-tauri"),
	/** Signal engine */
	engine: path.resolve(DESKTOP_ROOT, "../../systems/devpulse-engine"),
	/** AI orchestrator kernel */
	clyffy: path.resolve(DESKTOP_ROOT, "../../kernel/devpulse-clyffy"),
	/** Build/doc scripts */
	scripts: path.resolve(DESKTOP_ROOT, "../../scripts"),
	/** Desktop-local scripts */
	desktopScripts: path.join(DESKTOP_ROOT, "scripts"),
} as const;

// =============================================================================
// TYPES
// =============================================================================

export type Language = "typescript" | "svelte" | "rust" | "css" | "json" | "surql" | "shell";

export type Namespace =
	| "@devpulse/coldlight"
	| "@devpulse/sys"
	| `@devpulse/domains/${string}`
	| "@devpulse/routes"
	| "@devpulse/tauri"
	| "@devpulse/engine"
	| "@devpulse/clyffy"
	| "@devpulse/scripts";

export interface FileContext {
	/** Absolute path on disk */
	filePath: string;
	/** Path relative to platform root (forward slashes) */
	relativePath: string;
	/** Path relative to nearest significant root (e.g. design/, sys/) */
	localPath: string;
	/** Resolved namespace */
	namespace: Namespace;
	/** Architecture layer (primitives, tokens, components, actions, etc.) */
	layer: string;
	/** File extension including dot */
	ext: string;
	/** Resolved language */
	language: Language;
	/** Filename without path */
	fileName: string;
	/** Filename without extension */
	baseName: string;
	/** Primitive/component kind if inside a named folder (e.g. "button", "dialog") */
	kind: string | null;
	/** PascalCase kind (e.g. "Button", "Dialog") */
	kindPascal: string | null;
	/** Whether a contract.ts exists alongside this file */
	hasContract: boolean;
	/** ariaStateProvider from contract if loadable */
	ariaStateProvider: string | null;
	/** Whether this is inside _internal/ */
	isInternal: boolean;
	/** Whether this is inside _transport/ */
	isTransport: boolean;
	/** Whether this is inside _schema/ */
	isSchema: boolean;
	/** Domain name if inside domains/{name}/ */
	domain: string | null;
	/** SvelteKit route group if inside (groupName)/ */
	routeGroup: string | null;
}

// =============================================================================
// LANGUAGE DETECTION
// =============================================================================

const EXT_TO_LANGUAGE: Record<string, Language> = {
	".ts": "typescript",
	".js": "typescript",
	".svelte": "svelte",
	".svelte.ts": "typescript",
	".rs": "rust",
	".css": "css",
	".json": "json",
	".surql": "surql",
	".sh": "shell",
	".cmd": "shell",
};

function detectLanguage(filePath: string): Language {
	if (filePath.endsWith(".svelte.ts")) return "typescript";
	const ext = path.extname(filePath);
	return EXT_TO_LANGUAGE[ext] ?? "typescript";
}

function getExt(filePath: string): string {
	if (filePath.endsWith(".svelte.ts")) return ".svelte.ts";
	return path.extname(filePath);
}

// =============================================================================
// HELPERS
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

/**
 * Check if `child` is under `parent` directory.
 * Returns the relative path (forward slashes) or null.
 */
function relativeUnder(parent: string, child: string): string | null {
	const rel = path.relative(parent, child);
	if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
	return toForwardSlash(rel);
}

// =============================================================================
// NAMESPACE RESOLUTION
// =============================================================================

function resolveNamespace(filePath: string): {
	namespace: Namespace;
	localPath: string;
	root: string;
} {
	// Order matters — most specific first

	// ColdLight design system
	const designRel = relativeUnder(ROOTS.design, filePath);
	if (designRel !== null) {
		return { namespace: "@devpulse/coldlight", localPath: designRel, root: ROOTS.design };
	}

	// System layer
	const sysRel = relativeUnder(ROOTS.sys, filePath);
	if (sysRel !== null) {
		return { namespace: "@devpulse/sys", localPath: sysRel, root: ROOTS.sys };
	}

	// Feature domains
	const domainsRel = relativeUnder(ROOTS.domains, filePath);
	if (domainsRel !== null) {
		const domainName = domainsRel.split("/")[0];
		return {
			namespace: `@devpulse/domains/${domainName}`,
			localPath: domainsRel,
			root: ROOTS.domains,
		};
	}

	// SvelteKit routes
	const routesRel = relativeUnder(ROOTS.routes, filePath);
	if (routesRel !== null) {
		return { namespace: "@devpulse/routes", localPath: routesRel, root: ROOTS.routes };
	}

	// Tauri commands
	const tauriRel = relativeUnder(ROOTS.tauri, filePath);
	if (tauriRel !== null) {
		return { namespace: "@devpulse/tauri", localPath: tauriRel, root: ROOTS.tauri };
	}

	// Signal engine
	const engineRel = relativeUnder(ROOTS.engine, filePath);
	if (engineRel !== null) {
		return { namespace: "@devpulse/engine", localPath: engineRel, root: ROOTS.engine };
	}

	// AI orchestrator
	const clyffyRel = relativeUnder(ROOTS.clyffy, filePath);
	if (clyffyRel !== null) {
		return { namespace: "@devpulse/clyffy", localPath: clyffyRel, root: ROOTS.clyffy };
	}

	// Desktop-local scripts (interfaces/desktop/scripts/)
	const dScriptsRel = relativeUnder(ROOTS.desktopScripts, filePath);
	if (dScriptsRel !== null) {
		return { namespace: "@devpulse/scripts", localPath: dScriptsRel, root: ROOTS.desktopScripts };
	}

	// Platform-level scripts
	const scriptsRel = relativeUnder(ROOTS.scripts, filePath);
	if (scriptsRel !== null) {
		return { namespace: "@devpulse/scripts", localPath: scriptsRel, root: ROOTS.scripts };
	}

	// Fallback — anything under src/lib/
	const libRel = relativeUnder(ROOTS.lib, filePath);
	if (libRel !== null) {
		return { namespace: "@devpulse/coldlight", localPath: libRel, root: ROOTS.lib };
	}

	// Last resort — relative to platform root
	const platformRel = relativeUnder(ROOTS.platform, filePath);
	return {
		namespace: "@devpulse/scripts",
		localPath: platformRel ?? toForwardSlash(filePath),
		root: ROOTS.platform,
	};
}

// =============================================================================
// LAYER RESOLUTION
// =============================================================================

function resolveLayer(namespace: Namespace, localPath: string): string {
	if (namespace === "@devpulse/coldlight") {
		if (localPath.startsWith("tokens/")) return "tokens";
		if (localPath.startsWith("primitives/_schema/")) return "primitives/schema";
		if (localPath.startsWith("primitives/")) return "primitives";
		if (localPath.startsWith("components/_schema/")) return "components/schema";
		if (localPath.startsWith("components/")) return "components";
		if (localPath.startsWith("recipes/")) return "recipes";
		if (localPath.startsWith("blueprints/")) return "blueprints";
		if (localPath.startsWith("api/adapters/")) return "adapters";
		if (localPath.startsWith("api/actions/")) return "api/actions";
		if (localPath.startsWith("actions/")) return "actions";
		if (localPath.startsWith("utils/")) return "utils";
		if (localPath.startsWith("config/")) return "config";
		if (localPath.startsWith("molecules/")) return "molecules";
		if (localPath.startsWith("blocks/")) return "blocks";
		if (localPath.startsWith("patterns/")) return "patterns";
		if (localPath.startsWith("plugins/")) return "plugins";
		if (localPath.startsWith(".generated/")) return "generated";
		return "design";
	}

	if (namespace === "@devpulse/sys") {
		if (localPath.startsWith("cfg/")) return "config";
		if (localPath.startsWith("runes/")) return "state";
		if (localPath.startsWith("debug/")) return "debug";
		if (localPath.startsWith("routing/")) return "routing";
		if (localPath.startsWith("streams/")) return "streams";
		return "sys";
	}

	if (namespace.startsWith("@devpulse/domains/")) {
		if (localPath.includes("/pages/")) return "pages";
		if (localPath.includes("/components/")) return "components";
		if (localPath.includes("/services/")) return "services";
		if (localPath.includes("/stores/")) return "stores";
		return "domains";
	}

	if (namespace === "@devpulse/routes") return "routes";

	if (namespace === "@devpulse/tauri") {
		if (localPath.startsWith("src/commands/")) return "commands";
		if (localPath.startsWith("src/")) return "core";
		return "tauri";
	}

	if (namespace === "@devpulse/engine") {
		if (localPath.startsWith("src/signals/")) return "signals";
		if (localPath.startsWith("src/engine/")) return "engine";
		return "engine";
	}

	if (namespace === "@devpulse/clyffy") {
		if (localPath.startsWith("src/cortex/")) return "cortex";
		if (localPath.startsWith("src/config/")) return "config";
		return "clyffy";
	}

	return "scripts";
}

// =============================================================================
// KIND RESOLUTION
// =============================================================================

function resolveKind(namespace: Namespace, localPath: string): string | null {
	if (namespace !== "@devpulse/coldlight") return null;

	const patterns = [
		/^primitives\/([^/]+)\//,
		/^components\/([^/]+)\//,
		/^api\/adapters\/\w+\/_internal\/([^/]+)\//,
		/^recipes\/components\/([^/]+)\//,
		/^blueprints\/components\/([^/]+)\//,
	];

	for (const pattern of patterns) {
		const match = localPath.match(pattern);
		if (match && match[1] !== "_schema" && match[1] !== "_transport") {
			return match[1];
		}
	}

	return null;
}

// =============================================================================
// ROUTE GROUP EXTRACTION
// =============================================================================

function extractRouteGroup(localPath: string): string | null {
	const match = localPath.match(/^\(([^)]+)\)\//);
	return match ? match[1] : null;
}

// =============================================================================
// DOMAIN EXTRACTION
// =============================================================================

function extractDomain(namespace: Namespace): string | null {
	const match = namespace.match(/^@devpulse\/domains\/(.+)$/);
	return match ? match[1] : null;
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Resolve full FileContext from an absolute file path.
 * This is the primary entry point — every tool imports this.
 */
export function resolveFileContext(filePath: string): FileContext {
	const abs = path.resolve(filePath);
	const { namespace, localPath, root: _root } = resolveNamespace(abs);

	const ext = getExt(abs);
	const language = detectLanguage(abs);
	const fileName = path.basename(abs);
	const baseName = fileName.replace(/\.[^/.]+$/, "").replace(/\.svelte$/, "");

	const layer = resolveLayer(namespace, localPath);
	const kind = resolveKind(namespace, localPath);
	const kindPascal = kind ? toPascalCase(kind) : null;
	const hasContract = false;
	const ariaStateProvider = null;

	const platformRel = relativeUnder(ROOTS.platform, abs);

	return {
		filePath: abs,
		relativePath: platformRel ?? toForwardSlash(abs),
		localPath,
		namespace,
		layer,
		ext,
		language,
		fileName,
		baseName,
		kind,
		kindPascal,
		hasContract,
		ariaStateProvider,
		isInternal: localPath.includes("_internal/"),
		isTransport: localPath.includes("_transport/"),
		isSchema: localPath.includes("_schema/"),
		domain: extractDomain(namespace),
		routeGroup: namespace === "@devpulse/routes" ? extractRouteGroup(localPath) : null,
	};
}
