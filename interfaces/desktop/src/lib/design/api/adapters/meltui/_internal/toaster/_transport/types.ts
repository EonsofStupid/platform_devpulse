/**
 * @file api/adapters/meltui/_internal/toaster/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the MeltUI toaster adapter.
 * Maps melt v0.44 Toaster API → ColdLight slot vocabulary.
 *
 * Slots managed by melt: root (on toaster), content/title/description/close (per toast)
 * States: toasts (array of ToastTransport)
 *
 * Each toast exposes its own slots and lifecycle methods.
 */

import type {
	SlotAttrs,
	TransportAdapter,
} from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";

// =============================================================================
// TOAST TRANSPORT — per-toast interface
// =============================================================================

export interface ToastTransport {
	/** Unique toast identifier */
	readonly id: string;
	/** Slot attrs for the toast content wrapper */
	readonly content: SlotAttrs;
	/** Slot attrs for the toast title element */
	readonly title: SlotAttrs;
	/** Slot attrs for the toast description element */
	readonly description: SlotAttrs;
	/** Slot attrs for the close button */
	readonly close: SlotAttrs;
	/** Progress percentage (0-100) for timed auto-dismiss */
	readonly percentage: number;
	/** Remove this toast from the toaster */
	removeSelf(): void;
	/** Pause auto-dismiss timer */
	pause(): void;
	/** Resume auto-dismiss timer */
	resume(): void;
	/** Reset auto-dismiss timer */
	reset(): void;
}

// =============================================================================
// TRANSPORT STATES
// =============================================================================

export interface ToasterTransportStates {
	/** Currently active toasts */
	readonly toasts: readonly ToastTransport[];
}

// =============================================================================
// TRANSPORT CONFIG
// =============================================================================

export interface ToasterTransportConfig {
	/** Default duration in ms before auto-dismiss. @default 5000 */
	duration?: number;
	/** Default toast type. @default "foreground" */
	type?: "foreground" | "background";
	/** Delay in ms before removing dismissed toast from DOM. @default 300 */
	closeDelay?: number;
}

// =============================================================================
// TRANSPORT ADAPTER
// =============================================================================

/**
 * ColdLight toaster transport — the public contract for the melt toaster adapter.
 *
 * Slots (melt-managed): root
 * States: toasts (array of ToastTransport)
 * Methods: addToast(data) — creates a new toast
 */
export type ToasterTransport<T = unknown> = TransportAdapter<
	"root",
	ToasterTransportStates
> & {
	readonly slots: {
		readonly root: SlotAttrs;
	};
	/** Add a new toast with the given data payload */
	addToast(data: T): void;
};
