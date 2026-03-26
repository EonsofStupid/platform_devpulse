export interface DismissLayerConfig {
	/** Whether dismiss detection is active. */
	enabled: () => boolean;
	/** The node to detect clicks outside of. */
	node: () => HTMLElement | null;
	/** Callback when a dismiss is detected (click outside). */
	onDismiss: () => void;
}
