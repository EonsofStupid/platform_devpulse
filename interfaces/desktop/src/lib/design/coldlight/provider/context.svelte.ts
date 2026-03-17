/**
 * ColdLight theme context.
 *
 * Svelte 5 context for provider-controlled theming.
 * Components read theme values via getColdLightTheme().
 * The provider sets theme values via setColdLightTheme().
 *
 * This is ColdLight's equivalent of React Spectrum's Provider.
 */

import { getContext, setContext } from "svelte";
import type { ColdLightTheme } from "./types.js";

const CTX_KEY = Symbol("coldlight:theme");

const DEFAULT_THEME: ColdLightTheme = {
	accent: "teal",
	colorScheme: "dark",
	neumorphism: true,
	animations: true,
	scale: 1,
};

/** Set the ColdLight theme in Svelte context. Call from Provider component. */
export function setColdLightTheme(theme: Partial<ColdLightTheme>): ColdLightTheme {
	const merged: ColdLightTheme = { ...DEFAULT_THEME, ...theme };
	setContext(CTX_KEY, merged);
	return merged;
}

/** Get the ColdLight theme from Svelte context. Call from any child component. */
export function getColdLightTheme(): ColdLightTheme {
	return getContext<ColdLightTheme>(CTX_KEY) ?? DEFAULT_THEME;
}

/** The default theme values. */
export { DEFAULT_THEME };
