<!--
  @file src/lib/layouts/app/TopBar.svelte
  @name TopBar.svelte
  @module @devpulse/layouts/app/TopBar
  @layer lib
-->
<script lang="ts">
  import { tick } from "svelte";
  import { Parasite } from "$lib/design/plugins/parasite";

  let searchOpen = $state(false);
  let searchQuery = $state("");
  let inputEl: HTMLInputElement | null = null;

  function toggleSearch() {
    searchOpen = !searchOpen;
    if (!searchOpen) searchQuery = "";
  }

  $effect(async () => {
    if (!searchOpen) return;
    await tick();
    inputEl?.focus();
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
Append these sections to src/lib/layouts/app/styles/layout.css
You already have helpers; these are the missing “actual sidebar item” + “status dot states” + “micro-animations” layers.

css
Copy code
/* ---------- Sidebar Nav Item Skin (scoped) ---------- */
.app-frame .navItem {
  --mx: 50%;
  --my: 50%;

  width: 100%;
  height: 42px;
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 0 10px;
  border-radius: 14px;

  text-decoration: none;
  color: oklch(0.94 0.01 260 / 0.92);

  background:
    linear-gradient(180deg,
      oklch(0.18 0.04 240 / 0.78) 0%,
      oklch(0.14 0.04 240 / 0.72) 100%);
  border: 1px solid oklch(0.74 0.18 195 / 0.16);

  box-shadow:
    inset 1px 1px 0 oklch(0.98 0.01 260 / 0.10),
    inset -1px -1px 0 oklch(0.08 0.02 240 / 0.40),
    0 0 12px oklch(0.78 0.18 195 / 0.06),
    0 6px 18px oklch(0.08 0.02 240 / 0.35);

  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);

  position: relative;
  overflow: hidden;

  transition:
    transform 180ms cubic-bezier(0.33, 1, 0.68, 1),
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease;
}

.app-frame .navItem::before {
  content: "";
  position: absolute;
  inset: -45%;
  pointer-events: none;
  opacity: 0;

  background:
    radial-gradient(240px 180px at var(--mx) var(--my),
      oklch(0.82 0.18 195 / 0.20) 0%,
      transparent 65%);
  transition: opacity 180ms ease;
}

.app-frame .navItem::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;

  background: linear-gradient(
    135deg,
    transparent 0%,
    oklch(0.92 0.02 260 / 0.10) 35%,
    transparent 60%
  );
  opacity: 0.30;
}

.app-frame .navItem:hover {
  transform: translateY(-1px);
  border-color: oklch(0.78 0.18 195 / 0.34);
  box-shadow:
    inset 1px 1px 0 oklch(0.98 0.01 260 / 0.12),
    inset -1px -1px 0 oklch(0.08 0.02 240 / 0.34),
    0 0 18px oklch(0.78 0.18 195 / 0.16),
    0 0 42px oklch(0.72 0.22 330 / 0.08),
    0 10px 22px oklch(0.08 0.02 240 / 0.45);
}
.app-frame .navItem:hover::before { opacity: 1; }

.app-frame .navItem:active {
  transform: translateY(0px) scale(0.99);
  box-shadow:
    inset 2px 2px 10px oklch(0.06 0.02 240 / 0.55),
    inset -1px -1px 0 oklch(0.98 0.01 260 / 0.06),
    0 0 12px oklch(0.78 0.18 195 / 0.10);
}

.app-frame .navItem.active {
  border-color: oklch(0.82 0.18 195 / 0.52);
  box-shadow:
    inset 1px 1px 0 oklch(0.98 0.01 260 / 0.14),
    inset -1px -1px 0 oklch(0.08 0.02 240 / 0.34),
    0 0 22px oklch(0.82 0.18 195 / 0.22),
    0 10px 22px oklch(0.08 0.02 240 / 0.45);
}

.app-frame .navIcon {
  width: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  line-height: 1;
  filter: drop-shadow(0 0 8px oklch(0.78 0.18 195 / 0.10));
}

/* spacer pushes toggle to bottom */
.app-frame .sidebarSpacer { flex: 1; }

/* toggle can share same look; just slightly different */
.app-frame .navToggle { justify-content: flex-start; }

/* ---------- Micro-animations (triggered by data-animation) ---------- */
.app-frame .navItem.animating[data-animation="bounce"] { animation: dp-bounce 420ms cubic-bezier(0.33, 1, 0.68, 1); }
.app-frame .navItem.animating[data-animation="spin"]   { animation: dp-spin 420ms cubic-bezier(0.33, 1, 0.68, 1); }
.app-frame .navItem.animating[data-animation="pulse"]  { animation: dp-pulse 420ms cubic-bezier(0.33, 1, 0.68, 1); }
.app-frame .navItem.animating[data-animation="shake"]  { animation: dp-shake 420ms cubic-bezier(0.33, 1, 0.68, 1); }

@keyframes dp-bounce {
  0% { transform: translateY(0); }
  35% { transform: translateY(-2px); }
  100% { transform: translateY(0); }
}
@keyframes dp-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(3deg); }
}
@keyframes dp-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}
@keyframes dp-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-1px); }
  75% { transform: translateX(1px); }
}

/* ---------- Status Dot states (scoped) ---------- */
.app-frame .statusDot[data-state="online"] {
  background: oklch(0.82 0.18 195 / 0.92);
  box-shadow:
    0 0 10px oklch(0.82 0.18 195 / 0.35),
    0 0 18px oklch(0.82 0.18 195 / 0.18);
}
.app-frame .statusDot[data-state="offline"] {
  background: oklch(0.62 0.22 25 / 0.90);
  box-shadow: 0 0 10px oklch(0.62 0.22 25 / 0.25);
}
.app-frame .statusDot[data-state="warning"] {
  background: oklch(0.80 0.18 80 / 0.92);
  box-shadow:
    0 0 10px oklch(0.80 0.18 80 / 0.30),
    0 0 18px oklch(0.80 0.18 80 / 0.16);
}
.app-frame .statusDot[data-state="processing"] {
  background: oklch(0.82 0.18 195 / 0.92);
  box-shadow:
    0 0 10px oklch(0.82 0.18 195 / 0.35),
    0 0 18px oklch(0.82 0.18 195 / 0.18);
  animation: dp-status-pulse 900ms ease-in-out infinite;
}

@keyframes dp-status-pulse {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.15); opacity: 1; }
}

/* optional: status text class used by StatusBar.svelte */
.app-frame .statusText {
  font-size: 12px;
  letter-spacing: 0.04em;
  color: oklch(0.92 0.01 260 / 0.85);
}