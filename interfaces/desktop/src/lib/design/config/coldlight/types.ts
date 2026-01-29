/**
 * @file ColdLight Configuration Types
 * @package @devpulse/coldlight
 */

export type ColdLightSystemId = "coldlight";

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
     * The design-system adapter providing ARIA + state behavior
     * under ColdLight's public surface.
     * ColdLight is always the SSOT — not listed here.
     */
    dsAdapter: string;
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
