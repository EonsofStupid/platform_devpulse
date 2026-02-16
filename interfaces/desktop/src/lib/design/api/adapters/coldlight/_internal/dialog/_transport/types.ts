import type { TransportAdapter } from "../../_transport/types.js";

/** Dialog slot names — will be sourced from central taxonomy contract */
type DialogSlot = "root" | "trigger" | "overlay" | "content" | "title" | "description" | "close" | "portal";

export interface DialogTransportStates {
	open: boolean;
}

export type DialogTransport = TransportAdapter<Exclude<DialogSlot, "root">, DialogTransportStates>;

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
