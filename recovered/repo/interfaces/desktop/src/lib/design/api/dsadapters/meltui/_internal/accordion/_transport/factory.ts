/**
 * @file api/adapters/meltui/_internal/accordion/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight accordion transport from melt v0.44 Accordion.
 * Maps melt Accordion getters → ColdLight slot vocabulary.
 *
 * Slot mapping:
 *   melt accordion.root       → slots.root
 *   melt accordion.getItem()  → getItem() returning AccordionItemTransport
 *     .heading   → item heading attrs
 *     .trigger   → item trigger attrs (aria-expanded, aria-controls, onclick, onkeydown)
 *     .content   → item content attrs (data-state, data-value)
 */

import type { SlotAttrs } from "$lib/design/api/dsadapters/coldlight/_internal/_transport/types.js";
import { createMeltAccordion } from "../factory.js";
import type {
	AccordionItemTransport,
	AccordionTransport,
	AccordionTransportConfig,
} from "./types.js";

/**
 * Create a ColdLight accordion transport wrapping melt v0.44 Accordion.
 *
 * Usage in component:
 * ```svelte
 * const transport = createAccordionTransport({ multiple: false });
 * const item = transport.getItem({ id: "section-1" });
 *
 * <div {...transport.slots.root}>
 *   <div {...item.slots.heading}>
 *     <button {...item.slots.trigger}>Section 1</button>
 *   </div>
 *   {#if item.states.isExpanded}
 *     <div {...item.slots.content}>Content here</div>
 *   {/if}
 * </div>
 * ```
 */
export function createAccordionTransport(config?: AccordionTransportConfig): AccordionTransport {
	const accordion = createMeltAccordion({
		multiple: config?.multiple,
		disabled: config?.disabled,
		value: config?.value,
		onValueChange: config?.onValueChange as any,
	});

	return {
		slots: {
			get root(): SlotAttrs {
				return accordion.root as unknown as SlotAttrs;
			},
		},
		states: {
			get value() {
				return accordion.value;
			},
			get disabled() {
				return accordion.disabled;
			},
		},
		getItem(meta) {
			const item = accordion.getItem(meta);
			return {
				slots: {
					get heading(): SlotAttrs {
						return item.heading as unknown as SlotAttrs;
					},
					get trigger(): SlotAttrs {
						return item.trigger as unknown as SlotAttrs;
					},
					get content(): SlotAttrs {
						return item.content as unknown as SlotAttrs;
					},
				},
				states: {
					get isExpanded() {
						return item.isExpanded;
					},
					get isDisabled() {
						return item.isDisabled;
					},
				},
				expand: () => item.expand(),
				collapse: () => item.collapse(),
				toggleExpanded: () => item.toggleExpanded(),
			} satisfies AccordionItemTransport;
		},
		isExpanded(id: string) {
			return accordion.isExpanded(id);
		},
	};
}
