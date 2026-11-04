import type { RoomChatCopy } from "$lib/sys/generated/bindings.js";

export interface RoomTemplate {
	id: string;
	name: string;
	summary: string;
	seats: number;
	yours: boolean;
}

export interface RoomTemplatesProps {
	copy: RoomChatCopy;
	rooms: readonly RoomTemplate[];
	problem: string | null;
	onPick: (id: string) => void;
	onDelete: (id: string) => void;
	onBack: () => void;
}
