/**
 * @file ColdLight Adapters
 * @package @devpulse/coldlight
 *
 * dsAdapter declares the design-system adapter that secretly provides
 * ARIA + state behavior under ColdLight's public surface.
 *
 * ColdLight is always the SSOT — it is the system, not an adapter.
 * Only the behavior provider is configurable.
 */

export const ADAPTERS = {
  dsAdapter: "meltui",
} as const;
