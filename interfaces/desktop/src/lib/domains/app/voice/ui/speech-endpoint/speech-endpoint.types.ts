/** Presentation contract; the feature supplies kernel-approved connections and the binding. */
import type {
	SavedConnection,
	SpeechBinding,
	VoiceLabEndpointsCopy,
} from "#lib/sys/generated/bindings.js";

export interface SpeechEndpointPickerProps {
	copy: VoiceLabEndpointsCopy;
	/** Heading naming the role. */
	title: string;
	/** What happens with nothing chosen. */
	noneLine: string;
	/** What happens to the slot while a connection is chosen. */
	slotNote: string;
	/** The saved choice, if any. */
	binding: SpeechBinding | null;
	/** Saved connections that can carry speech. */
	connections: SavedConnection[];
	busy: boolean;
	onChoose: (connection: SavedConnection, model: string) => void | Promise<void>;
	onStopUsing: () => void | Promise<void>;
}
