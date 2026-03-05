/**
 * @file Adapter Contract Types
 * @package @devpulse/coldlight
 *
 * AdapterContract declares HOW a MeltUI adapter maps to a ColdLight
 * primitive contract. Every adapter folder under meltui/_internal/{kind}/
 * MUST have an adapter.contract.ts that satisfies this type.
 *
 * This is the bridge: MeltUI provides behavior → AdapterContract declares
 * the mapping → ColdLight is the ONLY public API.
 *
 * Scanner validates: adapter contract slots ⊇ primitive contract required slots.
 * Scanner validates: adapter contract ARIA ⊇ primitive contract required ARIA attrs.
 */

import type {
	AriaAttribute,
	AriaRole,
	KeyboardKey,
	StateToken,
} from "../../../primitives/_schema/types.js";

// =============================================================================
// SLOT MAPPING — per-slot declaration of what the adapter provides
// =============================================================================

/**
 * Per-slot ARIA mapping.
 * Declares which ARIA attributes the adapter MUST produce for this slot,
 * which it CAN produce, and which MeltUI getter provides them.
 */
export interface AdapterSlotAria {
	/** ARIA role this slot renders (must match primitive contract) */
	readonly role?: AriaRole;
	/** ARIA attrs the adapter MUST set — validated against primitive contract */
	readonly required: readonly AriaAttribute[];
	/** ARIA attrs the adapter CAN set — optional per primitive contract */
	readonly optional: readonly AriaAttribute[];
}

/**
 * Per-slot mapping from MeltUI → ColdLight.
 *
 * Declares: what MeltUI calls this slot, what ARIA it provides,
 * what states are valid, and what HTML element it renders.
 */
export interface AdapterSlotMapping {
	/** What MeltUI's getter is called (e.g., "trigger", "content", "root") */
	readonly meltGetter: string;
	/** What ColdLight's primitive contract calls this slot */
	readonly coldlightSlot: string;
	/** HTML element this slot renders */
	readonly element: string;
	/** ARIA attributes this slot provides */
	readonly aria: AdapterSlotAria;
	/** Valid data-state values for this slot */
	readonly states: readonly StateToken[];
	/** Data attributes this slot renders (e.g., "data-cl-accordion-trigger") */
	readonly dataAttributes: readonly string[];
}

// =============================================================================
// PROP MAPPING — MeltUI config → ColdLight props
// =============================================================================

/**
 * Per-prop mapping from MeltUI config → ColdLight component props.
 */
export interface AdapterPropMapping {
	/** MeltUI config property name */
	readonly meltProp: string;
	/** ColdLight component prop name */
	readonly coldlightProp: string;
	/** Type of the prop (for manifest/VPB introspection) */
	readonly type: string;
	/** Whether this prop is required */
	readonly required: boolean;
	/** Default value (for manifest/VPB) */
	readonly defaultValue?: unknown;
}

// =============================================================================
// KEYBOARD MAPPING
// =============================================================================

/**
 * Per-key mapping: what keyboard interactions the adapter handles.
 */
export interface AdapterKeyboardMapping {
	readonly key: KeyboardKey;
	readonly action: string;
	readonly description: string;
	/** Which slot handles this key event */
	readonly slot: string;
}

// =============================================================================
// ADAPTER CONTRACT — the master type
// =============================================================================

/**
 * AdapterContract — SSOT for how a MeltUI adapter maps to ColdLight.
 *
 * Every adapter folder MUST export an `adapterContract` that satisfies this.
 * The scanner validates this against the primitive contract at build time.
 *
 * @example
 * ```typescript
 * export const adapterContract = {
 *   kind: "accordion",
 *   source: "meltui",
 *   meltClass: "Accordion",
 *   slots: {
 *     root: { meltGetter: "root", coldlightSlot: "root", ... },
 *     trigger: { meltGetter: "item.trigger", coldlightSlot: "trigger", ... },
 *   },
 *   props: [ ... ],
 *   keyboard: [ ... ],
 * } satisfies AdapterContract<"accordion">;
 * ```
 */
export interface AdapterContract<TKind extends string = string> {
	/** Primitive kind this adapter fulfills */
	readonly kind: TKind;

	/** Source adapter system */
	readonly source: "meltui";

	/** MeltUI class name (for documentation/debugging) */
	readonly meltClass: string;

	/** MeltUI package import path */
	readonly meltImport: string;

	/**
	 * Per-slot mapping: MeltUI getter → ColdLight slot.
	 * Keys are ColdLight slot names (from primitive contract).
	 * Scanner validates: every required slot in contract has a mapping here.
	 */
	readonly slots: Record<string, AdapterSlotMapping>;

	/**
	 * Prop mappings: MeltUI config → ColdLight component props.
	 * Powers VPB prop introspection.
	 */
	readonly props: readonly AdapterPropMapping[];

	/**
	 * Keyboard interactions handled by this adapter.
	 * Must cover all keyboard keys in the primitive contract.
	 */
	readonly keyboard: readonly AdapterKeyboardMapping[];

	/**
	 * Whether this is a compound component (uses getItem/getTrigger/etc.)
	 * Compound adapters have sub-item transports.
	 */
	readonly compound: boolean;

	/**
	 * For compound components: describes the sub-item slot structure.
	 * Each item has its own set of slots (e.g., accordion item has heading, trigger, content).
	 */
	readonly itemSlots?: Record<string, AdapterSlotMapping>;
}
