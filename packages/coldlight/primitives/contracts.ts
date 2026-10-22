/**
 * @file Primitive contracts — a primitive's spec + anatomy as manifest entries
 * @package @devpulse/coldlight
 * @layer primitive
 *
 * The contract scanner (deleted in 31dfab89) turned each primitive's and
 * component's `contract.ts` into manifest entries. Those contracts went with
 * the March primitives (c7a10cad); what describes a primitive now is its
 * spec (a11y slots, keyboard, focus, APG link) and its anatomy (required
 * parts, state attributes, conditional ARIA). These functions build the same
 * entries from those two. Fields neither source states are derived, and
 * each says from what.
 */

import { validateAnatomyAlignment } from "#coldlight/schema/primitive.schema.js";
import type { PrimitiveEntry } from "./catalog.js";
import type { ManifestComponent, ManifestPrimitive, SlotSpec } from "./manifest.types.js";

/** Roles whose elements are chosen from a set. */
const SELECTABLE_ROLES = new Set([
	"option",
	"tab",
	"treeitem",
	"gridcell",
	"row",
	"radio",
	"menuitemradio",
	"menuitemcheckbox",
]);

/** Elements and roles a user types or drags a value into. */
const EDITABLE_ELEMENTS = new Set(["input", "textarea"]);
const EDITABLE_ROLES = new Set(["textbox", "combobox", "spinbutton", "slider", "searchbox"]);

/** Attributes that give an element its accessible name. */
const NAME_ATTRS = ["aria-label", "aria-labelledby"];

function partsByRequired(entry: PrimitiveEntry): { required: string[]; optional: string[] } {
	const required: string[] = [];
	const optional: string[] = [];
	entry.anatomy.parts.forEach((part) => {
		(entry.anatomy.meta[part]?.required ? required : optional).push(part);
	});
	return { required, optional };
}

/** `data-disabled` → `disabled`. */
function stateName(attr: string): string {
	return attr.replace(/^data-/, "");
}

function slotStates(entry: PrimitiveEntry): Record<string, readonly string[]> {
	return Object.fromEntries(
		entry.anatomy.parts.map((part) => [
			part,
			(entry.anatomy.meta[part]?.stateAttrs ?? []).map(stateName),
		]),
	);
}

function slotSpecs(entry: PrimitiveEntry): Record<string, SlotSpec> {
	return Object.fromEntries(
		Object.entries(entry.spec.a11y.slots).map(([slot, spec]) => [
			slot,
			{
				element: spec.element,
				aria: {
					...(spec.role ? { role: spec.role } : {}),
					required: [...(entry.anatomy.meta[slot]?.aria?.required ?? [])],
					// The spec's attributes, plus the anatomy's state-driven ones.
					optional: [
						...new Set([...spec.ariaAttrs, ...(entry.anatomy.meta[slot]?.aria?.conditional ?? [])]),
					],
				},
			},
		]),
	);
}

/**
 * The slot that carries the primitive's role and name: `root`; else the slot
 * whose role is the kind (a dialog's `content` has role="dialog"); else the
 * first part the anatomy requires; else the first spec slot.
 */
function rootSlot(entry: PrimitiveEntry): string {
	const slots = Object.entries(entry.spec.a11y.slots);
	const names = slots.map(([name]) => name);
	if (names.includes("root")) return "root";
	const kindRole = entry.kind.replaceAll("-", "");
	const byRole = slots.find(([, s]) => s.role === kindRole)?.[0];
	if (byRole) return byRole;
	const required = entry.anatomy.parts.find(
		(p) => entry.anatomy.meta[p]?.required && names.includes(p),
	);
	return required ?? names[0] ?? "root";
}

export function toManifestPrimitive(entry: PrimitiveEntry): ManifestPrimitive {
	const specs = slotSpecs(entry);
	const root = specs[rootSlot(entry)];
	const states = slotStates(entry);
	const aligned = validateAnatomyAlignment(entry.spec, entry.anatomy.parts).valid;
	return {
		kind: entry.kind,
		// "complete" when the spec's slots match the anatomy's parts.
		status: aligned ? "complete" : "contract-only",
		ariaStateProvider: "coldlight",
		slots: { ...partsByRequired(entry), forbidden: [] },
		slotSpec: specs,
		states: { shared: [], specific: [...new Set(Object.values(states).flat())] },
		slotStates: states,
		slotActions: {},
		aria: root?.aria ?? { required: [], optional: [] },
		keyboard: entry.spec.a11y.keyboard.map((k) => k.key),
		focusStrategy: entry.spec.a11y.focusStrategy,
		compound: entry.spec.compound,
	};
}

export function toManifestComponent(entry: PrimitiveEntry): ManifestComponent {
	const slots = Object.entries(entry.spec.a11y.slots);
	const rootName = rootSlot(entry);
	const rootMeta = entry.anatomy.meta[rootName];
	const rootAttrs = new Set([
		...(entry.spec.a11y.slots[rootName]?.ariaAttrs ?? []),
		...(rootMeta?.aria?.required ?? []),
		...(rootMeta?.aria?.conditional ?? []),
	]);
	const textParts = entry.anatomy.parts.filter((p) =>
		entry.anatomy.meta[p]?.accepts?.includes("text"),
	);
	return {
		kind: entry.kind,
		description: entry.spec.description,
		primitiveKind: entry.kind,
		...(entry.spec.a11y.apgPattern ? { apgPattern: entry.spec.a11y.apgPattern } : {}),
		slots: partsByRequired(entry),
		accessibleName: {
			// Required when the anatomy demands a naming attribute on the root.
			required: NAME_ATTRS.some((a) => rootMeta?.aria?.required?.includes(a)),
			// The naming attributes the root takes, then text content if a part carries it.
			sources: [
				...NAME_ATTRS.filter((a) => rootAttrs.has(a)),
				...(textParts.length > 0 ? ["text content"] : []),
			],
		},
		focus: { strategy: entry.spec.a11y.focusStrategy },
		keyboard: entry.spec.a11y.keyboard.map((k) => ({
			key: k.key,
			action: k.action,
			description: k.condition ? `${k.action} (${k.condition})` : k.action,
		})),
		states: [...new Set(Object.values(slotStates(entry)).flat())],
		interactions: {
			// Derived: focus trapped inside means modal.
			modal: entry.spec.a11y.focusStrategy === "trap",
			// Derived: a slot whose role is picked from a set.
			selectable: slots.some(([, s]) => s.role !== null && SELECTABLE_ROLES.has(s.role)),
			// Derived: a slot that takes typed or dragged values.
			editable: slots.some(
				([, s]) =>
					EDITABLE_ELEMENTS.has(s.element) || (s.role !== null && EDITABLE_ROLES.has(s.role)),
			),
			// Derived: a slot that carries aria-expanded.
			expandable: slots.some(([, s]) => s.ariaAttrs.includes("aria-expanded")),
		},
	};
}
