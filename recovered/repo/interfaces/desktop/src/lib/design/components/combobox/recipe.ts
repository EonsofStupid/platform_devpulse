/**
 * @file Combobox Recipe — Gold Standard
 * @kind combobox
 * @layer components
 * @package @devpulse/coldlight
 *
 * Variant-driven styling for the combobox compound component.
 * Uses SD5 OKLCH component tokens — NOT hardcoded white/opacity values.
 *
 * Token references (from tokens.css):
 *   --combobox-bg            → var(--surface-overlay)
 *   --combobox-border        → var(--border-subtle)
 *   --combobox-border-focus  → var(--border-focus)
 *   --combobox-option-hover  → var(--surface-elevated)
 *
 * Theming: data-theme="dark" (default) | data-theme="light"
 * Dark mode values come from tokens.css :root.
 * Light mode overrides via [data-theme="light"] selector in CSS layer.
 *
 * Size variants: sm (32px), md (40px), lg (48px) — matches button recipe.
 * Disabled state: reduced opacity, pointer-events-none.
 */

import type { SizeToken } from "$lib/design/tokens/types.js";

// =============================================================================
// SIZE VARIANTS — Height, padding, font-size per slot
// =============================================================================

/** Combobox size token — matches SizeToken from token pipeline. */
export type ComboboxSize = SizeToken;

const sizeStyles: Record<ComboboxSize, {
	wrapper: string;
	input: string;
	trigger: string;
	item: string;
	groupLabel: string;
	empty: string;
	label: string;
}> = {
	sm: {
		wrapper: "min-h-8",
		input: "px-2 py-1 text-sm",
		trigger: "px-1.5 py-1 text-sm",
		item: "px-2 py-1 text-sm",
		groupLabel: "px-2 py-1 text-xs",
		empty: "py-4 text-sm",
		label: "text-xs mb-1",
	},
	md: {
		wrapper: "min-h-10",
		input: "px-3 py-2 text-sm",
		trigger: "px-2 py-2 text-sm",
		item: "px-2 py-1.5 text-sm",
		groupLabel: "px-2 py-1.5 text-xs",
		empty: "py-6 text-sm",
		label: "text-sm mb-1.5",
	},
	lg: {
		wrapper: "min-h-12",
		input: "px-4 py-3 text-base",
		trigger: "px-3 py-3 text-base",
		item: "px-3 py-2 text-base",
		groupLabel: "px-3 py-2 text-xs",
		empty: "py-8 text-base",
		label: "text-base mb-2",
	},
};

// =============================================================================
// BASE STYLES — Token-driven, NOT hardcoded white/opacity
// =============================================================================

/**
 * Wrapper: uses combobox component tokens for bg + border.
 * Focus ring uses --combobox-border-focus (→ --border-focus → teal-400).
 */
const wrapperBase = [
	"inline-flex w-full items-center",
	"rounded-lg",
	"bg-[var(--combobox-bg)]",
	"border border-[var(--combobox-border)]",
	"focus-within:ring-2 focus-within:ring-[var(--combobox-border-focus)]",
	"transition-[border-color,box-shadow] duration-fast",
].join(" ");

/**
 * Input: transparent bg so wrapper bg shows through.
 * Text color uses semantic --text-primary / --text-muted tokens.
 */
const inputBase = [
	"flex-1 w-full bg-transparent",
	"text-text-primary",
	"placeholder:text-text-muted",
	"outline-none",
	"caret-[var(--combobox-border-focus)]",
].join(" ");

/**
 * Trigger: icon button, uses semantic text tokens.
 */
const triggerBase = [
	"inline-flex items-center justify-center",
	"text-text-secondary hover:text-text-primary",
	"transition-colors duration-fast",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--combobox-border-focus)]",
	"rounded-md",
].join(" ");

/**
 * Content: floating listbox popup.
 * Uses combobox-bg for the dropdown and semantic border.
 */
const contentBase = [
	"z-50 overflow-hidden",
	"rounded-lg p-1",
	"bg-[var(--combobox-bg)]",
	"border border-[var(--combobox-border)]",
	"shadow-depth-overlay",
	"data-[open]:animate-in data-[open]:fade-in-0 data-[open]:zoom-in-95",
].join(" ");

/**
 * Item: selectable option.
 * Highlighted state uses --combobox-option-hover.
 * Selected state uses teal accent with OKLCH tokens.
 */
const itemBase = [
	"relative flex w-full cursor-pointer select-none items-center",
	"rounded-md text-text-secondary",
	"outline-none transition-colors duration-fast",
	"data-[highlighted]:bg-[var(--combobox-option-hover)] data-[highlighted]:text-text-primary",
	"aria-[selected=true]:bg-teal-500/20 aria-[selected=true]:text-teal-300",
].join(" ");

/** Group: simple padding wrapper. */
const groupBase = "py-1";

/** Group label: uppercase category heading. */
const groupLabelBase = [
	"font-semibold text-text-muted uppercase tracking-wider",
].join(" ");

/** Empty: no-results state, centered. */
const emptyBase = [
	"text-center text-text-muted",
].join(" ");

/** Label: visible label above the combobox. */
const labelBase = [
	"font-medium text-text-secondary",
].join(" ");

// =============================================================================
// DISABLED STATE
// =============================================================================

const disabledStyles = {
	wrapper: "opacity-50 pointer-events-none",
	input: "cursor-not-allowed",
	trigger: "cursor-not-allowed",
};

// =============================================================================
// RECIPE FUNCTION — Variant-driven output
// =============================================================================

/** Combobox recipe options. */
export interface ComboboxRecipeOptions {
	/** Size variant. @default "md" */
	size?: ComboboxSize;
	/** Whether the combobox is disabled. @default false */
	disabled?: boolean;
}

/** Combobox recipe output — class string per slot. */
export interface ComboboxRecipeResult {
	readonly wrapper: string;
	readonly input: string;
	readonly trigger: string;
	readonly content: string;
	readonly item: string;
	readonly group: string;
	readonly groupLabel: string;
	readonly empty: string;
	readonly label: string;
}

/**
 * Generate per-slot class strings for the combobox compound component.
 *
 * @param opts - Recipe options (size, disabled)
 * @returns Class string for each slot
 *
 * @example
 * ```ts
 * const recipe = comboboxRecipe({ size: "lg", disabled: false });
 * // recipe.wrapper → "inline-flex w-full items-center rounded-lg bg-[var(--combobox-bg)] ..."
 * // recipe.input → "flex-1 w-full bg-transparent text-text-primary ... px-4 py-3 text-base"
 * ```
 */
export function comboboxRecipe(opts: ComboboxRecipeOptions = {}): ComboboxRecipeResult {
	const { size = "md", disabled = false } = opts;
	const s = sizeStyles[size];

	return {
		wrapper: `${wrapperBase} ${s.wrapper}${disabled ? ` ${disabledStyles.wrapper}` : ""}`,
		input: `${inputBase} ${s.input}${disabled ? ` ${disabledStyles.input}` : ""}`,
		trigger: `${triggerBase} ${s.trigger}${disabled ? ` ${disabledStyles.trigger}` : ""}`,
		content: `${contentBase}`,
		item: `${itemBase} ${s.item}`,
		group: groupBase,
		groupLabel: `${groupLabelBase} ${s.groupLabel}`,
		empty: `${emptyBase} ${s.empty}`,
		label: `${labelBase} ${s.label}`,
	};
}
