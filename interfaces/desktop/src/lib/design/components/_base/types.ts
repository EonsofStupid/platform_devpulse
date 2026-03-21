/**
 * @file Component Base Types
 * @module @devpulse/coldlight/components/_base/types
 * @layer components
 *
 * Components are DUMB. Structure + ARIA only.
 * Visual treatment comes from StyleMacro at the usage site.
 * Components accept class + children. That's it.
 */

import type { Snippet } from "svelte";

/**
 * Base props for all ColdLight components.
 * class for structural layout + visual classes passed down from StyleMacro.
 * children for content.
 * NO visual props. NO 8-axis. NO preset. NO encoding.
 */
export interface ComponentProps {
	/** CSS classes (structural + visual via StyleMacro) */
	class?: string;
	/** Children snippet */
	children?: Snippet;
}
