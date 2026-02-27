/**
 * @file ColdLight Configuration Types
 * @package @devpulse/coldlight
 *
 * ColdLight config is the owner's instrument of control.
 * ALL build tools, scanners, generators, and registries read this type.
 * Nothing is hardcoded. Config drives everything.
 */

export type SystemId = "coldlight";

/**
 * CategoryId is the hub grouping (primitives/components/composites).
 * Individual things inside a category are "kinds" (e.g., dialog, tabs).
 */
export type CategoryId = "primitives" | "components" | "composites";

/**
 * ARIA state provider — who handles ARIA attributes for a primitive.
 * "coldlight" = ColdLight owns ARIA directly (DEFAULT).
 * "meltui" = MeltUI adapter handles ARIA (exception only, must be justified).
 */
export type AriaStateProvider = "coldlight" | "meltui";

/**
 * Design-system adapter identifier.
 * These are OPTIONAL behavior providers that run UNDER ColdLight.
 * ColdLight is the SSOT and public API — adapters are internal details.
 */
export type AdapterId = "meltui";

/** Tailwind v4 @theme namespace mapping for a token category */
type ThemeMapping = Readonly<{
	namespace: string;
	prefix: string | null;
}>;

/**
 * SD5 output platform — one per build target.
 * Matches Style Dictionary v5's PlatformConfig shape (simplified).
 * ColdLight names: css, theme, types.
 */
type TokenPlatform = Readonly<{
	enabled: boolean;
	output: string;
}>;

export type ColdLightConfig = Readonly<{
	identity: Readonly<{
		systemId: SystemId;
		packageName: string;
		version: string;
	}>;

	roots: Readonly<{
		/** Absolute or repo-relative base used by build tools */
		designRoot: string;
		/** The api/ folder (adapters live under api/adapters/) */
		apiRoot: string;
		/** Primitives root — scanner walks this for kind discovery + contract loading */
		primitivesRoot: string;
		/** Styled component folders (primitives + recipes = components) */
		componentsRoot: string;
		/** ColdLight-owned builders (headless ARIA+behavior for coldlight-owned kinds) */
		buildersRoot: string;
		/** Recipe definitions — styling patterns per component kind */
		recipesRoot: string;
		/** Generated output (manifest, imports) */
		generatedRoot: string;
	}>;

	adapters: Readonly<{
		/** Which adapters are enabled (optional fallbacks) */
		enabled: Readonly<Record<AdapterId, true>>;
		/** The active adapter available for ARIA delegation */
		active: AdapterId;
		/** DEFAULT ARIA provider — "coldlight" unless per-primitive contract overrides */
		ariaStateProvider: AriaStateProvider;
	}>;

	generation: Readonly<{
		categories: Readonly<Record<CategoryId, { enabled: boolean }>>;
		outputs: Readonly<{
			manifestJson: string;
			importsTs: string;
		}>;
	}>;

	enforcement: Readonly<{
		mode: "strict";
		failOnParity: true;
		failOnContractLoad: true;
		lefthook: Readonly<{
			enabled: boolean;
			verifyCmd: string;
		}>;
	}>;

	attributes: Readonly<{
		kind: "data-kind";
		slot: "data-slot";
		state: "data-state";
		id: "data-id";
	}>;

	/** Testing configuration — enforced by scanner and CI */
	testing: Readonly<{
		/** Vitest browser tests required for every primitive */
		vitest: Readonly<{
			enabled: boolean;
			/** Test file pattern relative to primitive/component folder */
			filePattern: string;
			/** Browser provider */
			browser: "chromium" | "firefox" | "webkit";
		}>;
		/** Playwright E2E for critical flows */
		playwright: Readonly<{
			enabled: boolean;
		}>;
		/** Scanner flags missing test files */
		scannerEnforced: boolean;
	}>;

	/** Component (styled semantic) folder configuration */
	components: Readonly<{
		/** Root path for component folders */
		root: string;
		/** Required files in each component folder */
		requiredFiles: readonly string[];
		/** Scanner enforces folder parity */
		scannerEnforced: boolean;
	}>;

	/** Style Dictionary v5 token pipeline configuration */
	tokens: Readonly<{
		sdVersion: number;
		sources: Readonly<{
			globals: string;
			semantic: string;
			components: string;
		}>;
		dtcg: Readonly<{
			output: string;
			formatVersion: string;
		}>;
		/** SD5 output platforms — ColdLight's 3 build targets */
		platforms: Readonly<{
			/** CSS custom properties → :root { --token: val; } */
			css: TokenPlatform;
			/** Tailwind v4 @theme block → @theme { --color-*: oklch(...); } */
			theme: TokenPlatform;
			/** TypeScript constants + union types */
			types: TokenPlatform;
		}>;
		/** @theme namespace mappings — SSOT for Tailwind v4 integration */
		themeMappings: Readonly<Record<string, ThemeMapping>>;
	}>;
}>;
