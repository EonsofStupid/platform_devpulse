/**
 * @file api/adapters/meltui/_internal/radiogroup/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight radio group transport from melt v0.44 RadioGroup.
 * Maps melt RadioGroup getters → ColdLight slot vocabulary.
 *
 * Slot mapping:
 *   melt radiogroup.root        → slots.root        (role=radiogroup, data-melt-*)
 *   melt radiogroup.label       → slots.label       (id, data-melt-*)
 *   melt radiogroup.hiddenInput → slots.hiddenInput  (type=radio, hidden, data-melt-*)
 *   melt radiogroup.item(v)     → item(v)           (role=radio, aria-checked, data-melt-*)
 *
 * Ref mapping:
 *   melt radiogroup.refs.attach("root") → refs.root()
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
 * <div {...transport.slots.root} use:transport.refs.root()>
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
		refs: {
			root: () => radiogroup.refs.attach("root"),
		},
		item(value: string): SlotAttrs {
			return radiogroup.item(value) as unknown as SlotAttrs;
		},
	};
}
