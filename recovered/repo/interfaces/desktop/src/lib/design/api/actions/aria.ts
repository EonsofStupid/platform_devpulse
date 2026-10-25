/**
 * @file ARIA Action
 * @description Svelte action for applying ARIA attributes based on contract + state.
 *
 * Usage:
 *   <button use:aria={{ contract, slot: "root", state }}>
 *
 * For MeltUI-backed primitives (ariaStateProvider: "meltui"), this is a no-op.
 * MeltUI already applies ARIA attributes via its builder pattern.
 *
 * For ColdLight-backed primitives (ariaStateProvider: "coldlight"), this action
 * reads the slot's AriaSpec from the contract and applies attributes based on state.
 */

import type { Action } from "svelte/action";

/**
 * Minimal slot aria spec shape for the action.
 * Looser than full SlotAriaSpec to accept any contract.
 */
interface SlotAriaSpec {
	readonly role?: string;
	readonly required: readonly string[];
	readonly optional: readonly string[];
}

/**
 * Minimal slot spec shape for the action.
 */
interface SlotSpec {
	readonly aria: SlotAriaSpec;
}

/**
 * Minimal contract shape for the action.
 * Accepts any PrimitiveContract without strict generic constraints.
 */
interface ContractShape {
	readonly kind: string;
	readonly ariaStateProvider: "meltui" | "coldlight";
	readonly slotSpec: Record<string, SlotSpec>;
}

/**
 * State map for ARIA attribute values.
 * Keys are state names, values are booleans or strings.
 */
export interface AriaState {
	open?: boolean;
	expanded?: boolean;
	selected?: boolean;
	checked?: boolean | "mixed";
	disabled?: boolean;
	pressed?: boolean | "mixed";
	busy?: boolean;
	hidden?: boolean;
	modal?: boolean;
	required?: boolean;
	invalid?: boolean;
	current?: boolean | "page" | "step" | "location" | "date" | "time";
	haspopup?: boolean | "menu" | "listbox" | "tree" | "grid" | "dialog";
	live?: "off" | "polite" | "assertive";
	orientation?: "horizontal" | "vertical";
	valuemin?: number;
	valuemax?: number;
	valuenow?: number;
	valuetext?: string;
	level?: number;
	setsize?: number;
	posinset?: number;
	controls?: string;
	labelledby?: string;
	describedby?: string;
	label?: string;
}

/**
 * Options for the aria action.
 */
export interface AriaActionOptions {
	/** The primitive contract (contains slotSpec with AriaSpec) */
	contract: ContractShape;
	/** Which slot this element represents */
	slot: string;
	/** Current state values for reactive ARIA attributes */
	state?: AriaState;
}

/**
 * Map from ARIA attribute names to state keys.
 */
const ARIA_STATE_MAP: Record<string, keyof AriaState> = {
	"aria-expanded": "expanded",
	"aria-selected": "selected",
	"aria-checked": "checked",
	"aria-disabled": "disabled",
	"aria-pressed": "pressed",
	"aria-busy": "busy",
	"aria-hidden": "hidden",
	"aria-modal": "modal",
	"aria-required": "required",
	"aria-invalid": "invalid",
	"aria-current": "current",
	"aria-haspopup": "haspopup",
	"aria-live": "live",
	"aria-orientation": "orientation",
	"aria-valuemin": "valuemin",
	"aria-valuemax": "valuemax",
	"aria-valuenow": "valuenow",
	"aria-valuetext": "valuetext",
	"aria-level": "level",
	"aria-setsize": "setsize",
	"aria-posinset": "posinset",
	"aria-controls": "controls",
	"aria-labelledby": "labelledby",
	"aria-describedby": "describedby",
	"aria-label": "label",
};

/**
 * Alternate state key mappings (e.g., "open" maps to aria-expanded).
 */
const STATE_ALIASES: Record<string, string> = {
	open: "aria-expanded",
};

/**
 * Apply a single ARIA attribute to an element.
 */
function applyAttribute(node: HTMLElement, attr: string, state: AriaState): void {
	const stateKey = ARIA_STATE_MAP[attr];
	if (!stateKey) return;

	const value = state[stateKey];
	if (value === undefined) return;

	if (typeof value === "boolean") {
		node.setAttribute(attr, String(value));
	} else if (typeof value === "number") {
		node.setAttribute(attr, String(value));
	} else if (typeof value === "string") {
		node.setAttribute(attr, value);
	}
}

/**
 * Apply state aliases (e.g., state.open → aria-expanded).
 */
function applyAliases(node: HTMLElement, state: AriaState): void {
	for (const [stateKey, attr] of Object.entries(STATE_ALIASES)) {
		const value = state[stateKey as keyof AriaState];
		if (value !== undefined) {
			node.setAttribute(attr, String(value));
		}
	}
}

/**
 * Apply all ARIA attributes based on contract slot spec and current state.
 */
function applyAria(node: HTMLElement, slotSpec: SlotSpec, state: AriaState): void {
	const { aria } = slotSpec;
	if (!aria) return;

	// Apply role if specified (and not native element role)
	if (aria.role && node.tagName.toLowerCase() !== aria.role) {
		node.setAttribute("role", aria.role);
	}

	// Apply required attributes
	for (const attr of aria.required) {
		applyAttribute(node, attr, state);
	}

	// Apply optional attributes if state provides value
	for (const attr of aria.optional) {
		const stateKey = ARIA_STATE_MAP[attr];
		if (stateKey && state[stateKey] !== undefined) {
			applyAttribute(node, attr, state);
		}
	}

	// Apply state aliases
	applyAliases(node, state);
}

/**
 * Svelte action for ARIA attribute application.
 *
 * For ariaStateProvider: "meltui", this is a no-op (MeltUI handles ARIA).
 * For ariaStateProvider: "coldlight", applies attributes based on slotSpec.
 */
export const aria: Action<HTMLElement, AriaActionOptions> = (node, options) => {
	const { contract, slot, state = {} } = options;

	// No-op for MeltUI-backed primitives
	if (contract.ariaStateProvider === "meltui") {
		return {};
	}

	// Get slot spec
	const slotSpec = contract.slotSpec[slot];
	if (!slotSpec) {
		console.warn(`[aria] No slotSpec for slot "${slot}" in ${contract.kind}`);
		return {};
	}

	// Initial application
	applyAria(node, slotSpec, state);

	return {
		update(newOptions: AriaActionOptions) {
			const newSlotSpec = newOptions.contract.slotSpec[newOptions.slot];
			if (newSlotSpec) {
				applyAria(node, newSlotSpec, newOptions.state ?? {});
			}
		},
		destroy() {
			// Cleanup: remove applied ARIA attributes
			const { aria: ariaSpec } = slotSpec;
			if (ariaSpec?.role) {
				node.removeAttribute("role");
			}
			for (const attr of [...(ariaSpec?.required ?? []), ...(ariaSpec?.optional ?? [])]) {
				node.removeAttribute(attr);
			}
		},
	};
};

export default aria;
