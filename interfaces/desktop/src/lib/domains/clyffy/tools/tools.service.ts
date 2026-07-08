/**
 * @file Clyffy Tools Service — read-only catalog of Clyffy capabilities.
 * @module @devpulse/domains/clyffy/tools
 *
 * Layman-safe listing of what Clyffy can do for the user. Config of
 * each capability (grammars, guardrails, llguidance rules, MCP tool
 * wiring) lives in devtools — this surface is strictly READ.
 *
 * The catalog below is frontend-owned VOCABULARY (labels, layman
 * descriptions, grouping). Availability is NEVER authored here — it is
 * computed per render from the connected endpoint's advertised
 * capability (`clyffyConnection.slots`) via each entry's `wire`
 * matcher, the same idiom the wizard's SLOT_LAYMAN table uses.
 * Standalone (Tier-1) honestly resolves every entry to unavailable.
 */

import type { LoadedSlotSummary } from "$lib/sys/generated/bindings.js";

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
	/** Whether the capability is currently usable — computed from the
	 *  connected endpoint's capability, never authored. */
	available: boolean;
}

export type ClyffyCapabilityGroup = "thinking" | "memory" | "voice" | "vision" | "tools";

/** Catalog entry — vocabulary + how it finds itself on the wire. */
interface CapabilityCatalogEntry {
	id: string;
	label: string;
	description: string;
	group: ClyffyCapabilityGroup;
	/** Match against `LoadedSlotSummary` — `slotId` speaks the wire
	 *  contract's slot vocabulary verbatim (clyffy / minion / voice /
	 *  rag_embed); `role` matches advertised roles for concepts that
	 *  are capabilities rather than slots (vision). */
	wire: { slotId?: string; role?: string };
}

/** Frontend-owned vocabulary — labels + grouping only, no availability. */
const CAPABILITY_CATALOG: readonly CapabilityCatalogEntry[] = [
	{
		id: "chat.brain",
		label: "Chat",
		description: "Answers questions, writes, and reasons through problems.",
		group: "thinking",
		wire: { slotId: "clyffy" },
	},
	{
		id: "chat.minion",
		label: "Quick Help",
		description: "Fast answers for short questions without waking the main brain.",
		group: "thinking",
		wire: { slotId: "minion" },
	},
	{
		id: "memory.recall",
		label: "Recall",
		description: "Remembers earlier conversations and project context.",
		group: "memory",
		wire: { slotId: "rag_embed" },
	},
	{
		id: "memory.search",
		label: "Search",
		description: "Finds relevant snippets across saved notes and files.",
		group: "memory",
		wire: { slotId: "rag_embed" },
	},
	{
		id: "voice.listen",
		label: "Listen",
		description: "Transcribes what you say into text.",
		group: "voice",
		wire: { slotId: "voice" },
	},
	{
		id: "voice.speak",
		label: "Speak",
		description: "Reads replies out loud with a chosen voice.",
		group: "voice",
		wire: { slotId: "voice" },
	},
	{
		id: "vision.see",
		label: "See",
		description: "Looks at screenshots and images to answer questions about them.",
		group: "vision",
		wire: { role: "vision" },
	},
] as const;

/**
 * Resolve the catalog against the advertised slots — availability is a
 * pure function of what the connected endpoint serves right now. An
 * empty `slots` (standalone / connecting) resolves everything to
 * unavailable, which is the honest Tier-1 answer.
 */
export function resolveCapabilities(
	slots: readonly LoadedSlotSummary[],
): readonly ClyffyCapability[] {
	return CAPABILITY_CATALOG.map((entry) => ({
		id: entry.id,
		label: entry.label,
		description: entry.description,
		group: entry.group,
		available: slots.some(
			(slot) =>
				(entry.wire.slotId === undefined || slot.slot_id === entry.wire.slotId) &&
				(entry.wire.role === undefined || slot.role === entry.wire.role) &&
				slot.status === "ready",
		),
	}));
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
