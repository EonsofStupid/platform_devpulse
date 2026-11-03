/** Presentation contract; the feature supplies kernel-approved connection options. */
import type { EndpointChatCopy, SavedConnection } from "$lib/sys/generated/bindings.js";
export interface EndpointPickerProps {
	copy: EndpointChatCopy;
	connections: SavedConnection[];
	busy: boolean;
	onStart: (connection: SavedConnection, model: string) => void | Promise<void>;
}
