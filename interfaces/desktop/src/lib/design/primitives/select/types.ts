import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the Select primitive.
 *
 * A select presents a dropdown list for picking a value. Unlike Combobox,
 * there is no text input for filtering. For free-form text with suggestions,
 * use Combobox. For multiple selections displayed as tags, use TagGroup
 * composed with Select or Combobox.
 *
 * @example
 * ```svelte
 * <div {...selectAnatomy.attrs.root}>
 *   <label {...selectAnatomy.attrs.label}>Country</label>
 *   <button {...selectAnatomy.attrs.trigger} role="combobox" aria-expanded={open}>
 *     <span {...selectAnatomy.attrs.value}>{selected ?? "Choose..."}</span>
 *   </button>
 *   <div {...selectAnatomy.attrs.listbox} role="listbox">
 *     <div {...selectAnatomy.attrs.option} role="option" aria-selected={true}>USA</div>
 *   </div>
 * </div>
 * ```
 */
export interface SelectPrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the select */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Currently selected value */
	value?: string;
	/** Callback when selected value changes */
	onChange?: (value: string) => void;
	/** Whether the dropdown is open */
	open?: boolean;
	/** Callback when open state changes */
	onOpenChange?: (open: boolean) => void;
	/** Placeholder text shown when no value is selected */
	placeholder?: string;
	/** Allow selecting multiple values */
	multiple?: boolean;
	/** Disabled state */
	disabled?: boolean;
	/** Required for form validation */
	required?: boolean;
	/** Form field name */
	name?: string;
}
