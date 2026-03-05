/**
 * @file api/adapters/meltui/_internal/radiogroup/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight radio group transport from melt v0.44 RadioGroup.
 * Maps melt RadioGroup getters → ColdLight slot vocabulary.
 *
 * Melt v0.44 RadioGroup exposes direct getter properties:
 *   radiogroup.root        → slots.root        (role=radiogroup, aria-required, data-melt-*)
 *   radiogroup.label       → slots.label       (id, onclick, data-melt-*)
 *   radiogroup.hiddenInput → slots.hiddenInput  (type=radio, hidden, aria-hidden, data-melt-*)
 *   radiogroup.getItem(v).attrs → item(v)      (role=radio, aria-checked, onclick, data-melt-*)
 *
 * No .refs API — melt uses direct event handlers on elements.
 */

import type { SlotAttrs } from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";
import { createMeltRadioGroup } from "../factory.js";
import type { RadioGroupTransport, RadioGroupTransportConfig } from "./types.js";

/**
 * Create a ColdLight radio group transport wrapping melt v0.44 RadioGroup.
 *
 * Usage in component:
 * ```svelte
 * const transport = createRadioGroupTransport({ value: "option1" });
 *
 * <div {...transport.slots.root}>
 *   <span {...transport.slots.label}>Choose an option</span>
 *   <div {...transport.item("option1")}>Option 1</div>
 *   <div {...transport.item("option2")}>Option 2</div>
 *   <input {...transport.slots.hiddenInput} />
 * </div>
 * ```
 */
export function createRadioGroupTransport(
	config?: RadioGroupTransportConfig,
): RadioGroupTransport {
	const radiogroup = createMeltRadioGroup({
		value: config?.value,
		onValueChange: config?.onValueChange,
		disabled: config?.disabled,
		required: config?.required,
		loop: config?.loop,
		selectWhenFocused: config?.selectWhenFocused,
		orientation: config?.orientation,
	});

	return {
		slots: {
			get root(): SlotAttrs {
				return radiogroup.root as unknown as SlotAttrs;
			},
			get label(): SlotAttrs {
				return radiogroup.label as unknown as SlotAttrs;
			},
			get hiddenInput(): SlotAttrs {
				return radiogroup.hiddenInput as unknown as SlotAttrs;
			},
		},
		states: {
			get value(): string {
				return radiogroup.value;
			},
			set value(v: string) {
				radiogroup.value = v;
			},
		},
		item(value: string): SlotAttrs {
			return radiogroup.getItem(value).attrs as unknown as SlotAttrs;
		},
	};
}
