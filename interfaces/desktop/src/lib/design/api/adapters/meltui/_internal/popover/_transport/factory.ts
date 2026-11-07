/**
 * @file api/adapters/meltui/_internal/popover/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight popover transport from melt v0.44 Popover.
 * Maps melt Popover getters → ColdLight slot vocabulary.
 *
 * Melt v0.44 Popover exposes direct getter properties:
 *   popover.trigger → slots.trigger  (onclick, popovertarget, onfocus, data-melt-*)
 *   popover.content → slots.content  (popover="manual", inert, data-open, ontoggle, data-melt-*)
 *   popover.arrow   → slots.arrow    (data-arrow, aria-hidden, data-open, data-melt-*)
 *
 * No .refs API — melt uses Popover API (popovertarget) for positioning.
 *
 * WAI-ARIA: Non-modal dialog pattern. Trigger has popovertarget linking to content.
 */

import type { SlotAttrs } from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";
import { createMeltPopover } from "../factory.js";
import type { PopoverTransport, PopoverTransportConfig } from "./types.js";

/**
 * Create a ColdLight popover transport wrapping melt v0.44 Popover.
 *
 * Usage in component:
 * ```svelte
 * const transport = createPopoverTransport({ open: false });
 *
 * <button {...transport.slots.trigger}>Toggle</button>
 * <div {...transport.slots.content}>
 *   <div {...transport.slots.arrow}></div>
 *   Popover content here
 * </div>
 * ```
 */
export function createPopoverTransport(config?: PopoverTransportConfig): PopoverTransport {
	const popover = createMeltPopover({
		open: config?.open,
		onOpenChange: config?.onOpenChange,
		forceVisible: config?.forceVisible,
		sameWidth: config?.sameWidth,
		closeOnEscape: config?.closeOnEscape,
		closeOnOutsideClick: config?.closeOnOutsideClick,
		floatingConfig: config?.floatingConfig,
	});

	return {
		slots: {
			get trigger(): SlotAttrs {
				return popover.trigger as unknown as SlotAttrs;
			},
			get content(): SlotAttrs {
				return popover.content as unknown as SlotAttrs;
			},
			get arrow(): SlotAttrs {
				return popover.arrow as unknown as SlotAttrs;
			},
		},
		states: {
			get open(): boolean {
				return popover.open;
			},
			set open(v: boolean) {
				popover.open = v;
			},
		},
		close() {
			popover.open = false;
		},
	};
}
