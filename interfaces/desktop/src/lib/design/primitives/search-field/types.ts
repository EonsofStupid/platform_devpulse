import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the SearchField primitive.
 *
 * A search field provides a text input optimized for search queries,
 * with a search icon and clear button. For general text input, use
 * TextField. For filtering a list while typing, use Combobox.
 *
 * @example
 * ```svelte
 * <div {...searchFieldAnatomy.attrs.root} role="search" aria-label="Site search">
 *   <span {...searchFieldAnatomy.attrs.icon} aria-hidden="true">🔍</span>
 *   <input {...searchFieldAnatomy.attrs.input} type="search" aria-label="Search"
 *          value={query} />
 *   {#if query}
 *     <button {...searchFieldAnatomy.attrs.clear} aria-label="Clear search">×</button>
 *   {/if}
 * </div>
 * ```
 */
export interface SearchFieldPrimitiveProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the search field */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Current search query value */
	value?: string;
	/** Callback when search value changes */
	onChange?: (value: string) => void;
	/** Callback when clear button is pressed */
	onClear?: () => void;
	/** Disabled state */
	disabled?: boolean;
	/** Placeholder text */
	placeholder?: string;
}
