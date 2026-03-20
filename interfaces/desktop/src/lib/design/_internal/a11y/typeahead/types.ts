export interface TypeaheadConfig {
	/** Get all items to search through. */
	getItems: () => HTMLElement[];
	/** Callback when a match is found. Receives the matched element. */
	onMatch: (item: HTMLElement) => void;
	/** Timeout before search buffer resets (ms). Default: 500. */
	timeout?: number;
	/** Get text content from an item. Default: element.textContent. */
	getItemText?: (item: HTMLElement) => string;
}

export interface TypeaheadReturn {
	/** Handle a keydown event. Call from the container's keydown handler. */
	handleKeydown(e: KeyboardEvent): void;
	/** Reset the search buffer. */
	reset(): void;
}
