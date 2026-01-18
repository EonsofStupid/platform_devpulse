<!--
  VPBTabs.svelte
  Tab bar - uses recipes from lib/design/vpb-tabs.css
-->
<script lang="ts">
    import { vpb } from "../state/vpb.svelte";

    interface Tab {
        id: string;
        label: string;
        closable: boolean;
    }

    let tabs = $state<Tab[]>([
        { id: "inspector", label: "Inspector", closable: false },
        { id: "tokens", label: "Tokens", closable: true },
    ]);

    let activeTab = $state("inspector");
    let isExpanded = $state(true);

    function selectTab(id: string) {
        activeTab = id;
    }

    function closeTab(id: string) {
        const tab = tabs.find((t) => t.id === id);
        if (tab?.closable) {
            tabs = tabs.filter((t) => t.id !== id);
            if (activeTab === id && tabs.length > 0) {
                activeTab = tabs[0].id;
            }
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "ArrowUp") {
            isExpanded = true;
        } else if (e.key === "ArrowDown") {
            isExpanded = false;
        } else if (e.key === "ArrowLeft") {
            const currentIndex = tabs.findIndex((t) => t.id === activeTab);
            if (currentIndex > 0) {
                activeTab = tabs[currentIndex - 1].id;
            }
        } else if (e.key === "ArrowRight") {
            const currentIndex = tabs.findIndex((t) => t.id === activeTab);
            if (currentIndex < tabs.length - 1) {
                activeTab = tabs[currentIndex + 1].id;
            }
        }
    }
</script>

<div
    class="vpb-tabs"
    class:vpb-tabs--collapsed={!isExpanded}
    role="tablist"
    aria-label="VPB Tabs"
    tabindex="0"
    onkeydown={handleKeydown}
>
    {#each tabs as tab (tab.id)}
        <button
            class="vpb-tab"
            class:vpb-tab--active={activeTab === tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`vpb-panel-${tab.id}`}
            onclick={() => selectTab(tab.id)}
        >
            <span class="vpb-tab__label">{tab.label}</span>

            {#if tab.closable}
                <span
                    class="vpb-tab__close"
                    role="button"
                    tabindex="0"
                    onclick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                    }}
                    onkeydown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            closeTab(tab.id);
                        }
                    }}
                    aria-label={`Close ${tab.label} tab`}
                >
                    <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="currentColor"
                    >
                        <path
                            d="M1 1l8 8m0-8l-8 8"
                            stroke="currentColor"
                            stroke-width="1.5"
                            fill="none"
                        />
                    </svg>
                </span>
            {/if}
        </button>
    {/each}

    <button
        class="vpb-tabs__toggle"
        onclick={() => (isExpanded = !isExpanded)}
        aria-label={isExpanded ? "Collapse tabs" : "Expand tabs"}
        title={isExpanded ? "Collapse (↓)" : "Expand (↑)"}
    >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            {#if isExpanded}
                <path
                    d="M2 4l4 4 4-4"
                    stroke="currentColor"
                    stroke-width="1.5"
                    fill="none"
                />
            {:else}
                <path
                    d="M2 8l4-4 4 4"
                    stroke="currentColor"
                    stroke-width="1.5"
                    fill="none"
                />
            {/if}
        </svg>
    </button>
</div>
