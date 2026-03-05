/**
 * @file api/adapters/meltui/_internal/tooltip/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight tooltip transport from melt v0.44 Tooltip.
 * Maps melt Tooltip getters → ColdLight slot vocabulary.
 *
 * Melt v0.44 Tooltip exposes direct getter properties:
 *   tooltip.trigger → slots.trigger (aria-describedby, data-melt-*)
 *   tooltip.content → slots.content (role="tooltip", popover="manual", data-melt-*)
 *   tooltip.arrow   → slots.arrow   (data-arrow, aria-hidden, data-melt-*)
 *
 * No .refs API — melt uses Popover API (popovertarget) for positioning.
 */

import type { SlotAttrs } from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";
import { createMeltTooltip } from "../factory.js";
import type { TooltipTransport, TooltipTransportConfig } from "./types.js";

/**
 * Create a ColdLight tooltip transport wrapping melt v0.44 Tooltip.
 *
 * Usage in component:
 * ```svelte
 * const transport = createTooltipTransport({ openDelay: 200 });
 *
 * <button {...transport.slots.trigger}>Hover me</button>
 * {#if transport.states.open}
 *   <div {...transport.slots.content}>
 *     Tooltip text
 *     <div {...transport.slots.arrow}></div>
 *   </div>
 * {/if}
 * ```
 */
export function createTooltipTransport(config?: TooltipTransportConfig): TooltipTransport {
	const tooltip = createMeltTooltip({
		openDelay: config?.openDelay,
		closeDelay: config?.closeDelay,
		open: config?.open,
		onOpenChange: config?.onOpenChange,
		closeOnPointerDown: config?.closeOnPointerDown,
		disableHoverableContent: config?.disableHoverableContent,
		forceVisible: config?.forceVisible,
		floatingConfig: config?.floatingConfig,
	});

	return {
		slots: {
			get trigger(): SlotAttrs {
				return tooltip.trigger as unknown as SlotAttrs;
			},
			get content(): SlotAttrs {
				return tooltip.content as unknown as SlotAttrs;
			},
			get arrow(): SlotAttrs {
				return tooltip.arrow as unknown as SlotAttrs;
			},
		},
		states: {
			get open(): boolean {
				return tooltip.open;
			},
			set open(v: boolean) {
				tooltip.open = v;
			},
		},
	};
}
