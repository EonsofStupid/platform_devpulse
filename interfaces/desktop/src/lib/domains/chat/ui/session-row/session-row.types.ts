import type { ChatSession } from "$lib/sys/generated/bindings.js";

/** Display data only; selecting a session remains the feature's responsibility. */
export interface SessionRowProps {
	session: Pick<ChatSession, "id" | "title" | "updatedAt">;
	active: boolean;
	onClick: () => void;
	disabled?: boolean;
	class?: string;
}
