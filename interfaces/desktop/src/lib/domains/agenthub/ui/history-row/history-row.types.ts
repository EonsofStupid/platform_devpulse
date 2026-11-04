import type { FoundSession } from "#lib/sys/generated/bindings.js";

export interface HistoryRowProps {
	session: FoundSession;
	providerName: string;
	selected: boolean;
	onSelect: () => void;
}
