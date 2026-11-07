/**
 * @file api/adapters/meltui/_internal/pininput/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the MeltUI pin input adapter.
 * Maps melt v0.44 PinInput API → ColdLight slot vocabulary.
 *
 * Slots managed by melt: root, inputs (array of per-input attrs)
 * States: value (string), isFilled (boolean)
 *
 * Note: PinInput.inputs returns an array of attr objects (one per digit).
 * The TransportAdapter base only uses "root" since "inputs" is an array
 * extension, not a single SlotAttrs.
 */

import type {
	SlotAttrs,
	TransportAdapter,
} from "$lib/design/api/dsadapters/coldlight/_internal/_transport/types.js";

// =============================================================================
// TRANSPORT STATES
// =============================================================================

export interface PinInputTransportStates {
	/** The current combined value of all pin input fields */
	value: string;
	/** Whether all input fields have been filled */
	readonly isFilled: boolean;
}

// =============================================================================
// TRANSPORT CONFIG
// =============================================================================

export interface PinInputTransportConfig {
	/** Number of input fields. @default 4 */
	maxLength?: number;
	/** Placeholder character for empty inputs. @default "○" */
	placeholder?: string;
	/** Whether the pin input is disabled. @default false */
	disabled?: boolean;
	/** Whether to mask input values (like a password). @default false */
	mask?: boolean;
	/** Input type constraint. @default "text" */
	type?: "text" | "numeric" | "alphanumeric";
	/** Whether to allow paste across inputs. @default true */
	allowPaste?: boolean;
}

// =============================================================================
// TRANSPORT ADAPTER
// =============================================================================

/**
 * ColdLight pin input transport — the public contract for the melt pin input adapter.
 *
 * Slots (melt-managed): root, inputs (array — one SlotAttrs per digit)
 * States: value, isFilled
 */
export type PinInputTransport = TransportAdapter<
	"root",
	PinInputTransportStates
> & {
	readonly slots: {
		readonly root: SlotAttrs;
		/** Per-input slot attrs — iterate to render each input field */
		readonly inputs: readonly SlotAttrs[];
	};
};
