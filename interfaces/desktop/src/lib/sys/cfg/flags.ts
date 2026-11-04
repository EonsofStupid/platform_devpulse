/**
 * @fileoverview flags.ts
 * @file src/lib/sys/cfg/flags.ts
 * @module @devpulse/sys/cfg/flags
 * @layer lib
 *
 * @description
 * The feature flags: one validated dictionary, read instead of testing the
 * build mode or a domain's availability where it is needed. The owner reversed
 * the old IP-hiding policy on 2026-11-01, so a flag here turns a feature on or
 * off; it does not conceal anything from the shipped application.
 *
 * @dependencies
 * - arktype (validates the dictionary at load)
 *
 * @consumers
 * - layouts/app/Sidebar.svelte: DEV_MODE
 * - sys/contracts/domains/app/{overmind,wiredfront}: ENABLE_OVERMIND, ENABLE_WIREDFRONT
 * - devtools/system/observability/structure: lists every flag and its value
 *
 * @vpb-editable none
 * @since 1.0.0
 */

import { type } from "arktype";

const FeatureFlagsContract = type({
	ENABLE_VIPER_MEMORY: "boolean",
	ENABLE_MAESTRO_THOUGHTS: "boolean",
	ENABLE_JOURNEY_ANALYTICS: "boolean",
	DEV_MODE: "boolean",
	ENABLE_CONTEXT_DEBUGGER: "boolean",
	ENABLE_OVERMIND: "boolean",
	ENABLE_WIREDFRONT: "boolean",
});

// FEATURE FLAGS (The SSOT)
// Protocol: IP_PROTECTION.md
// Default: All proprietary features must be FALSE.

export const flags = FeatureFlagsContract.assert({
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
});

// Type Safety for the Flag Dictionary
export type FeatureFlags = typeof flags;
