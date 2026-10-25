/**
 * @file sys/boot/boot-labels.ts
 * @description SSOT for subsystem labels and icons.
 * Maps Platform::boot() step names to user-friendly labels, dev labels, and Lucide icons.
 * Engine uses IP-safe names ("Graph store"). This file provides:
 *   - Prod labels: user-facing, no tech details ("Cortex")
 *   - Dev labels: raw tech names ("SurrealDB")
 *   - Icons: Lucide component per subsystem
 */

import {
	Settings,
	Database,
	BarChart3,
	Brain,
	Zap,
	Radar,
} from "lucide-svelte";

/** Lucide icon type — SvelteComponentTyped class constructor. */
type LucideIcon = typeof Settings;

export interface BootLabel {
	/** Production-safe friendly label. */
	label: string;
	/** Dev-mode raw tech label. */
	devLabel: string;
	/** Lucide icon component. */
	icon: LucideIcon;
}

const LABELS: Record<string, BootLabel> = {
	"Data layer": { label: "System", devLabel: "Trinity", icon: Settings },
	"Relational store": { label: "Data Store", devLabel: "LibSQL", icon: Database },
	"Analytics store": { label: "Analytics Engine", devLabel: "DuckDB", icon: BarChart3 },
	"Graph store": { label: "Cortex", devLabel: "SurrealDB", icon: Brain },
	"Cache store": { label: "Memory Cache", devLabel: "Moka", icon: Zap },
	"RRO": { label: "Vector Store", devLabel: "RRO", icon: Radar },
};

/** Resolve a step name to its production-friendly label. Falls back to raw name. */
export function friendlyLabel(step: string): string {
	return LABELS[step]?.label ?? step;
}

/** Resolve a step name to its dev-mode tech label. Falls back to raw name. */
export function devLabel(step: string): string {
	return LABELS[step]?.devLabel ?? step;
}

/** Resolve a step name to its Lucide icon component. Returns undefined if unknown. */
export function getIcon(step: string): LucideIcon | undefined {
	return LABELS[step]?.icon;
}

/** Bottom message based on progress. */
export function bootMessage(progress: number, hasErrors: boolean): string {
	if (hasErrors) return "Something went wrong...";
	if (progress >= 100) return "Ready!";
	if (progress >= 75) return "Almost ready...";
	if (progress >= 50) return "Setting up your workspace...";
	return "Initializing...";
}
