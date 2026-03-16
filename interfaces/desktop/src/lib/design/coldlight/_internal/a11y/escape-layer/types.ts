export interface EscapeLayerConfig {
	/** Whether escape handling is active. */
	enabled: () => boolean;
	/** Callback when Escape is pressed on the top layer. */
	onEscape: () => void;
}
