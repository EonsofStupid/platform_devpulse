/**
 * @file ColdLight Tabs Transport Types
 * @description Transport adapter types for ColdLight-native tabs.
 *
 * Static slots: root, list (via TransportAdapter)
 * Parameterized slots: trigger, content (via TabsActions)
 */

import type { SlotAttrs, TransportAdapter } from "../../_transport/types.js";

export interface TabsTransportStates {
	value: string;
	readonly orientation: "horizontal" | "vertical";
}

export type TabsTransport = TransportAdapter<"root" | "list", TabsTransportStates>;

export interface TabsActions {
	getTrigger(value: string, disabled?: boolean): SlotAttrs;
	getContent(value: string): SlotAttrs;
}

export interface TabsTransportConfig {
	value?: string;
	onValueChange?: (value: string) => void;
	orientation?: "horizontal" | "vertical";
	activateOnFocus?: boolean;
	loop?: boolean;
}
