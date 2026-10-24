/**
 * @file Clyffy Tools Service — read-only catalog of Clyffy capabilities.
 * @module @devpulse/domains/clyffy/tools
 *
 * Layman-safe listing of what Clyffy can do for the user. Config of
 * each capability (grammars, guardrails, llguidance rules, MCP tool
 * wiring) lives in devtools — this surface is strictly READ.
 *
 * TODO(kernel-backed): Today this returns a hardcoded list. Replace
 * with a Tauri command `clyffy.listCapabilities()` that sources from
 * the kernel capability registry once that command exists. Frontend
 * shape is stable; only the fetch swaps.
 */

/** A single user-facing Clyffy capability. */
export interface ClyffyCapability {
	/** Stable id — matches the kernel capability registry key. */
	id: string;
	/** One- or two-word name the user sees. */
	label: string;
	/** One-line layman description. No algorithm names. */
	description: string;
	/** Broad grouping for the browser UI. */
	group: ClyffyCapabilityGroup;
	/** Whether the capability is currently usable. Driven by backend later. */
	available: boolean;
}

export type ClyffyCapabilityGroup = "thinking" | "memory" | "voice" | "vision" | "tools";

/** Placeholder list — replaced by a kernel query when the command lands. */
const STUB_CAPABILITIES: readonly ClyffyCapability[] = [
	{
		id: "chat.brain",
		label: "Chat",
		description: "Answers questions, writes, and reasons through problems.",
		group: "thinking",
		available: true,
	},
	{
		id: "chat.minion",
		label: "Quick Help",
		description: "Fast answers for short questions without waking the main brain.",
		group: "thinking",
		available: true,
	},
	{
		id: "memory.recall",
		label: "Recall",
		description: "Remembers earlier conversations and project context.",
		group: "memory",
		available: true,
	},
	{
		id: "memory.search",
		label: "Search",
		description: "Finds relevant snippets across saved notes and files.",
		group: "memory",
		available: true,
	},
	{
		id: "voice.listen",
		label: "Listen",
		description: "Transcribes what you say into text.",
		group: "voice",
		available: false,
	},
	{
		id: "voice.speak",
		label: "Speak",
		description: "Reads replies out loud with a chosen voice.",
		group: "voice",
		available: false,
	},
	{
		id: "vision.see",
		label: "See",
		description: "Looks at screenshots and images to answer questions about them.",
		group: "vision",
		available: false,
	},
] as const;

/**
 * Fetch the current capability catalog. Async today so the real
 * kernel-backed version can slot in without touching callers.
 */
export async function listCapabilities(): Promise<readonly ClyffyCapability[]> {
	return STUB_CAPABILITIES;
}

/** Group capabilities for UI rendering. */
export function groupCapabilities(
	items: readonly ClyffyCapability[],
): Record<ClyffyCapabilityGroup, ClyffyCapability[]> {
	const groups: Record<ClyffyCapabilityGroup, ClyffyCapability[]> = {
		thinking: [],
		memory: [],
		voice: [],
		vision: [],
		tools: [],
	};
	items.forEach((cap) => {
		groups[cap.group].push(cap);
	});
	return groups;
}
