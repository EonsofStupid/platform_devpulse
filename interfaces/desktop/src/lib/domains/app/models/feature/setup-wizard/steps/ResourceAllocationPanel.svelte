<!--
  @file ResourceAllocationPanel.svelte
  VRAM/RAM stacked bar. Per-slot segments. Over-budget warning. Disk space.
  Colocated CSS. No renderForge.
-->
<script lang="ts">
import { AlertTriangle } from "lucide-svelte";
import { copyState, fill } from "#lib/sys/copy/index.js";
import { hardwareState } from "../../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import { formatMb, friendlySlotLabel, isInferenceReady } from "../../../util/models.types.js";

const text = $derived(copyState.catalog?.setup_wizard.resources ?? null);

/** Each slot's segment colour: its role's accent. */
const COLORS: Record<string, string> = {
	"chat.brain": "var(--wizard-role-brain-main)",
	"chat.fast": "var(--wizard-role-brain-main)",
	"chat.vision": "var(--accent-purple-main)",
	"minion.shared": "var(--wizard-role-minion-main)",
	"minion.escalation": "var(--wizard-role-minion-main)",
	"rag.embedder": "var(--wizard-role-encoder-main)",
	"rag.reranker": "var(--accent-gold-main)",
	"rag.encoder": "var(--wizard-role-encoder-main)",
	"vision.embedder": "var(--accent-cyan-main)",
	"voice.stt": "var(--wizard-role-voice-main)",
	"voice.tts": "var(--accent-hotpink-main)",
	"voice.brain": "var(--wizard-role-voice-main)",
	"voice.wake": "var(--wizard-role-voice-main)",
};
const slotName = (id: string): string => friendlySlotLabel(id);

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

{#if text}

<div class="rp">
	<h3 class="title">{text.title}</h3>

	{#if hardwareState.hasGpu && vramTotal > 0}
		<div class="sec">
			<div class="row-between"><span class="lbl">{text.gpu_vram}</span><span class="val" class:over={overBudget}>{formatMb(totalUsed)} / {formatMb(vramTotal)}</span></div>
			<div class="bar">
				{#each gpuSlots as s (s.id)}
					<div class="seg" class:loaded={s.loaded} style:width="{(s.vram / vramTotal) * 100}%" style:background={COLORS[s.id] ?? "var(--border-strong)"} title={fill(text.segment, { slot: slotName(s.id), size: formatMb(s.vram) })}></div>
				{/each}
				<div class="free"></div>
			</div>
			<div class="legend">{#each gpuSlots as s (s.id)}<div class="li"><span class="ld" style:background={COLORS[s.id] ?? "var(--border-strong)"}></span><span class="lt">{slotName(s.id)} {formatMb(s.vram)}</span></div>{/each}</div>
		</div>
		{#if overBudget}<div class="warn"><AlertTriangle size={16}/><span>{fill(text.over_budget, { size: formatMb(totalUsed - vramTotal) })}</span></div>{/if}
	{:else}
		<p class="muted">{text.no_gpu}</p>
	{/if}

	{#if hardwareState.ramTotalMb}
		<div class="sec">
			<div class="row-between"><span class="lbl">{text.ram}</span><span class="val">{fill(text.ram_free, { free: formatMb(hardwareState.ramTotalMb - (hardwareState.ramUsedMb ?? 0)), total: formatMb(hardwareState.ramTotalMb) })}</span></div>
			<div class="sbar"><div class="sfill" style:width="{Math.min(100, ((hardwareState.ramUsedMb ?? 0) / hardwareState.ramTotalMb) * 100)}%"></div></div>
		</div>
	{/if}

	{#if hardwareState.diskFreeMb}
		<div class="sec"><div class="row-between"><span class="lbl">{text.disk}</span><span class="val">{fill(text.disk_free, { size: formatMb(hardwareState.diskFreeMb) })}</span></div></div>
	{/if}
</div>
{/if}

<style>
	.rp { display:flex;flex-direction:column;gap:1rem;background:var(--surface-inset);border:var(--border-width-thin) solid var(--border-subtle);border-radius:0.75rem;padding:1.25rem;backdrop-filter:blur(0.75rem); }
	.title { font-size:1rem;font-weight:700;color:var(--text-primary);margin:0; }
	.sec { display:flex;flex-direction:column;gap:0.375rem; }
	.row-between { display:flex;justify-content:space-between;align-items:center; }
	.lbl { font-size:0.8125rem;font-weight:600;color:var(--text-secondary); }
	.val { font-size:0.8125rem;color:var(--text-primary); }
	.val.over { color:var(--signal-error);font-weight:700; }
	.bar { display:flex;height:1.5rem;border-radius:0.5rem;overflow:hidden;border:var(--border-width-thin) solid var(--border-subtle); }
	.seg { transition:width var(--duration-fast);min-width:0.125rem;opacity:0.7; }
	.seg.loaded { opacity:1; }
	.free { flex:1;background:var(--surface-raised); }
	.legend { display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.25rem; }
	.li { display:flex;align-items:center;gap:0.25rem; }
	.ld { width:0.5rem;height:0.5rem;border-radius:var(--radius-full); }
	.lt { font-size:0.875rem;color:var(--text-muted); }
	.warn { display:flex;align-items:center;gap:0.5rem;padding:0.75rem;border-radius:0.5rem;background:color-mix(in oklch, var(--signal-error) 20%, transparent);border:var(--border-width-thin) solid color-mix(in oklch, var(--signal-error) 30%, transparent);color:var(--signal-error);font-size:0.8125rem; }
	.muted { font-size:0.875rem;color:var(--text-muted);font-style:italic;margin:0; }
	.sbar { height:0.75rem;border-radius:0.375rem;background:var(--surface-raised);overflow:hidden; }
	.sfill { height:100%;background:color-mix(in oklch, var(--accent-teal-main) 60%, transparent);border-radius:0.375rem;transition:width var(--duration-fast); }
</style>
