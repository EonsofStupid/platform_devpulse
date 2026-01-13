<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Tab {
    id: string;
    label: string;
  }

  let {
    tabs,
    activeTab = $bindable(tabs[0]?.id ?? ''),
    class: className = '',
    onchange,
  }: {
    tabs: Tab[];
    activeTab?: string;
    class?: string;
    onchange?: (tabId: string) => void;
  } = $props();

  function handleTabClick(tabId: string) {
    activeTab = tabId;
    onchange?.(tabId);
  }
</script>

<div class="tabs-container {className}">
  <div class="tabs-list glass-subtle" role="tablist">
    {#each tabs as tab}
      <button
        role="tab"
        aria-selected={activeTab === tab.id}
        class="tab-trigger"
        class:active={activeTab === tab.id}
        onclick={() => handleTabClick(tab.id)}
      >
        {tab.label}
      </button>
    {/each}
  </div>
</div>

<style>
  .tabs-container {
    width: 100%;
  }

  .tabs-list {
    display: flex;
    gap: 0.25rem;
    padding: 0.25rem;
    border-radius: var(--radius);
  }

  .tab-trigger {
    flex: 1;
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--foreground-muted);
    background: transparent;
    border: 1px solid transparent;
    border-radius: calc(var(--radius) - 2px);
    transition: all var(--transition-fast);
  }

  .tab-trigger:hover:not(.active) {
    color: var(--foreground);
    background: rgba(130, 111, 214, 0.1);
  }

  .tab-trigger.active {
    color: var(--primary-foreground);
    background: linear-gradient(
      135deg,
      rgba(127, 47, 168, 0.4) 0%,
      rgba(127, 47, 168, 0.2) 100%
    );
    border-color: rgba(130, 111, 214, 0.4);
    box-shadow:
      0 0 15px rgba(127, 47, 168, 0.2),
      inset 0 1px 1px rgba(255, 255, 255, 0.1);
  }
</style>
