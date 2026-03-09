/**
 * @file Combobox Adapter Schema — The Schema IS The Contract
 * @package @devpulse/coldlight
 *
 * THE gold standard adapter schema. Every field verified against:
 *   1. WAI-ARIA APG Combobox pattern (https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
 *   2. MeltUI Combobox.svelte.d.ts (melt v0.44, class extends BasePopover)
 *   3. ColdLight adapter conventions (data-kind, data-slot, data-state)
 *
 * Build-time:  AdapterSchemaZ.parse(ComboboxAdapterSchema) — Zod validates
 * Compile-time: satisfies AdapterSchema — TypeScript enforces shape
 * Runtime:     JSON-serializable for VPB introspection
 *
 * TRANSPORT CORRECTION REQUIRED: MeltUI places aria-activedescendant on the
 * content (listbox). WAI-ARIA APG 1.2 unambiguously states it belongs on the
 * element with DOM focus (the input with role=combobox). The transport layer
 * MUST relocate this attribute from content → input to achieve APG compliance.
 * This schema declares it on input (where APG demands it) and flags the
 * content slot's copy as a MeltUI artifact that must be suppressed.
 */

import type { AdapterSchema } from "../../../_base/schema.js";

export const ComboboxAdapterSchema = {
	// ─── Identity ────────────────────────────────────────────────────────
	kind: "combobox",
	engine: "meltui",
	description: "Autocomplete text input with popup listbox of suggested values. Supports single and multiple selection, keyboard navigation, and virtual focus via aria-activedescendant.",

	// ─── WAI-ARIA APG Reference ──────────────────────────────────────────
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/",
	ariaVersion: "1.2",

	// ─── Slots ───────────────────────────────────────────────────────────
	slots: {
		input: {
			name: "input",
			element: "input",
			role: "combobox",
			aria: [
				{
					attr: "aria-expanded",
					level: "MUST",
					valueType: "boolean",
					description: "Indicates whether the listbox popup is displayed. Set to true when open, false when closed.",
				},
				{
					attr: "aria-controls",
					level: "MUST",
					valueType: "idref",
					targetSlot: "content",
					description: "Identifies the listbox element that is controlled by this combobox input.",
				},
				{
					attr: "aria-owns",
					level: "MUST",
					valueType: "idref",
					targetSlot: "content",
					description: "MeltUI uses aria-owns in addition to aria-controls to establish ownership of the popup listbox (required for popover API pattern).",
				},
				{
					attr: "aria-autocomplete",
					level: "SHOULD",
					valueType: "token",
					description: "Indicates whether the combobox provides autocomplete. Values: 'none', 'list', 'both', 'inline'. ColdLight must add this — MeltUI does NOT provide it.",
				},
				{
					attr: "aria-activedescendant",
					level: "MUST",
					valueType: "idref",
					targetSlot: "option",
					description: "Identifies the currently highlighted option. WAI-ARIA APG 1.2: 'DOM focus remains on the combobox and the combobox has aria-activedescendant set to a value that refers to the focused element within the popup.' MeltUI places this on content — transport MUST relocate it here.",
				},
				{
					attr: "aria-label",
					level: "MAY",
					valueType: "string",
					description: "Accessible name when no visible label element is present.",
				},
				{
					attr: "aria-labelledby",
					level: "MAY",
					valueType: "idref",
					targetSlot: "label",
					description: "References the label element that names this combobox.",
				},
				{
					attr: "aria-describedby",
					level: "MAY",
					valueType: "idref",
					description: "References an element providing additional description (e.g., helper text, error message).",
				},
				{
					attr: "aria-invalid",
					level: "MAY",
					valueType: "token",
					description: "Indicates the entered value does not conform to expected format. ColdLight adds this — MeltUI does not provide it.",
				},
				{
					attr: "aria-required",
					level: "MAY",
					valueType: "boolean",
					description: "Indicates the field is required. ColdLight adds this — MeltUI does not provide it.",
				},
			],
			states: ["open", "closed", "focused", "disabled"],
			perItem: false,
			required: true,
			meltGetter: "input",
			keyboard: [
				{
					key: "ArrowDown",
					action: "Opens listbox if closed. Moves visual focus to next option if open.",
					description: "Navigate to next option or open the listbox",
					level: "MUST",
				},
				{
					key: "ArrowUp",
					action: "Opens listbox if closed. Moves visual focus to previous option if open.",
					description: "Navigate to previous option or open the listbox",
					level: "MUST",
				},
				{
					key: "Enter",
					action: "Selects the currently highlighted option and closes the listbox.",
					description: "Select highlighted option",
					level: "MUST",
				},
				{
					key: "Escape",
					action: "Closes the listbox if open. If closed, clears the input (implementation-dependent).",
					description: "Close listbox or clear input",
					level: "MUST",
				},
				{
					key: "Home",
					action: "Moves visual focus to the first option in the listbox.",
					description: "Jump to first option",
					level: "SHOULD",
				},
				{
					key: "End",
					action: "Moves visual focus to the last option in the listbox.",
					description: "Jump to last option",
					level: "SHOULD",
				},
				{
					key: "Tab",
					action: "Accepts the currently highlighted option (if any) and moves focus out of the combobox.",
					description: "Accept and exit combobox",
					level: "MUST",
				},
			],
		},

		trigger: {
			name: "trigger",
			element: "button",
			role: null,
			aria: [
				{
					attr: "aria-label",
					level: "SHOULD",
					valueType: "string",
					description: "Accessible name for the trigger button (e.g., 'Open suggestions'). Important because the trigger often has only an icon.",
				},
				{
					attr: "aria-expanded",
					level: "MAY",
					valueType: "boolean",
					description: "Optional mirror of input's expanded state on the trigger button.",
				},
			],
			states: ["open", "closed"],
			perItem: false,
			required: false,
			meltGetter: "trigger",
			keyboard: [],
		},

		content: {
			name: "content",
			element: "div",
			role: "listbox",
			aria: [
				{
					attr: "aria-expanded",
					level: "MUST",
					valueType: "boolean",
					description: "MeltUI provides aria-expanded on the listbox. This is non-standard (APG doesn't require it on listbox) but does not harm accessibility.",
				},
				{
					attr: "aria-activedescendant",
					level: "MAY",
					valueType: "idref",
					targetSlot: "option",
					description: "MELTUI ARTIFACT — MeltUI incorrectly places aria-activedescendant here on the listbox. WAI-ARIA APG 1.2 says it belongs on the input (element with DOM focus). Transport MUST suppress this and relocate the value to the input slot instead.",
				},
				{
					attr: "aria-label",
					level: "MAY",
					valueType: "string",
					description: "Accessible name for the listbox when not implicitly labeled.",
				},
				{
					attr: "aria-multiselectable",
					level: "MAY",
					valueType: "boolean",
					description: "When multiple selection is enabled, indicates the listbox supports multi-select. ColdLight must add this — MeltUI does not provide it.",
				},
			],
			states: ["open", "closed"],
			perItem: false,
			required: true,
			meltGetter: "content",
			keyboard: [],
		},

		label: {
			name: "label",
			element: "label",
			role: null,
			aria: [],
			states: ["disabled"],
			perItem: false,
			required: false,
			meltGetter: "label",
			keyboard: [],
		},

		option: {
			name: "option",
			element: "div",
			role: "option",
			aria: [
				{
					attr: "aria-selected",
					level: "MUST",
					valueType: "boolean",
					description: "Indicates whether the option is currently selected. Required by APG for all options in a listbox.",
				},
				{
					attr: "aria-hidden",
					level: "MAY",
					valueType: "boolean",
					description: "MeltUI sets aria-hidden=true on filtered-out options to hide them from the accessibility tree without removing from DOM.",
				},
				{
					attr: "aria-disabled",
					level: "MAY",
					valueType: "boolean",
					description: "Indicates the option is not selectable. ColdLight adds this — MeltUI does not provide it.",
				},
			],
			states: ["selected", "highlighted", "disabled"],
			perItem: true,
			required: true,
			meltGetter: "getOption",
			keyboard: [
				{
					key: "Click",
					action: "Selects this option and closes the listbox.",
					description: "Select option via pointer",
					level: "MUST",
				},
			],
		},
	},

	// ─── Relationships ───────────────────────────────────────────────────
	relationships: [
		{
			sourceSlot: "input",
			attr: "aria-controls",
			targetSlot: "content",
			required: true,
		},
		{
			sourceSlot: "input",
			attr: "aria-owns",
			targetSlot: "content",
			required: true,
		},
		{
			sourceSlot: "input",
			attr: "aria-labelledby",
			targetSlot: "label",
			required: false,
		},
		{
			sourceSlot: "input",
			attr: "aria-activedescendant",
			targetSlot: "option",
			required: false,
		},
	],

	// ─── Focus ───────────────────────────────────────────────────────────
	focusStrategy: "activedescendant",
	initialFocusSlot: "input",
	returnFocusSlot: "input",

	// ─── Props ───────────────────────────────────────────────────────────
	props: [
		// ── Selection ────────────────────────────────────────────────────
		{
			name: "value",
			type: "T | T[] | undefined",
			required: false,
			defaultValue: undefined,
			meltProp: "value",
			description: "The selected value(s). Single value when multiple=false, array when multiple=true.",
		},
		{
			name: "onValueChange",
			type: "(value: T | T[] | undefined) => void",
			required: false,
			defaultValue: undefined,
			meltProp: "onValueChange",
			description: "Callback when the selected value changes.",
		},
		{
			name: "multiple",
			type: "boolean",
			required: false,
			defaultValue: false,
			meltProp: "multiple",
			description: "Whether multiple options can be selected simultaneously.",
		},

		// ── Input ────────────────────────────────────────────────────────
		{
			name: "inputValue",
			type: "string",
			required: false,
			defaultValue: "",
			meltProp: "inputValue",
			description: "The current text value of the input element.",
		},
		{
			name: "onInputValueChange",
			type: "(value: string) => void",
			required: false,
			defaultValue: undefined,
			meltProp: "onInputValueChange",
			description: "Callback when the input text changes (for filtering).",
		},

		// ── Open/Close ───────────────────────────────────────────────────
		{
			name: "open",
			type: "boolean",
			required: false,
			defaultValue: false,
			meltProp: "open",
			description: "Whether the listbox popup is open.",
		},
		{
			name: "onOpenChange",
			type: "(open: boolean) => void",
			required: false,
			defaultValue: undefined,
			meltProp: "onOpenChange",
			description: "Callback when the open state changes.",
		},

		// ── Highlighting ─────────────────────────────────────────────────
		{
			name: "highlighted",
			type: "T | null",
			required: false,
			defaultValue: null,
			meltProp: "highlighted",
			description: "The currently highlighted (visually focused) option value.",
		},
		{
			name: "onHighlightChange",
			type: "(value: T | null) => void",
			required: false,
			defaultValue: undefined,
			meltProp: "onHighlightChange",
			description: "Callback when the highlighted option changes.",
		},

		// ── Popover behavior (from BasePopover) ──────────────────────────
		{
			name: "closeOnEscape",
			type: "boolean",
			required: false,
			defaultValue: true,
			meltProp: "closeOnEscape",
			description: "Whether pressing Escape closes the listbox popup.",
		},
		{
			name: "closeOnOutsideClick",
			type: "boolean",
			required: false,
			defaultValue: true,
			meltProp: "closeOnOutsideClick",
			description: "Whether clicking outside the combobox closes the listbox popup.",
		},
		{
			name: "sameWidth",
			type: "boolean",
			required: false,
			defaultValue: true,
			meltProp: "sameWidth",
			description: "Whether the listbox popup should match the width of the input/trigger.",
		},
		{
			name: "forceVisible",
			type: "boolean",
			required: false,
			defaultValue: false,
			meltProp: "forceVisible",
			description: "Force the listbox popup to be visible regardless of open state. Useful for animations.",
		},
		{
			name: "scrollAlignment",
			type: "'nearest' | 'center' | null",
			required: false,
			defaultValue: "nearest",
			meltProp: "scrollAlignment",
			description: "How to align the highlighted option when scrolling into view. null disables auto-scrolling.",
		},

		// ── Virtualization ───────────────────────────────────────────────
		{
			name: "onNavigate",
			type: "(current: T | null, direction: 'next' | 'prev') => T | null",
			required: false,
			defaultValue: undefined,
			meltProp: "onNavigate",
			description: "Custom navigation handler for virtualized lists. Overrides DOM-based navigation.",
		},
	],

	// ─── Compound ────────────────────────────────────────────────────────
	compound: true,

	// ─── MeltUI-Specific ─────────────────────────────────────────────────
	meltClass: "Combobox",
	meltImport: "melt/builders",

	// ─── States ──────────────────────────────────────────────────────────
	states: ["open", "closed", "focused", "disabled", "selected", "highlighted"],
	stateAriaMapping: {
		open: "aria-expanded",
		selected: "aria-selected",
	},

	// ─── Interactions ────────────────────────────────────────────────────
	interactions: {
		modal: false,
		selectable: true,
		editable: true,
		expandable: true,
	},
} as const satisfies AdapterSchema;
