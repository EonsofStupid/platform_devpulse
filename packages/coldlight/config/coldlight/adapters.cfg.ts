/**
 * @file ColdLight Adapters
 * @package @devpulse/coldlight
 *
 * Declares the design-system adapter configuration.
 *
 * ColdLight OWNS headless behavior end-to-end: ARIA, focus, keyboard, state.
 * Terminology and patterns align with React Spectrum S2; there is no third-party
 * headless runtime in the product stack.
 *
 * ColdLight is always the SSOT and the public API.
 */

export const ADAPTERS = {
	enabled: { coldlight: true },
	active: "coldlight",
	ariaStateProvider: "coldlight",
} as const;
