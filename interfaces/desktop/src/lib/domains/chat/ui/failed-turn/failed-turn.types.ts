/** A retained stream copy, independent of live execution and saved history. */
export interface FailedTurnProps {
	title: string;
	note: string;
	message: string;
	text: string;
	dismissLabel: string;
	onDismiss: () => void;
}
