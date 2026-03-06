/**
 * @file routes/splashscreen/boot-labels.ts
 * @description Maps Platform::boot() step names to user-friendly labels.
 * Engine layer uses IP-safe names ("Graph store"). Frontend adds friendly labels for production mode.
 */

export interface BootLabel {
	label: string;
	icon: string;
}

/** Maps engine step names to production-friendly labels. */
export const FRIENDLY_LABELS: Record<string, BootLabel> = {
	"Data layer": { label: "System", icon: "gear" },
	"Relational store": { label: "Data Store", icon: "database" },
	"Analytics store": { label: "Analytics Engine", icon: "chart" },
	"Graph store": { label: "Knowledge Graph", icon: "brain" },
	"Cache store": { label: "Memory Cache", icon: "lightning" },
	// Future:
	// "Vector store": { label: "Search Engine", icon: "search" },
};

/** Resolve a step name to its friendly label. Falls back to raw name. */
export function friendlyLabel(step: string): string {
	return FRIENDLY_LABELS[step]?.label ?? step;
}

/** Bottom message based on progress. */
export function bootMessage(progress: number, hasErrors: boolean): string {
	if (hasErrors) return "Something went wrong...";
	if (progress >= 100) return "Ready!";
	if (progress >= 75) return "Almost ready...";
	if (progress >= 50) return "Setting up your workspace...";
	return "Initializing...";
}
