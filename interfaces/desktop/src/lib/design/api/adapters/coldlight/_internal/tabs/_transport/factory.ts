/**
 * @file ColdLight Tabs Transport Factory
 * @description Creates typed transport from ColdLightTabs implementation.
 * Maps internal class → ColdLight slot vocabulary.
 */

import { ColdLightTabs } from "../tabs.svelte.js";
import type { TabsActions, TabsTransport, TabsTransportConfig } from "./types.js";

export function createTabsTransport(config?: TabsTransportConfig): TabsTransport & TabsActions {
	const valueGetter = config?.value;
	const tabs = new ColdLightTabs({
		value: valueGetter,
		onValueChange: config?.onValueChange,
		orientation: config?.orientation,
		activateOnFocus: config?.activateOnFocus,
		loop: config?.loop,
	});

	return {
		slots: {
			get root() {
				return tabs.root;
			},
			get list() {
				return tabs.list;
			},
		},
		states: {
			get value() {
				return tabs.value;
			},
			set value(v: string) {
				tabs.value = v;
			},
			get orientation() {
				return tabs.orientation;
			},
		},
		getTrigger: (value, disabled?) => tabs.getTrigger(value, disabled),
		getContent: (value) => tabs.getContent(value),
	};
}
