<!--
  @file ResourceAllocationPanel.svelte
  VRAM/RAM stacked bar. Per-slot segments. Over-budget warning. Disk space.
  Colocated CSS. No renderForge.
-->
<script lang="ts">
import { AlertTriangle } from "lucide-svelte";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { formatMb, isInferenceReady } from "../../../types/models.types.js";

const COLORS: Record<string, string> = {
	"chat.brain": "oklch(0.65 0.17 185)",
	"minion.shared": "oklch(0.6 0.15 260)",
	"rag.embedder": "oklch(0.7 0.15 150)",
	"rag.reranker": "oklch(0.65 0.12 100)",
	"vision.encoder": "oklch(0.7 0.12 300)",
	"voice.stt": "oklch(0.7 0.15 50)",
	"voice.tts": "oklch(0.65 0.18 330)",
};
const LABELS: Record<string, string> = {
	"chat.brain": "Main AI",
	"minion.shared": "Helper",
	"rag.embedder": "Search",
	"rag.reranker": "Reranker",
	"vision.encoder": "Vision",
	"voice.stt": "Ears",
	"voice.tts": "Voice",
};

const gpuSlots = $derived(
	modelsState.userSlots
		.map((s) => {
			const m = modelsState.assignedModel(s.id);
			return {
				id: s.id,
				vram: m?.vram_estimate_mb ?? 0,
				loaded: isInferenceReady(modelsState.statuses[s.id] ?? { type: "cold" }),
			};
		})
		.filter((s) => s.vram > 0),
);
const totalUsed = $derived(gpuSlots.reduce((a, s) => a + s.vram, 0));
const vramTotal = $derived(hardwareState.vramTotalMb ?? 0);
const overBudget = $derived(vramTotal > 0 && totalUsed > vramTotal);
</script>

<div class="rp">
	<h3 class="title">Resource Allocation</h3>

	{#if hardwareState.hasGpu && vramTotal > 0}
		<div class="sec">
			<div class="row-between"><span class="lbl">GPU VRAM</span><span class="val" class:over={overBudget}>{formatMb(totalUsed)} / {formatMb(vramTotal)}</span></div>
			<div class="bar">
				{#each gpuSlots as s (s.id)}
					<div class="seg" class:loaded={s.loaded} style="width:{(s.vram/vramTotal)*100}%;background:{COLORS[s.id] ?? 'oklch(0.5 0.05 220)'};" title="{LABELS[s.id] ?? s.id}: {formatMb(s.vram)}"></div>
				{/each}
				<div class="free"></div>
			</div>
			<div class="legend">{#each gpuSlots as s (s.id)}<div class="li"><span class="ld" style="background:{COLORS[s.id]??''}"></span><span class="lt">{LABELS[s.id]??s.id} {formatMb(s.vram)}</span></div>{/each}</div>
		</div>
		{#if overBudget}<div class="warn"><AlertTriangle size={16}/><span>Over budget by {formatMb(totalUsed - vramTotal)} — some models will use CPU</span></div>{/if}
	{:else}
		<p class="muted">No GPU detected. All models run on CPU.</p>
	{/if}

	{#if hardwareState.ramTotalMb}
		<div class="sec">
			<div class="row-between"><span class="lbl">RAM</span><span class="val">{formatMb(hardwareState.ramAvailableMb ?? 0)} free / {formatMb(hardwareState.ramTotalMb)}</span></div>
			<div class="sbar"><div class="sfill" style="width:{Math.min(100,((hardwareState.ramTotalMb-(hardwareState.ramAvailableMb??0))/hardwareState.ramTotalMb)*100)}%"></div></div>
		</div>
	{/if}

	{#if hardwareState.diskFreeMb}
		<div class="sec"><div class="row-between"><span class="lbl">Disk</span><span class="val">{formatMb(hardwareState.diskFreeMb)} free</span></div></div>
	{/if}
</div>

<style>
	.rp { display:flex;flex-direction:column;gap:1rem;background:oklch(0.12 0.025 220/0.65);border:1px solid oklch(0.3 0.03 220/0.4);border-radius:0.75rem;padding:1.25rem;backdrop-filter:blur(12px); }
	.title { font-size:1rem;font-weight:700;color:oklch(0.93 0.015 224);margin:0; }
	.sec { display:flex;flex-direction:column;gap:0.375rem; }
	.row-between { display:flex;justify-content:space-between;align-items:center; }
	.lbl { font-size:0.8125rem;font-weight:600;color:oklch(0.7 0.02 220); }
	.val { font-size:0.8125rem;color:oklch(0.8 0.015 224); }
	.val.over { color:oklch(0.7 0.18 25);font-weight:700; }
	.bar { display:flex;height:1.5rem;border-radius:0.5rem;overflow:hidden;border:1px solid oklch(0.25 0.02 220/0.5); }
	.seg { transition:width 300ms;min-width:2px;opacity:0.7; }
	.seg.loaded { opacity:1; }
	.free { flex:1;background:oklch(0.15 0.01 220/0.3); }
	.legend { display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.25rem; }
	.li { display:flex;align-items:center;gap:0.25rem; }
	.ld { width:0.5rem;height:0.5rem;border-radius:9999px; }
	.lt { font-size:0.875rem;color:oklch(0.6 0.02 220); }
	.warn { display:flex;align-items:center;gap:0.5rem;padding:0.75rem;border-radius:0.5rem;background:oklch(0.2 0.08 25/0.2);border:1px solid oklch(0.6 0.18 25/0.3);color:oklch(0.8 0.12 25);font-size:0.8125rem; }
	.muted { font-size:0.875rem;color:oklch(0.55 0.02 220);font-style:italic;margin:0; }
	.sbar { height:0.75rem;border-radius:0.375rem;background:oklch(0.15 0.01 220/0.3);overflow:hidden; }
	.sfill { height:100%;background:oklch(0.55 0.12 185/0.6);border-radius:0.375rem;transition:width 300ms; }
</style>
