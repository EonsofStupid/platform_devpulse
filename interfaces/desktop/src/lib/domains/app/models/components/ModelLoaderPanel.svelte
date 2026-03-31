<!--
  @file ModelLoaderPanel — Main model management UI.
  Layman-friendly by default. Advanced toggle for power users.
  ALL styling via resolveMacro + cssVarString. Zero raw values.
-->
<script lang="ts">
import { HardDrive, Search, Zap } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cssVarString, resolveMacro } from "$lib/design/style-macro/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { hardwareState } from "../runes/hardware.runes.svelte.js";
import { modelsState } from "../runes/models.runes.svelte.js";
import { formatMb } from "../types/models.types.js";
import ClyffyNarration from "./ClyffyNarration.svelte";
import SetupWizard from "./SetupWizard.svelte";
import SubsystemGroup from "./SubsystemGroup.svelte";
import VramGauge from "./VramGauge.svelte";

let layman = $state(true);
let showWizard = $state(true);

const mPanel = $derived(resolveMacro({ kind: "model-panel", preset: "primary" }));
const mError = $derived(resolveMacro({ kind: "model-error", preset: "danger" }));
const mMetrics = $derived(resolveMacro({ kind: "model-metrics", preset: "neutral" }));
const mActionScan = $derived(resolveMacro({ kind: "model-action", preset: "info" }));
const mActionDownload = $derived(resolveMacro({ kind: "model-action", preset: "success" }));

$effect(() => {
	hardwareState.startPolling(2000);
	modelsState.refresh();
	return () => {
		hardwareState.stopPolling();
	};
});

const clyffyMessage = $derived.by(() => {
	if (modelsState.loading) return "Checking your system...";
	if (modelsState.error) return `Something went wrong: ${modelsState.error}`;

	const hw = hardwareState.metrics;
	if (!hw) return "Detecting your hardware...";

	const modelCount = modelsState.models.length;
	const loadedCount = Object.values(modelsState.statuses).filter((s) => s.type === "loaded").length;

	if (modelsState.firstRun && modelCount === 0) {
		return hardwareState.hasGpu
			? `I see you have a ${hw.gpuName} with ${formatMb(hardwareState.vramTotalMb)} GPU memory. Let me recommend some models that fit your hardware.`
			: "No GPU detected — I'll set things up for CPU mode. It's slower but everything works.";
	}

	if (modelCount === 0) {
		return "No models found yet. Click 'Scan Models' or download one from HuggingFace.";
	}

	if (loadedCount > 0) {
		return `${loadedCount} model${loadedCount > 1 ? "s" : ""} loaded. ${
			hardwareState.hasGpu
				? `Using ${formatMb(hardwareState.vramUsedMb)} of ${formatMb(hardwareState.vramTotalMb)} GPU memory.`
				: "Running in CPU mode."
		}`;
	}

	return `${modelCount} model${modelCount > 1 ? "s" : ""} in your library. Assign and load them to get started.`;
});

const clyffyType = $derived.by(() => {
	if (modelsState.error) return "error" as const;
	if (modelsState.firstRun && modelsState.models.length === 0) return "info" as const;
	const loadedCount = Object.values(modelsState.statuses).filter((s) => s.type === "loaded").length;
	if (loadedCount > 0) return "success" as const;
	return "info" as const;
});
</script>

{#if modelsState.firstRun && modelsState.models.length === 0 && showWizard}
	<div data-component="model-loader-setup">
		<SetupWizard onComplete={() => { showWizard = false; }} />
	</div>
{:else}
<div
	{...mPanel.dataAttrs}
	style={cssVarString(mPanel.cssVars)}
	class={stack({ gap: "4" })}
	data-component="model-loader-panel"
>
	<!-- Header -->
	<div class={hstack({ justify: "between", align: "center" })}>
		<div class={hstack({ gap: "2", align: "center" })}>
			<Zap size={18} style="color: var(--color);" />
			<Text size="lg" weight="bold" color="primary">Model Control</Text>
		</div>
		<button
			class="rounded px-2 py-1 text-xs transition-colors hover:brightness-110"
			style="background: var(-bg); color: var(--color);"
			onclick={() => (layman = !layman)}
		>
			{layman ? "Advanced" : "Simple"}
		</button>
	</div>

	<!-- Hardware gauges -->
	<div class={hstack({ gap: "4", justify: "center", align: "start" })}>
		<VramGauge
			usedMb={hardwareState.vramUsedMb}
			totalMb={hardwareState.vramTotalMb}
			hasGpu={hardwareState.hasGpu}
			label={layman ? "GPU Memory" : "VRAM"}
		/>

		{#if !layman && hardwareState.metrics}
			<div
				{...mMetrics.dataAttrs}
				style={cssVarString(mMetrics.cssVars)}
				class={stack({ gap: "2" })}
			>
				<div>
					<div class={hstack({ justify: "between" })}>
						<Text size="xs" color="muted">CPU</Text>
						<Text size="xs" color="secondary">{hardwareState.metrics.cpuUsagePercent.toFixed(0)}%</Text>
					</div>
					<div class="h-1.5 w-full overflow-hidden rounded-full opacity-30">
						<div class="h-full rounded-full" style="width: {hardwareState.metrics.cpuUsagePercent}%; background: var(--color);"></div>
					</div>
				</div>
				<div>
					<div class={hstack({ justify: "between" })}>
						<Text size="xs" color="muted">RAM</Text>
						<Text size="xs" color="secondary">{formatMb(hardwareState.metrics.ramUsedMb)} / {formatMb(hardwareState.metrics.ramTotalMb)}</Text>
					</div>
					<div class="h-1.5 w-full overflow-hidden rounded-full opacity-30">
						<div class="h-full rounded-full" style="width: {(hardwareState.metrics.ramUsedMb / hardwareState.metrics.ramTotalMb) * 100}%; background: var(--color);"></div>
					</div>
				</div>
				{#if hardwareState.hasGpu && hardwareState.metrics.gpuUtilizationPercent !== null}
					<div>
						<div class={hstack({ justify: "between" })}>
							<Text size="xs" color="muted">GPU Load</Text>
							<Text size="xs" color="secondary">{hardwareState.metrics.gpuUtilizationPercent.toFixed(0)}%</Text>
						</div>
						<div class="h-1.5 w-full overflow-hidden rounded-full opacity-30">
							<div class="h-full rounded-full" style="width: {hardwareState.metrics.gpuUtilizationPercent}%; background: var(--color);"></div>
						</div>
					</div>
				{/if}
				{#if hardwareState.hasGpu && hardwareState.metrics.gpuTemperatureC !== null}
					<div class={hstack({ justify: "between" })}>
						<Text size="xs" color="muted">GPU Temp</Text>
						<Text size="xs" color="secondary">{hardwareState.metrics.gpuTemperatureC}°C</Text>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- GPU name + tier -->
	{#if hardwareState.metrics}
		<div class={hstack({ justify: "center", gap: "2" })}>
			{#if hardwareState.hasGpu}
				<Badge variant="positive" size="sm">{hardwareState.metrics.gpuName}</Badge>
			{:else}
				<Badge variant="neutral" size="sm">CPU Only</Badge>
			{/if}
			<Badge variant="neutral" size="sm">
				{hardwareState.tier === "high" ? "High-End" : hardwareState.tier === "medium" ? "Mid-Range" : hardwareState.tier === "low" ? "Entry" : hardwareState.tier === "minimal" ? "Basic" : "CPU Mode"}
			</Badge>
		</div>
	{/if}

	<!-- Subsystem slot groups -->
	<div class={stack({ gap: "2" })}>
		{#each Object.entries(modelsState.subsystems) as [sub, slots] (sub)}
			<SubsystemGroup
				name={sub}
				label={modelsState.subsystemLabels[sub] ?? sub}
				{slots}
				{layman}
			/>
		{/each}
	</div>

	<!-- Actions -->
	<div class={hstack({ gap: "2", justify: "center" })}>
		<button
			{...mActionScan.dataAttrs}
			style={cssVarString(mActionScan.cssVars)}
			class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:brightness-110"
			onclick={() => modelsState.scan()}
			disabled={modelsState.scanning}
		>
			<Search size={14} />
			{modelsState.scanning ? "Scanning..." : "Scan Models"}
		</button>

		<button
			{...mActionDownload.dataAttrs}
			style={cssVarString(mActionDownload.cssVars)}
			class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:brightness-110"
		>
			<HardDrive size={14} />
			Download Model
		</button>
	</div>

	<!-- Hard error display -->
	{#if hardwareState.error}
		<div
			{...mError.dataAttrs}
			style={cssVarString(mError.cssVars)}
			class="flex flex-col gap-1 rounded-lg border-l-4 px-3 py-2"
		>
			<Text size="xs" weight="bold" style="color: var(--color);">HARDWARE ERROR</Text>
			<Text size="xs" color="secondary">{hardwareState.error}</Text>
		</div>
	{/if}

	{#if modelsState.error}
		<div
			{...mError.dataAttrs}
			style={cssVarString(mError.cssVars)}
			class="flex flex-col gap-1 rounded-lg border-l-4 px-3 py-2"
		>
			<Text size="xs" weight="bold" style="color: var(--color);">MODEL LOADER ERROR</Text>
			<Text size="xs" color="secondary">{modelsState.error}</Text>
		</div>
	{/if}

	<ClyffyNarration message={clyffyMessage} type={clyffyType} />
</div>
{/if}
