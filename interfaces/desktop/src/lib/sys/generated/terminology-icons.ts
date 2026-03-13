/**
 * @file sys/generated/terminology-icons.ts
 * @description Thin icon map for terminology engine terms → Lucide icons.
 * This is the ONLY hand-maintained file in the terminology system.
 * Everything else is generated from kernel_terms.toml.
 *
 * Maps engine step names (what Platform::boot() emits) to Lucide icons.
 */

import {
	Settings,
	Database,
	BarChart3,
	Brain,
	Zap,
	Radar,
} from "lucide-svelte";

type LucideIcon = typeof Settings;

/** Engine term → Lucide icon component */
const ICONS: Record<string, LucideIcon> = {
	"data layer": Settings,
	"Relational store": Database,
	"Analytics store": BarChart3,
	"Graph store": Brain,
	"Cache store": Zap,
	"Vector store": Radar,
};

/** Get Lucide icon for an engine term. Returns undefined if no icon mapped. */
export function getIcon(engineTerm: string): LucideIcon | undefined {
	return ICONS[engineTerm];
}

export type { LucideIcon };
