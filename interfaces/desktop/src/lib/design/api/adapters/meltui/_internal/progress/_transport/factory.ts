/**
 * @file api/adapters/meltui/_internal/progress/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight progress transport from melt v0.44 Progress.
 * Maps melt Progress getters → ColdLight slot vocabulary.
 *
 * Slot mapping:
 *   melt progress.root     → slots.root      (role="progressbar", aria-valuenow, aria-valuemax, data-melt-*)
 *   melt progress.progress → slots.indicator  (data-value, data-melt-*)
 *
 * Note: melt's `.progress` getter is remapped to ColdLight's `indicator` slot
 * for naming consistency across the design system.
 */

import type { SlotAttrs } from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";
import { createMeltProgress } from "../factory.js";
import type { ProgressTransport, ProgressTransportConfig } from "./types.js";

/**
 * Create a ColdLight progress transport wrapping melt v0.44 Progress.
 *
 * Usage in component:
 * ```svelte
 * const transport = createProgressTransport({ value: 50, max: 100 });
 *
 * <div {...transport.slots.root}>
 *   <div {...transport.slots.indicator} style:width="{transport.states.value}%"></div>
 * </div>
 * ```
 */
export function createProgressTransport(config?: ProgressTransportConfig): ProgressTransport {
	const progress = createMeltProgress({
		max: config?.max,
		value: config?.value,
	});

	return {
		slots: {
			get root(): SlotAttrs {
				return progress.root as unknown as SlotAttrs;
			},
			get indicator(): SlotAttrs {
				return progress.progress as unknown as SlotAttrs;
			},
		},
		states: {
			get value(): number {
				return progress.value;
			},
			set value(v: number) {
				progress.value = v;
			},
			get max(): number {
				return progress.max;
			},
		},
	};
}
