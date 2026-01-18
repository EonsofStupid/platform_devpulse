<!--
    TabSet.svelte - Legacy TabSet (uses token system)
    Note: Prefer Tabs.svelte from primitives for new code
-->
<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        tabs: string[];
        activeTab?: string;
        children: Snippet<[string]>;
    }

    let { tabs, activeTab, children }: Props = $props();
    let currentTab = $state<string | undefined>(undefined);
    const effectiveTab = $derived(currentTab ?? activeTab ?? tabs[0]);

    function selectTab(tab: string) {
        currentTab = tab;
    }
</script>

<div class="tabset-container">
    <nav class="tab-nav">
        {#each tabs as tab}
            <button
                class="tab-btn"
                class:active={effectiveTab === tab}
                onclick={() => selectTab(tab)}
            >
                {tab}
            </button>
        {/each}
    </nav>

    <div class="tab-content">
        {@render children(effectiveTab)}
    </div>
</div>

<style>
    .tabset-container {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .tab-nav {
        display: flex;
        gap: var(--dp-space-2);
        padding: var(--dp-space-2) var(--dp-space-4);
        border-bottom: 1px solid oklch(35% 0.05 195 / 0.3);
        background: oklch(8% 0.03 195 / 0.6);
    }

    .tab-btn {
        background: transparent;
        border: none;
        color: var(--dp-text-muted);
        padding: var(--dp-space-2) var(--dp-space-4);
        font-size: var(--dp-text-sm);
        font-family: var(--dp-font-sans);
        cursor: pointer;
        border-radius: var(--dp-radius-sm);
        transition: all var(--dp-transition-fast);
    }

    .tab-btn:hover {
        color: var(--dp-text-secondary);
        background: oklch(15% 0.03 195 / 0.3);
    }

    .tab-btn.active {
        color: var(--dp-teal-400);
        background: oklch(65% 0.2 180 / 0.1);
        border-bottom: 2px solid var(--dp-teal-400);
    }

    .tab-content {
        flex: 1;
        padding: var(--dp-space-4);
        overflow-y: auto;
    }
</style>
