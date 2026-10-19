import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Combobox autocomplete mode per WAI-ARIA */
export type ComboboxAutocomplete = "none" | "list" | "both" | "inline";

/**
 * Structural props for the Combobox primitive.
 *
 * A combobox combines a text input with a filterable dropdown list.
 * The user types to filter, then selects from results. For a simple
 * dropdown without text input, use Select instead.
 *
 * @example
 * ```svelte
 * <div {...comboboxAnatomy.attrs.root}>
 *   <label {...comboboxAnatomy.attrs.label} for={inputId}>Country</label>
 *   <input {...comboboxAnatomy.attrs.input} id={inputId} role="combobox"
 *          aria-expanded={open} aria-controls={listboxId} />
 *   <button {...comboboxAnatomy.attrs.trigger} aria-label="Show options">▼</button>
 *   <div {...comboboxAnatomy.attrs.listbox} id={listboxId} role="listbox">
 *     <div {...comboboxAnatomy.attrs.option} role="option">United States</div>
 *   </div>
 * </div>
 * ```
 */
export interface ComboboxPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the combobox */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Currently selected value */
	value?: string;
	/** Current text input value (may differ from selected value during filtering) */
	inputValue?: string;
	/** Callback when an option is selected */
	onSelect?: (value: string) => void;
	/** Callback when the input text changes (for filtering) */
	onInputChange?: (value: string) => void;
	/** Whether the listbox is open */
	open?: boolean;
	/** Callback when open state changes */
	onOpenChange?: (open: boolean) => void;
	/** Autocomplete behavior. Default: "list" */
	autocomplete?: ComboboxAutocomplete;
	/** Allow selecting multiple values */
	multiple?: boolean;
	/** Disabled state */
	disabled?: boolean;
	/** Required for form validation */
	required?: boolean;
}
