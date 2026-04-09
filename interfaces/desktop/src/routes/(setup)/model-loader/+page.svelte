<!--
  @file Welcome — First page of setup wizard
  @route /model-loader
  @domain models

  Clyffy mascot greeting. Hardware auto-detect. Background image from layout.
  Two paths: Recommended (auto) or Advanced (manual).
  Both set up TTS, STT, STS — symlink models to userdata.
  ALL ColdLight components. Fluid clamp. WAI-ARIA APG.
-->
<script lang="ts">
import { Cpu, HardDrive, Monitor, Sparkles, Zap } from "lucide-svelte";
import { goto } from "$app/navigation";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import {
	fetchRecommendations,
	startHardwareScan,
} from "$lib/domains/app/models/features/setup-wizard/index.js";
import { formatMb, hardwareState } from "$lib/domains/app/models/index.js";

let phase = $state<"welcome" | "scanning" | "detected">("welcome");
let scanError = $state<string | null>(null);

const tier = $derived.by(() => {
	const vram = hardwareState.vramTotalMb ?? 0;
	if (vram >= 24000)
		return {
			name: "Workstation",
			desc: "All models at full quality",
			color: "var(--accent-purple-main)",
		};
	if (vram >= 16000)
		return {
			name: "Prosumer",
			desc: "Large models, multi-model",
			color: "var(--accent-cyan-main)",
		};
	if (vram >= 8000)
		return {
			name: "Mainstream",
			desc: "Most models, all features",
			color: "var(--accent-green-main)",
		};
	if (vram >= 4000)
		return {
			name: "Entry",
			desc: "Smaller models, voice on-demand",
			color: "var(--accent-gold-main)",
		};
	if ((hardwareState.ramTotalMb ?? 0) >= 8000)
		return { name: "CPU Mode", desc: "Slower but works", color: "var(--accent-coral-main)" };
	return { name: "Minimal", desc: "Micro-models only", color: "var(--accent-salmon-main)" };
});

async function handleStart(): Promise<void> {
	phase = "scanning";
	scanError = null;
	try {
		await startHardwareScan();
		await fetchRecommendations();
		phase = "detected";
	} catch (e) {
		scanError = e instanceof Error ? e.message : String(e);
		phase = "detected";
	}
}
</script>

<div class="welcome-page" role="main" aria-label="Clyffy Setup Wizard">
	{#if phase === "welcome"}
		<img src="/imgs/mascot/clyffy-anim-wobble.png" alt="Clyffy mascot waving" class="mascot" />

		<Heading level={2} size="xl">Hey! I'm Clyffy.</Heading>
		<Text size="base" color="secondary">I'll help you set up your AI models. It only takes a minute.</Text>

		{#if hardwareState.gpuName || hardwareState.cpuName}
			<Card preset="glass">
				<div class="hw-list" role="list" aria-label="Detected hardware">
					{#if hardwareState.gpuName}
						<div class="hw-row" role="listitem">
							<Monitor size={16} aria-hidden="true" />
							<Text size="xs" weight="bold" color="muted" class="hw-label">GPU</Text>
							<Text size="sm">{hardwareState.gpuName}</Text>
							{#if hardwareState.vramTotalMb}
								<Badge preset="glass">{formatMb(hardwareState.vramTotalMb)} VRAM</Badge>
							{/if}
						</div>
					{/if}
					{#if hardwareState.cpuName}
						<div class="hw-row" role="listitem">
							<Cpu size={16} aria-hidden="true" />
							<Text size="xs" weight="bold" color="muted" class="hw-label">CPU</Text>
							<Text size="sm">{hardwareState.cpuName}</Text>
						</div>
					{/if}
					{#if hardwareState.ramTotalMb}
						<div class="hw-row" role="listitem">
							<Zap size={16} aria-hidden="true" />
							<Text size="xs" weight="bold" color="muted" class="hw-label">RAM</Text>
							<Text size="sm">{formatMb(hardwareState.ramTotalMb)}</Text>
						</div>
					{/if}
					{#if hardwareState.diskFreeMb}
						<div class="hw-row" role="listitem">
							<HardDrive size={16} aria-hidden="true" />
							<Text size="xs" weight="bold" color="muted" class="hw-label">Disk</Text>
							<Text size="sm">{formatMb(hardwareState.diskFreeMb)} free</Text>
						</div>
					{/if}
				</div>
			</Card>
		{/if}

		<Text size="sm" color="muted">I'll recommend the best models for your hardware.</Text>

		<Button preset="primary" size="lg" onclick={handleStart} aria-label="Start hardware scan and model setup">
			<Sparkles size={18} aria-hidden="true" />
			Let's Go
		</Button>

	{:else if phase === "scanning"}
		<img src="/imgs/mascot/clyffyloading.gif" alt="Clyffy scanning your hardware" class="mascot-loading" />
		<Heading level={2} size="lg">Scanning your hardware...</Heading>
		<Text size="sm" color="muted">Checking GPU, CPU, RAM, and disk space</Text>
		<Spinner size="md" />

	{:else if phase === "detected"}
		<img src="/imgs/mascot/clyffy-anim-blinking.png" alt="Clyffy ready" class="mascot" />

		<Heading level={2} size="lg">Hardware Detected</Heading>

		<div class="tier-badge" style="border-color: {tier.color}; color: {tier.color};" role="status" aria-label="Hardware tier: {tier.name}">
			<span class="tier-name">{tier.name}</span>
			<Text size="sm" color="secondary">{tier.desc}</Text>
		</div>

		{#if scanError}
			<Card preset="flat">
				<div class="error-content" role="alert">
					<Text size="sm" color="danger">{scanError}</Text>
					<Button preset="secondary" size="sm" onclick={handleStart}>Retry Scan</Button>
				</div>
			</Card>
		{/if}

		<Text size="sm" color="secondary">Choose how to set up your AI:</Text>

		<div class="choice-row" role="group" aria-label="Setup mode selection">
			<button class="choice-card choice-default" onclick={() => goto("/model-loader/models")} aria-label="Recommended setup — auto-configure all models">
				<Text size="base" weight="bold">Recommended Setup</Text>
				<Text size="sm" color="muted">
					Auto-configure brain, voice, and search models for your
					<strong style="color: {tier.color};">{tier.name}</strong> hardware. One click.
				</Text>
			</button>
			<button class="choice-card choice-advanced" onclick={() => goto("/model-loader/browse")} aria-label="Advanced setup — browse and pick models manually">
				<Text size="base" weight="bold">Advanced Setup</Text>
				<Text size="sm" color="muted">
					Browse models, pick each slot manually, import from disk.
				</Text>
			</button>
		</div>

		<Text size="xs" color="muted">Both options set up TTS, STT, and all voice models. You can change anything later.</Text>
	{/if}
</div>

<style>
	.welcome-page {
		display: flex; flex-direction: column; align-items: center; justify-content: center;
		gap: clamp(0.75rem, 2vw, 1.5rem);
		min-height: 80vh; text-align: center;
		padding: clamp(1rem, 3vw, 2.5rem);
	}
	.mascot {
		width: clamp(4rem, 8vw, 6rem); height: clamp(4rem, 8vw, 6rem); object-fit: contain;
		filter: drop-shadow(var(--wizard-shadow-glow-lg));
		animation: float 3s ease-in-out infinite;
	}
	.mascot-loading { width: clamp(3rem, 6vw, 5rem); height: clamp(3rem, 6vw, 5rem); object-fit: contain; }
	@keyframes float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-0.5rem); }
	}

	.hw-list {
		display: flex; flex-direction: column; gap: 0.5rem;
		width: 100%; max-width: 22rem;
	}
	.hw-row { display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); }

	.tier-badge {
		display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
		padding: clamp(0.5rem, 1.5vw, 0.75rem) clamp(1rem, 3vw, 1.5rem);
		border-radius: var(--radius-lg);
		border: var(--border-width-medium) solid; background: var(--surface-overlay);
	}
	.tier-name { font-size: clamp(0.875rem, 2vw, 1.125rem); font-weight: 800; }

	.error-content {
		display: flex; align-items: center; gap: 0.75rem;
	}

	.choice-row {
		display: flex; gap: clamp(0.5rem, 2vw, 1rem);
		width: 100%; max-width: 32rem;
	}
	.choice-card {
		flex: 1; display: flex; flex-direction: column; gap: 0.5rem;
		padding: clamp(0.75rem, 2vw, 1.25rem);
		border-radius: var(--radius-lg);
		border: var(--border-width-medium) solid var(--border-subtle);
		background: var(--surface-raised); cursor: pointer; text-align: left;
		transition: border-color var(--motion-duration-fast), box-shadow var(--motion-duration-fast);
	}
	.choice-card:hover { border-color: var(--accent-cyan-main); }
	.choice-default:hover { box-shadow: var(--wizard-shadow-glow-md); }
	.choice-advanced:hover { box-shadow: var(--wizard-shadow-glow-sm); }
</style>
