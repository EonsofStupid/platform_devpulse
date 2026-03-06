/**
 * @fileoverview flags.ts
 * @file src/lib/cfg/flags.ts
 * @module @devpulse/cfg/flags
 * @layer lib
 *
 * @description
 * [TODO: Describe the purpose and responsibility of this module]
 *
 * @dependencies
 * - [TODO: List imports this file depends on]
 *
 * @consumers
 * - [TODO: List modules that import this file]
 *
 * @vpb-editable [TODO: List props VPB can modify, or 'none']
 * @since 1.0.0
 */

// FEATURE FLAGS (The SSOT)
// Protocol: IP_PROTECTION.md
// Default: All proprietary features must be FALSE.

export const flags = {
	// 1. IP / INTERNAL MECHANICS
	ENABLE_VIPER_MEMORY: false, // The Advanced Recall System
	ENABLE_MAESTRO_THOUGHTS: false, // Internal Monologue Visualization
	ENABLE_JOURNEY_ANALYTICS: false, // Emotional Graphing

	// 2. DEV TOOLS (Builder Mode)
	DEV_MODE: import.meta.env.DEV, // Automatically true in local dev
	ENABLE_CONTEXT_DEBUGGER: false, // Visualizer for loaded context

	// 3. EXPERIMENTAL DOMAINS
	ENABLE_OVERMIND: true, // The ThinkSpace (Core Feature)
	ENABLE_WIREDFRONT: true, // The Overlay System

	// 4. STARTUP EXPERIENCE
	ENABLE_BOOT_UI: true, // Splashscreen during Platform::boot()
};

// Type Safety for the Flag Dictionary
export type FeatureFlags = typeof flags;
