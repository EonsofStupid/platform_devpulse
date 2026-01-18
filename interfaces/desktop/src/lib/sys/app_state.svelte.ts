/**
 * @fileoverview app_state.svelte.ts
 * @file src/lib/sys/app_state.svelte.ts
 * @module @devpulse/sys/app_state.svelte
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

// Senior Svelte 5 Pattern: Global Singleton Store (Runes)
// Replaces complex "Zustand" adapters for simple UI state.

class AppState {
    // Core UI State
    sidebar_expanded = $state(true);
    theme_mode = $state("glass-dark");
    current_view = $state("home");

    // Visual State (The "Mad Scientist" Flair)
    background_asset = $state("/imgs/backgrounds/maincontentbackground.png");
    activity_icon = $state("/imgs/devpulse_icon_activity_pack/devpulse_activity.webp");
    glass_tint = $state("rgba(0, 0, 0, 0.4)"); // Default

    // Actions
    toggleSidebar() {
        this.sidebar_expanded = !this.sidebar_expanded;
    }

    setTheme(mode: string) {
        this.theme_mode = mode;
    }

    setView(view: string) {
        this.current_view = view;
        
        // Dynamic Glass Tinting based on Domain
        switch (view) {
            case "devmaestro":
                this.glass_tint = "rgba(100, 149, 237, 0.15)"; // Cornflower Blue (Production)
                break;
            case "thinkmaestro":
                this.glass_tint = "rgba(147, 112, 219, 0.15)"; // Medium Purple (Creative)
                break;
            case "wiredfront":
                this.glass_tint = "rgba(0, 255, 127, 0.1)"; // Spring Green (Signal/Live)
                break;
            default:
                this.glass_tint = "rgba(0, 0, 0, 0.4)"; // Default Dark
        }
    }
}

// Singleton Export
export const appState = new AppState();
