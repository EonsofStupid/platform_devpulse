<!--
  @file HardwareDetectionStep.svelte
  Phase 1. Hardware metrics with tooltips. Tier badge. ColdLight tokens.
-->
<script lang="ts">
import { ArrowRight, Check, Cpu, HardDrive, Info, LoaderCircle, Monitor, Zap } from "lucide-svelte";
import { hardwareState } from "../../../data-access/hardware.state.svelte.js";
import { formatMb } from "../../../util/models.types.js";

interface Props {
	onContinue: () => void;
	continueEnabled: boolean;
}
let { onContinue, continueEnabled }: Props = $props();

let scanning = $state(true);
let tooltipVisible = $state<string | null>(null);
let tooltipTimer = $state<ReturnType<typeof setTimeout> | null>(null);

function showTooltip(id: string) {
	if (tooltipTimer) clearTimeout(tooltipTimer);
	tooltipTimer = setTimeout(() => {
		tooltipVisible = id;
	}, 300);
}
function hideTooltip() {
	if (tooltipTimer) clearTimeout(tooltipTimer);
	tooltipVisible = null;
}

$effect(() => {
	const t = setTimeout(() => {
		scanning = false;
	}, 2000);
	return () => clearTimeout(t);
});

/** Tier classification with layman descriptions. */
const tier = $derived.by(() => {
	const vram = hardwareState.vramTotalMb ?? 0;
	const ram = hardwareState.ramTotalMb ?? 0;
	if (vram >= 24000)
		return {
			name: "Workstation",
			desc: "All models at full quality",
			cssColor: "var(--wiz-role-brain)",
			tip: "Your GPU has 24GB+ VRAM. You can run the largest models and keep multiple loaded at once.",
		};
	if (vram >= 16000)
		return {
			name: "Prosumer",
			desc: "Large models, multi-model loading",
			cssColor: "var(--wiz-cyan)",
			tip: "16GB VRAM is excellent. You can run 9B parameter models and keep 2-3 loaded.",
		};
	if (vram >= 8000)
		return {
			name: "Mainstream",
			desc: "Most models, all features",
			cssColor: "var(--wiz-green)",
			tip: "8GB VRAM handles most models well. We'll pick sizes that leave room for voice and vision.",
		};
	if (vram >= 4000)
		return {
			name: "Entry",
			desc: "Smaller models, voice on-demand",
			cssColor: "var(--wiz-gold)",
			tip: "4GB VRAM can run smaller models. Voice loads on-demand to save memory.",
		};
	if (ram >= 8000)
		return {
			name: "CPU Mode",
			desc: "Slower but works",
			cssColor: "var(--wiz-coral)",
			tip: "No dedicated GPU detected. Models run on CPU — slower but fully functional.",
		};
	return {
		name: "Minimal",
		desc: "Micro-models only",
		cssColor: "var(--wiz-salmon)",
		tip: "Limited resources. We'll use the smallest available models.",
	};
});
</script>

<div class="hw-step">
	{#if scanning}
		<div class="scanning">
			<LoaderCircle size={32} class="animate-spin" style="color: var(--wiz-cyan);" />
			<h2 class="scan-title">Scanning your hardware...</h2>
			<p class="scan-sub">Checking GPU, CPU, RAM, and disk space</p>
		</div>
	{:else}
		<h2 class="title">Hardware Detected</h2>

		<!-- Tier badge -->
		<div class="tier-badge" role="group" aria-label="Hardware tier" style="border-color: {tier.cssColor}; color: {tier.cssColor};"
			onmouseenter={() => showTooltip("tier")}
			onmouseleave={hideTooltip}>
			<span class="tier-name">{tier.name}</span>
			<span class="tier-desc">{tier.desc}</span>
			{#if tooltipVisible === "tier"}
				<div class="tooltip">{tier.tip}</div>
			{/if}
		</div>

		<!-- Metrics -->
		<div class="metrics">
			{#if hardwareState.gpuName}
				<div class="metric" role="group"
					onmouseenter={() => showTooltip("gpu")}
					onmouseleave={hideTooltip}>
					<Monitor size={18} />
					<span class="ml">GPU</span>
					<span class="mv">{hardwareState.gpuName}</span>
					{#if hardwareState.vramTotalMb}<span class="mt">{formatMb(hardwareState.vramTotalMb)} VRAM</span>{/if}
					<Info size={14} class="info-icon" />
					{#if tooltipVisible === "gpu"}
						<div class="tooltip">Your graphics card. AI models run on GPU for fast inference. More VRAM = bigger models.</div>
					{/if}
				</div>
			{/if}

			{#if hardwareState.vramTotalMb}
				<div class="metric" role="group"
					onmouseenter={() => showTooltip("vram")}
					onmouseleave={hideTooltip}>
					<Zap size={18} />
					<span class="ml">VRAM</span>
					<span class="mv">{formatMb(hardwareState.vramFreeMb ?? 0)} free / {formatMb(hardwareState.vramTotalMb)}</span>
					<div class="vram-bar">
						<div class="vram-fill" style="width:{Math.min(100, ((hardwareState.vramUsedMb) / hardwareState.vramTotalMb) * 100)}%;background:{hardwareState.vramColor};"></div>
					</div>
					<Info size={14} class="info-icon" />
					{#if tooltipVisible === "vram"}
						<div class="tooltip">Video RAM — dedicated GPU memory. Each AI model uses some. Green = room. Yellow = tight. Red = full.</div>
					{/if}
				</div>
			{/if}

			{#if hardwareState.cpuName}
				<div class="metric" role="group"
					onmouseenter={() => showTooltip("cpu")}
					onmouseleave={hideTooltip}>
					<Cpu size={18} />
					<span class="ml">CPU</span>
					<span class="mv">{hardwareState.cpuName}</span>
					{#if hardwareState.cpuCores}<span class="mt">{hardwareState.cpuCores} cores</span>{/if}
					<Info size={14} class="info-icon" />
					{#if tooltipVisible === "cpu"}
						<div class="tooltip">Your processor. Fallback when GPU is full. Models run ~5-10x slower on CPU.</div>
					{/if}
				</div>
			{/if}

			{#if hardwareState.ramTotalMb}
				<div class="metric" role="group"
					onmouseenter={() => showTooltip("ram")}
					onmouseleave={hideTooltip}>
					<Zap size={18} />
					<span class="ml">RAM</span>
					<span class="mv">{formatMb(hardwareState.ramAvailableMb ?? 0)} free / {formatMb(hardwareState.ramTotalMb)}</span>
					<Info size={14} class="info-icon" />
					{#if tooltipVisible === "ram"}
						<div class="tooltip">System memory. Used for loading model files before GPU. 16GB+ ideal.</div>
					{/if}
				</div>
			{/if}

			{#if hardwareState.diskFreeMb}
				<div class="metric" role="group"
					onmouseenter={() => showTooltip("disk")}
					onmouseleave={hideTooltip}>
					<HardDrive size={18} />
					<span class="ml">Disk</span>
					<span class="mv">{formatMb(hardwareState.diskFreeMb)} free</span>
					<Info size={14} class="info-icon" />
					{#if tooltipVisible === "disk"}
						<div class="tooltip">Free storage. AI models are 1-10 GB each. Need at least 5GB for recommended setup.</div>
					{/if}
				</div>
			{/if}
		</div>

		{#if !hardwareState.hasGpu}
			<div class="warn">
				<strong>No GPU detected.</strong> Models run on CPU — slower but fully functional.
			</div>
		{/if}

		<!-- What happens next -->
		<div class="next-info">
			<span>Next: I'll recommend AI models sized for your <strong style="color:{tier.cssColor}">{tier.name}</strong> hardware.</span>
		</div>

		<button class="btn-continue" onclick={onContinue} disabled={!continueEnabled}
			aria-label="Continue to model selection">
			<Check size={14} /> Looks Good — Continue <ArrowRight size={14} />
		</button>
	{/if}
</div>

<style>
	.hw-step { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; padding: 2rem; text-align: center; }
	.scanning { display: flex; flex-direction: column; align-items: center; gap: 1rem; min-height: 40vh; justify-content: center; }
	.scan-title { font-size: 1.25rem; font-weight: 700; color: var(--wiz-text); margin: 0; }
	.scan-sub { font-size: var(--wiz-text-sm); color: var(--wiz-text-muted); margin: 0; }
	.title { font-size: 1.25rem; font-weight: 800; color: var(--wiz-text); margin: 0; }

	/* Tier badge */
	.tier-badge {
		display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
		padding: 0.75rem 1.5rem; border-radius: var(--wiz-radius-lg); border: 2px solid;
		background: var(--wiz-card); position: relative; cursor: help;
	}
	.tier-name { font-size: 1.125rem; font-weight: 800; }
	.tier-desc { font-size: var(--wiz-text-sm); color: var(--wiz-text-sub); }

	/* Metrics */
	.metrics { display: flex; flex-direction: column; gap: 0.5rem; width: 100%; max-width: 28rem; text-align: left; }
	.metric {
		display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem;
		border-radius: var(--wiz-radius-md); background: var(--wiz-card);
		border: 1px solid var(--wiz-border); color: var(--wiz-text-sub);
		position: relative; cursor: help; transition: border-color var(--wiz-duration-fast);
	}
	.metric:hover { border-color: oklch(0.63 0.08 173 / 0.35); }
	.ml { font-size: var(--wiz-text-sm); font-weight: 700; color: var(--wiz-text-muted); width: 3.5rem; }
	.mv { flex: 1; font-size: var(--wiz-text-sm); color: var(--wiz-text); }
	.mt {
		font-size: var(--wiz-text-sm); padding: 0.125rem 0.5rem; border-radius: var(--wiz-radius-sm);
		background: var(--wiz-fill-cyan); color: var(--wiz-cyan);
	}

	/* VRAM bar */
	.vram-bar { width: 4rem; height: 0.375rem; border-radius: var(--wiz-radius-full); background: var(--wiz-void-800); overflow: hidden; }
	.vram-fill { height: 100%; border-radius: var(--wiz-radius-full); transition: width var(--wiz-duration-normal); }

	/* Info icon */
	:global(.info-icon) { color: var(--wiz-void-500); flex-shrink: 0; }

	/* Warning */
	.warn {
		font-size: var(--wiz-text-sm); color: var(--wiz-coral);
		background: var(--wiz-fill-ember); border: 1px solid var(--wiz-ember-600);
		border-radius: var(--wiz-radius-md); padding: 0.75rem; max-width: 28rem; text-align: left;
	}
	.warn strong { color: var(--wiz-salmon); }

	/* Next info */
	.next-info { font-size: var(--wiz-text-sm); color: var(--wiz-text-sub); max-width: 28rem; }

	/* CTA */
	.btn-continue {
		display: inline-flex; align-items: center; gap: 0.375rem;
		padding: 0.625rem 1.75rem; border-radius: var(--wiz-radius-lg); border: none;
		background: var(--wiz-cyan); color: var(--wiz-void-950);
		font-size: 0.9375rem; font-weight: 800; cursor: pointer;
		box-shadow: 0 0 1.25rem var(--wiz-glow-cyan);
		transition: all var(--wiz-duration-fast);
	}
	.btn-continue:hover { filter: brightness(1.15); box-shadow: 0 0 2rem var(--wiz-glow-cyan); }
	.btn-continue:disabled { opacity: 0.4; cursor: not-allowed; }

	/* Tooltip */
	.tooltip {
		position: absolute; z-index: var(--wiz-z-tooltip);
		bottom: calc(100% + 0.5rem); left: 50%; transform: translateX(-50%);
		white-space: normal; max-width: 20rem; padding: 0.5rem 0.75rem;
		border-radius: var(--wiz-radius-md); background: var(--wiz-overlay);
		border: 1px solid var(--wiz-border-strong); color: var(--wiz-text);
		font-size: var(--wiz-text-sm); line-height: 1.4; box-shadow: var(--wiz-shadow-lg);
		pointer-events: none; animation: fade-in 100ms ease-out; text-align: left;
	}
	@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
</style>
