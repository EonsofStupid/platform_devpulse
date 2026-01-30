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
}>;
