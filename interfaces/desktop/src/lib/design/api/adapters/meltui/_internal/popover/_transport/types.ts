/**
 * @file api/adapters/meltui/_internal/popover/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the MeltUI popover adapter.
 * Maps melt v0.44 Popover API → ColdLight slot vocabulary.
 *
 * Slots managed by melt: trigger, content, arrow
 * States: open
 *
 * The `refs` object exposes melt's attachment API for DOM registration.
 * Components use: `use:transport.refs.attach("trigger")` on the trigger element.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/popover/
 */

import type { Attachment } from "svelte/attachments";
import type {
	SlotAttrs,
	TransportAdapter,
} from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";

// =============================================================================
// TRANSPORT STATES
// =============================================================================

export interface PopoverTransportStates {
	/** Whether the popover is currently open */
	open: boolean;
}

// =============================================================================
// TRANSPORT REFS — Svelte attachment protocol for DOM registration
// =============================================================================

export interface PopoverTransportRefs {
	/** Attach to the <button> trigger element. Required for positioning anchor. */
	trigger: () => Attachment<HTMLElement>;
	/** Attach to the popover content element. Required for floating positioning. */
	content: () => Attachment<HTMLElement>;
	/** Attach to the arrow element. Required for arrow positioning. */
	arrow: () => Attachment<HTMLElement>;
}

// =============================================================================
// TRANSPORT CONFIG
// =============================================================================

export interface PopoverTransportConfig {
	/** Initial open state. Pass a getter for controlled mode. */
	open?: boolean | (() => boolean);
	/** Called when open state changes. */
	onOpenChange?: (value: boolean) => void;
	/** Floating UI positioning configuration. */
	positioning?: Record<string, unknown>;
}

// =============================================================================
// TRANSPORT ADAPTER
// =============================================================================

/**
 * ColdLight popover transport — the public contract for the melt popover adapter.
 *
 * Slots (melt-managed): trigger, content, arrow
 * States: open
 * Refs: Svelte attachments for DOM lifecycle
 */
export type PopoverTransport = TransportAdapter<
	"trigger" | "content" | "arrow",
	PopoverTransportStates
> & {
	/** Svelte attachment protocol — use these on the corresponding DOM elements */
	readonly refs: PopoverTransportRefs;
	/** Slot attrs for each popover slot */
	readonly slots: {
		readonly trigger: SlotAttrs;
		readonly content: SlotAttrs;
		readonly arrow: SlotAttrs;
	};
};
