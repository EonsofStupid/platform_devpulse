/**
 * @file api/adapters/meltui/_internal/tooltip/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the MeltUI tooltip adapter.
 * Maps melt v0.44 Tooltip API → ColdLight slot vocabulary.
 *
 * Slots managed by melt: trigger, content, arrow
 *
 * The `refs` object exposes melt's attachment API for DOM registration.
 * Components use: `use:transport.refs.attach("trigger")` on the trigger element.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 */

import type { Attachment } from "svelte/attachments";
import type {
	SlotAttrs,
	TransportAdapter,
} from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";

// =============================================================================
// TRANSPORT STATES
// =============================================================================

export interface TooltipTransportStates {
	/** Whether the tooltip is currently open */
	open: boolean;
}

// =============================================================================
// TRANSPORT REFS — Svelte attachment protocol for DOM registration
// =============================================================================

export interface TooltipTransportRefs {
	/** Attach to the trigger element. Enables hover/focus tracking. */
	trigger: () => Attachment<HTMLElement>;
	/** Attach to the tooltip content element. Required for positioning. */
	content: () => Attachment<HTMLElement>;
}

// =============================================================================
// TRANSPORT CONFIG
// =============================================================================

export interface TooltipTransportConfig {
	/** Delay in ms before the tooltip opens on hover. */
	openDelay?: number;
	/** Delay in ms before the tooltip closes after leaving. */
	closeDelay?: number;
	/** Initial open state. Pass a getter for controlled mode. */
	open?: boolean | (() => boolean);
	/** Called when open state changes. */
	onOpenChange?: (value: boolean) => void;
	/** Whether to close the tooltip when pointer is pressed down. @default true */
	closeOnPointerDown?: boolean;
	/** Whether to disable hoverable content (tooltip closes when leaving trigger). @default false */
	disableHoverableContent?: boolean;
	/** Whether to force the tooltip visible regardless of hover state. @default false */
	forceVisible?: boolean;
}

// =============================================================================
// TRANSPORT ADAPTER
// =============================================================================

/**
 * ColdLight tooltip transport — the public contract for the melt tooltip adapter.
 *
 * Slots (melt-managed): trigger, content, arrow
 * States: open
 * Refs: Svelte attachments for DOM lifecycle
 */
export type TooltipTransport = TransportAdapter<
	"trigger" | "content" | "arrow",
	TooltipTransportStates
> & {
	/** Svelte attachment protocol — use these on the corresponding DOM elements */
	readonly refs: TooltipTransportRefs;
	readonly slots: {
		readonly trigger: SlotAttrs;
		readonly content: SlotAttrs;
		readonly arrow: SlotAttrs;
	};
};
