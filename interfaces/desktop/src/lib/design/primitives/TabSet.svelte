<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        tabs: string[];
        activeTab?: string;
        children: Snippet<[string]>; // Passes active tab to children
    }

    let { tabs, activeTab, children }: Props = $props();
    // Use $derived for reactive initial value from props
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
        {@render children(currentTab)}
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
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(0, 0, 0, 0.2);
    }

    .tab-btn {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s;
    }

    .tab-btn:hover {
        color: rgba(255, 255, 255, 0.8);
        background: rgba(255, 255, 255, 0.05);
    }

    .tab-btn.active {
        color: #00ffcc;
        background: rgba(0, 255, 204, 0.1);
        border-bottom: 2px solid #00ffcc;
    }

    .tab-content {
        flex: 1;
        padding: 1rem;
        overflow-y: auto;
    }
</style>
