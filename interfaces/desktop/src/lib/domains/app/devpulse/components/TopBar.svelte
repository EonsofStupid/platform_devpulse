<!--
  @file src/lib/domains/app/devpulse/components/TopBar.svelte
  @name TopBar.svelte
  @module @devpulse/domains/app/devpulse/components/TopBar
  @layer lib

  @description
  [TODO: Describe this component's purpose]

  @props
  - [TODO: propName]: [type] - [description]

  @dependencies
  - [TODO: List imports]

  @consumers
  - [TODO: List who uses this component]

  @vpb-editable [TODO: List editable props]
  @since 1.0.0
-->
<script lang="ts">
    import { global } from "$lib/sys/runes/global.svelte";
    import Surface from "$lib/design/primitives/Surface.svelte";
    import ParasiteLogo from "$lib/design/primitives/ParasiteLogo.svelte";
</script>

<div class="topbar-container">
    <Surface variant="deep" animate="pulse" class="topbar-surface">
        <div class="glass-flex">
            <div class="left">
                <ParasiteLogo />
                <span class="domain-badge"
                    >{global.current_domain.toUpperCase()}</span
                >
            </div>

            <div class="center">
                <!-- OmniSearch Placeholder -->
                <Surface variant="metallic" class="search-surface">
                    <input
                        type="text"
                        placeholder="OmniSearch..."
                        class="omni-input"
                    />
                </Surface>
            </div>

            <div class="right">
                <button class="icon-btn" onclick={() => global.toggleTheme()}>
                    {global.theme === "glass-dark" ? "🌙" : "☀️"}
                </button>
                <div class="user-avatar">JP</div>
            </div>
        </div>
    </Surface>
</div>

<style>
    .topbar-container {
        width: 100%;
        height: 100%;
        padding: 8px 16px;
    }

    /* Pass-through class to Surface */
    :global(.topbar-surface) {
        height: 100%;
        display: flex;
        align-items: center; /* Vertical Center */
    }

    .glass-flex {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: 0 1rem;
        color: rgba(255, 255, 255, 0.8);
    }

    .domain-badge {
        font-size: 0.8rem;
        padding: 2px 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    /* Search Input within a Surface */
    :global(.search-surface) {
        width: 400px;
        height: 36px;
        transition: width 0.3s;
    }

    .omni-input {
        background: transparent;
        border: none;
        width: 100%;
        height: 100%;
        padding: 0 1rem;
        color: white;
        outline: none;
    }
</style>
