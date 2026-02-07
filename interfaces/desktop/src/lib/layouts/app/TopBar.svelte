<!--
  @file src/lib/layouts/app/TopBar.svelte
  @name TopBar.svelte
  @module @devpulse/layouts/app/TopBar
  @layer lib

  @description
  Top navigation bar with search functionality and action buttons.

  @props
  - (none)

  @dependencies
  - Parasite: Plugin component for extension points

  @consumers
  - Frame.svelte: Main app layout

  @vpb-editable (none)
  @since 1.0.0
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

<div class="flex w-full items-center justify-between" onkeydown={onKey}>
  <div class="flex items-center">
    <Parasite />
  </div>

  <div class="flex-1"></div>

  <div class="flex items-center gap-2">
    <span class="group relative" data-tooltip="Search">
      <button
        class="flex h-8 w-8 items-center justify-center rounded-md bg-glass-smoke border border-teal-700/30 text-neutral-300 transition-all hover:bg-glass-deep hover:border-teal-500/50 hover:shadow-glow-teal"
        type="button"
        aria-label="Search"
        onclick={toggleSearch}
        onpointermove={track}
      >
        <span class="text-base" aria-hidden="true">🔍</span>
      </button>
    </span>

    {#if searchOpen}
      <div class="absolute right-4 top-12 z-dropdown rounded-lg bg-glass-void border border-teal-700/30 p-2 shadow-z3 backdrop-blur-lg" role="dialog" aria-label="Search">
        <input
          bind:this={inputEl}
          class="w-64 rounded-md bg-matte-dark border border-teal-700/30 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-teal-500 focus:shadow-glow-teal"
          type="text"
          bind:value={searchQuery}
          placeholder="Search…"
        />
      </div>
    {/if}
  </div>
</div>
