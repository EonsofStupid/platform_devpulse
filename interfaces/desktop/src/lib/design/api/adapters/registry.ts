/**
 * @file Adapter Registry
 * @description Runtime registry shape for ColdLight Inversion of Control.
 *
 * ColdLight is always SSOT. The dsAdapter (declared in config) is the
 * behavior provider that secretly runs under ColdLight's public surface.
 */

import type { DsAdapterId } from "$lib/design/taxonomy/types";

/**
 * Registry shape for adapter IoC.
 */
export interface AdapterRegistry {
  /** ColdLight is always the SSOT public surface */
  ssot: "coldlight";

  /** The dsAdapter providing ARIA/state behavior */
  dsAdapter: DsAdapterId;

  /** Mapping of ColdLight primitives to provider methods */
  mappings: {
    [primitiveKind: string]: {
      /** Provider package source (e.g., "@melt-ui/svelte") */
      providerSource: string;
      /** Internal mapping folder path */
      internalPath: string;
      /** Requirements this mapping must satisfy */
      requirements: {
        states: readonly string[];
        aria: readonly string[];
      };
    };
  };
}

/**
 * Default registry configuration.
 */
export const defaultRegistry: AdapterRegistry = {
  ssot: "coldlight",
  dsAdapter: "meltui",
  mappings: {},
};
