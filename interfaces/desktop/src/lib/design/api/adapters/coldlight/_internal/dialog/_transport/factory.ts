import { ColdLightDialog } from "../dialog.svelte.js";
import type { DialogTransport, DialogTransportConfig, DialogAttachments } from "./types.js";

export function createDialogTransport(
	config?: DialogTransportConfig,
): DialogTransport & DialogAttachments {
	const dialog = new ColdLightDialog({
		open: config?.open ? () => config.open! : undefined,
		onOpenChange: config?.onOpenChange,
		closeOnEscape: config?.closeOnEscape,
		closeOnOutsideClick: config?.closeOnOutsideClick,
		preventScroll: config?.preventScroll,
	});

	return {
		slots: {
			get trigger() {
				return dialog.trigger;
			},
			get content() {
				return dialog.content;
			},
			get overlay() {
				return dialog.overlay;
			},
			get portal() {
				return dialog.portal;
			},
			get title() {
				return dialog.title;
			},
			get description() {
				return dialog.description;
			},
			get close() {
				return dialog.close;
			},
		},
		states: {
			get open() {
				return dialog.open;
			},
			set open(v: boolean) {
				dialog.open = v;
			},
		},
		attachContent: (node) => dialog.attachContent(node),
		attachOverlay: (node) => dialog.attachOverlay(node),
		attachTrigger: (node) => dialog.attachTrigger(node),
	};
}
