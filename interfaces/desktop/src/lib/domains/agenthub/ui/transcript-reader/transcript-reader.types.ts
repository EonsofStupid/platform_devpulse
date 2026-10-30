import type { FoundEvent, FoundSession } from "$lib/sys/generated/bindings.js";

export interface TranscriptReaderProps {
	session: FoundSession | null;
	providerName: string;
	events: FoundEvent[];
	loading: boolean;
	error: string | null;
	hasOlder: boolean;
	truncatedBefore: boolean;
	onOlder: () => void;
	onReload: () => void;
}
