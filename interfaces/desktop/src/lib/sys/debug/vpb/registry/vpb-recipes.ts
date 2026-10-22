/**
 * @file VPB recipes — the base styles a block node can start from
 * @layer vpb
 * @package @devpulse/sys
 *
 * A node's `recipe` is its base style: `{kind}-default` (what
 * `createBlockNode` writes) or a preset from ColdLight's library. Presets
 * fit every kind, so every kind offers the same list after its default.
 *
 * Replaces the per-kind recipe registry (`$lib/design/recipes`, deleted in
 * 0020c1f4); its recipes were per-kind style variants, which presets are now.
 */

import { ALL_PRESETS } from "@devpulse/coldlight/presets";

export interface VpbRecipe {
	readonly id: string;
	readonly label: string;
	readonly description?: string;
}

/** The recipes a kind offers: its default, then every library preset. */
export function recipesForKind(kind: string): readonly VpbRecipe[] {
	return [
		{ id: `${kind}-default`, label: "Default", description: `The ${kind} component's own default` },
		...ALL_PRESETS.map((p) => ({ id: p.id, label: p.label, description: p.description })),
	];
}
