export interface FocusTrapConfig {
	/** Whether the focus trap is active. */
	enabled: () => boolean;
	/** The container element to trap focus within. */
	node: () => HTMLElement | null;
	/** Element to focus on mount. Default: first focusable or [autofocus]. */
	initialFocus?: () => HTMLElement | null;
	/** Restore focus to previous element on unmount. Default: true. */
	restoreFocus?: boolean;
}
