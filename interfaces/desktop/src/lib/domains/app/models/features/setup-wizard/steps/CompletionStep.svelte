<!--
  @file CompletionStep.svelte
  Summary. All slots with role colors. Launch button.
  ColdLight tokens. Zero hardcoded colors.
-->
<script lang="ts">
import { Check, Cloud, Key, PartyPopper } from "lucide-svelte";
import { type ApiKeyStatus, commands } from "$lib/sys/generated/bindings.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { formatMb, isInferenceReady } from "../../../types/models.types.js";
import { ROLE_COLORS, SLOT_LABELS } from "../wizard.types.js";

interface Props {
	onComplete: () => void;
}
let { onComplete }: Props = $props();

const slotSummary = $derived(
	SLOT_LABELS.map((sl) => {
		const slot = modelsState.userSlots.find((s) => s.id === sl.id);
		const model = slot?.assigned_model_id
			? modelsState.models.find((m) => m.id === slot.assigned_model_id)
			: null;
		const status = modelsState.statuses[sl.id] ?? { type: "cold" as const };
		const ready = isInferenceReady(status);
		const color = ROLE_COLORS[sl.role];
		return { ...sl, model, ready, status, color };
	}),
);
const readyCount = $derived(slotSummary.filter((s) => s.ready).length);
const assignedCount = $derived(slotSummary.filter((s) => s.model).length);

let apiKeys = $state<ApiKeyStatus[]>([]);
$effect(() => {
	commands.getApiKeyStatus().then((result) => {
		if (result.status === "ok") apiKeys = result.data as ApiKeyStatus[];
	});
});
const connectedProviders = $derived(apiKeys.filter((k) => k.stored));
</script>

<div class="completion">
	<div class="icon-wrap"><PartyPopper size={40} /></div>
	<h2 class="title">You're All Set!</h2>
	<p class="sub">{readyCount} of {slotSummary.length} capabilities ready. {assignedCount} models assigned.</p>

	<div class="summary">
		{#each slotSummary as s (s.id)}
			<div class="row">
				<span class="dot" style="background: {s.ready ? s.color.accent : s.model ? 'var(--wiz-gold)' : 'var(--wiz-void-600)'};">
				</span>
				<span class="row-label">{s.name}</span>
				<span class="row-model">{s.model?.filename ?? "Not assigned"}</span>
				<span class="row-status">{s.ready ? "Ready" : s.model ? "Assigned" : "Empty"}</span>
			</div>
		{/each}
	</div>

	<!-- Cloud AI -->
	<div class="api-section">
		<span class="api-title"><Key size={14} /> Cloud AI</span>
		{#if connectedProviders.length > 0}
			{#each connectedProviders as prov (prov.provider)}
				<div class="row">
					<span class="dot" style="background: var(--wiz-green);"></span>
					<span class="row-label"><Cloud size={12} /> {prov.provider}</span>
					<span class="row-model">{prov.masked_preview ?? "Connected"}</span>
					<span class="row-status">Ready</span>
				</div>
			{/each}
		{:else}
			<p class="api-note">No API keys configured. Clyffy runs fully local. Add keys anytime in Settings.</p>
		{/if}
	</div>

	{#if hardwareState.hasGpu}
		<p class="vram-sum">GPU: {hardwareState.gpuName} — {formatMb(hardwareState.vramFreeMb ?? 0)} VRAM free</p>
	{/if}

	<button class="btn-launch" onclick={onComplete}>
		<Check size={18} /> Launch DevPulse
	</button>

	<p class="hint">You can change models anytime from Settings.</p>
</div>

<style>
	.completion { display: flex; flex-direction: column; align-items: center; gap: 1.25rem; padding: 2rem; text-align: center; }
	.icon-wrap { color: var(--wiz-cyan); animation: bounce 600ms ease-in-out; }
	@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-0.5rem); } }
	.title { font-size: 1.5rem; font-weight: 800; color: var(--wiz-text); margin: 0; }
	.sub { font-size: 0.9375rem; color: var(--wiz-text-sub); margin: 0; }

	.summary { display: flex; flex-direction: column; gap: 0.375rem; width: 100%; max-width: 28rem; text-align: left; }
	.row {
		display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem;
		border-radius: var(--wiz-radius-md); background: var(--wiz-card); border: 1px solid var(--wiz-border);
	}
	.dot { width: 0.5rem; height: 0.5rem; border-radius: var(--wiz-radius-full); flex-shrink: 0; }
	.row-label { font-size: var(--wiz-text-sm); font-weight: 600; color: var(--wiz-text); width: 8rem; }
	.row-model { flex: 1; font-size: var(--wiz-text-sm); color: var(--wiz-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.row-status { font-size: var(--wiz-text-sm); color: var(--wiz-text-muted); }

	.api-section { display: flex; flex-direction: column; gap: 0.375rem; width: 100%; max-width: 28rem; text-align: left; }
	.api-title { display: flex; align-items: center; gap: 0.375rem; font-size: var(--wiz-text-sm); font-weight: 700; color: var(--wiz-text-sub); }
	.api-note { font-size: var(--wiz-text-sm); color: var(--wiz-text-muted); margin: 0; font-style: italic; }

	.vram-sum { font-size: var(--wiz-text-sm); color: var(--wiz-text-sub); margin: 0; }

	.btn-launch {
		display: inline-flex; align-items: center; gap: 0.5rem;
		padding: 0.75rem 2.5rem; border-radius: var(--wiz-radius-lg); border: none;
		background: var(--wiz-cyan); color: var(--wiz-void-950);
		font-size: 1.0625rem; font-weight: 800; cursor: pointer;
		box-shadow: 0 0 1.5rem var(--wiz-glow-cyan);
		transition: all var(--wiz-duration-fast);
	}
	.btn-launch:hover { filter: brightness(1.15); box-shadow: 0 0 2rem var(--wiz-glow-cyan); }

	.hint { font-size: var(--wiz-text-sm); color: var(--wiz-text-muted); margin: 0; }
</style>
