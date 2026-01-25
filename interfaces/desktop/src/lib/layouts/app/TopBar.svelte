<!--
  @file src/lib/layouts/app/TopBar.svelte
  @name TopBar.svelte
  @module @devpulse/layouts/app/TopBar
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
<!--
    TOPBAR.SVELTE - Persistent Header (100% width)
    ===============================================
    - ParasiteLogo (pure typography with glass effect)
    - Search icon → overlay input
    - True depth: thick bevel, gradient, tokens
    - NO padding from frame edges
-->
<script lang="ts">
    import { Parasite } from "$lib/design/plugins/parasite";

    let searchOpen = $state(false);
    let searchQuery = $state("");

    function toggleSearch() {
        searchOpen = !searchOpen;
        if (!searchOpen) searchQuery = "";
    }
</script>

<div class="topbar">
    <!-- Left: ParasiteLogo -->
    <div class="topbar-left">
        <Parasite />
    </div>

    <!-- Center: Spacer -->
    <div class="topbar-center"></div>

    <!-- Right: Search Icon + Controls -->
    <div class="topbar-right">
        <button class="topbar-icon" onclick={toggleSearch} aria-label="Search">
            <span class="icon">🔍</span>
        </button>

        {#if searchOpen}
            <div class="search-overlay">
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Search..."
                    class="search-input"
                />
            </div>
        {/if}
    </div>
</div>

<style>
    /* =============================================
       TOPBAR - NEON ICONS + LIQUID GLASS
       Pattern: pulseos-glass-interactive-button
       ============================================= */
    .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        height: 100%;
        padding: 0 16px;
        box-sizing: border-box;
    }

    .topbar-left {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .topbar-center {
        flex: 1;
    }

    .topbar-right {
        display: flex;
        align-items: center;
        gap: 8px;
        position: relative;
    }

    /* =============================================
       ICON BUTTON - NEON GLOW + MOUSE TRACKING
       ============================================= */
    .topbar-icon {
        position: relative;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        /* Glass base */
        background: hsl(222 48% 13% / 0.8);
        border: 1px solid hsl(191 100% 60% / 0.25);
        border-radius: 8px;
        cursor: pointer;
        /* Mouse position CSS vars for gradient tracking */
        --mouse-x: 50%;
        --mouse-y: 50%;
        /* Multi-layer shadow */
        box-shadow:
            /* Crisp bevel */
            inset 1px 1px 0 hsl(0 0% 100% / 0.1),
            inset -1px -1px 0 hsl(0 0% 0% / 0.3),
            /* Subtle neon glow */
            0 0 8px hsl(191 100% 60% / 0.15),
            /* Elevation */
            0 2px 8px hsl(0 0% 0% / 0.3);
        transition:
            transform 0.3s cubic-bezier(0.33, 1, 0.68, 1),
            background 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        overflow: hidden;
    }

    /* Mouse-following gradient overlay */
    .topbar-icon::before {
        content: '';
        position: absolute;
        top: var(--mouse-y, 50%);
        left: var(--mouse-x, 50%);
        width: 150%;
        height: 150%;
        background: radial-gradient(
            circle at center,
            hsl(191 100% 60% / 0.2) 0%,
            transparent 70%
        );
        transform: translate(-50%, -50%);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        z-index: 0;
    }

    /* Hover - SWELL + NEON GLOW */
    .topbar-icon:hover {
        transform: scale(1.1);
        background: hsl(222 40% 16% / 0.9);
        border-color: hsl(191 100% 60% / 0.5);
        box-shadow:
            /* Enhanced bevel */
            inset 1px 1px 0 hsl(0 0% 100% / 0.15),
            inset -1px -1px 0 hsl(0 0% 0% / 0.25),
            /* NEON GLOW - bright */
            0 0 20px hsl(191 100% 60% / 0.4),
            0 0 40px hsl(191 100% 60% / 0.2),
            /* Elevation */
            0 4px 16px hsl(0 0% 0% / 0.4);
    }

    .topbar-icon:hover::before {
        opacity: 1;
    }

    /* Icon element - glow on hover */
    .topbar-icon .icon {
        position: relative;
        z-index: 1;
        font-size: 14px;
        color: hsl(0 0% 90%);
        transition:
            filter 0.3s ease,
            color 0.3s ease;
    }

    .topbar-icon:hover .icon {
        color: hsl(191 100% 80%);
        filter: drop-shadow(0 0 6px hsl(191 100% 60% / 0.8));
    }

    /* Gradual return on mouse leave */
    .topbar-icon:not(:hover) {
        transition:
            transform 0.5s cubic-bezier(0.33, 1, 0.68, 1),
            background 0.3s ease,
            border-color 0.3s ease,
            box-shadow 0.3s ease;
    }

    /* =============================================
       SEARCH OVERLAY - DEEP GLASS PANEL
       ============================================= */
    .search-overlay {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 8px;
        /* Deep glass */
        background: hsl(222 50% 9% / 0.95);
        backdrop-filter: blur(24px) saturate(180%);
        -webkit-backdrop-filter: blur(24px) saturate(180%);
        /* Neon border */
        border: 1px solid hsl(191 100% 60% / 0.35);
        border-radius: 12px;
        /* Multi-layer shadow for depth */
        box-shadow:
            /* Crisp bevel */
            inset 2px 2px 0 hsl(0 0% 100% / 0.08),
            inset -2px -2px 0 hsl(0 0% 0% / 0.3),
            /* Neon glow */
            0 0 24px hsl(191 100% 60% / 0.2),
            /* Elevation */
            0 8px 32px hsl(0 0% 0% / 0.5),
            0 2px 8px hsl(0 0% 0% / 0.3);
        padding: 12px;
        min-width: 300px;
        animation: search-reveal 200ms cubic-bezier(0.33, 1, 0.68, 1);
        z-index: 1000;
    }

    @keyframes search-reveal {
        from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    /* =============================================
       SEARCH INPUT - RECESSED GLASS
       ============================================= */
    .search-input {
        width: 100%;
        /* Recessed glass */
        background: hsl(222 60% 6% / 0.9);
        border: 1px solid hsl(191 100% 60% / 0.2);
        border-radius: 8px;
        padding: 10px 14px;
        color: hsl(0 0% 95%);
        font-family: "Rajdhani", "Inter", system-ui, sans-serif;
        font-size: 0.9rem;
        outline: none;
        /* Inset shadow for recessed look */
        box-shadow:
            inset 2px 2px 6px hsl(0 0% 0% / 0.5),
            inset -1px -1px 3px hsl(0 0% 100% / 0.03);
        transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
    }

    .search-input::placeholder {
        color: hsl(0 0% 50%);
    }

    .search-input:focus {
        border-color: hsl(191 100% 60% / 0.6);
        box-shadow:
            inset 2px 2px 6px hsl(0 0% 0% / 0.5),
            inset -1px -1px 3px hsl(0 0% 100% / 0.03),
            /* Focus neon glow */
            0 0 16px hsl(191 100% 60% / 0.3);
    }
</style>
