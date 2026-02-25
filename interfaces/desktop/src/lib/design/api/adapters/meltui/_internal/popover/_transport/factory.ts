/**
 * @file api/adapters/meltui/_internal/popover/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight popover transport from melt v0.44 Popover.
 * Maps melt Popover getters → ColdLight slot vocabulary.
 *
 * Slot mapping:
 *   melt popover.trigger → slots.trigger  (onclick, aria-expanded, data-open, data-melt-*)
 *   melt popover.content → slots.content  (popover, inert, data-open, data-melt-*)
 *   melt popover.arrow   → slots.arrow    (data-arrow, data-melt-*)
 *
 * Ref mapping:
 *   melt popover.refs.attach("trigger") → refs.trigger()
 *   melt popover.refs.attach("content") → refs.content()
 *   melt popover.refs.attach("arrow")   → refs.arrow()
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
 * <button {...transport.slots.trigger} use:transport.refs.trigger()>Toggle</button>
 * <div {...transport.slots.content} use:transport.refs.content()>
 *   <div {...transport.slots.arrow} use:transport.refs.arrow()></div>
 *   Popover content here
 * </div>
 * ```
 */
export function createPopoverTransport(config?: PopoverTransportConfig): PopoverTransport {
	const popover = createMeltPopover({
		open: config?.open,
		onOpenChange: config?.onOpenChange,
		positioning: config?.positioning,
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
		refs: {
			trigger: () => popover.refs.attach("trigger"),
			content: () => popover.refs.attach("content"),
			arrow: () => popover.refs.attach("arrow"),
		},
	};
}
