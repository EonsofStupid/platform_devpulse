/**
 * @file ColdLight Adapters
 * @package @devpulse/coldlight
 *
 * SSOT adapters map (not const arrays).
 * Keys are AdapterIds.
 *
 * Start with meltui only, because that's what exists today.
 */

import type { AdapterId } from "./types.js";

export const ADAPTERS = {
  meltui: {
    id: "meltui",
    label: "Melt UI",
    role: "aria+state",
  },
} as const;

export type AdapterKey = keyof typeof ADAPTERS;

/** Brand AdapterId from keys (keeps AdapterId strict without array unions). */
export const asAdapterId = (id: AdapterKey): AdapterId => id as unknown as AdapterId;
