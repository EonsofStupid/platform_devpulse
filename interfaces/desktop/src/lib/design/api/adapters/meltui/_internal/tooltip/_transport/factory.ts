/**
 * @file api/adapters/meltui/_internal/tooltip/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight tooltip transport from melt v0.44 Tooltip.
 * Maps melt Tooltip getters → ColdLight slot vocabulary.
 *
 * Slot mapping:
 *   melt tooltip.trigger → slots.trigger (aria-describedby, data-melt-*)
 *   melt tooltip.content → slots.content (role="tooltip", data-melt-*)
 *   melt tooltip.arrow   → slots.arrow   (data-melt-*)
 *
 * Ref mapping:
 *   melt tooltip.refs.attach("trigger") → refs.trigger()
 *   melt tooltip.refs.attach("content") → refs.content() ← REQUIRED for positioning
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
 * <button {...transport.slots.trigger} use:transport.refs.trigger()>Hover me</button>
 * {#if transport.states.open}
 *   <div {...transport.slots.content} use:transport.refs.content()>
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
		refs: {
			trigger: () => tooltip.refs.attach("trigger"),
			content: () => tooltip.refs.attach("content"),
		},
	};
}
