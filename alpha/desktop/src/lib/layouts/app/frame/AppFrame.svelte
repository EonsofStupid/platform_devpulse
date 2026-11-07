<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    topbar?: Snippet;
    sidebar?: Snippet;
    main?: Snippet;
    statusbar?: Snippet;
  }

  let { topbar, sidebar, main, statusbar }: Props = $props();
</script>

<div class="app-frame">
  <header class="app-topbar glass-bar">
    {#if topbar}
      {@render topbar()}
    {:else}
      <div class="flex items-center gap-3">
        <span class="text-gradient font-bold text-lg">DevPulse</span>
      </div>
    {/if}
  </header>

  <aside class="app-sidebar glass-sidebar">
    {#if sidebar}
      {@render sidebar()}
    {:else}
      <nav class="flex flex-col gap-2 p-3">
        <a href="/" class="glass-button text-sm">Home</a>
      </nav>
    {/if}
  </aside>

  <main class="app-main">
    {#if main}{@render main()}{/if}
  </main>

  <footer class="app-statusbar glass-bar-bottom">
    {#if statusbar}
      {@render statusbar()}
    {:else}
      <div class="flex items-center justify-between w-full px-4">
        <span class="text-xs text-muted">DevPulse v0.1.0</span>
        <div class="flex items-center gap-2">
          <span class="status-dot status-dot-success"></span>
          <span class="text-xs text-muted">Connected</span>
        </div>
      </div>
    {/if}
  </footer>
</div>

<style>
  .app-frame {
    display: grid;
    grid-template-areas:
      "topbar topbar"
      "sidebar main"
      "statusbar statusbar";
    grid-template-rows: var(--dp-topbar-height) 1fr var(--dp-statusbar-height);
    grid-template-columns: var(--dp-sidebar-collapsed) 1fr;
    height: 100vh;
    background: var(--dp-obsidian-950);
  }

  .app-topbar {
    grid-area: topbar;
    display: flex;
    align-items: center;
    padding: 0 var(--dp-space-4);
  }

  .app-sidebar {
    grid-area: sidebar;
    display: flex;
    flex-direction: column;
  }

  .app-main {
    grid-area: main;
    overflow: auto;
    padding: var(--dp-space-4);
  }

  .app-statusbar {
    grid-area: statusbar;
    display: flex;
    align-items: center;
  }
</style>
