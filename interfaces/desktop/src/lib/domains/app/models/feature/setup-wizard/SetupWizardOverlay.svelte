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
import { invoke } from "@tauri-apps/api/core";
import { KeyRound, Lock, Settings, Sparkles, X } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo, logWarn } from "$lib/sys/logger.js";
import { hardwareState } from "../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../data-access/models.state.svelte.js";
import { formatMb } from "../../util/models.types.js";
import BrainCard from "../components/BrainCard.svelte";
import MemoryCard from "../components/MemoryCard.svelte";
import VisionCard from "../components/VisionCard.svelte";
import VoiceCard from "../components/VoiceCard.svelte";
import HfTokenModal from "./components/HfTokenModal.svelte";
import VramBar from "./components/VramBar.svelte";
import { wizardState } from "./wizard.state.svelte.js";
import type { WizardCopy } from "./wizard.types.js";

// ── State ───────────────────────────────────────────────
type View = "welcome" | "config";
let view = $state<View>("welcome");
let copy = $state<WizardCopy | null>(null);
let copyError = $state<string | null>(null);
let hfHasToken = $state(false);
let showHfModal = $state(false);
let loadingPreset = $state(false);

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
		// Chain: subscribe to push events FIRST, then trigger refresh.
		// refresh() calls scanModels() which makes Rust emit_status.
		// The listener must be ready before that event fires.
		void (async () => {
			await modelsState.startStatusListener();
			logInfo("wizard.overlay", "Model status listener ready — triggering refresh");
			await modelsState.refresh();
			logInfo(
				"wizard.overlay",
				`Models populated: ${modelsState.models.length} models, ${modelsState.slots.length} slots`,
			);
		})();
		if (!copy) {
			logInfo("wizard.overlay", "Loading wizard copy from Rust SSOT...");
			void loadCopy();
			void checkHfToken();
		}
		return () => {
			modelsState.stopStatusListener();
		};
	}
});

async function loadCopy(): Promise<void> {
	try {
		copy = await invoke<WizardCopy>("get_wizard_copy");
		logInfo("wizard.overlay", "Wizard copy loaded");
	} catch (e) {
		copyError = e instanceof Error ? e.message : String(e);
		logError("wizard.overlay", `Failed to load wizard copy: ${copyError}`);
	}
}

async function checkHfToken(): Promise<void> {
	try {
		hfHasToken = await invoke<boolean>("has_hf_token");
	} catch (e) {
		logWarn("wizard.overlay", `HF token check failed: ${e}`);
	}
}

// ── Jesse Config shortcut ───────────────────────────────
async function applyJesseConfig(): Promise<void> {
	loadingPreset = true;
	logInfo("wizard.overlay", "Applying Jesse Config preset...");
	try {
		const result = await commands.autoConfigure();
		if (result.status === "error") throw new Error(result.error);
		const configJson = result.data;
		const config = JSON.parse(configJson);
		wizardState.setRecommendations(config);
		logInfo(
			"wizard.overlay",
			`Jesse Config applied — ${config.recommendations?.length ?? 0} recommendations`,
		);
		view = "config";
	} catch (e) {
		logError("wizard.overlay", `Jesse Config failed: ${e}`);
	} finally {
		loadingPreset = false;
	}
}

// ── Actions ─────────────────────────────────────────────
function handleLetsGo(): void {
	view = "config";
}

async function handleDone(): Promise<void> {
	logInfo("wizard.overlay", "Config complete — closing wizard");
	try {
		const r1 = await commands.markSetupComplete();
		if (r1.status === "error") logWarn("wizard.overlay", `markSetupComplete: ${r1.error}`);
		const r2 = await commands.completeModelSetup();
		if (r2.status === "error") logWarn("wizard.overlay", `completeModelSetup: ${r2.error}`);
	} catch (e) {
		logWarn("wizard.overlay", `Post-setup finalization: ${e}`);
	}
	wizardState.close();
}
</script>

{#if wizardState.isOpen}
<div class="wizard-overlay">
	<div class="wizard-backdrop"></div>

	<div class="wizard-chrome">
		<!-- Top bar -->
		<div class="wizard-topbar">
			<div class="topbar-left">
				{#if view === "config"}
					<Button preset="button-ghost" size="sm" onclick={() => (view = "welcome")}>
						← Back
					</Button>
				{/if}
				<Text size="sm" weight="bold" class="topbar-title">
					{view === "welcome" ? "DevPulse Setup" : "Model Configuration"}
				</Text>
			</div>

			<div class="topbar-right">
				<button class="hf-pill" onclick={() => (showHfModal = true)}>
					{#if hfHasToken}
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
			{#if copyError}
				<div class="state-msg">
					<Text size="sm">Failed to load: {copyError}</Text>
					<Button preset="button-secondary" size="sm" onclick={loadCopy}>Retry</Button>
				</div>

			{:else if view === "welcome"}
				<!-- ═══ WELCOME VIEW ═══ -->
				<div class="welcome">
					<img src="/imgs/mascot/clyffy-df-icon-interaction1.png" alt="Clyffy" class="mascot" />
					<Heading level={2} size="xl">Welcome to DevPulse</Heading>
					<Text size="sm" color="secondary">
						Let's get your AI models configured. Pick a preset or customize each slot.
					</Text>

					<!-- Hardware snapshot -->
					{#if hardwareState.hasSnapshot}
						<div class="hw-bar">
							<Text size="xs" color="muted">
								{gpuName} ({formatMb(vramMb)} VRAM) · {cpuName} · {formatMb(ramMb)} RAM · {tier} · {modelCount} models on disk
							</Text>
						</div>
					{/if}

					<div class="welcome-actions">
						<Button preset="button-primary" size="lg" onclick={handleLetsGo}>
							<Sparkles size={16} />
							Let's Go
						</Button>
						<Button preset="button-secondary" size="lg" onclick={applyJesseConfig} disabled={loadingPreset}>
							{#if loadingPreset}
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
						<Button preset="button-primary" size="lg" onclick={handleDone}>
							Done — Start Using DevPulse
						</Button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

{#if copy}
	<HfTokenModal
		open={showHfModal}
		copy={copy.hf_token}
		initiallyHasToken={hfHasToken}
		onClose={() => (showHfModal = false)}
		onSaved={(has) => { hfHasToken = has; showHfModal = false; }}
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
