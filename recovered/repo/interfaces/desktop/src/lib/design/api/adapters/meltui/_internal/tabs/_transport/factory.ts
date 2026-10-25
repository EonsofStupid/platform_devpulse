/**
 * @file api/adapters/meltui/_internal/tabs/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight tabs transport from melt v0.44 Tabs.
 * Maps melt Tabs getters → ColdLight slot vocabulary.
 *
 * Slot mapping:
 *   melt tabs.triggerList       → slots.list
 *   melt tabs.getTrigger(value) → slots.getTrigger(value)  [PARAMETERIZED]
 *   melt tabs.getContent(value) → slots.getContent(value)  [PARAMETERIZED]
 *
 * State mapping:
 *   melt tabs.value             → states.value (get/set)
 */

import type { SlotAttrs } from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";
import { createMeltTabs } from "../factory.js";
import type { TabsTransport, TabsTransportConfig } from "./types.js";

/**
 * Create a ColdLight tabs transport wrapping melt v0.44 Tabs.
 *
 * The `config.value` is REQUIRED — tabs must always have an active value.
 *
 * Usage in root component:
 * ```svelte
 * const transport = createTabsTransport({ value: "account" });
 * setTabsContext({ transport });
 * ```
 *
 * Usage in sub-components via context:
 * ```svelte
 * const { transport } = getTabsContext();
 * // In TabsList:
 * <div {...transport.slots.list}>
 * // In TabsTrigger (props.value = "account"):
 * <button {...transport.slots.getTrigger(props.value)}>
 * // In TabsContent (props.value = "account"):
 * <div {...transport.slots.getContent(props.value)}>
 * ```
 */
export function createTabsTransport<T extends string = string>(
	config: TabsTransportConfig<T>,
): TabsTransport<T> {
	const tabs = createMeltTabs<T>({
		value: config.value,
		onValueChange: config.onValueChange,
		selectWhenFocused: config.selectWhenFocused,
		loop: config.loop,
		orientation: config.orientation,
	});

	return {
		slots: {
			get list(): SlotAttrs {
				return tabs.triggerList as unknown as SlotAttrs;
			},
			getTrigger: (value: T): SlotAttrs => {
				return tabs.getTrigger(value) as unknown as SlotAttrs;
			},
			getContent: (value: T): SlotAttrs => {
				return tabs.getContent(value) as unknown as SlotAttrs;
			},
		},
		states: {
			get value(): T {
				return tabs.value;
			},
			set value(v: T) {
				tabs.value = v;
			},
		},
	};
}
