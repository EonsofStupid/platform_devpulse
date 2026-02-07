/**
 * @file ColdLight Adapters
 * @package @devpulse/coldlight
 *
 * Declares the design-system adapter that provides
 * ARIA + state behavior under ColdLight's public surface.
 *
 * ColdLight is always the SSOT — it is the system, not an adapter.
 */

export const ADAPTERS = {
	enabled: { meltui: true },
	active: "meltui",
	ariaStateProvider: "meltui",
} as const;
