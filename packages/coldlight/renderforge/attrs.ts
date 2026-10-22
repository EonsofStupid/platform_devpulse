/**
 * @file styleAttrs — the attributes that select a kind's generated CSS
 * @package @devpulse/coldlight
 *
 * Plan 0006 §0s: a component's look is its kind's generated CSS
 * (`styles/components/kinds/<kind>.css`, from `components/<kind>/<kind>.tokens.json`),
 * selected by data attributes. This returns those attributes and nothing
 * else: no inline custom properties.
 *
 * Pure, like `renderForge` (RENDERFORGE.md P1): same input, same output; no
 * DOM, no framework. Kinds move to it one by one; `renderForge` serves the
 * kinds not yet moved.
 */

/** What a component selects: its kind and its variant, size, tone and family. */
export interface StyleSelection {
	/** The kind; matches the component folder and its tokens file. */
	readonly kind: string;
	readonly variant?: string;
	readonly size?: string;
	readonly tone?: string;
	/** A family for this element's subtree (a scope of one). */
	readonly surface?: string;
}

/** The attributes a styled root spreads. */
export interface StyleAttrs {
	readonly "data-kind": string;
	readonly "data-variant"?: string;
	readonly "data-size"?: string;
	readonly "data-tone"?: string;
	readonly "data-surface"?: string;
}

export function styleAttrs(selection: StyleSelection): StyleAttrs {
	const { kind, variant, size, tone, surface } = selection;
	return {
		"data-kind": kind,
		...(variant ? { "data-variant": variant } : {}),
		...(size ? { "data-size": size } : {}),
		...(tone ? { "data-tone": tone } : {}),
		...(surface ? { "data-surface": surface } : {}),
	};
}
