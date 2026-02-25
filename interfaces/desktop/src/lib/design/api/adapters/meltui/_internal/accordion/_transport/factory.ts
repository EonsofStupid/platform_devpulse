/**
 * @file api/adapters/meltui/_internal/accordion/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight accordion transport from melt v0.44 Accordion.
 * Maps melt Accordion getters → ColdLight slot vocabulary.
 *
 * Root slot mapping:
 *   melt accordion.root → slots.root (data-melt-accordion-root, id)
 *
 * Item slot mapping (per getItem()):
 *   melt item.heading → slots.heading (role, aria-level, data-heading-level)
 *   melt item.trigger → slots.trigger (aria-expanded, onclick, onkeydown, data-state)
 *   melt item.content → slots.content (data-state, data-value)
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 */

import type { SlotAttrs } from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";
import { createMeltAccordion } from "../factory.js";
import type {
	AccordionItemMeta,
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
 * const item = transport.getItem({ id: "item-1", headingLevel: 3 });
 *
 * <div {...transport.slots.root}>
 *   <div {...item.slots.heading}>
 *     <button {...item.slots.trigger}>Section 1</button>
 *   </div>
 *   <div {...item.slots.content}>Content here</div>
 * </div>
 * ```
 */
export function createAccordionTransport<Multiple extends boolean = false>(
	config?: AccordionTransportConfig<Multiple>,
): AccordionTransport {
	const accordion = createMeltAccordion({
		multiple: config?.multiple,
		disabled: config?.disabled,
		value: config?.value,
		onValueChange: config?.onValueChange,
	});

	return {
		slots: {
			get root(): SlotAttrs {
				return accordion.root as unknown as SlotAttrs;
			},
		},
		states: {
			get value() {
				return accordion.value as string | string[];
			},
			set value(v: string | string[]) {
				accordion.value = v as typeof accordion.value;
			},
			get disabled(): boolean {
				return accordion.disabled;
			},
			get multiple(): boolean {
				return accordion.multiple;
			},
		},
		getItem<Meta extends Record<string, unknown> = Record<never, never>>(
			meta: AccordionItemMeta<Meta>,
		): AccordionItemTransport {
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
					get isExpanded(): boolean {
						return item.isExpanded;
					},
					get isDisabled(): boolean | undefined {
						return item.isDisabled;
					},
				},
				expand: () => item.expand(),
				collapse: () => item.collapse(),
				toggleExpanded: () => item.toggleExpanded(),
			};
		},
		isExpanded: (id: string) => accordion.isExpanded(id),
		expand: (id: string) => accordion.expand(id),
		collapse: (id: string) => accordion.collapse(id),
		toggleExpanded: (id: string) => accordion.toggleExpanded(id),
	};
}
