/**
 * @file scripts/dev/platform-scanner.types.ts
 * @module @devpulse/scripts/dev/platform-scanner-types
 * @package @devpulse/scripts
 *
 * Types for the DevPulse platform-wide scanner and manifest.
 * The platform scanner extends beyond ColdLight primitives to cover
 * every namespace in the platform: sys, domains, routes, tauri, engine, maestro, scripts.
 *
 * @since 1.0.0
 */

// =============================================================================
// SHARED TYPES
// =============================================================================

export interface FileSummary {
	/** File path relative to its namespace root (forward slashes) */
	readonly localPath: string;
	/** Matched schema rule name, or null if no rule matched */
	readonly rule: string | null;
	/** Header status */
	readonly headerStatus: "ok" | "missing" | "wrong";
	/** Missing tags (when headerStatus is "wrong") */
	readonly missingTags: readonly string[];
}

// =============================================================================
// COLDLIGHT — PRIMITIVES
// =============================================================================

export interface PrimitiveSummary {
	/** Primitive kind (e.g. "button", "dialog") */
	readonly kind: string;
	/** PascalCase kind (e.g. "Button", "Dialog") */
	readonly kindPascal: string;
	/** ARIA state provider: "meltui" | "coldlight" */
	readonly ariaStateProvider: "meltui" | "coldlight" | null;
	/** Category grouping for inventory display */
	readonly category: PrimitiveCategory;

	// ── File existence ───────────────────────────────────────────────────────
	readonly hasContract: boolean;
	readonly hasTypes: boolean;
	readonly hasIndex: boolean;
	readonly hasSvelte: boolean;
	readonly hasTest: boolean;

	// ── Parity status ────────────────────────────────────────────────────────
	/** MeltUI adapter folder exists in _internal/ */
	readonly hasMeltAdapter: boolean;
	/** ColdLight adapter folder exists in _internal/ */
	readonly hasColdlightAdapter: boolean;
	/** Full parity: all required folders present per ariaStateProvider */
	readonly hasParity: boolean;

	/** List of .svelte files in this kind's folder */
	readonly svelteFiles: readonly string[];
}

export type PrimitiveCategory =
	| "melt-backed"
	| "interactive"
	| "layout"
	| "typography"
	| "data-display"
	| "feedback"
	| "form"
	| "navigation"
	| "overlay";

// =============================================================================
// COLDLIGHT — ADAPTERS
// =============================================================================

export interface AdapterKindSummary {
	/** Kind name (e.g. "accordion", "dialog") */
	readonly kind: string;
	/** Has factory.ts */
	readonly hasFactory: boolean;
	/** Has index.ts */
	readonly hasIndex: boolean;
	/** Has _transport/ folder */
	readonly hasTransport: boolean;
	/** Has _transport/types.ts */
	readonly hasTransportTypes: boolean;
	/** Has _transport/factory.ts */
	readonly hasTransportFactory: boolean;
	/** Has _transport/index.ts */
	readonly hasTransportIndex: boolean;
	/** Is complete: all required files present */
	readonly isComplete: boolean;
}

// =============================================================================
// COLDLIGHT — RECIPES / BLUEPRINTS / BLOCKS / PATTERNS / PLUGINS
// =============================================================================

export interface RecipeSummary {
	/** Kind or category (e.g. "dialog", "shell") */
	readonly kind: string;
	/** Parent group: "components" | "layouts" */
	readonly group: "components" | "layouts";
	/** Variant files (e.g. ["dialog.default.ts"]) */
	readonly variants: readonly string[];
	/** Has index.ts */
	readonly hasIndex: boolean;
	/** Has types.ts */
	readonly hasTypes: boolean;
}

export interface BlueprintSummary {
	readonly kind: string;
	readonly variants: readonly string[];
	readonly hasIndex: boolean;
	readonly hasTypes: boolean;
}

export interface BlockSummary {
	readonly category: string;
	readonly files: readonly string[];
}

export interface PatternSummary {
	readonly category: string;
	readonly files: readonly string[];
}

export interface PluginSummary {
	readonly name: string;
	readonly files: readonly string[];
}

// =============================================================================
// COLDLIGHT — COMPONENT LAYER
// =============================================================================

export interface ComponentKindSummary {
	readonly kind: string;
	readonly hasSvelte: boolean;
	readonly hasTypes: boolean;
	readonly hasContract: boolean;
	readonly hasIndex: boolean;
	readonly hasRecipe: boolean;
	readonly svelteFiles: readonly string[];
}

// =============================================================================
// NAMESPACE SUMMARIES (non-ColdLight areas)
// =============================================================================

export interface NamespaceSummary {
	/** Total file count */
	readonly fileCount: number;
	/** Files grouped by layer or subdirectory */
	readonly files: readonly FileSummary[];
}

// =============================================================================
// HEADER COMPLIANCE
// =============================================================================

export interface HeaderComplianceReport {
	readonly totalFiles: number;
	readonly ok: number;
	readonly missing: number;
	readonly wrong: number;
	readonly skipped: number;
	readonly errors: number;
}

// =============================================================================
// PLATFORM STATISTICS
// =============================================================================

export interface PlatformStats {
	/** File counts by namespace */
	readonly byNamespace: Record<string, number>;
	/** File counts by layer */
	readonly byLayer: Record<string, number>;
	/** ColdLight-specific totals */
	readonly coldlight: {
		readonly totalPrimitives: number;
		readonly primitivesWithSvelte: number;
		readonly primitivesWithContract: number;
		readonly primitivesWithParity: number;
		readonly meltAdapters: number;
		readonly coldlightAdapters: number;
		readonly components: number;
		readonly actions: number;
		readonly utils: number;
		readonly recipes: number;
		readonly blueprints: number;
		readonly blocks: number;
		readonly patterns: number;
		readonly plugins: number;
		readonly molecules: number;
	};
}

// =============================================================================
// TOP-LEVEL MANIFEST
// =============================================================================

export interface DevPulseManifest {
	readonly version: string;
	readonly generatedAt: string;

	readonly coldlight: {
		readonly primitives: readonly PrimitiveSummary[];
		readonly adapters: {
			readonly meltui: readonly AdapterKindSummary[];
			readonly coldlight: readonly AdapterKindSummary[];
		};
		readonly components: readonly ComponentKindSummary[];
		readonly recipes: readonly RecipeSummary[];
		readonly blueprints: readonly BlueprintSummary[];
		readonly blocks: readonly BlockSummary[];
		readonly patterns: readonly PatternSummary[];
		readonly plugins: readonly PluginSummary[];
		readonly actions: readonly FileSummary[];
		readonly utils: readonly FileSummary[];
		readonly tokens: readonly FileSummary[];
		readonly config: readonly FileSummary[];
		readonly molecules: readonly FileSummary[];
	};

	readonly sys: NamespaceSummary;
	readonly domains: Record<string, NamespaceSummary>;
	readonly routes: NamespaceSummary;
	readonly tauri: NamespaceSummary;
	readonly engine: NamespaceSummary;
	readonly maestro: NamespaceSummary;
	readonly scripts: NamespaceSummary;

	readonly stats: PlatformStats;
	readonly headerCompliance: HeaderComplianceReport;
}

// =============================================================================
// SCAN RESULT (full scanner output)
// =============================================================================

export interface PlatformScanResult {
	readonly manifest: DevPulseManifest;
	readonly errors: readonly ScanError[];
}

export interface ScanError {
	readonly code: string;
	readonly path: string;
	readonly detail: string;
}
