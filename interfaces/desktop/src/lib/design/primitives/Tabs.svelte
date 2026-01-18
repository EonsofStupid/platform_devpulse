<!--
    Tabs.svelte - Custom ARIA Tabs Primitive
    
    WAI-ARIA compliant tabs:
    - role="tablist" / "tab" / "tabpanel"
    - aria-selected state
    - Keyboard: Arrow keys to navigate, Enter/Space to select
-->
<script lang="ts" module>
    export interface TabItem {
        id: string;
        label: string;
    }
</script>

<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        /** Tab items */
        tabs: TabItem[];
        /** Currently active tab ID */
        activeTab?: string;
        /** Additional CSS class */
        class?: string;
        /** Tab content renderer */
        children: Snippet<[{ activeTab: string }]>;
        /** Tab change handler */
        onchange?: (tabId: string) => void;
    }

    let {
        tabs,
        activeTab = $bindable(tabs[0]?.id ?? ""),
        class: className = "",
        children,
        onchange,
    }: Props = $props();

    function selectTab(id: string) {
        activeTab = id;
        onchange?.(id);
    }

    function handleKeydown(event: KeyboardEvent, currentIndex: number) {
        let newIndex = currentIndex;

        switch (event.key) {
            case "ArrowLeft":
                event.preventDefault();
                newIndex =
                    currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
                break;
            case "ArrowRight":
                event.preventDefault();
                newIndex =
                    currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
                break;
            case "Home":
                event.preventDefault();
                newIndex = 0;
                break;
            case "End":
                event.preventDefault();
                newIndex = tabs.length - 1;
                break;
            default:
                return;
        }

        selectTab(tabs[newIndex].id);
        // Focus the new tab button
        const tabButton = document.getElementById(`tab-${tabs[newIndex].id}`);
        tabButton?.focus();
    }
</script>

<div class="dp-tabs {className}">
    <!-- Tab List -->
    <div class="dp-tabs-list" role="tablist">
        {#each tabs as tab, index (tab.id)}
            {@const isActive = activeTab === tab.id}
            <button
                id="tab-{tab.id}"
                class="dp-tab"
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="panel-{tab.id}"
                tabindex={isActive ? 0 : -1}
                onclick={() => selectTab(tab.id)}
                onkeydown={(e) => handleKeydown(e, index)}
            >
                {tab.label}
            </button>
        {/each}
    </div>

    <!-- Tab Panels -->
    {#each tabs as tab (tab.id)}
        {@const isActive = activeTab === tab.id}
        <div
            id="panel-{tab.id}"
            class="dp-tab-panel"
            role="tabpanel"
            aria-labelledby="tab-{tab.id}"
            hidden={!isActive}
            tabindex={isActive ? 0 : -1}
        >
            {#if isActive}
                {@render children({ activeTab })}
            {/if}
        </div>
    {/each}
</div>

<style>
    .dp-tabs {
        display: flex;
        flex-direction: column;
    }

    .dp-tabs-list {
        display: flex;
        gap: var(--dp-space-1);
        border-bottom: 1px solid oklch(35% 0.05 195 / 0.3);
        padding-bottom: var(--dp-space-1);
    }

    .dp-tab {
        padding: var(--dp-space-2) var(--dp-space-4);
        background: none;
        border: none;
        color: var(--dp-text-muted);
        font: inherit;
        font-weight: var(--dp-font-medium);
        cursor: pointer;
        border-radius: var(--dp-radius-sm) var(--dp-radius-sm) 0 0;
        transition: all var(--dp-transition-fast);
        position: relative;
    }

    .dp-tab:hover {
        color: var(--dp-text-secondary);
        background: oklch(15% 0.02 195 / 0.3);
    }

    .dp-tab[aria-selected="true"] {
        color: var(--dp-text-primary);
    }

    .dp-tab[aria-selected="true"]::after {
        content: "";
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--dp-teal-400);
    }

    .dp-tab:focus-visible {
        outline: 2px solid var(--dp-teal-400);
        outline-offset: -2px;
    }

    .dp-tab-panel {
        padding: var(--dp-space-4) 0;
    }

    .dp-tab-panel[hidden] {
        display: none;
    }
</style>
