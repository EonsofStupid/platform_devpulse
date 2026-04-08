<!--
  @file SlotCard.svelte
  Commandment #3: Layman names. Commandment #4: Role colors.
  Single slot display with: friendly name, status, role color border, "Change" button.
  Technical model name in small gray text.
-->
<script lang="ts">
import { Check, Loader2, RefreshCw, X } from "lucide-svelte";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { formatMb, isInferenceReady } from "../../../types/models.types.js";
import type { SlotLabel } from "../wizard.types.js";
import { getSlotLabel, ROLE_COLORS } from "../wizard.types.js";

interface Props {
	slotId: string;
	onChange: () => void;
}
let { slotId, onChange }: Props = $props();

const label: SlotLabel | undefined = $derived(getSlotLabel(slotId));
const roleColor = $derived(label ? ROLE_COLORS[label.role] : null);
const slot = $derived(modelsState.slots.find((s) => s.id === slotId));
const assignedModel = $derived(
	slot?.assigned_model_id ? modelsState.models.find((m) => m.id === slot.assigned_model_id) : null,
);
const status = $derived(modelsState.statuses[slotId]);
const ready = $derived(status ? isInferenceReady(status) : false);

const statusText = $derived.by(() => {
	if (!assignedModel) return "Not set up";
	if (ready) return "Ready";
	if (status?.type === "loading") return "Loading...";
	if (status?.type === "warm") return "Standby";
	if (status?.type === "failed") return "Failed";
	return "Assigned";
});

const statusClass = $derived.by(() => {
	if (ready) return "status-ready";
	if (!assignedModel) return "status-empty";
	if (status?.type === "failed") return "status-failed";
	if (status?.type === "loading") return "status-loading";
	return "status-assigned";
});
</script>

<div class="slot-card" style="border-left-color: {roleColor?.accent ?? 'var(--wiz-border)'};">
	<div class="card-main">
		<div class="card-info">
			<span class="slot-name">{label?.name ?? slotId}</span>
			<span class="slot-desc">{label?.description ?? ""}</span>
			{#if assignedModel}
				<span class="model-tech">{assignedModel.filename} · {formatMb(assignedModel.vram_estimate_mb)} VRAM</span>
			{/if}
		</div>

		<div class="card-right">
			<span class="status-badge {statusClass}">
				{#if ready}
					<Check size={10} />
				{:else if status?.type === "loading"}
					<Loader2 size={10} class="animate-spin" />
				{:else if status?.type === "failed"}
					<X size={10} />
				{/if}
				{statusText}
			</span>
			<button class="btn-change" onclick={onChange}>
				<RefreshCw size={12} /> Change
			</button>
		</div>
	</div>
</div>

<style>
	.slot-card {
		display: flex; flex-direction: column;
		padding: 0.75rem 1rem; border-radius: var(--wiz-radius-md);
		background: var(--wiz-card); border: 1px solid var(--wiz-border);
		border-left: 3px solid var(--wiz-border);
		transition: border-color var(--wiz-duration-fast);
	}
	.slot-card:hover { border-color: var(--wiz-void-500); }

	.card-main { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
	.card-info { display: flex; flex-direction: column; gap: 0.125rem; }
	.slot-name { font-size: var(--wiz-text-sm); font-weight: 700; color: var(--wiz-text); }
	.slot-desc { font-size: var(--wiz-text-xs); color: var(--wiz-text-muted); }
	.model-tech { font-size: var(--wiz-text-xs); color: var(--wiz-void-400); font-family: monospace; }

	.card-right { display: flex; align-items: center; gap: 0.5rem; }

	.status-badge {
		display: inline-flex; align-items: center; gap: 0.25rem;
		font-size: var(--wiz-text-xs); font-weight: 600;
		padding: 0.125rem 0.5rem; border-radius: var(--wiz-radius-full);
	}
	.status-ready { color: var(--wiz-green); background: var(--wiz-fill-green); }
	.status-assigned { color: var(--wiz-gold); background: var(--wiz-fill-ember); }
	.status-loading { color: var(--wiz-cyan); background: var(--wiz-fill-cyan); }
	.status-failed { color: var(--wiz-salmon); background: var(--wiz-fill-ember); }
	.status-empty { color: var(--wiz-text-muted); background: var(--wiz-void-800); }

	.btn-change {
		display: inline-flex; align-items: center; gap: 0.25rem;
		padding: 0.25rem 0.5rem; border-radius: var(--wiz-radius-sm);
		border: 1px solid var(--wiz-border); background: transparent;
		color: var(--wiz-text-muted); font-size: var(--wiz-text-xs); cursor: pointer;
		transition: all var(--wiz-duration-fast);
	}
	.btn-change:hover { border-color: var(--wiz-cyan); color: var(--wiz-text); }
</style>
