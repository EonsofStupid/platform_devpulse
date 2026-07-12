/**
 * @file Section — prop types
 * @kind section
 */

import type { Snippet } from "svelte";
import type { PresetId, SemanticIntent } from "$lib/design/visual/preset-id.js";

/**
 * Accent identity for a section — a role accent (bound in app.css to a
 * palette hue, rebindable per app) or one of the 16 palette accents
 * (`--accent-{name}-{main,glow,fill}` triplets emitted by SD5).
 */
export type SectionAccent =
	| "primary"
	| "secondary"
	| "success"
	| "warning"
	| "danger"
	| "muted"
	| "teal"
	| "purple"
	| "magenta"
	| "ember"
	| "frost"
	| "cyber"
	| "cyan"
	| "green"
	| "hotpink"
	| "blue"
	| "coral"
	| "salmon"
	| "gold"
	| "electric"
	| "violet"
	| "azure";

export interface SectionProps {
	/** Uppercase section title, accent-colored. */
	title?: string;
	/** Secondary one-line description rendered beside the title. */
	blurb?: string;
	/**
	 * Accent identity. Rebinds the `--accent-section-{main,glow,fill}`
	 * role trio for this section's subtree — tiles/cards inside read the
	 * trio, so switching a section's hue is this one prop.
	 */
	accent?: SectionAccent;
	/**
	 * Visual preset. `"default"` resolves the kind's inert `@defaults`
	 * (transparent, no chrome) — the normal case. A preset id here skins
	 * the section through the standard renderForge chain.
	 */
	preset?: SemanticIntent | PresetId;
	/**
	 * Opt-in container seam: names this section a `cqi` container
	 * (`container: <name> / inline-size`). Leave unset for ordinary
	 * sections — containers belong at zone boundaries, not every leaf.
	 */
	container?: string;
	/** Right-aligned header actions. */
	actions?: Snippet;
	/** Section body — brings its own chrome (Cards, tiles, grids). */
	children: Snippet;
	/** Extra classes on the root `<section>`. */
	class?: string;
}
