/**
 * @fileoverview global.svelte.ts
 * @file src/lib/sys/runes/global.svelte.ts
 * @module @devpulse/sys/runes/global.svelte
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

// GLOBAL APP STATE (The Singleton Atom)
// Architecture: Svelte 5 Runes ($state, $derived)
// Replacement for: Zustand / Jotai

class GlobalState {
    // 1. System State
    theme = $state<'glass-dark' | 'glass-light'>('glass-dark');
    is_dev_mode = $state(import.meta.env.DEV);
    
    // 2. Navigation State
    current_domain = $state("devpulse"); // "devpulse" | "overmind" | "wiredfront"
    
    // 3. Session State
    user_id = $state<string | null>(null);
    session_active = $state(false);

    // 4. UI State
    sidebar_expanded = $state(false);

    // Actions (Atomic Mutations)
    toggleTheme() {
        this.theme = this.theme === 'glass-dark' ? 'glass-light' : 'glass-dark';
    }

    toggleSidebar() {
        this.sidebar_expanded = !this.sidebar_expanded;
    }

    setDomain(domain: string) {
        this.current_domain = domain;
        // Logic to trigger Dynamic Background change would live here or in UI
    }
}

// Export Singleton
export const global = new GlobalState();
