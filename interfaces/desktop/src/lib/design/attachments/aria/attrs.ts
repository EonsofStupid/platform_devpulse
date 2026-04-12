/**
 * @file attachments/aria/attrs.ts
 * @package @devpulse/coldlight
 * @layer attachment
 * @category aria
 *
 * Applies ARIA attributes to an element based on a primitive contract
 * and current state. Reads the slot's AriaSpec from the contract and
 * sets role, required attributes, and optional attributes based on state.
 *
 * ColdLight primitives declare `ariaStateProvider: "coldlight"` on their contract.
 * This attachment reads the contract and applies ARIA attributes for the slot.
 *
 * @example
 * ```svelte
 * <button {@attach ariaAttrs(() => ({ contract, slot: "root", state: { pressed } }))}>
 *   Save
 * </button>
 * ```
 *
 * @consumers Every ColdLight-owned component
 */

/**
 * ARIA state values that can be set on elements.
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

interface SlotAriaSpec {
	readonly role?: string;
	readonly required: readonly string[];
	readonly optional: readonly string[];
}

interface SlotSpec {
	readonly aria: SlotAriaSpec;
}

interface ContractShape {
	readonly kind: string;
	readonly ariaStateProvider: "coldlight";
	readonly slotSpec: Record<string, SlotSpec>;
}

export interface AriaAttrsOptions {
	contract: ContractShape;
	slot: string;
	state?: AriaState;
}

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

const STATE_ALIASES: Record<string, string> = {
	open: "aria-expanded",
};

function applyAttr(node: HTMLElement, attr: string, state: AriaState): void {
	const stateKey = ARIA_STATE_MAP[attr];
	if (!stateKey) return;
	const value = state[stateKey];
	if (value === undefined) return;
	node.setAttribute(attr, String(value));
}

function applyAliases(node: HTMLElement, state: AriaState): void {
	for (const [stateKey, attr] of Object.entries(STATE_ALIASES)) {
		const value = state[stateKey as keyof AriaState];
		if (value !== undefined) {
			node.setAttribute(attr, String(value));
		}
	}
}

function applyAll(node: HTMLElement, slotSpec: SlotSpec, state: AriaState): void {
	const { aria } = slotSpec;
	if (!aria) return;

	if (aria.role && node.tagName.toLowerCase() !== aria.role) {
		node.setAttribute("role", aria.role);
	}

	aria.required.forEach((attr) => {
		applyAttr(node, attr, state);
	});

	aria.optional.forEach((attr) => {
		const stateKey = ARIA_STATE_MAP[attr];
		if (stateKey && state[stateKey] !== undefined) {
			applyAttr(node, attr, state);
		}
	});

	applyAliases(node, state);
}

function cleanupAll(node: HTMLElement, slotSpec: SlotSpec): void {
	const { aria } = slotSpec;
	if (aria?.role) node.removeAttribute("role");
	[...(aria?.required ?? []), ...(aria?.optional ?? [])].forEach((attr) => {
		node.removeAttribute(attr);
	});
}

/**
 * ARIA attributes attachment.
 *
 * @param node - The element to apply ARIA attributes to
 * @param options - Reactive getter returning contract, slot, and state
 */
export function ariaAttrs(node: HTMLElement, options: () => AriaAttrsOptions): () => void {
	const { contract, slot, state = {} } = options();

	const slotSpec = contract.slotSpec[slot];
	if (!slotSpec) {
		return () => {};
	}

	applyAll(node, slotSpec, state);

	return () => {
		cleanupAll(node, slotSpec);
	};
}
