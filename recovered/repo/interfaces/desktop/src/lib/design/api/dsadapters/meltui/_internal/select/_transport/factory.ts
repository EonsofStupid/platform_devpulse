/**
 * @file api/adapters/meltui/_internal/select/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight select transport from melt v0.44 Select.
 * Maps melt Select getters → ColdLight slot vocabulary.
 *
 * Melt v0.44 Select extends BasePopover and exposes direct getter properties:
 *   select.trigger       → slots.trigger  (popovertarget, aria-expanded, data-melt-*)
 *   select.content       → slots.content  (role=listbox, popover="manual", data-melt-*)
 *   select.label         → slots.label    (for, onclick, data-melt-*)
 *   select.getOption(v)  → item(v)        (role=option, aria-selected, data-melt-*)
 *   ColdLight structural → slots.group
 *
 * No .refs API — melt uses Popover API (popovertarget) for positioning.
 */

import type { SlotAttrs } from "$lib/design/api/dsadapters/coldlight/_internal/_transport/types.js";
import { createMeltSelect } from "../factory.js";
import type { SelectTransport, SelectTransportConfig } from "./types.js";

/**
 * Create a ColdLight select transport wrapping melt v0.44 Select.
 *
 * Usage in component:
 * ```svelte
 * const transport = createSelectTransport<string>({ value: "apple" });
 *
 * <label {...transport.slots.label}>Fruit</label>
 * <button {...transport.slots.trigger}>
 *   {transport.states.value}
 * </button>
 * <div {...transport.slots.content}>
 *   <div {...transport.item("apple")}>Apple</div>
 *   <div {...transport.item("banana")}>Banana</div>
 * </div>
 * ```
 */
export function createSelectTransport<T = unknown>(
	config?: SelectTransportConfig<T>,
): SelectTransport<T> {
	const select = createMeltSelect<T, false>({
		value: config?.value,
		onValueChange: config?.onValueChange as
			| ((value: T | undefined) => void)
			| undefined,
		open: config?.open,
		onOpenChange: config?.onOpenChange,
		floatingConfig: config?.floatingConfig,
		typeaheadTimeout: config?.typeaheadTimeout,
	});

	return {
		slots: {
			get trigger(): SlotAttrs {
				return select.trigger as unknown as SlotAttrs;
			},
			get content(): SlotAttrs {
				return select.content as unknown as SlotAttrs;
			},
			get label(): SlotAttrs {
				return select.label as unknown as SlotAttrs;
			},
			// Structural slot — no melt behavior, ColdLight owns this
			get group(): SlotAttrs {
				return { role: "group" };
			},
		},
		states: {
			get open(): boolean {
				return select.open;
			},
			set open(v: boolean) {
				select.open = v;
			},
			get value(): T | undefined {
				return select.value as T | undefined;
			},
			set value(v: T | undefined) {
				select.value = v as typeof select.value;
			},
			get highlighted(): T | null {
				return select.highlighted;
			},
			set highlighted(v: T | null) {
				select.highlighted = v;
			},
		},
		item(value: T, label?: string): SlotAttrs {
			return select.getOption(value, label) as unknown as SlotAttrs;
		},
	};
}
