/**
 * @file api/adapters/meltui/_internal/collapsible/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight collapsible transport from melt v0.44 Collapsible.
 * Maps melt Collapsible getters → ColdLight slot vocabulary.
 *
 * Slot mapping:
 *   melt collapsible.trigger → slots.trigger (aria-expanded, aria-controls, data-melt-*)
 *   melt collapsible.content → slots.content (data-open, data-melt-*)
 */

import type { SlotAttrs } from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";
import { createMeltCollapsible } from "../factory.js";
import type { CollapsibleTransport, CollapsibleTransportConfig } from "./types.js";

/**
 * Create a ColdLight collapsible transport wrapping melt v0.44 Collapsible.
 *
 * Usage in component:
 * ```svelte
 * const transport = createCollapsibleTransport({ open: false });
 *
 * <button {...transport.slots.trigger}>Toggle</button>
 * {#if transport.states.open}
 *   <div {...transport.slots.content}>
 *     Collapsible content here
 *   </div>
 * {/if}
 * ```
 */
export function createCollapsibleTransport(config?: CollapsibleTransportConfig): CollapsibleTransport {
	const collapsible = createMeltCollapsible({
		open: config?.open,
		onOpenChange: config?.onOpenChange,
		disabled: config?.disabled,
	});

	return {
		slots: {
			get trigger(): SlotAttrs {
				return collapsible.trigger as unknown as SlotAttrs;
			},
			get content(): SlotAttrs {
				return collapsible.content as unknown as SlotAttrs;
			},
		},
		states: {
			get open(): boolean {
				return collapsible.open;
			},
			set open(v: boolean) {
				collapsible.open = v;
			},
		},
	};
}
