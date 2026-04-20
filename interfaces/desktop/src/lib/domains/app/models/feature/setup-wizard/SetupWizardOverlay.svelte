<!--
  @file SetupWizardOverlay — Model configuration overlay.
  @domain models

  Mounted in `layouts/app/Frame.svelte` as a sibling of `SwapOverlay`.
  wizardState.isOpen controls visibility.

  Two views:
    1. Welcome — mascot greeting, "Let's Go" + "Jesse Config" buttons
    2. Config  — all 4 model cards in a grid, VramBar, hardware summary

  ColdLight teal glass. Rust SSOT for all data.
-->
<script lang="ts">
import { KeyRound, Lock, Settings, Sparkles, X } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { hardwareState } from "../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../data-access/models.state.svelte.js";
import { setupWizardOverlayState } from "../../data-access/setup-wizard-overlay.state.svelte.js";
import { formatMb } from "../../util/models.types.js";
import BrainCard from "../components/BrainCard.svelte";
import MemoryCard from "../components/MemoryCard.svelte";
import VisionCard from "../components/VisionCard.svelte";
import VoiceCard from "../components/VoiceCard.svelte";
import HfTokenModal from "./components/HfTokenModal.svelte";
import VramBar from "./components/VramBar.svelte";
import { wizardState } from "./wizard.state.svelte.js";

const overlayState = setupWizardOverlayState;

async function handleApplyJesseConfig(): Promise<void> {
	const config = await overlayState.applyJesseConfig();
	if (config) {
		wizardState.setRecommendations(config);
	}
}

async function handleApplyAndLaunch(): Promise<void> {
	await overlayState.applyAndLaunch(() => wizardState.close());
}

// ── Hardware summary (read-only runes) ──────────────────
const gpuName = $derived(hardwareState.gpuName ?? "No GPU");
const vramMb = $derived(hardwareState.vramTotalMb);
const cpuName = $derived(hardwareState.cpuName ?? "Unknown CPU");
const ramMb = $derived(hardwareState.ramTotalMb);
const tier = $derived(hardwareState.tier);
const modelCount = $derived(modelsState.models.length);
const assignedCount = $derived(modelsState.slots.filter((s) => s.assigned_model_id).length);

// ── Init ────────────────────────────────────────────────
$effect(() => {
	if (wizardState.isOpen) {
		void overlayState.start();
		return () => {
			overlayState.stop();
		};
	}
});
</script>

{#if wizardState.isOpen}
<div class="wizard-overlay">
	<div class="wizard-backdrop"></div>

	<div class="wizard-chrome">
		<!-- Top bar -->
		<div class="wizard-topbar">
			<div class="topbar-left">
				{#if overlayState.view === "config"}
					<Button preset="button-ghost" size="sm" onclick={() => overlayState.showWelcome()}>
						← Back
					</Button>
				{/if}
				<Text size="sm" weight="bold" class="topbar-title">
					{overlayState.view === "welcome" ? "DevPulse Setup" : "Model Configuration"}
				</Text>
			</div>

			<div class="topbar-right">
				<button class="hf-pill" onclick={() => overlayState.openHfModal()}>
					{#if overlayState.hfHasToken}
						<Lock size={12} />
						<Text size="xs">HF Token</Text>
						<Badge tone="positive" size="sm">Set</Badge>
					{:else}
						<KeyRound size={12} />
						<Text size="xs">HF Token</Text>
					{/if}
				</button>
				<Button preset="button-ghost" size="sm" onclick={() => wizardState.close()} aria-label="Close">
					<X size={16} />
				</Button>
			</div>
		</div>

		<!-- Content -->
		<div class="wizard-content">
			{#if overlayState.copyError}
				<div class="state-msg">
					<Text size="sm">Failed to load: {overlayState.copyError}</Text>
					<Button preset="button-secondary" size="sm" onclick={() => overlayState.retryCopy()}>Retry</Button>
				</div>

			{:else if overlayState.view === "welcome"}
				<!-- ═══ WELCOME VIEW ═══ -->
				<div class="welcome">
					<img src="/imgs/mascot/clyffy-df-icon-interaction1.png" alt="Clyffy" class="mascot" />
					<Heading level={2} size="xl">Welcome to DevPulse</Heading>
					<Text size="sm" color="secondary">
						Let's get your AI models configured. Pick a preset or customize each slot.
					</Text>

					<!-- Profile -->
					<div class="profile-form">
						<div class="profile-field">
							<label for="profile-name">
								<Text size="xs" color="secondary">Your Name</Text>
							</label>
							<input
								id="profile-name"
								type="text"
								placeholder="What should Clyffy call you?"
								bind:value={overlayState.profileName}
								class="profile-input"
							/>
						</div>
						<div class="profile-field">
							<label for="profile-email">
								<Text size="xs" color="secondary">Email (optional)</Text>
							</label>
							<input
								id="profile-email"
								type="email"
								placeholder="you@example.com"
								bind:value={overlayState.profileEmail}
								class="profile-input"
							/>
						</div>
						<div class="profile-field">
							<Text size="xs" color="secondary">Experience</Text>
							<div class="level-row">
								<button
									class="level-btn"
									class:level-active={overlayState.profileLevel === 1}
									onclick={() => overlayState.setProfileLevel(1)}
								>Beginner</button>
								<button
									class="level-btn"
									class:level-active={overlayState.profileLevel === 2}
									onclick={() => overlayState.setProfileLevel(2)}
								>Intermediate</button>
								<button
									class="level-btn"
									class:level-active={overlayState.profileLevel === 3}
									onclick={() => overlayState.setProfileLevel(3)}
								>Advanced</button>
							</div>
						</div>
					</div>

					<!-- Hardware snapshot -->
					{#if hardwareState.hasSnapshot}
						<div class="hw-bar">
							<Text size="xs" color="muted">
								{gpuName} ({formatMb(vramMb)} VRAM) · {cpuName} · {formatMb(ramMb)} RAM · {tier} · {modelCount} models on disk
							</Text>
						</div>
					{/if}

					<div class="welcome-actions">
						<Button preset="button-primary" size="lg" onclick={() => overlayState.showConfig()} disabled={!overlayState.canContinue}>
							<Sparkles size={16} />
							Let's Go
						</Button>
						<Button preset="button-secondary" size="lg" onclick={handleApplyJesseConfig} disabled={overlayState.loadingPreset}>
							{#if overlayState.loadingPreset}
								<Spinner size="xs" />
							{:else}
								<Settings size={16} />
							{/if}
							Jesse Config
						</Button>
					</div>

					<button class="skip-link" onclick={() => wizardState.close()}>
						Skip setup — I'll configure later
					</button>
				</div>

			{:else}
				<!-- ═══ CONFIG VIEW ═══ -->
				<div class="config">
					<!-- Hardware summary bar -->
					<div class="hw-bar">
						<Text size="xs" color="muted">
							{gpuName} ({formatMb(vramMb)} VRAM) · {tier} · {assignedCount} of {modelsState.slots.length} slots assigned
						</Text>
					</div>

					<!-- VRAM bar -->
					<VramBar />

					<!-- 4 model cards in a 2x2 grid -->
					<div class="card-grid">
						<BrainCard />
						<VisionCard />
						<VoiceCard />
						<MemoryCard />
					</div>

					<!-- Footer -->
					<div class="config-footer">
						<Button preset="button-primary" size="lg" onclick={handleApplyAndLaunch} disabled={overlayState.applying}>
							{#if overlayState.applying}
								<Spinner size="xs" />
								Applying...
							{:else}
								Apply and Launch Clyffy
							{/if}
						</Button>
					</div>

					{#if overlayState.error}
						<div class="state-msg">
							<Text size="sm">{overlayState.error}</Text>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

{#if overlayState.copy}
	<HfTokenModal
		open={overlayState.showHfModal}
		copy={overlayState.copy.hf_token}
		initiallyHasToken={overlayState.hfHasToken}
		onClose={() => overlayState.closeHfModal()}
		onSaved={(has) => overlayState.handleHfSaved(has)}
	/>
{/if}
{/if}

<style>
	.wizard-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		flex-direction: column;
	}

	.wizard-backdrop {
		position: absolute;
		inset: 0;
		background: oklch(0.06 0.01 220 / 0.92);
		backdrop-filter: blur(1rem);
	}

	.wizard-chrome {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.wizard-topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: clamp(0.5rem, 1.5vw, 0.875rem) clamp(0.75rem, 2vw, 1.5rem);
		border-bottom: 1px solid color-mix(in oklch, var(--accent-teal-main) 10%, var(--border-soft));
		flex-shrink: 0;
		background: color-mix(in oklch, var(--surface-base) 60%, transparent);
		backdrop-filter: blur(0.75rem);
	}

	.topbar-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	:global(.topbar-title) {
		color: var(--accent-teal-main);
	}

	.topbar-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.hf-pill {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		border-radius: 999px;
		border: 1px solid var(--border-soft);
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		transition: all 150ms ease-out;
	}
	.hf-pill:hover {
		border-color: var(--accent-teal-main);
		color: var(--text-secondary);
	}

	.wizard-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		overflow-y: auto;
		padding: 1.5rem;
	}

	.state-msg {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 3rem;
	}

	/* ── Welcome ──────────────────────────────── */

	.welcome {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(1rem, 2.5vw, 1.75rem);
		max-width: clamp(20rem, 60vw, 36rem);
		text-align: center;
		padding-top: clamp(1.5rem, 4vh, 3rem);
	}

	.mascot {
		width: clamp(4rem, 8vw, 6rem);
		height: clamp(4rem, 8vw, 6rem);
		object-fit: contain;
		filter: drop-shadow(0 0 2rem color-mix(in oklch, var(--accent-teal-main) 50%, transparent));
		animation: mascot-float 4s ease-in-out infinite;
	}

	@keyframes mascot-float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-0.375rem); }
	}

	.hw-bar {
		width: 100%;
		padding: clamp(0.5rem, 1vw, 0.75rem) clamp(0.75rem, 2vw, 1.25rem);
		border-radius: 0.75rem;
		background: var(--glass-deep);
		border: 1px solid color-mix(in oklch, var(--accent-teal-main) 15%, var(--border-soft));
		backdrop-filter: blur(0.5rem);
		text-align: center;
		box-shadow:
			0 0 1rem color-mix(in oklch, var(--accent-teal-main) 8%, transparent),
			inset 0 1px 0 color-mix(in oklch, var(--accent-teal-main) 5%, transparent);
	}

	.welcome-actions {
		display: flex;
		gap: clamp(0.5rem, 1.5vw, 1rem);
		margin-top: clamp(0.5rem, 1.5vh, 1rem);
	}

	/* ── Profile form ────────────────────────── */

	.profile-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		max-width: 24rem;
	}

	.profile-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.profile-input {
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid var(--border-soft);
		background: var(--glass-deep);
		color: var(--text-primary);
		font-size: 0.875rem;
		outline: none;
		transition: border-color 150ms ease-out;
	}
	.profile-input:focus {
		border-color: var(--accent-teal-main);
	}
	.profile-input::placeholder {
		color: var(--text-muted);
	}

	.level-row {
		display: flex;
		gap: 0.375rem;
	}

	.level-btn {
		flex: 1;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid var(--border-soft);
		background: transparent;
		color: var(--text-muted);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 150ms ease-out;
	}
	.level-btn:hover {
		border-color: var(--accent-teal-main);
		color: var(--text-secondary);
	}
	.level-active {
		border-color: var(--accent-teal-main);
		background: color-mix(in oklch, var(--accent-teal-main) 15%, transparent);
		color: var(--accent-teal-main);
	}

	.skip-link {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 0.75rem;
		cursor: pointer;
		transition: color 200ms ease-out;
		margin-top: 0.5rem;
	}
	.skip-link:hover {
		color: var(--accent-teal-main);
	}

	/* ── Config ───────────────────────────────── */

	.config {
		display: flex;
		flex-direction: column;
		gap: clamp(0.75rem, 2vw, 1.25rem);
		width: 100%;
		max-width: clamp(36rem, 80vw, 64rem);
		padding: clamp(0.5rem, 1.5vw, 1rem);
	}

	.card-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: clamp(0.75rem, 2vw, 1.25rem);
	}

	/* Teal glow border on each card in the grid */
	.card-grid > :global(*) {
		border-radius: 0.75rem;
		border: 1px solid color-mix(in oklch, var(--accent-teal-main) 20%, var(--border-soft));
		box-shadow:
			0 0.25rem 1rem color-mix(in oklch, var(--accent-teal-main) 6%, transparent),
			0 0.0625rem 0.1875rem oklch(0 0 0 / 0.15);
		transition: border-color 200ms ease-out, box-shadow 200ms ease-out;
	}
	.card-grid > :global(*:hover) {
		border-color: color-mix(in oklch, var(--accent-teal-main) 35%, var(--border-soft));
		box-shadow:
			0 0.25rem 1.5rem color-mix(in oklch, var(--accent-teal-main) 12%, transparent),
			0 0.0625rem 0.25rem oklch(0 0 0 / 0.2);
	}

	@media (max-width: 48rem) {
		.card-grid {
			grid-template-columns: 1fr;
		}
	}

	.config-footer {
		display: flex;
		justify-content: center;
		padding-top: clamp(0.5rem, 1.5vh, 1rem);
	}
</style>
