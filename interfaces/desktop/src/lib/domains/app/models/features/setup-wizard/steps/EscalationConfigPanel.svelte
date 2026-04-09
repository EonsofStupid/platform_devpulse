<!--
  @file EscalationConfigPanel.svelte
  Escalation chain: voice.brain → chat.brain → API fallback.
  Drag to reorder. Enable/disable tiers. Timeout config.
  Colocated CSS. No renderForge.
-->
<script lang="ts">
import { ArrowDown, Brain, Cloud, Cpu, GripVertical, Settings } from "lucide-svelte";
import { type ApiKeyStatus, commands } from "$lib/sys/generated/bindings.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { isInferenceReady } from "../../../types/models.types.js";

interface EscalationTier {
	id: string;
	label: string;
	desc: string;
	icon: typeof Brain;
	enabled: boolean;
	timeoutMs: number;
	slotId?: string;
}

let tiers = $state<EscalationTier[]>([
	{
		id: "voice-brain",
		label: "Voice Brain (CPU)",
		desc: "Fast local model for quick answers. ~100ms response.",
		icon: Cpu,
		enabled: true,
		timeoutMs: 3000,
		slotId: "voice.brain",
	},
	{
		id: "main-brain",
		label: "Main AI (GPU)",
		desc: "Full reasoning model for complex questions. ~1-3s response.",
		icon: Brain,
		enabled: true,
		timeoutMs: 10000,
		slotId: "chat.brain",
	},
	{
		id: "api-fallback",
		label: "Cloud API",
		desc: "External AI service. Requires internet. Highest quality.",
		icon: Cloud,
		enabled: false,
		timeoutMs: 30000,
	},
]);

let apiKeyStatuses = $state<ApiKeyStatus[]>([]);
const hasAnyApiKey = $derived(apiKeyStatuses.some((s) => s.stored));

$effect(() => {
	commands.getApiKeyStatus().then((result) => {
		if (result.status === "ok") apiKeyStatuses = result.data as ApiKeyStatus[];
	});
});

function toggleTier(id: string): void {
	tiers = tiers.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t));
}

function updateTimeout(id: string, ms: number): void {
	tiers = tiers.map((t) => (t.id === id ? { ...t, timeoutMs: ms } : t));
}
</script>

<div class="esc-panel">
	<div class="header">
		<Settings size={20} class="icon" />
		<div>
			<h3 class="title">Escalation Chain</h3>
			<p class="subtitle">When one AI can't answer, it escalates to the next. Configure the chain and timeouts.</p>
		</div>
	</div>

	<div class="chain">
		{#each tiers as tier, i (tier.id)}
			{@const slotReady = tier.slotId ? isInferenceReady(modelsState.statuses[tier.slotId] ?? { type: "cold" }) : false}
			{@const Icon = tier.icon}

			{#if i > 0}
				<div class="arrow"><ArrowDown size={16} /></div>
			{/if}

			<div class="tier-card" class:enabled={tier.enabled} class:disabled={!tier.enabled}>
				<div class="tier-header">
					<GripVertical size={14} class="grip" />
					<Icon size={18} />
					<div class="tier-info">
						<span class="tier-label">{tier.label}</span>
						<span class="tier-desc">{tier.desc}</span>
					</div>
					<label class="switch">
						<input type="checkbox" checked={tier.enabled} onchange={() => toggleTier(tier.id)} />
						<span class="slider"></span>
					</label>
				</div>

				{#if tier.enabled}
					<div class="tier-config">
						{#if tier.slotId}
							<div class="tier-status">
								<span class="dot" class:ready={slotReady}></span>
								<span class="status-text">{slotReady ? "Model loaded and ready" : "Model not loaded — will load on first escalation"}</span>
							</div>
						{/if}
						{#if tier.id === "api-fallback"}
							<div class="tier-status">
								<span class="dot" class:ready={hasAnyApiKey}></span>
								{#if hasAnyApiKey}
									<span class="status-text">
										{apiKeyStatuses.filter((s) => s.stored).map((s) => s.provider).join(", ")} connected
									</span>
								{:else}
									<span class="status-text warn">No API keys configured — add keys in the API Keys tab</span>
								{/if}
							</div>
						{/if}
						<div class="timeout-row">
							<span class="timeout-label">Timeout</span>
							<input type="range" class="range" min={1000} max={60000} step={1000}
								value={tier.timeoutMs}
								oninput={(e) => updateTimeout(tier.id, Number(e.currentTarget.value))} />
							<span class="timeout-value">{(tier.timeoutMs / 1000).toFixed(0)}s</span>
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<p class="hint">
		The chain runs top to bottom. If a tier times out or fails, the request escalates to the next enabled tier.
		Disable tiers you don't want. Cloud API requires an API key (configure in Settings).
	</p>
</div>

<style>
	.esc-panel { display:flex;flex-direction:column;gap:1rem;background:oklch(0.12 0.025 220/0.65);border:1px solid oklch(0.3 0.03 220/0.4);border-radius:0.75rem;padding:1.25rem;backdrop-filter:blur(12px); }
	.header { display:flex;align-items:flex-start;gap:0.75rem; }
	:global(.icon) { color:oklch(0.65 0.17 185); }
	.title { font-size:1rem;font-weight:700;color:oklch(0.93 0.015 224);margin:0; }
	.subtitle { font-size:0.8125rem;color:oklch(0.6 0.02 220);margin:0.25rem 0 0; }

	.chain { display:flex;flex-direction:column;align-items:stretch;gap:0; }
	.arrow { display:flex;justify-content:center;color:oklch(0.4 0.02 220);padding:0.25rem 0; }

	.tier-card { border:1px solid oklch(0.3 0.03 220/0.4);border-radius:0.5rem;padding:0.75rem;background:oklch(0.15 0.02 220/0.4);transition:opacity 150ms; }
	.tier-card.disabled { opacity:0.5; }

	.tier-header { display:flex;align-items:center;gap:0.5rem; }
	:global(.grip) { color:oklch(0.4 0.02 220);cursor:grab; }
	.tier-info { flex:1; }
	.tier-label { display:block;font-size:0.875rem;font-weight:600;color:oklch(0.9 0.015 224); }
	.tier-desc { display:block;font-size:0.875rem;color:oklch(0.55 0.02 220); }

	.switch { position:relative;width:2.5rem;height:1.25rem;flex-shrink:0; }
	.switch input { opacity:0;width:0;height:0; }
	.slider { position:absolute;inset:0;border-radius:9999px;background:oklch(0.25 0.02 220);cursor:pointer;transition:background 150ms; }
	.slider::before { content:"";position:absolute;left:0.125rem;top:0.125rem;width:1rem;height:1rem;border-radius:9999px;background:oklch(0.7 0.02 220);transition:transform 150ms; }
	.switch input:checked + .slider { background:oklch(0.65 0.17 185); }
	.switch input:checked + .slider::before { transform:translateX(1.25rem);background:oklch(0.12 0.02 220); }

	.tier-config { margin-top:0.5rem;display:flex;flex-direction:column;gap:0.375rem; }
	.tier-status { display:flex;align-items:center;gap:0.375rem; }
	.dot { width:0.5rem;height:0.5rem;border-radius:9999px;background:oklch(0.4 0.02 220); }
	.dot.ready { background:oklch(0.72 0.19 152); }
	.status-text { font-size:0.875rem;color:oklch(0.6 0.02 220); }
	.status-text.warn { color:oklch(0.75 0.15 50); }

	.timeout-row { display:flex;align-items:center;gap:0.5rem; }
	.timeout-label { font-size:0.8125rem;color:oklch(0.55 0.02 220);width:4rem; }
	.timeout-value { font-size:0.8125rem;color:oklch(0.85 0.015 224);width:2rem;text-align:right; }
	.range { flex:1;accent-color:oklch(0.65 0.17 185); }

	.hint { font-size:0.875rem;color:oklch(0.5 0.02 220);margin:0;line-height:1.5; }
</style>
