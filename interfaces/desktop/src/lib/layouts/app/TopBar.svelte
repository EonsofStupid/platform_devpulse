<!--
  @file src/lib/layouts/app/TopBar.svelte
  @name TopBar.svelte
  @module @devpulse/layouts/app/TopBar
  @layer lib
-->
<script lang="ts">
  import { Parasite } from "$lib/design/plugins/parasite";

  let searchOpen = $state(false);
  let searchQuery = $state("");
  let inputEl = $state<HTMLInputElement | null>(null);

  function toggleSearch() {
    searchOpen = !searchOpen;
    if (!searchOpen) searchQuery = "";
  }

  $effect(() => {
    if (searchOpen && inputEl) {
      inputEl.focus();
    }
  });

  function track(e: PointerEvent) {
    const el = e.currentTarget as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty("--mx", `${x}%`);
    el.style.setProperty("--my", `${y}%`);
    el.style.setProperty("--mouse-x", `${x}%`);
    el.style.setProperty("--mouse-y", `${y}%`);
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape" && searchOpen) toggleSearch();
  }
</script>

<div class="topbar" onkeydown={onKey}>
  <div class="topbar-left">
    <Parasite />
  </div>

  <div class="topbar-center"></div>

  <div class="topbar-right">
    <span class="tooltipWrap" data-tooltip="Search">
      <button class="iconBtn" type="button" aria-label="Search" onclick={toggleSearch} onpointermove={track}>
        <span class="iconGlyph" aria-hidden="true">🔍</span>
      </button>
    </span>

    {#if searchOpen}
      <div class="search-overlay" role="dialog" aria-label="Search">
        <input
          bind:this={inputEl}
          class="search-input"
          type="text"
          bind:value={searchQuery}
          placeholder="Search…"
        />
      </div>
    {/if}
  </div>
</div>
