<!--
  @file Welcome — First page of setup wizard
  @route /model-loader
  @domain models

  Rust SSOT for ALL copy. Frontend renders ColdLight components.
  WizardCopy fetched from get_wizard_copy command (TOML defaults + .userdata override).
  TierDisplay fetched from get_tier_display command (semantic role → SD5 token via TIER_TOKENS).
  ColdLight base components throughout. Fluid clamp. WAI-ARIA APG.
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
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
	TIER_TOKENS,
	type TierDisplay,
	type WizardCopy,
} from "$lib/domains/app/models/features/setup-wizard/index.js";
import { formatMb, hardwareState } from "$lib/domains/app/models/index.js";

let phase = $state<"welcome" | "scanning" | "detected">("welcome");
let scanError = $state<string | null>(null);
let copy = $state<WizardCopy | null>(null);
let copyError = $state<string | null>(null);
let tier = $state<TierDisplay | null>(null);

// Fetch wizard copy from Rust on mount — single source of truth.
$effect(() => {
	(async () => {
		try {
			copy = await invoke<WizardCopy>("get_wizard_copy");
		} catch (e) {
			copyError = e instanceof Error ? e.message : String(e);
		}
	})();
});

const tierToken = $derived(tier ? TIER_TOKENS[tier.role] : null);
const nextStepLine = $derived(
	tier && copy ? copy.hardware.next_step_template.replace("{tier}", tier.name) : "",
);

async function handleStart(): Promise<void> {
	phase = "scanning";
	scanError = null;
	try {
		await startHardwareScan();
		await fetchRecommendations();
		// Fetch tier display from Rust after scan completes
		tier = await invoke<TierDisplay>("get_tier_display");
		phase = "detected";
	} catch (e) {
		scanError = e instanceof Error ? e.message : String(e);
		phase = "detected";
	}
}
</script>

<div class="welcome-page" role="main" aria-label="Clyffy Setup Wizard">
	{#if copyError}
		<Card preset="flat">
			<Text size="sm" color="danger">Failed to load wizard copy: {copyError}</Text>
		</Card>
	{:else if !copy}
		<Spinner size="md" />
		<Text size="sm" color="muted">Loading wizard...</Text>
	{:else if phase === "welcome"}
		<img src="/imgs/mascot/clyffy-anim-wobble.png" alt={copy.greeting.mascot_alt} class="mascot" />

		<Heading level={2} size="xl">{copy.greeting.title}</Heading>
		<Text size="base" color="secondary">{copy.greeting.subtitle}</Text>

		{#if hardwareState.gpuName || hardwareState.cpuName}
			<Card preset="glass">
				<div class="hw-list" role="list" aria-label="Detected hardware">
					{#if hardwareState.gpuName}
						<div class="hw-row" role="listitem" title={copy.hardware.gpu_tooltip}>
							<Monitor size={16} aria-hidden="true" />
							<Text size="xs" weight="bold" color="muted" class="hw-label">{copy.hardware.gpu_label}</Text>
							<Text size="sm">{hardwareState.gpuName}</Text>
							{#if hardwareState.vramTotalMb}
								<Badge preset="glass">{formatMb(hardwareState.vramTotalMb)} {copy.hardware.vram_label}</Badge>
							{/if}
						</div>
					{/if}
					{#if hardwareState.cpuName}
						<div class="hw-row" role="listitem" title={copy.hardware.cpu_tooltip}>
							<Cpu size={16} aria-hidden="true" />
							<Text size="xs" weight="bold" color="muted" class="hw-label">{copy.hardware.cpu_label}</Text>
							<Text size="sm">{hardwareState.cpuName}</Text>
						</div>
					{/if}
					{#if hardwareState.ramTotalMb}
						<div class="hw-row" role="listitem" title={copy.hardware.ram_tooltip}>
							<Zap size={16} aria-hidden="true" />
							<Text size="xs" weight="bold" color="muted" class="hw-label">{copy.hardware.ram_label}</Text>
							<Text size="sm">{formatMb(hardwareState.ramTotalMb)}</Text>
						</div>
					{/if}
					{#if hardwareState.diskFreeMb}
						<div class="hw-row" role="listitem" title={copy.hardware.disk_tooltip}>
							<HardDrive size={16} aria-hidden="true" />
							<Text size="xs" weight="bold" color="muted" class="hw-label">{copy.hardware.disk_label}</Text>
							<Text size="sm">{formatMb(hardwareState.diskFreeMb)} free</Text>
						</div>
					{/if}
				</div>
			</Card>
		{/if}

		<Text size="sm" color="muted">{copy.greeting.hint}</Text>

		<Button preset="primary" size="lg" onclick={handleStart} aria-label={copy.greeting.cta_aria}>
			<Sparkles size={18} aria-hidden="true" />
			{copy.greeting.cta_label}
		</Button>

	{:else if phase === "scanning"}
		<img src="/imgs/mascot/clyffyloading.gif" alt={copy.scanning.mascot_alt} class="mascot-loading" />
		<Heading level={2} size="lg">{copy.scanning.title}</Heading>
		<Text size="sm" color="muted">{copy.scanning.subtitle}</Text>
		<Spinner size="md" />

	{:else if phase === "detected" && tier && tierToken}
		<img src="/imgs/mascot/clyffy-anim-blinking.png" alt="Clyffy ready" class="mascot" />

		<Heading level={2} size="lg">{copy.hardware.title}</Heading>

		<div
			class="tier-badge"
			style="border-color: {tierToken.color}; color: {tierToken.color};"
			role="status"
			aria-label="Hardware tier: {tier.name}"
			title={tier.tooltip}
		>
			<span class="tier-name">{tier.name}</span>
			<Text size="sm" color="secondary">{tier.description}</Text>
		</div>

		{#if scanError}
			<Card preset="flat">
				<div class="error-content" role="alert">
					<Text size="sm" color="danger">{scanError}</Text>
					<Button preset="secondary" size="sm" onclick={handleStart}>{copy.models.error_retry_label}</Button>
				</div>
			</Card>
		{/if}

		{#if !hardwareState.hasGpu}
			<Card preset="flat">
				<div class="warn-content">
					<Text size="sm" weight="bold" color="warning">{copy.hardware.no_gpu_warning_title}</Text>
					<Text size="sm" color="muted">{copy.hardware.no_gpu_warning_detail}</Text>
				</div>
			</Card>
		{/if}

		<Text size="sm" color="secondary">
			{nextStepLine}
		</Text>

		<div class="choice-row" role="group" aria-label="Setup mode selection">
			<button
				class="choice-card choice-default"
				onclick={() => goto("/model-loader/models")}
				aria-label="Recommended setup — auto-configure all models"
			>
				<Text size="base" weight="bold">Recommended Setup</Text>
				<Text size="sm" color="muted">
					Auto-configure brain, voice, and search models for your
					<strong style="color: {tierToken.color};">{tier.name}</strong> hardware. One click.
				</Text>
			</button>
			<button
				class="choice-card choice-advanced"
				onclick={() => goto("/model-loader/browse")}
				aria-label="Advanced setup — browse and pick models manually"
			>
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
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: clamp(0.75rem, 2vw, 1.5rem);
		min-height: 80vh;
		text-align: center;
		padding: clamp(1rem, 3vw, 2.5rem);
	}
	.mascot {
		width: clamp(4rem, 8vw, 6rem);
		height: clamp(4rem, 8vw, 6rem);
		object-fit: contain;
		filter: drop-shadow(var(--wizard-shadow-glow-lg));
		animation: float 3s ease-in-out infinite;
	}
	.mascot-loading {
		width: clamp(3rem, 6vw, 5rem);
		height: clamp(3rem, 6vw, 5rem);
		object-fit: contain;
	}
	@keyframes float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-0.5rem); }
	}

	.hw-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		max-width: 22rem;
	}
	.hw-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-secondary);
		cursor: help;
	}

	.tier-badge {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: clamp(0.5rem, 1.5vw, 0.75rem) clamp(1rem, 3vw, 1.5rem);
		border-radius: var(--radius-lg);
		border: var(--border-width-medium) solid;
		background: var(--surface-overlay);
		cursor: help;
	}
	.tier-name {
		font-size: clamp(0.875rem, 2vw, 1.125rem);
		font-weight: 800;
	}

	.error-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.warn-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.choice-row {
		display: flex;
		gap: clamp(0.5rem, 2vw, 1rem);
		width: 100%;
		max-width: 32rem;
	}
	.choice-card {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: clamp(0.75rem, 2vw, 1.25rem);
		border-radius: var(--radius-lg);
		border: var(--border-width-medium) solid var(--border-subtle);
		background: var(--surface-raised);
		cursor: pointer;
		text-align: left;
		transition: border-color var(--motion-duration-fast), box-shadow var(--motion-duration-fast);
	}
	.choice-card:hover { border-color: var(--accent-cyan-main); }
	.choice-default:hover { box-shadow: var(--wizard-shadow-glow-md); }
	.choice-advanced:hover { box-shadow: var(--wizard-shadow-glow-sm); }
</style>
