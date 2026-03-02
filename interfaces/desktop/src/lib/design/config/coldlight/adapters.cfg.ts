/**
 * @file ColdLight Adapters
 * @package @devpulse/coldlight
 *
 * Declares the design-system adapter configuration.
 *
 * ColdLight OWNS everything by default. Adapters are OPTIONAL fallbacks
 * used only when ARIA/focus/keyboard complexity genuinely justifies it.
 *
 * DEFAULT ariaStateProvider is "coldlight" — ColdLight handles ARIA directly.
 * MeltUI is available as an adapter for complex widgets (dialog, combobox, etc.)
 * but is NEVER the default authority.
 *
 * ColdLight is always the SSOT and the public API — adapters are internal.
 */

export const ADAPTERS = {
	enabled: { meltui: true },
	/** MeltUI is available but ColdLight is the default owner */
	active: "meltui",
	/** DEFAULT: ColdLight owns ARIA. Per-primitive contracts override to "meltui" when justified */
	ariaStateProvider: "coldlight",
} as const;
/**
 * @file ColdLight Attributes
 * @package @devpulse/coldlight
 */

export const ATTRIBUTES = {
	kind: "data-kind",
	slot: "data-slot",
	state: "data-state",
	id: "data-id",
} as const;
