export interface ActiveDescendantConfig {
	/** The container that holds DOM focus (input, div[role=listbox]). */
	container: () => HTMLElement | null;
	/** CSS selector to find option items. */
	itemSelector: string;
	/** Attribute on items holding their id. Default: "id". */
	idAttr?: string;
	/** Attribute marking disabled items. Default: "data-disabled". */
	disabledAttr?: string;
	/** Loop from last → first. Default: true. */
	loop?: boolean;
	/** Callback when highlighted item changes. */
	onHighlightChange: (id: string | null) => void;
	/** Callback when item is selected (Enter). */
	onSelect?: (id: string) => void;
}

export interface ActiveDescendantReturn {
	/** ID of the currently highlighted item (for aria-activedescendant). */
	readonly highlightedId: string | null;
	/** Highlight the first item. */
	highlightFirst(): void;
	/** Highlight the last item. */
	highlightLast(): void;
	/** Clear the highlight. */
	clear(): void;
}
