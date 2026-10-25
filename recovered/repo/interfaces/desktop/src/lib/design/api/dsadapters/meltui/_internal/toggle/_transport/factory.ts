/**
 * @file api/adapters/meltui/_internal/toggle/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight toggle transport from melt v0.44 Toggle.
 * Maps melt Toggle getters → ColdLight slot vocabulary.
 *
 * Slot mapping:
 *   melt toggle.trigger → slots.trigger (aria-pressed, data-melt-*, onclick)
 */

import type { SlotAttrs } from "$lib/design/api/dsadapters/coldlight/_internal/_transport/types.js";
import { createMeltToggle } from "../factory.js";
import type { ToggleTransport, ToggleTransportConfig } from "./types.js";

/**
 * Create a ColdLight toggle transport wrapping melt v0.44 Toggle.
 *
 * Usage in component:
 * ```svelte
 * const transport = createToggleTransport({ value: false });
 *
 * <button {...transport.slots.trigger}>Toggle me</button>
 * ```
 */
export function createToggleTransport(config?: ToggleTransportConfig): ToggleTransport {
	const toggle = createMeltToggle({
		value: config?.value,
		onValueChange: config?.onValueChange,
		disabled: config?.disabled,
	});

	return {
		slots: {
			get trigger(): SlotAttrs {
				return toggle.trigger as unknown as SlotAttrs;
			},
		},
		states: {
			get pressed(): boolean {
				return toggle.value;
			},
			set pressed(v: boolean) {
				toggle.value = v;
			},
		},
	};
}
