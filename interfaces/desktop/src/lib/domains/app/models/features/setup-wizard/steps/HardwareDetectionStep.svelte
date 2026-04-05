<!--
  @file HardwareDetectionStep.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/HardwareDetectionStep

  Shows real hardware metrics from hardwareState rune. No mocks. No fakes.
  Metrics not available in HardwareInfo (disk_free, cuda_version) are omitted — not faked.
-->
<script lang="ts">
import { Check, LoaderCircle, TriangleAlert } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { formatMb } from "../../../types/models.types.js";
import { pickVariation } from "../seed-families.js";
import type { HardwareProfile } from "../wizard.types.js";
import { tierToProfile } from "../wizard.types.js";

interface Props {
	onContinue: () => void;
	continueEnabled: boolean;
}

let { onContinue, continueEnabled }: Props = $props();

const profile = $derived<HardwareProfile>(tierToProfile(hardwareState.tier));
const isScanning = $derived(hardwareState.loading);
const hasData = $derived(hardwareState.metrics !== null);
const m = $derived(hardwareState.metrics);

const clyfMessage = $derived(
	hardwareState.hasGpu ? pickVariation("hardware.gpu_found") : pickVariation("hardware.no_gpu"),
);
</script>

<div class={`${stack({ gap: "6", align: "center" })} w-full max-w-2xl`}>
	<!-- Clyffy narration -->
	{#if clyfMessage}
		<div
			class={cn(box({ paddingX: "12", paddingY: "8" }), "rounded-lg w-full border")}
			style="background: var(--surface-elevated); border-color: var(--border-subtle);"
		>
			<Text size="sm" color="secondary">{clyfMessage}</Text>
		</div>
	{/if}

	<!-- Hardware Scan heading -->
	<div class={hstack({ gap: "3", align: "center" })}>
		{#if isScanning}
			<LoaderCircle size={16} class="animate-spin" style="color: var(--accent-teal-main);" />
		{/if}
		<Text size="base" weight="bold" color="primary">Hardware Scan</Text>
		{#if hasData}
			<Badge variant="informative" size="sm">{profile}</Badge>
		{/if}
	</div>

	<!-- Metrics rows -->
	{#if hasData && m}
		<div class={`${stack({ gap: "4" })} w-full`}>
			<!-- CPU -->
			<div
				class={cn(box({ paddingX: "12", paddingY: "6" }), "rounded-md w-full border")}
				style="background: var(--surface-base); border-color: var(--border-subtle);"
			>
				<div class={hstack({ gap: "8", align: "center" })}>
					<Check size={14} style="color: var(--signal-success);" />
					<Text size="sm" color="secondary" class="flex-1">
						CPU: {m.cpu_name ?? "Unknown"} ({m.cpu_cores ?? "?"} cores)
					</Text>
				</div>
			</div>

			<!-- RAM -->
			<div
				class={cn(box({ paddingX: "12", paddingY: "6" }), "rounded-md w-full border")}
				style="background: var(--surface-base); border-color: var(--border-subtle);"
			>
				<div class={hstack({ gap: "8", align: "center" })}>
					<Check size={14} style="color: var(--signal-success);" />
					<Text size="sm" color="secondary" class="flex-1">
						RAM: {formatMb(m.ram_total_mb)} total ({formatMb(m.ram_available_mb)} available)
					</Text>
				</div>
			</div>

			<!-- GPU -->
			<div
				class={cn(box({ paddingX: "12", paddingY: "6" }), "rounded-md w-full border")}
				style="background: var(--surface-base); border-color: var(--border-subtle);"
			>
				<div class={hstack({ gap: "8", align: "center" })}>
					{#if m.gpu_name}
						<Check size={14} style="color: var(--signal-success);" />
						<Text size="sm" color="secondary" class="flex-1">
							GPU: {m.gpu_name}
						</Text>
					{:else if m.gpu_error}
						<TriangleAlert size={14} style="color: var(--signal-warning);" />
						<Text size="sm" color="secondary" class="flex-1">
							GPU: {m.gpu_error}
						</Text>
					{:else}
						<TriangleAlert size={14} style="color: var(--signal-warning);" />
						<Text size="sm" color="muted" class="flex-1">
							GPU: No GPU detected — using CPU mode
						</Text>
					{/if}
				</div>
			</div>

			<!-- VRAM (only if GPU present) -->
			{#if m.gpu_name && m.gpu_vram_total_mb}
				<div
					class={cn(box({ paddingX: "12", paddingY: "6" }), "rounded-md w-full border")}
					style="background: var(--surface-base); border-color: var(--border-subtle);"
				>
					<div class={hstack({ gap: "8", align: "center" })}>
						<Check size={14} style="color: var(--signal-success);" />
						<Text size="sm" color="secondary" class="flex-1">
							VRAM: {formatMb(m.gpu_vram_total_mb)} total ({formatMb(m.gpu_vram_free_mb ?? 0)} free)
						</Text>
					</div>
				</div>
			{/if}
		</div>
	{:else if isScanning}
		<div class={hstack({ gap: "3", align: "center" })}>
			<LoaderCircle size={14} class="animate-spin" style="color: var(--text-muted);" />
			<Text size="sm" color="muted">Scanning hardware...</Text>
		</div>
	{/if}

	<!-- Error display — RAW, not generic -->
	{#if hardwareState.error}
		<div
			class={cn(box({ paddingX: "12", paddingY: "8" }), "rounded-md w-full")}
			style="background: var(--signal-error); color: var(--text-primary);"
		>
			<Text size="xs" color="primary">{hardwareState.error}</Text>
		</div>
	{/if}

	<!-- Continue -->
	<button
		class="flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
		style="background: var(--accent-teal-main); color: var(--surface-base);"
		onclick={onContinue}
		disabled={!continueEnabled}
		aria-label="Continue to model loader"
	>
		Continue to Model Loader
	</button>

	{#if !continueEnabled && !isScanning}
		<Text size="xs" color="muted">Waiting for hardware detection to complete...</Text>
	{/if}
</div>
