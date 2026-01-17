<!--
    TOPBAR.SVELTE - Persistent Header (100% width)
    ===============================================
    - ParasiteLogo (pure typography with glass effect)
    - Search icon → overlay input
    - True depth: thick bevel, gradient, tokens
    - NO padding from frame edges
-->
<script lang="ts">
    import ParasiteLogo from "$lib/design/primitives/ParasiteLogo.svelte";

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
        <ParasiteLogo />
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
    .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        height: 100%;
        padding: 0 var(--space-4);
        box-sizing: border-box;
    }

    .topbar-left {
        display: flex;
        align-items: center;
        gap: var(--space-3);
    }

    .topbar-center {
        flex: 1;
    }

    .topbar-right {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        position: relative;
    }

    .topbar-icon {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--surface-glass-smoke);
        border: var(--border-subtle);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--duration-fast) var(--ease-out);
        box-shadow: var(--bevel-outset-subtle);
    }

    .topbar-icon:hover {
        background: var(--surface-glass-frost);
        box-shadow: var(--bevel-outset-soft), var(--shadow-glow-teal);
    }

    .icon {
        font-size: 14px;
    }

    /* Search Overlay */
    .search-overlay {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: var(--space-2);
        background: var(--surface-glass-void);
        backdrop-filter: blur(var(--blur-xl));
        border: var(--border-medium);
        border-radius: var(--radius-lg);
        box-shadow: var(--bevel-outset-medium), var(--shadow-z4);
        padding: var(--space-2);
        min-width: 280px;
        animation: fade-in var(--duration-fast) var(--ease-out);
        z-index: 1000;
    }

    .search-input {
        width: 100%;
        background: var(--surface-glass-deep);
        border: var(--border-subtle);
        border-radius: var(--radius-md);
        padding: var(--space-2) var(--space-3);
        color: var(--text-white);
        font-family: var(--font-sans);
        font-size: var(--text-sm);
        outline: none;
        box-shadow: var(--bevel-inset-soft);
    }

    .search-input::placeholder {
        color: var(--text-muted);
    }

    .search-input:focus {
        border-color: var(--signal-teal);
        box-shadow: var(--bevel-inset-soft), var(--shadow-glow-teal);
    }
</style>
