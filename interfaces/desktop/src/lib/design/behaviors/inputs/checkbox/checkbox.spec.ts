/**
 * @file Checkbox primitive spec — the FIRST authored PrimitiveSpec.
 * @package @devpulse/coldlight
 *
 * The schema/enforce machinery (definePrimitive → enforceAll) shipped
 * 2026-05 with zero specs authored — a validator nobody fed (a11y audit
 * Gap 7). This spec wires it: declared here, validated at import time by
 * ArkType, enforced against the REAL rendered DOM in
 * components/checkbox/Checkbox.contract.test.ts. It is the authoring
 * template for the remaining kinds.
 *
 * Slot truth mirrors checkbox.anatomy.ts: root (button, role=checkbox,
 * aria-checked always emitted), indicator (decorative span), label
 * (optional — when omitted the root carries aria-label/labelledby).
 */

import { definePrimitive } from "../../../schema/primitive.schema.js";

export const checkboxSpec = definePrimitive({
	kind: "checkbox",
	label: "Checkbox",
	description: "Tri-state selection control — checked, unchecked, or indeterminate.",
	category: "interactive",
	behaviorHook: "useCheckbox",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "button",
				role: "checkbox",
				ariaAttrs: ["aria-checked"],
				description: "The toggle control. aria-checked tracks true/false/mixed.",
			},
			indicator: {
				element: "span",
				decorative: true,
				description: "Check/dash/empty visual — hidden from assistive technology.",
			},
			label: {
				element: "span",
				optional: true,
				description: "Visible label; when omitted, root must be labelled via aria-*.",
			},
		},
		keyboard: [{ key: "Space", action: "Toggle checked state" }],
		focusStrategy: "direct",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/",
	},
});
