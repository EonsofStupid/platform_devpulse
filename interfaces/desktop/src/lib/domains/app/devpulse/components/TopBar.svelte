<!--
  @file src/lib/domains/app/devpulse/components/TopBar.svelte
  @name TopBar.svelte
  @module @devpulse/domains/app/devpulse/components/TopBar
  @layer lib

  @description
  DevPulse domain-specific top bar with logo, domain badge, search, and user controls.

  @since 1.0.0
-->
<script lang="ts">
    import { global } from "$lib/sys/runes/global.svelte";
    import { Parasite } from "$lib/design/plugins/parasite";
    import GlassPanel from "$lib/design/components/GlassPanel.svelte";
</script>

<div class="topbar-container">
    <GlassPanel variant="deep" padding="none" class="topbar-surface">
        <div class="glass-flex">
            <div class="left">
                <Parasite />
                <span class="domain-badge"
                    >{global.current_domain.toUpperCase()}</span
                >
            </div>

            <div class="center">
                <!-- OmniSearch Placeholder -->
                <div class="dp-surface search-surface" data-surface="glass" data-variant="smoke">
                    <input
                        type="text"
                        placeholder="OmniSearch..."
                        class="omni-input"
                    />
                </div>
            </div>

            <div class="right">
                <button class="icon-btn" onclick={() => global.toggleTheme()}>
                    {global.theme === "glass-dark" ? "🌙" : "☀️"}
                </button>
                <div class="user-avatar">JP</div>
            </div>
        </div>
    </GlassPanel>
</div>

<style>
    .topbar-container {
        width: 100%;
        height: 100%;
        padding: var(--space-2) var(--space-4);
    }

    :global(.topbar-surface) {
        height: 100%;
        display: flex;
        align-items: center;
        border-radius: var(--radius-md);
    }

    .glass-flex {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: 0 var(--space-4);
        color: var(--text-secondary);
    }

    .left {
        display: flex;
        align-items: center;
        gap: var(--space-3);
    }

    .domain-badge {
        font-size: var(--text-xs);
        padding: var(--space-1) var(--space-2);
        background: var(--surface-glass-smoke);
        border-radius: var(--radius-sm);
        border: var(--border-subtle);
        color: var(--text-muted);
    }

    .center {
        flex: 1;
        display: flex;
        justify-content: center;
    }

    .search-surface {
        width: 400px;
        height: 36px;
        border-radius: var(--radius-md);
        transition: width var(--duration-normal) var(--ease-out);
    }

    .omni-input {
        background: transparent;
        border: none;
        width: 100%;
        height: 100%;
        padding: 0 var(--space-4);
        color: var(--text-white);
        outline: none;
    }

    .omni-input::placeholder {
        color: var(--text-muted);
    }

    .right {
        display: flex;
        align-items: center;
        gap: var(--space-3);
    }

    .icon-btn {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--surface-glass-smoke);
        border: var(--border-subtle);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all var(--duration-fast) var(--ease-out);
    }

    .icon-btn:hover {
        background: var(--surface-glass-frost);
    }

    .user-avatar {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--signal-teal);
        border-radius: var(--radius-full);
        font-size: var(--text-xs);
        font-weight: 700;
        color: var(--surface-solid-black);
    }
</style>
