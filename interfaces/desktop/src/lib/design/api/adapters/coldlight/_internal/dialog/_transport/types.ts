import type { DialogSlot } from "$lib/design/taxonomy/kinds/primitives/dialog/types.js";
import type { SlotAttrs, TransportAdapter } from "../../_transport/types.js";

export interface DialogTransportStates {
	open: boolean;
}

export type DialogTransport = TransportAdapter<
	Exclude<DialogSlot, "root">,
	DialogTransportStates
>;

export interface DialogTransportConfig {
	open?: boolean;
	onOpenChange?: (value: boolean) => void;
	closeOnEscape?: boolean;
	closeOnOutsideClick?: boolean;
	preventScroll?: boolean;
}

export interface DialogAttachments {
	attachContent: (node: HTMLDialogElement) => { destroy(): void };
	attachOverlay: (node: HTMLElement) => { destroy(): void };
	attachTrigger: (node: HTMLElement) => { destroy(): void };
}
