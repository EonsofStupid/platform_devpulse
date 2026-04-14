<!--
  @file ConversationalBrainPanel.svelte
  Main AI brain configuration. Model assignment, load/unload, metadata, VRAM.
  Crosslinked: same pattern as SttConfigPanel/TtsConfigPanel.
  Colocated CSS. No renderForge.
-->
<script lang="ts">
import {
	AlertTriangle,
	Brain,
	Check,
	ChevronDown,
	ChevronUp,
	LoaderCircle,
	Power,
	PowerOff,
	Settings,
} from "lucide-svelte";
import { Progress } from "$lib/design/components/progress/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { hardwareState } from "../../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import type { SlotId } from "../../../util/models.types.js";
import {
	calculateFit,
	fitColor,
	fitLabel,
	formatContext,
	formatMb,
	isInferenceReady,
} from "../../../util/models.types.js";

const SLOT_ID: SlotId = "chat.brain";

let showModelPicker = $state(false);
let showAdvanced = $state(false);

const status = $derived(modelsState.statuses[SLOT_ID] ?? { type: "cold" as const });
const model = $derived(modelsState.assignedModel(SLOT_ID));
const isReady = $derived(isInferenceReady(status));
const isLoading = $derived(status.type === "loading");
const isFailed = $derived(status.type === "failed");
const compatibleModels = $derived(
	modelsState.models.filter((m) => m.compatible_capabilities.includes("text_generation")),
);

async function assignAndLoad(modelId: string): Promise<void> {
	try {
		await modelsState.assign(SLOT_ID, modelId);
		await modelsState.load(SLOT_ID);
		showModelPicker = false;
	} catch {}
}
async function handleLoad(): Promise<void> {
	try {
		await modelsState.load(SLOT_ID);
	} catch {}
}
async function handleUnload(): Promise<void> {
	try {
		await modelsState.unload(SLOT_ID);
	} catch {}
}
</script>

<div class="brain-panel">
	<div class="header">
		<div class="header-icon"><Brain size={24} /></div>
		<div class="header-info">
			<h3 class="title">Main AI (Clyffy's Brain)</h3>
			<p class="subtitle">The model that talks to you, writes code, answers questions, and reasons through problems.</p>
		</div>
		<div class="status-badge" class:ready={isReady} class:failed={isFailed} class:loading={isLoading}>
			{#if isReady}<Check size={14} /> Ready
			{:else if isLoading}<LoaderCircle size={14} class="animate-spin" /> Loading
			{:else if isFailed}<AlertTriangle size={14} /> Failed
			{:else}Not Loaded{/if}
		</div>
	</div>

	<div class="section">
		<div class="section-header">
			<span class="section-title">Model</span>
			{#if model}<span class="model-badge">{model.filename}</span>{/if}
		</div>

		{#if model}
			<div class="model-detail">
				<div class="detail-row"><span class="dl">Architecture</span><span class="dv">{model.architecture}</span></div>
				{#if model.quant_level}<div class="detail-row"><span class="dl">Quality</span><span class="dv">{model.quant_level}</span></div>{/if}
				<div class="detail-row"><span class="dl">Size</span><span class="dv">{formatMb(model.size_mb)}</span></div>
				<div class="detail-row"><span class="dl">VRAM</span><span class="dv">{formatMb(model.vram_estimate_mb)}</span></div>
				{#if model.context_length > 0}<div class="detail-row"><span class="dl">Context</span><span class="dv">{formatContext(model.context_length)} tokens</span></div>{/if}
			</div>
			<div class="actions">
				{#if status.type === "cold" || isFailed}<button class="btn-primary" onclick={handleLoad}><Power size={14} /> Load</button>{/if}
				{#if isReady}<button class="btn-danger" onclick={handleUnload}><PowerOff size={14} /> Unload</button>{/if}
				<button class="btn-outline" onclick={() => (showModelPicker = !showModelPicker)}>{showModelPicker ? "Cancel" : "Change Model"}</button>
			</div>
		{:else}
			<p class="no-model">No brain model assigned. This is required for chat.</p>
			<button class="btn-primary" onclick={() => (showModelPicker = true)}><Brain size={14} /> Assign Model</button>
		{/if}

		{#if showModelPicker}
			<div class="picker">
				<span class="picker-label">Compatible chat models ({compatibleModels.length})</span>
				{#if compatibleModels.length === 0}<p class="picker-empty">No GGUF chat models found. Download one from HuggingFace or import from disk.</p>{/if}
				{#each compatibleModels as m (m.id)}
					{@const fit = calculateFit(m.vram_estimate_mb, hardwareState.vramFreeMb, hardwareState.vramTotalMb)}
					<button class="picker-row" onclick={() => assignAndLoad(m.id)}>
						<span class="picker-name">{m.filename}</span>
						{#if m.quant_level}<span class="tag">{m.quant_level}</span>{/if}
						<span class="tag-muted">{formatMb(m.size_mb)}</span>
						<span class="tag-muted">{formatMb(m.vram_estimate_mb)} VRAM</span>
						<span class="fit-dot" style="background:{fitColor(fit)}"></span>
						<span class="fit-text">{fitLabel(fit)}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	{#if isFailed && "error" in status}
		<div class="error-box"><AlertTriangle size={16} /><span>{status.error}</span></div>
	{/if}

	{#if isLoading}
		<div class="loading-row"><Spinner size="sm" /><span>Loading brain model...</span><Progress value={status.type === "loading" ? status.progressPct : 0} max={100} size="sm" class="flex-1" /></div>
	{/if}

	<button class="advanced-toggle" onclick={() => (showAdvanced = !showAdvanced)}>
		<Settings size={14} /> Advanced Settings
		{#if showAdvanced}<ChevronUp size={14} />{:else}<ChevronDown size={14} />{/if}
	</button>
	{#if showAdvanced}
		<div class="advanced">
			<div class="detail-row"><span class="dl">Temperature</span><input type="range" class="range" min={0} max={200} value={70} /><span class="dv">0.7</span></div>
			<div class="detail-row"><span class="dl">Top P</span><input type="range" class="range" min={0} max={100} value={90} /><span class="dv">0.9</span></div>
			<div class="detail-row"><span class="dl">Max Tokens</span><input type="number" class="input-sm" value={4096} min={256} max={32768} step={256} /></div>
			<div class="detail-row"><span class="dl">GPU Layers</span><input type="number" class="input-sm" value={99} min={0} max={999} /></div>
			<p class="hint">GPU Layers: higher = more VRAM used but faster. Set to 0 for CPU-only.</p>
		</div>
	{/if}
</div>

<style>
	.brain-panel { display: flex; flex-direction: column; gap: 1rem; background: oklch(0.12 0.025 220 / 0.65); border: 1px solid oklch(0.3 0.03 220 / 0.4); border-radius: 0.75rem; padding: 1.25rem; backdrop-filter: blur(12px); }
	.header { display: flex; align-items: flex-start; gap: 0.75rem; }
	.header-icon { color: oklch(0.65 0.17 185); }
	.header-info { flex: 1; }
	.title { font-size: 1rem; font-weight: 700; color: oklch(0.93 0.015 224); margin: 0; }
	.subtitle { font-size: 0.8125rem; color: oklch(0.6 0.02 220); margin: 0.25rem 0 0; }
	.status-badge { display: flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background: oklch(0.2 0.02 220 / 0.5); color: oklch(0.6 0.02 220); }
	.status-badge.ready { background: oklch(0.25 0.08 152 / 0.3); color: oklch(0.72 0.19 152); }
	.status-badge.failed { background: oklch(0.25 0.08 25 / 0.3); color: oklch(0.7 0.18 25); }
	.status-badge.loading { background: oklch(0.25 0.08 75 / 0.3); color: oklch(0.75 0.15 75); }
	.section { display: flex; flex-direction: column; gap: 0.5rem; }
	.section-header { display: flex; align-items: center; gap: 0.5rem; }
	.section-title { font-size: 0.8125rem; font-weight: 700; color: oklch(0.75 0.02 220); }
	.model-badge { font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 0.25rem; background: oklch(0.2 0.03 185 / 0.3); color: oklch(0.65 0.12 185); }
	.model-detail { background: oklch(0.15 0.02 220 / 0.5); border-radius: 0.5rem; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; }
	.detail-row { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
	.dl { font-size: 0.8125rem; color: oklch(0.55 0.02 220); }
	.dv { font-size: 0.8125rem; color: oklch(0.85 0.015 224); font-weight: 500; }
	.actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
	.no-model { font-size: 0.875rem; color: oklch(0.5 0.02 220); font-style: italic; margin: 0; }
	.picker { background: oklch(0.15 0.02 220 / 0.5); border: 1px solid oklch(0.3 0.02 220 / 0.4); border-radius: 0.5rem; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; }
	.picker-label { font-size: 0.8125rem; font-weight: 700; color: oklch(0.7 0.02 220); margin-bottom: 0.25rem; }
	.picker-empty { font-size: 0.8125rem; color: oklch(0.5 0.02 220); margin: 0; }
	.picker-row { display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.5rem; border-radius: 0.375rem; border: none; background: transparent; cursor: pointer; font-size: 0.8125rem; color: oklch(0.85 0.015 224); text-align: left; }
	.picker-row:hover { background: oklch(0.2 0.015 220 / 0.5); }
	.picker-name { flex: 1; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.tag { font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 0.25rem; background: oklch(0.2 0.02 220 / 0.6); color: oklch(0.8 0.02 220); }
	.tag-muted { font-size: 0.8125rem; color: oklch(0.6 0.02 220); }
	.fit-dot { width: 0.5rem; height: 0.5rem; border-radius: 9999px; }
	.fit-text { font-size: 0.75rem; color: oklch(0.6 0.02 220); }
	.error-box { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; border-radius: 0.5rem; background: oklch(0.2 0.08 25 / 0.3); border: 1px solid oklch(0.6 0.22 25 / 0.4); color: oklch(0.85 0.08 25); font-size: 0.875rem; }
	.loading-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: oklch(0.65 0.02 220); }
	.advanced-toggle { display: flex; align-items: center; gap: 0.375rem; background: none; border: none; color: oklch(0.6 0.02 220); font-size: 0.8125rem; cursor: pointer; padding: 0; }
	.advanced-toggle:hover { color: oklch(0.75 0.02 220); }
	.advanced { background: oklch(0.13 0.02 220 / 0.4); border-radius: 0.5rem; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
	.range { flex: 1; accent-color: oklch(0.65 0.17 185); }
	.input-sm { width: 5rem; padding: 0.25rem 0.5rem; border-radius: 0.375rem; border: 1px solid oklch(0.3 0.02 220 / 0.4); background: oklch(0.15 0.02 220); color: oklch(0.9 0.015 224); font-size: 0.8125rem; }
	.hint { font-size: 0.75rem; color: oklch(0.5 0.02 220); margin: 0; }
	.btn-primary { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.875rem; border-radius: 0.5rem; border: none; background: oklch(0.65 0.17 185); color: oklch(0.12 0.02 220); font-size: 0.8125rem; font-weight: 700; cursor: pointer; }
	.btn-primary:hover { filter: brightness(1.15); }
	.btn-outline { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.875rem; border-radius: 0.5rem; border: 1px solid oklch(0.3 0.03 220 / 0.5); background: transparent; color: oklch(0.75 0.02 220); font-size: 0.8125rem; cursor: pointer; }
	.btn-outline:hover { background: oklch(0.18 0.015 220 / 0.3); }
	.btn-danger { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.875rem; border-radius: 0.5rem; border: 1px solid oklch(0.5 0.15 25 / 0.4); background: transparent; color: oklch(0.7 0.15 25); font-size: 0.8125rem; cursor: pointer; }
</style>
