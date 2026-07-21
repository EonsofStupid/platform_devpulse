/**
 * @file sys/generated/terminology-icons.ts
 * @description Thin icon map for terminology engine terms → Lucide icons.
 * This is the ONLY hand-maintained file in the terminology system.
 * Everything else is generated from kernel_terms.toml.
 *
 * Maps engine step names (what Platform::boot() emits) to Lucide icons.
 * Keys MUST match the literal `engine` strings registered in
 * kernel_terms.toml AND the `InitEvent` names emitted by
 * systems/devpulse-engine/src/platform/boot/*.
 */

import {
	BarChart3,
	BookOpen,
	Brain,
	Cpu,
	Database,
	FileCheck,
	Globe,
	PlayCircle,
	Radar,
	Server,
	Settings,
	Users,
	Zap,
} from "@lucide/svelte";

type LucideIcon = typeof Settings;

/** Engine term → Lucide icon component */
const ICONS: Record<string, LucideIcon> = {
	// Architecture
	"data layer": Settings,

	// Stores
	"System relational": Database,
	"User relational": Database,
	"System analytics": BarChart3,
	"Graph store": Brain,
	"System cache": Zap,
	"Vector store": Radar,

	// Graph namespaces & HTTP surface
	"SurrealDB HTTP": Server,
	"User graph namespace": Users,
	"Global graph namespace": Globe,

	// AI
	"Model Loader": Cpu,

	// System stages
	preflight: PlayCircle,
	"Knowledge sync": BookOpen,
	"Grammar service": FileCheck,
};

/** Get Lucide icon for an engine term. Returns undefined if no icon mapped. */
export function getIcon(engineTerm: string): LucideIcon | undefined {
	return ICONS[engineTerm];
}

export type { LucideIcon };
