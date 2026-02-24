/**
 * @file api/adapters/meltui/_internal/dialog/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the MeltUI dialog adapter.
 * Maps melt v0.44 Dialog API → ColdLight slot vocabulary.
 *
 * Slots managed by melt: trigger, content, overlay
 * Slots structural only (ColdLight): portal, title, description, close
 *
 * The `refs` object exposes melt's attachment API for DOM registration.
 * Components use: `use:transport.refs.attach("content")` on the <dialog> element.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

import type { Attachment } from "svelte/attachments";
import type {
	SlotAttrs,
	TransportAdapter,
} from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";

// =============================================================================
// TRANSPORT STATES
// =============================================================================

export interface DialogTransportStates {
	/** Whether the dialog is currently open */
	open: boolean;
}

// =============================================================================
// TRANSPORT REFS — Svelte attachment protocol for DOM registration
// =============================================================================

export interface DialogTransportRefs {
	/** Attach to the <button> trigger element. Enables open-state tracking. */
	trigger: () => Attachment<HTMLElement>;
	/** Attach to the <dialog> element. Required for showModal()/close() lifecycle. */
	content: () => Attachment<HTMLElement>;
	/** Attach to the overlay element. Required for popover lifecycle. */
	overlay: () => Attachment<HTMLElement>;
}

// =============================================================================
// TRANSPORT CONFIG
// =============================================================================

export interface DialogTransportConfig {
	/** Initial open state. Pass a getter for controlled mode. */
	open?: boolean | (() => boolean);
	/** Called when open state changes. */
	onOpenChange?: (value: boolean) => void;
	/** Whether pressing Escape closes the dialog. @default true */
	closeOnEscape?: boolean | (() => boolean);
	/** Whether clicking outside closes the dialog. @default true */
	closeOnOutsideClick?: boolean | (() => boolean);
	/** Whether to lock document scroll when open. @default true */
	scrollLock?: boolean | (() => boolean);
}

// =============================================================================
// TRANSPORT ADAPTER
// =============================================================================

/**
 * ColdLight dialog transport — the public contract for the melt dialog adapter.
 *
 * Slots (melt-managed): trigger, content, overlay
 * Slots (structural): portal, title, description, close
 * States: open
 * Refs: Svelte attachments for DOM lifecycle
 */
export type DialogTransport = TransportAdapter<
	"trigger" | "content" | "overlay" | "portal" | "title" | "description" | "close",
	DialogTransportStates
> & {
	/** Svelte attachment protocol — use these on the corresponding DOM elements */
	readonly refs: DialogTransportRefs;
	/** Static slot attrs for structural-only slots (no melt behavior needed) */
	readonly slots: {
		readonly trigger: SlotAttrs;
		readonly content: SlotAttrs;
		readonly overlay: SlotAttrs;
		readonly portal: SlotAttrs;
		readonly title: SlotAttrs;
		readonly description: SlotAttrs;
		readonly close: SlotAttrs;
	};
};
