export interface DismissLayerConfig {
	/** Whether dismiss detection is active. */
	enabled: () => boolean;
	/** The node to detect clicks outside of. */
	node: () => HTMLElement | null;
	/**
	 * Elements that count as inside the layer — typically the control that
	 * toggles it. A press there is left to that control: dismissing first
	 * would let the control's own click reopen the layer.
	 */
	exclude?: () => readonly (HTMLElement | null | undefined)[];
	/** Callback when a dismiss is detected (click outside). */
	onDismiss: () => void;
}
