/**
 * @file ColdLight Configuration Types
 * @package @devpulse/coldlight
 */

export type ColdLightSystemId = "coldlight";

/**
 * AdapterId is derived from the adapter map keys (not const arrays).
 * Add new adapters by adding keys to ADAPTERS in adapters.cfg.ts.
 */
export type AdapterId = string & { readonly __brand: "AdapterId" };

/**
 * CategoryId is the hub grouping (primitives/semantics/composites).
 * Individual things inside a category are "kinds" (e.g., dialog, tabs).
 */
export type CategoryId = "primitives" | "semantics" | "composites";

export type ColdLightConfig = Readonly<{
  identity: Readonly<{
    systemId: ColdLightSystemId;
    packageName: string;
    version: string;
  }>;

  roots: Readonly<{
    /** Absolute or repo-relative base used by build tools */
    designRoot: string;
    taxonomyRoot: string;
    apiAdaptersRoot: string;
    primitivesRoot: string;
    generatedRoot: string;
  }>;

  adapters: Readonly<{
    /**
     * Enabled adapters for this project. Start with meltui only.
     * Additional adapters are enabled later by adding them to ADAPTERS and listing them here.
     */
    enabled: readonly string[];
    /** Default active adapter at runtime (initial selection) */
    defaultActive: string;
    /** Adapter providing ARIA + state builders (meltui now) */
    ariaStateProvider: string;
  }>;

  generation: Readonly<{
    categories: Readonly<Record<CategoryId, { enabled: boolean }>>;
    outputs: Readonly<{
      manifestJsonPath: string;
      importsPath: string;
      cssPath: string;
    }>;
  }>;

  enforcement: Readonly<{
    mode: "strict";
    failOnParity: true;
    failOnContractLoad: true;
    lefthook: Readonly<{
      enabled: boolean;
      verifyScript: string;
    }>;
  }>;

  attributes: Readonly<{
    kind: "data-kind";
    slot: "data-slot";
    state: "data-state";
    id: "data-id";
  }>;
}>;
