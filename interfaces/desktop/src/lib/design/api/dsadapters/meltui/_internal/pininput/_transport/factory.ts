/**
 * @file api/adapters/meltui/_internal/pininput/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight pin input transport from melt v0.44 PinInput.
 * Maps melt PinInput getters → ColdLight slot vocabulary.
 *
 * Slot mapping:
 *   melt pininput.root   → slots.root   (data-melt-*)
 *   melt pininput.inputs → slots.inputs (array of per-input attrs with value, oninput, data-melt-*)
 *
 * State mapping:
 *   melt pininput.value    → states.value    (get/set)
 *   melt pininput.isFilled → states.isFilled (readonly)
 */

import type { SlotAttrs } from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";
import { createMeltPinInput } from "../factory.js";
import type { PinInputTransport, PinInputTransportConfig } from "./types.js";

/**
 * Create a ColdLight pin input transport wrapping melt v0.44 PinInput.
 *
 * Usage in component:
 * ```svelte
 * const transport = createPinInputTransport({ maxLength: 6 });
 *
 * <div {...transport.slots.root}>
 *   {#each transport.slots.inputs as inputAttrs}
 *     <input {...inputAttrs} />
 *   {/each}
 * </div>
 * ```
 */
export function createPinInputTransport(config?: PinInputTransportConfig): PinInputTransport {
	const pininput = createMeltPinInput({
		maxLength: config?.maxLength,
		placeholder: config?.placeholder,
		disabled: config?.disabled,
		mask: config?.mask,
		type: config?.type,
		allowPaste: config?.allowPaste,
	});

	return {
		slots: {
			get root(): SlotAttrs {
				return pininput.root as unknown as SlotAttrs;
			},
			get inputs(): readonly SlotAttrs[] {
				return pininput.inputs as unknown as SlotAttrs[];
			},
		},
		states: {
			get value(): string {
				return pininput.value;
			},
			set value(v: string) {
				pininput.value = v;
			},
			get isFilled(): boolean {
				return pininput.isFilled;
			},
		},
	};
}
