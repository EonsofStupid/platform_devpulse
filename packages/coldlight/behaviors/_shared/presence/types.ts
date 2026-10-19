export interface PresenceConfig {
	/** Whether the element should be present. */
	open: () => boolean;
	/** The node to monitor for transition/animation end. */
	node: () => HTMLElement | null;
	/** Callback when exit transition/animation completes. */
	onExitComplete?: () => void;
}

export interface PresenceReturn {
	/** Whether the element should be in the DOM (true during exit animation). */
	readonly present: boolean;
}
