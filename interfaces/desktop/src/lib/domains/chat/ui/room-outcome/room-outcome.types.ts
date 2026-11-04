import type { Outcome, RoomChatCopy } from "#lib/sys/generated/bindings.js";

export interface RoomOutcomeProps {
	copy: RoomChatCopy;
	outcome: Outcome;
	/** What to call a place (`answerer-1`) on screen. */
	placeLabel: (place: string) => string;
	/** Opens the Council this room asked for, when it did. */
	onOpenCouncil?: () => void;
}
