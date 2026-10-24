export type Politeness = "polite" | "assertive";

export interface LiveRegionReturn {
	/** Announce a message to screen readers. */
	announce(message: string): void;
}
