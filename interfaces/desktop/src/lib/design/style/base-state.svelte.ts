/**
 * @file StyleMacro Base State — Global Reactive Theme State
 * @package @devpulse/coldlight
 *
 * $state-based global platform visual state.
 * VPB pushes updates via custom event. StyleMacro reads reactively.
 * One $state object for the entire application.
 */

import type { StyleMacroProps } from "./macro-mappings.js";

// =============================================================================
// PLATFORM BASE STATE
// =============================================================================

export const platformBase = $state({
	/** Active style/theme ID. VPB can switch this. */
	activeStyleId: "coldlight-default",

	/** Global token defaults. Every StyleMacro falls back to these. */
	globalTokens: {
		backgroundColor: "layer-1",
		color: "neutral",
		borderColor: "subtle",
		borderRadius: "md",
		padding: "md",
		gap: "md",
		fontSize: "sm",
		fontFamily: "sans",
		surface: "glass-void",
		depth: "z1",
	} as Partial<StyleMacroProps>,
});

// =============================================================================
// VPB EVENT LISTENER
// =============================================================================

/**
 * Register the VPB style update listener.
 * Call once at app initialization (e.g., in root +layout.svelte).
 *
 * VPB dispatches:
 * ```ts
 * window.dispatchEvent(new CustomEvent('vpb:style-update', {
 *   detail: { newStyleId: 'dark-mode', newTokens: { backgroundColor: 'layer-2' } }
 * }));
 * ```
 */
export function registerVpbListener(): void {
	if (typeof window === "undefined") return;

	window.addEventListener("vpb:style-update", ((
		event: CustomEvent<{
			newStyleId?: string;
			newTokens?: Partial<StyleMacroProps>;
		}>,
	) => {
		if (event.detail.newStyleId) {
			platformBase.activeStyleId = event.detail.newStyleId;
		}

		if (event.detail.newTokens) {
			// Safe mutation of specific keys — does not nuke the whole object
			Object.assign(platformBase.globalTokens, event.detail.newTokens);
		}
	}) as EventListener);
}

// =============================================================================
// PROGRAMMATIC API
// =============================================================================

/** Set the active style ID programmatically. */
export function setActiveStyle(styleId: string): void {
	platformBase.activeStyleId = styleId;
}

/** Update global tokens programmatically. */
export function updateGlobalTokens(tokens: Partial<StyleMacroProps>): void {
	Object.assign(platformBase.globalTokens, tokens);
}
