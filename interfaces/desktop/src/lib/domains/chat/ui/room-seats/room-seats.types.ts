import type { AgentChatCopy } from "$lib/sys/generated/bindings.js";

export interface RoomSeatView {
	key: string;
	role: string;
	agent: string;
	character: string | null;
	access: string;
	notes: boolean;
}

export interface RoomSeatsProps {
	title: string;
	seats: readonly RoomSeatView[];
	notesCopy: AgentChatCopy;
	/** The room is answering, so its seats cannot change. */
	disabled: boolean;
	onNotes: (key: string, on: boolean) => void;
	onChoose: () => void;
}
