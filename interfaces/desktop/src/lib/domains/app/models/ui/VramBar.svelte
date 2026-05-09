<!--
	@file VramBar.svelte
	@module @devpulse/domains/app/models/ui

	Live VRAM headroom bar — used in the slot orchestrator devtool, the
	models page, and the hardware status strip. Subscribes to
	`hardwareState` for the lifetime of the component (ref-counted: the
	listener attaches once, regardless of how many `<VramBar />` mount).

	Renders a labeled progress bar with used/total bytes + percent. When
	there's no GPU (`hasGpu === false`), shows a one-line CPU-only
	notice instead of a bar so we don't lie with a 100% red indicator.
-->
<script lang="ts">
import { Text } from "$lib/design/components/text/index.js";
import { hardwareState } from "../data-access/hardware.state.svelte.js";
import { formatMb } from "../util/format.js";

$effect(() => hardwareState.subscribe("VramBar"));

const usedMb = $derived(hardwareState.vramUsedMb ?? 0);
const totalMb = $derived(hardwareState.vramTotalMb ?? 0);
const pct = $derived(totalMb > 0 ? Math.min(100, (usedMb / totalMb) * 100) : 0);
const tone = $derived<"ok" | "warn" | "critical">(
	pct >= 90 ? "critical" : pct >= 75 ? "warn" : "ok",
);
</script>

{#if !hardwareState.hasGpu}
	<div class="vram-bar vram-bar--cpu" role="status">
		<Text size="xs" color="muted">CPU only — no discrete GPU detected</Text>
		{#if hardwareState.gpuError}
			<Text size="xs" color="muted" class="error">{hardwareState.gpuError}</Text>
		{/if}
	</div>
{:else}
	<div class="vram-bar" role="meter" aria-valuemin="0" aria-valuemax={totalMb} aria-valuenow={usedMb}>
		<div class="header">
			<Text size="xs" weight="medium">{hardwareState.gpuName ?? "GPU"}</Text>
			<Text size="xs" color="muted">
				{formatMb(usedMb)} / {formatMb(totalMb)} ({Math.round(pct)}%)
			</Text>
		</div>
		<div class="track">
			<div class="fill" data-tone={tone} style:width="{pct}%"></div>
		</div>
	</div>
{/if}

<style>
	.vram-bar {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.vram-bar--cpu {
		padding: 0.5rem 0.75rem;
		background: var(--surface-raised);
		border: 0.0625rem solid var(--border-subtle);
		border-radius: 0.5rem;
	}
	.header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}
	.track {
		height: 0.5rem;
		background: var(--surface-raised);
		border: 0.0625rem solid var(--border-subtle);
		border-radius: 0.25rem;
		overflow: hidden;
	}
	.fill {
		height: 100%;
		transition: width 0.3s ease-out, background 0.2s linear;
	}
	.fill[data-tone="ok"]       { background: var(--signal-success); }
	.fill[data-tone="warn"]     { background: var(--signal-warning); }
	.fill[data-tone="critical"] { background: var(--signal-error);   }
	:global(.vram-bar--cpu .error) { color: var(--signal-error); }
</style>
