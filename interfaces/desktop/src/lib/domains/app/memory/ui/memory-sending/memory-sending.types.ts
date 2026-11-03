/**
 * @file memory-sending.types.ts
 * @module @devpulse/domains/app/memory/ui/memory-sending
 * What goes to your agents, as the panel shows it.
 */
import type { MemoryCopy, MemorySending } from "$lib/sys/generated/bindings.js";

export interface MemorySendingPanelProps {
	copy: MemoryCopy;
	sending: MemorySending;
}
