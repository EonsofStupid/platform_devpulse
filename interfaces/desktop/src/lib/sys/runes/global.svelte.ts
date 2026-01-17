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

    // Actions (Atomic Mutations)
    toggleTheme() {
        this.theme = this.theme === 'glass-dark' ? 'glass-light' : 'glass-dark';
    }

    setDomain(domain: string) {
        this.current_domain = domain;
        // Logic to trigger Dynamic Background change would live here or in UI
    }
}

// Export Singleton
export const global = new GlobalState();
