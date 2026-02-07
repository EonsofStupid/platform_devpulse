/**
 * @file sys/init.ts
 * @description Initialize sys layer
 *
 * SvelteKit handles routing via file system.
 * Domain discovery is automatic from routes/(app)/ structure.
 */

let initialized = false;

/** Initialize the sys layer */
export function initSys(): void {
	if (initialized) return;
	initialized = true;
	// SvelteKit handles routing automatically
	// No manual domain registration needed
}

/** Check if sys is initialized */
export function isSysInitialized(): boolean {
	return initialized;
}
