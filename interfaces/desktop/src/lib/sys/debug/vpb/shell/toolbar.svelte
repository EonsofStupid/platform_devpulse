<!--
  @file src/lib/sys/debug/vpb/shell/toolbar.svelte
  @layer vpb

  The panel's status bar: whether a scan runs (from Footer.svelte) and the app
  version, which updates report (hidden until they have).
-->
<script lang="ts">
import { StatusDot } from "@devpulse/coldlight/components/status-dot";
import { updatesState } from "$lib/domains/app/updates/index.js";
import { copyState } from "$lib/sys/copy/index.js";
import { vpb } from "../state/vpb.svelte.js";

const text = $derived(copyState.catalog?.vpb);
const version = $derived(updatesState.info?.currentVersion);
</script>

<div class="vpb-panel__footer flex items-center gap-2">
	<StatusDot
		size="sm"
		status={!vpb.scanActive ? "ready" : vpb.scanPaused ? "pending" : "loading"}
		animate={vpb.scanActive && !vpb.scanPaused}
	/>
	<span
		class="vpb-status"
		class:vpb-status--active={vpb.scanActive && !vpb.scanPaused}
		class:vpb-status--paused={vpb.scanActive && vpb.scanPaused}
	>
		{!vpb.scanActive ? text?.status_ready : vpb.scanPaused ? text?.status_paused : text?.status_scanning}
	</span>

	<div class="flex-1"></div>

	{#if version}
		<span class="vpb-status">v{version}</span>
	{/if}
</div>
