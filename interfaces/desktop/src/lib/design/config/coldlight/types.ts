/**
 * @file ColdLight Configuration Types
 * @package @devpulse/coldlight
 */

export type SystemId = "coldlight";

/**
 * CategoryId is the hub grouping (primitives/semantics/composites).
 * Individual things inside a category are "kinds" (e.g., dialog, tabs).
 */
export type CategoryId = "primitives" | "semantics" | "composites";

/**
 * Design-system adapter identifier.
 * These are the behavior providers that run under ColdLight.
 * ColdLight itself is the SSOT system, not an adapter.
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
		generatedRoot: string;
	}>;

	adapters: Readonly<{
		/** Which adapters are enabled */
		enabled: Readonly<Record<AdapterId, true>>;
		/** The active adapter providing ARIA + state behavior */
		active: AdapterId;
		/** Who provides ARIA state builders */
		ariaStateProvider: AdapterId;
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
