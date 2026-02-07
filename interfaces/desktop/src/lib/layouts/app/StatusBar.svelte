<!--
  @file src/lib/layouts/app/StatusBar.svelte
  @name StatusBar.svelte
  @module @devpulse/layouts/app/StatusBar
  @layer lib
-->
<script lang="ts">
// TODO: wire real state later
const status = {
	connection: "online" as "online" | "offline" | "warning" | "processing",
	uptime: "12d 4h",
	version: "0.1.0",
};
</script>

<div class="flex w-full items-center justify-between" aria-label="System status">
  <div class="flex items-center gap-2">
    <span class="inline-flex items-center gap-1.5 rounded-full bg-glass-smoke px-2 py-0.5">
      <span
        class="h-2 w-2 rounded-full {status.connection === 'online' ? 'bg-teal-400 shadow-glow-teal' : status.connection === 'offline' ? 'bg-ember-500' : 'bg-purple-400'}"
        data-state={status.connection}
        aria-hidden="true"
      ></span>
      <span class="text-xs text-neutral-300">{status.connection}</span>
    </span>
  </div>

  <div class="flex items-center">
    <span class="inline-flex items-center rounded-full bg-glass-smoke px-2 py-0.5">
      <span class="text-xs text-neutral-400">Uptime: {status.uptime}</span>
    </span>
  </div>

  <div class="flex items-center">
    <span class="inline-flex items-center rounded-full bg-glass-smoke px-2 py-0.5">
      <span class="text-xs text-neutral-400">v{status.version}</span>
    </span>
  </div>
</div>