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
    version: "0.1.0"
  };
</script>

<div class="statusbar" aria-label="System status">
  <div class="statusLeft">
    <span class="statusPill">
      <span class="statusDot" data-state={status.connection} aria-hidden="true"></span>
      <span class="statusText">{status.connection}</span>
    </span>
  </div>

  <div class="statusCenter">
    <span class="statusPill">
      <span class="statusText">Uptime: {status.uptime}</span>
    </span>
  </div>

  <div class="statusRight">
    <span class="statusPill">
      <span class="statusText">v{status.version}</span>
    </span>
  </div>
</div>