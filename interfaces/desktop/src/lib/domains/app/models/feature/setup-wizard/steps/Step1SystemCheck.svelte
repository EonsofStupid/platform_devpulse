<!--
  @file Step-1-SystemCheck.svelte
  System specs display from ALREADY CACHED data. Zero IPC. Zero Mutex.

  Boot already:
  - Scanned hardware (hardwareState populated via model:hardware event)
  - Scanned models (modelsState.models populated via boot scan)
  - Detected tier (hardwareState.tier derived from VRAM)

  This step just READS cached state and displays it. Instant. Never blocks.
-->
<script lang="ts">
import { AlertTriangle, Check, Cpu, HardDrive, Monitor, Zap } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { hardwareState } from "../../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import { formatMb } from "../../../util/models.types.js";
import { wizardState } from "../wizard.state.svelte.js";

interface Props {
	onComplete: () => void;
}

let { onComplete }: Props = $props();

// ── Derive everything from cached state — no IPC ──────────
let hasHardware = $derived(hardwareState.hasSnapshot);
let gpuName = $derived(hardwareState.gpuName ?? "No GPU detected");
let vramMb = $derived(hardwareState.metrics?.gpu_vram_total_mb ?? 0);
let cpuName = $derived(hardwareState.cpuName ?? "Unknown CPU");
let ramMb = $derived(hardwareState.metrics?.ram_total_mb ?? 0);
let diskFreeMb = $derived(hardwareState.metrics?.disk_free_mb ?? 0);
let modelCount = $derived(modelsState.models.length);
let hasGpu = $derived(hardwareState.hasGpu);

// Tier from VRAM — same logic as kernel detect_tier
let tier = $derived(
	vramMb >= 40000
		? "Ultra"
		: vramMb >= 24000
			? "High"
			: vramMb >= 16000
				? "Jesse Primary"
				: vramMb >= 10000
					? "Mid"
					: vramMb >= 8000
						? "Floor"
						: vramMb > 0
							? "Minimal"
							: "CPU Only",
);

let tierColor = $derived(
	tier === "Ultra" || tier === "High"
		? "var(--signal-success)"
		: tier === "Jesse Primary" || tier === "Mid"
			? "var(--color-teal-400)"
			: "var(--signal-warning)",
);

interface SpecRow {
	id: string;
	label: string;
	value: string;
	icon: typeof Monitor;
	ok: boolean;
}

let specs = $derived<SpecRow[]>([
	{
		id: "gpu",
		label: "GPU",
		value: vramMb > 0 ? `${gpuName} — ${formatMb(vramMb)} VRAM` : gpuName,
		icon: Monitor,
		ok: hasGpu,
	},
	{
		id: "cpu",
		label: "CPU",
		value: cpuName,
		icon: Cpu,
		ok: true,
	},
	{
		id: "ram",
		label: "RAM",
		value: ramMb > 0 ? formatMb(ramMb) : "Unknown",
		icon: Zap,
		ok: ramMb >= 8000,
	},
	{
		id: "disk",
		label: "Disk Free",
		value: diskFreeMb > 0 ? `${formatMb(diskFreeMb)} available` : "Not reported",
		icon: HardDrive,
		ok: diskFreeMb === 0 ? true : diskFreeMb >= 5000, // null/unknown = pass, don't block on missing data
	},
	{
		id: "models",
		label: "Local Models",
		value: modelCount > 0 ? `${modelCount} models found` : "None yet — download in next step",
		icon: HardDrive,
		ok: true, // not a blocker
	},
]);

// Store tier in wizard state for later steps
$effect(() => {
	if (hasHardware) {
		wizardState.recommendedTier = tier;
		wizardState.hardwareScanned = true;
	}
});

// No auto-advance. User reads specs and clicks Continue.
</script>

<div class="check-step">
	<div class="check-header">
		<img src="/imgs/mascot/clyffy-df-icon-interaction1.png" alt="Clyffy scanning" class="check-mascot" />
		<div class="check-title">
			<Text size="lg" weight="bold">System Specs</Text>
			<Text size="sm" class="check-subtitle">Here's what I'm working with.</Text>
		</div>
	</div>

	<!-- Specs list -->
	<div class="check-list">
		{#each specs as spec (spec.id)}
			<div class="check-row" class:done={spec.ok} class:warn={!spec.ok}>
				<div class="check-icon">
					{#if hasHardware}
						<div class="check-circle" class:done={spec.ok} class:warn={!spec.ok}>
							{#if spec.ok}
								<Check size={14} />
							{:else}
								<AlertTriangle size={14} />
							{/if}
						</div>
					{:else}
						<Spinner size="sm" tone="accent" />
					{/if}
				</div>
				<div class="check-content">
					<Text size="sm" weight="bold">{spec.label}</Text>
					{#if hasHardware}
						<Text size="xs" class="check-result">{spec.value}</Text>
					{:else}
						<Text size="xs" class="check-result">Waiting for hardware data...</Text>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- Tier badge -->
	{#if hasHardware}
		<div class="tier-badge" style:border-color={tierColor}>
			<span class="tier-name" style:color={tierColor}>{tier}</span>
			<Text size="xs" class="tier-desc">
				{#if tier === "Ultra" || tier === "High"}
					Full model stack. All slots GPU-accelerated.
				{:else if tier === "Jesse Primary" || tier === "Mid"}
					Partial offload. Brain on GPU, helpers on CPU.
				{:else}
					CPU-focused. Smaller models recommended.
				{/if}
			</Text>
		</div>
	{/if}

	{#if !hasGpu && hasHardware}
		<div class="gpu-warning">
			<AlertTriangle size={16} />
			<Text size="sm">No GPU detected. Models will run on CPU — expect slower inference.</Text>
		</div>
	{/if}

	<div class="check-actions-secondary">
		<Button preset="button-ghost" size="sm" onclick={onComplete}>
			Continue
		</Button>
		<Button preset="button-ghost" size="sm" onclick={() => wizardState.goTo("complete")}>
			Skip Setup
		</Button>
	</div>
</div>

<style>
	.check-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		width: 100%;
		max-width: 36rem;
		padding: 1rem 0;
	}

	.check-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		text-align: left;
		width: 100%;
	}

	.check-mascot {
		width: 3.5rem;
		height: 3.5rem;
		object-fit: contain;
	}

	.check-title {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	:global(.check-subtitle) {
		color: var(--text-secondary);
	}

	.check-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
	}

	.check-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
		transition: border-color 300ms ease-out;
	}
	.check-row.done {
		border-color: color-mix(in oklch, var(--signal-success) 40%, transparent);
	}
	.check-row.warn {
		border-color: color-mix(in oklch, var(--signal-warning) 40%, transparent);
	}

	.check-icon {
		flex-shrink: 0;
		width: 1.75rem;
		height: 1.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.check-circle {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.check-circle.done {
		background: color-mix(in oklch, var(--signal-success) 20%, transparent);
		color: var(--signal-success);
	}
	.check-circle.warn {
		background: color-mix(in oklch, var(--signal-warning) 20%, transparent);
		color: var(--signal-warning);
	}

	.check-content {
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
	}

	:global(.check-result) {
		color: var(--text-muted);
	}

	.tier-badge {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
		border-left: 3px solid var(--border-default);
		width: 100%;
		text-align: left;
	}

	.tier-name {
		font-size: 0.875rem;
		font-weight: 700;
	}

	:global(.tier-desc) {
		color: var(--text-secondary);
	}

	.gpu-warning {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		background: color-mix(in oklch, var(--signal-warning) 10%, transparent);
		border: 1px solid color-mix(in oklch, var(--signal-warning) 30%, transparent);
		color: var(--signal-warning);
		width: 100%;
	}

	.check-actions-secondary {
		display: flex;
		gap: 0.5rem;
		opacity: 0.7;
	}
</style>
