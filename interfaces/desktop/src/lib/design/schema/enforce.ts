/**
 * @file Runtime Contract Enforcer
 * @package @devpulse/coldlight
 *
 * DEV-ONLY runtime validation. Verifies rendered DOM matches the primitive spec.
 * Hard failure — throws ContractViolation, does not warn.
 *
 * Stripped in production via tree-shaking (calls guarded by import.meta.env.DEV).
 *
 * Limitations acknowledged:
 * - Cannot verify keyboard event listeners are attached (no DOM API for this).
 *   Keyboard contracts are enforced via integration tests, not runtime checks.
 * - Cannot verify focus management strategy at the element level.
 *   Focus trapping/roving is verified via behavior hook tests.
 * - Implicit role resolution is a best-effort subset of WAI-ARIA 1.2 §5.
 *   Context-dependent roles (header→banner only under body) are NOT checked.
 */

import type { SlotSpec } from "./a11y.schema.js";
import { HtmlElementSchema } from "./a11y.schema.js";
import type { PrimitiveSpec } from "./primitive.schema.js";

// =============================================================================
// CONTRACT VIOLATION — structured error, not a console.warn
// =============================================================================

export class ContractViolation extends Error {
	readonly kind: string;
	readonly slot: string;
	readonly violations: string[];

	constructor(kind: string, slot: string, violations: string[]) {
		const msg =
			`[ColdLight] CONTRACT VIOLATION: ${kind}/${slot}\n` +
			violations.map((v) => `  - ${v}`).join("\n") +
			`\nFix the primitive or update ${kind}.spec.ts.`;
		super(msg);
		this.name = "ContractViolation";
		this.kind = kind;
		this.slot = slot;
		this.violations = violations;
	}
}

// =============================================================================
// IMPLICIT ROLE MAP — WAI-ARIA 1.2 §5.4 (subset, context-free only)
// =============================================================================
// Only roles that are ALWAYS implicit regardless of DOM context.
// Context-dependent roles (header→banner, footer→contentinfo) are excluded
// because they depend on ancestor elements we can't check here.

function getImplicitRole(node: Element): string | null {
	const tag = node.tagName.toLowerCase();

	// Input type determines role
	if (tag === "input") {
		const type = (node.getAttribute("type") ?? "text").toLowerCase();
		const inputRoles: Record<string, string> = {
			button: "button",
			checkbox: "checkbox",
			email: "textbox",
			image: "button",
			number: "spinbutton",
			password: "textbox",
			radio: "radio",
			range: "slider",
			reset: "button",
			search: "searchbox",
			submit: "button",
			tel: "textbox",
			text: "textbox",
			url: "textbox",
		};
		return inputRoles[type] ?? "textbox";
	}

	// Elements with unconditional implicit roles
	const unconditional: Record<string, string> = {
		a: "link", // only when href present, but close enough
		button: "button",
		dialog: "dialog",
		hr: "separator",
		meter: "meter",
		nav: "navigation",
		main: "main",
		ol: "list",
		output: "status",
		progress: "progressbar",
		select: "combobox",
		summary: "button",
		table: "table",
		tbody: "rowgroup",
		td: "cell",
		textarea: "textbox",
		tfoot: "rowgroup",
		th: "columnheader", // can also be rowheader based on scope, simplified
		thead: "rowgroup",
		tr: "row",
		ul: "list",
		li: "listitem",
		aside: "complementary",
	};

	return unconditional[tag] ?? null;
}

// =============================================================================
// ALLOWED POLYMORPHIC ELEMENTS — derived from schema, not hardcoded
// =============================================================================

const POLYMORPHIC_ELEMENTS = new Set(
	(HtmlElementSchema.options as readonly string[]).filter((e) => e !== "svelte:element"),
);

// =============================================================================
// VALIDATORS
// =============================================================================

function validateElement(node: Element, slotSpec: SlotSpec): string[] {
	const actual = node.tagName.toLowerCase();

	if (slotSpec.element === "svelte:element") {
		if (!POLYMORPHIC_ELEMENTS.has(actual)) {
			return [`Element: <${actual}> is not a valid semantic element for svelte:element`];
		}
		return [];
	}

	if (actual !== slotSpec.element) {
		return [`Element: expected <${slotSpec.element}>, got <${actual}>`];
	}

	return [];
}

function validateRole(node: Element, slotSpec: SlotSpec): string[] {
	if (slotSpec.role === null) {
		return [];
	}

	const explicit = node.getAttribute("role");
	const implicit = getImplicitRole(node);

	if (explicit === slotSpec.role || implicit === slotSpec.role) {
		return [];
	}

	const got = explicit
		? `role="${explicit}"`
		: implicit
			? `no explicit role (implicit: ${implicit})`
			: "no role";

	return [`Role: expected "${slotSpec.role}", got ${got}`];
}

function validateAriaAttrs(node: Element, slotSpec: SlotSpec): string[] {
	const errors: string[] = [];

	for (const attr of slotSpec.ariaAttrs) {
		if (!node.hasAttribute(attr)) {
			errors.push(`Missing: ${attr}`);
		}
	}

	if (slotSpec.decorative) {
		const hidden = node.getAttribute("aria-hidden");
		if (hidden !== "true") {
			errors.push(
				`Decorative: requires aria-hidden="true", got ${hidden === null ? "missing" : `"${hidden}"`}`,
			);
		}
	}

	return errors;
}

function validateDataAttrs(node: Element, kind: string, slot: string): string[] {
	const errors: string[] = [];

	const dk = node.getAttribute("data-kind");
	if (dk !== kind) {
		errors.push(`data-kind: expected "${kind}", got ${dk === null ? "missing" : `"${dk}"`}`);
	}

	const ds = node.getAttribute("data-slot");
	if (ds !== slot) {
		errors.push(`data-slot: expected "${slot}", got ${ds === null ? "missing" : `"${ds}"`}`);
	}

	return errors;
}

// =============================================================================
// PUBLIC: enforceSlot()
// =============================================================================

/**
 * Validate one DOM node against its slot spec. Throws on violation.
 *
 * @example
 * ```svelte
 * $effect(() => {
 *   if (import.meta.env.DEV && rootEl) {
 *     enforceSlot(rootEl, checkboxSpec, "root");
 *   }
 * });
 * ```
 */
export function enforceSlot(node: Element, spec: PrimitiveSpec, slotName: string): void {
	const slotSpec = spec.a11y.slots[slotName];
	if (!slotSpec) {
		throw new ContractViolation(spec.kind, slotName, [
			`Unknown slot "${slotName}". Valid: ${Object.keys(spec.a11y.slots).join(", ")}`,
		]);
	}

	const errors = [
		...validateElement(node, slotSpec),
		...validateRole(node, slotSpec),
		...validateAriaAttrs(node, slotSpec),
		...validateDataAttrs(node, spec.kind, slotName),
	];

	if (errors.length > 0) {
		throw new ContractViolation(spec.kind, slotName, errors);
	}
}

// =============================================================================
// PUBLIC: enforceAll()
// =============================================================================

/**
 * Validate all slots of a compound primitive within a container.
 * Required (non-optional) slots that are missing from DOM cause a violation.
 * Optional slots are only validated if present.
 *
 * @example
 * ```svelte
 * $effect(() => {
 *   if (import.meta.env.DEV && containerEl) {
 *     enforceAll(containerEl, tabsSpec);
 *   }
 * });
 * ```
 */
export function enforceAll(container: Element, spec: PrimitiveSpec): void {
	for (const [slotName, slotSpec] of Object.entries(spec.a11y.slots)) {
		const node = container.querySelector(`[data-kind="${spec.kind}"][data-slot="${slotName}"]`);

		if (!node) {
			if (!slotSpec.optional) {
				throw new ContractViolation(spec.kind, slotName, [
					`Required slot "${slotName}" not found in DOM`,
				]);
			}
			continue;
		}

		const errors = [
			...validateElement(node, slotSpec),
			...validateRole(node, slotSpec),
			...validateAriaAttrs(node, slotSpec),
		];

		if (errors.length > 0) {
			throw new ContractViolation(spec.kind, slotName, errors);
		}
	}
}
