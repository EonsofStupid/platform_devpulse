/**
 * @file api/adapters/meltui/_internal/select/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight select transport from melt v0.44 Select.
 * Maps melt Select getters → ColdLight slot vocabulary.
 *
 * Slot mapping:
 *   melt select.trigger → slots.trigger  (onclick, aria-expanded, aria-haspopup, data-melt-*)
 *   melt select.content → slots.content  (role=listbox, data-open, data-melt-*)
 *   melt select.label   → slots.label    (id, data-melt-*)
 *   melt select.item(v) → item(v)        (role=option, aria-selected, data-melt-*)
 *   ColdLight structural → slots.group
 *
 * Ref mapping:
 *   melt select.refs.attach("trigger") → refs.trigger()
 *   melt select.refs.attach("content") → refs.content()
 */

import type { SlotAttrs } from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";
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
 * <button {...transport.slots.trigger} use:transport.refs.trigger()>
 *   {transport.states.value}
 * </button>
 * <div {...transport.slots.content} use:transport.refs.content()>
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
		onValueChange: config?.onValueChange,
		open: config?.open,
		onOpenChange: config?.onOpenChange,
		positioning: config?.positioning,
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
			get value(): T {
				return select.value;
			},
			set value(v: T) {
				select.value = v;
			},
			get highlighted(): T | null {
				return select.highlighted;
			},
			set highlighted(v: T | null) {
				select.highlighted = v;
			},
		},
		refs: {
			trigger: () => select.refs.attach("trigger"),
			content: () => select.refs.attach("content"),
		},
		item(value: T): SlotAttrs {
			return select.item(value) as unknown as SlotAttrs;
		},
	};
}
