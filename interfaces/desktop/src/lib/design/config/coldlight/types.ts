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
type TailwindMapping = Readonly<{
	namespace: string;
	prefix: string | null;
}>;

/** Token pipeline platform configuration */
type TokenPlatformCss = Readonly<{
	enabled: boolean;
	output: string;
	prefixes: Readonly<Record<string, string>>;
	tailwindTheme: Readonly<{
		enabled: boolean;
		mappings: Readonly<
			Record<string, TailwindMapping | Readonly<Record<string, TailwindMapping>>>
		>;
	}>;
}>;

type TokenPlatformTs = Readonly<{
	enabled: boolean;
	output: string;
}>;

type TokenPlatformTailwind = Readonly<{
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
		taxonomyRoot: string;
		/** The api/ folder (adapters live under api/adapters/) */
		apiRoot: string;
		primitivesRoot: string;
		/** Styled component folders (primitives + recipes = components) */
		componentsRoot: string;
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
		/** Scanner enforces folder parity with taxonomy */
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
		platforms: Readonly<{
			css: TokenPlatformCss;
			ts: TokenPlatformTs;
			tailwind: TokenPlatformTailwind;
		}>;
	}>;
}>;
