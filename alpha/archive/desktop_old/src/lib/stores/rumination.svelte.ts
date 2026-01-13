/**
 * Rumination Store - Tracks Maestro's thinking state
 *
 * Rumination layers (from PHILOSOPHY.md):
 * - Keystroke (<50ms): What are they asking about?
 * - Pause (<500ms): What context do they need?
 * - Send (2-5s): Full rumination, COSTAR+ assembly
 * - Background (Minutes): Heavy analysis, learning
 */

export type RuminationLayer = 'keystroke' | 'pause' | 'send' | 'background' | null;

class RuminationStore {
	isProcessing = $state(false);
	currentLayer = $state<RuminationLayer>(null);
	startTime = $state<number | null>(null);

	/**
	 * Start rumination at a specific layer
	 */
	setProcessing(layer: RuminationLayer): void {
		this.isProcessing = true;
		this.currentLayer = layer;
		this.startTime = Date.now();
	}

	/**
	 * Clear processing state
	 */
	clearProcessing(): void {
		this.isProcessing = false;
		this.currentLayer = null;
		this.startTime = null;
	}

	/**
	 * Get elapsed time in ms since rumination started
	 */
	get elapsed(): number {
		if (!this.startTime) return 0;
		return Date.now() - this.startTime;
	}

	/**
	 * Get human-readable layer name
	 */
	get layerLabel(): string {
		switch (this.currentLayer) {
			case 'keystroke':
				return 'Listening';
			case 'pause':
				return 'Gathering context';
			case 'send':
				return 'Thinking';
			case 'background':
				return 'Deep analysis';
			default:
				return 'Ready';
		}
	}
}

export const ruminationState = new RuminationStore();
