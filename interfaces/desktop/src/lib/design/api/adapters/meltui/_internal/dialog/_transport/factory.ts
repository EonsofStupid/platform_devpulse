/**
 * @file api/adapters/meltui/_internal/dialog/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight dialog transport from melt v0.44 Dialog.
 * Maps melt Dialog getters → ColdLight slot vocabulary.
 *
 * Slot mapping:
 *   melt dialog.trigger  → slots.trigger  (onclick, type, data-open, data-melt-*)
 *   melt dialog.content  → slots.content  (onclose, data-open, data-melt-*)
 *   melt dialog.overlay  → slots.overlay  (popover, aria-hidden, data-open, data-melt-*)
 *   ColdLight structural → slots.portal, slots.title, slots.description, slots.close
 *
 * Ref mapping:
 *   melt dialog.refs.attach("trigger") → refs.trigger()
 *   melt dialog.refs.attach("content") → refs.content()  ← REQUIRED for showModal()
 *   melt dialog.refs.attach("overlay") → refs.overlay()  ← REQUIRED for popover
 */

import type { SlotAttrs } from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";
import { createMeltDialog } from "../factory.js";
import type { DialogTransport, DialogTransportConfig } from "./types.js";

/**
 * Create a ColdLight dialog transport wrapping melt v0.44 Dialog.
 *
 * Usage in component:
 * ```svelte
 * const transport = createDialogTransport({ open: false });
 *
 * <button {...transport.slots.trigger} use:transport.refs.trigger()>Open</button>
 * <dialog {...transport.slots.content} use:transport.refs.content()>
 *   <div {...transport.slots.overlay} use:transport.refs.overlay()></div>
 *   <h2 {...transport.slots.title}>Title</h2>
 *   <p {...transport.slots.description}>Description</p>
 *   <button {...transport.slots.close}>Close</button>
 * </dialog>
 * ```
 */
export function createDialogTransport(config?: DialogTransportConfig): DialogTransport {
	const dialog = createMeltDialog({
		open: config?.open,
		onOpenChange: config?.onOpenChange,
		closeOnEscape: config?.closeOnEscape,
		closeOnOutsideClick: config?.closeOnOutsideClick,
		scrollLock: config?.scrollLock,
	});

	return {
		slots: {
			get trigger(): SlotAttrs {
				return dialog.trigger as unknown as SlotAttrs;
			},
			get content(): SlotAttrs {
				return dialog.content as unknown as SlotAttrs;
			},
			get overlay(): SlotAttrs {
				return dialog.overlay as unknown as SlotAttrs;
			},
			// Structural slots — no melt behavior, ColdLight owns these
			get portal(): SlotAttrs {
				return {};
			},
			get title(): SlotAttrs {
				return {};
			},
			get description(): SlotAttrs {
				return {};
			},
			get close(): SlotAttrs {
				// Native onclick fallback — component layer may override
				return {
					type: "button",
					onclick: () => {
						dialog.open = false;
					},
				};
			},
		},
		states: {
			get open(): boolean {
				return dialog.open;
			},
			set open(v: boolean) {
				dialog.open = v;
			},
		},
		refs: {
			trigger: () => dialog.refs.attach("trigger"),
			content: () => dialog.refs.attach("content"),
			overlay: () => dialog.refs.attach("overlay"),
		},
	};
}
