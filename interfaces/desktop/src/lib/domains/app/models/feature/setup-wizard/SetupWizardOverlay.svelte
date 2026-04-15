<!--
	@file SetupWizardOverlay - first-run wizard mounted inside the app shell.
  @domain models

  This component REPLACES the old (setup)/model-loader/+page.svelte route
  that used to live at its own route group with its own opaque shell. The
  wizard is now a component mounted in `layouts/app/Frame.svelte` as a
	sibling of `SwapOverlay` - same app chrome, same data-layout="app", no
  parallel route tree, no opaque background hiding the circuit backdrop.

  Lifecycle:
  - `wizardState.isOpen` controls visibility. `platformState.init()` sets
    it to `true` when first-run is detected, or the user invokes it
    manually.
  - `wizardState.close()` dismisses the overlay without navigating.
	- The underlying (app) view stays rendered the whole time - closing the
    overlay returns the user to exactly where they were.

  Rust SSOT for ALL copy. Frontend renders ColdLight components.
  WizardCopy fetched from get_wizard_copy command.
  Hardware tier detected via startHardwareScan + fetchRecommendations.
  Preset picker populated by list_presets command so the owner can
  override the auto-detected default.

  Defensive rendering: every error path lands on a visible state.
  Never a blank screen.
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { Cpu, HardDrive, KeyRound, Lock, Monitor, Sparkles, X, Zap } from "lucide-svelte";
import { tick } from "svelte";
import { BackgroundScene } from "$lib/design/components/background-scene/index.js";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { DynamicBackground } from "$lib/design/components/dynamic-background/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import {
	fetchRecommendations,
	listAllPresets,
	selectPreset,
	startHardwareScan,
	type TierDisplay,
	type WizardCopy,
} from "$lib/domains/app/models/feature/setup-wizard/index.js";
import { wizardState } from "$lib/domains/app/models/feature/setup-wizard/wizard.state.svelte.js";
import {
	type AutoConfig,
	formatMb,
	type HardwareTier,
	hardwareState,
} from "$lib/domains/app/models/index.js";
import { LoadingContentCard } from "$lib/domains/clyffy/index.js";
import { commands } from "$lib/sys/generated/bindings.js";
import ClyffyTooltip from "./components/ClyffyTooltip.svelte";
import HfTokenModal from "./components/HfTokenModal.svelte";
import ClyfActivationStep from "./steps/ClyfActivationStep.svelte";
import CompletionStep from "./steps/CompletionStep.svelte";
import CustomizeStep from "./steps/CustomizeStep.svelte";
import ModelsStep from "./steps/ModelsStep.svelte";
import ProjectSetupStep from "./steps/ProjectSetupStep.svelte";
import SearchBrowseStep from "./steps/SearchBrowseStep.svelte";
import WelcomeStep from "./steps/WelcomeStep.svelte";

type Phase = "welcome" | "scanning" | "detected" | "error";

let phase = $state<Phase>("welcome");
let scanError = $state<string | null>(null);
let copy = $state<WizardCopy | null>(null);
let copyError = $state<string | null>(null);
let tier = $state<TierDisplay | null>(null);
let presets = $state<AutoConfig[]>([]);
let presetsError = $state<string | null>(null);
let switchingTier = $state<string | null>(null);

// HF token state is local to this overlay instance.
// The plaintext token is never stored in rune state or passed around the
// frontend - we only cache the has-token boolean so the header pill
// can reflect whether one is stored without an extra round-trip.
let hfTokenModalOpen = $state(false);
let hasHfTokenCached = $state(false);

async function refreshHasHfToken(): Promise<void> {
	try {
		const result = await commands.hasHfToken();
		if (result.status === "ok") {
			hasHfTokenCached = result.data;
		}
	} catch (e) {
		console.warn("hasHfToken check failed", e);
	}
}

function openHfTokenModal(): void {
	hfTokenModalOpen = true;
}
function closeHfTokenModal(): void {
	hfTokenModalOpen = false;
}
function handleHfTokenSaved(hasToken: boolean): void {
	hasHfTokenCached = hasToken;
}

const isOpen = $derived(wizardState.isOpen);

async function waitForWizardPaint(): Promise<void> {
	await tick();
	await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

// Fetch wizard copy from Rust the first time the overlay opens. Never
// fetch again unless copy failed - Rust is the source of truth and the
// file does not change at runtime.
$effect(() => {
	if (!isOpen || copy) return;
	(async () => {
		try {
			copy = await invoke<WizardCopy>("get_wizard_copy");
		} catch (e) {
			copyError = e instanceof Error ? e.message : String(e);
		}
	})();
});

// Refresh the HF token pill state every time the overlay opens - the
// kernel is the source of truth, not the frontend. A token could have
// been set via command-line or a previous session.
$effect(() => {
	if (!isOpen) return;
	refreshHasHfToken();
});

// Lock the background scroll while the overlay is open so the underlying
// (app) view doesn't scroll under the dim scrim.
$effect(() => {
	if (typeof document === "undefined") return;
	if (isOpen) {
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}
});

// Map a rust HardwareTier enum variant to the snake_case argument expected
// by the config_for_tier command.
function tierToArg(t: HardwareTier): string {
	switch (t) {
		case "Ultra":
			return "ultra";
		case "High":
			return "high";
		case "JessePrimary":
			return "jesse_primary";
		case "Mid":
			return "mid";
		case "Floor":
			return "floor";
		case "Minimal":
			return "minimal";
		case "CpuOnly":
			return "cpu_only";
	}
}

async function handleStart(): Promise<void> {
	if (phase === "scanning") return;

	phase = "scanning";
	scanError = null;
	tier = null;
	presets = [];
	presetsError = null;
	wizardState.goTo("hardware");

	await waitForWizardPaint();

	// Step 1: Hardware scan. If this fails entirely we still advance to
	// the detected phase with an error - never leave the user on a blank
	// scanning state.
	await startHardwareScan();

	const [autoConfig, detectedTier, availablePresets] = await Promise.all([
		fetchRecommendations(),
		invoke<TierDisplay>("get_tier_display")
			.then((result) => ({ ok: true as const, result }))
			.catch((error) => ({ ok: false as const, error })),
		listAllPresets(),
	]);

	// Step 2: Auto-configure recommendations. Error becomes scanError but
	// we keep going so we can still show the preset picker.
	if (!autoConfig) {
		scanError = wizardState.error ?? "Auto-configuration failed";
	}

	// Step 3: Tier display metadata. Null tier is handled in the template
	// with a fallback - the overlay never goes blank.
	if (detectedTier.ok) {
		tier = detectedTier.result;
	} else {
		scanError =
			scanError ??
			(detectedTier.error instanceof Error
				? detectedTier.error.message
				: String(detectedTier.error));
	}

	// Step 4: Load every known preset for the picker. These are the 6
	// hardware tiers so the owner can override the auto-detection.
	presets = availablePresets;
	if (presets.length === 0) {
		presetsError = "No presets available - rust list_presets returned empty";
	}

	wizardState.goTo("models");
	phase = "detected";
}

async function handlePickPreset(cfg: AutoConfig): Promise<void> {
	if (switchingTier !== null) return;
	const arg = tierToArg(cfg.tier);
	switchingTier = arg;
	try {
		await selectPreset(arg);
	} finally {
		switchingTier = null;
	}
}

async function handlePickTier(tier: HardwareTier): Promise<void> {
	if (switchingTier !== null) return;
	const arg = tierToArg(tier);
	switchingTier = arg;
	try {
		await selectPreset(arg);
	} finally {
		switchingTier = null;
	}
}

function handleDismiss(): void {
	phase = "welcome";
	wizardState.goTo("hardware");
	wizardState.close();
}

function handleRecommendedContinue(): void {
	wizardState.goTo("clyffy");
}
</script>

{#if isOpen}
	<div
		class="wizard-scrim"
		role="presentation"
		onclick={(e) => {
			// Click on the scrim backdrop (not the panel) closes the overlay.
			if (e.target === e.currentTarget) handleDismiss();
		}}
		onkeydown={(e) => {
			if (e.key === "Escape") handleDismiss();
		}}
	>
		<div class="wizard-background-layer" aria-hidden="true">
			<DynamicBackground
				variant="devpulse"
				src="/imgs/backgrounds/maincontentbackground.png"
				animated
				class="wizard-background"
			/>
			<BackgroundScene
				variation="void-breathe"
				palette="teal"
				speed="normal"
				intensity="strong"
				motion="on"
				class="wizard-scene"
			/>
			<div class="wizard-vignette"></div>
		</div>
		<div
			class="wizard-panel"
			role="dialog"
			aria-modal="true"
			aria-label="Clyffy Setup Wizard"
			tabindex="-1"
		>
			<div class="wizard-header-actions">
				{#if copy}
					<ClyffyTooltip
						copy={copy.clyffy_tooltips}
						copyKey="hf_token_info"
						label="What is a HuggingFace token?"
					/>
					<button
						type="button"
						class="wizard-token-pill"
						class:wizard-token-pill-set={hasHfTokenCached}
						onclick={openHfTokenModal}
						aria-label={copy.hf_token.lock_icon_aria}
						title={hasHfTokenCached ? copy.hf_token.saved_badge : copy.hf_token.unsaved_badge}
					>
						{#if hasHfTokenCached}
							<Lock size={12} aria-hidden="true" />
							<span>{copy.hf_token.saved_badge}</span>
						{:else}
							<KeyRound size={12} aria-hidden="true" />
							<span>{copy.hf_token.unsaved_badge}</span>
						{/if}
					</button>
				{/if}
				<button
					type="button"
					class="wizard-close"
					onclick={handleDismiss}
					aria-label="Close setup wizard"
				>
					<X size={16} aria-hidden="true" />
				</button>
			</div>

			{#if copy}
				<HfTokenModal
					open={hfTokenModalOpen}
					copy={copy.hf_token}
					initiallyHasToken={hasHfTokenCached}
					onClose={closeHfTokenModal}
					onSaved={handleHfTokenSaved}
				/>
			{/if}

			<div class="wizard-body">
				{#if copyError}
					<Card preset="danger">
						<div class="err-card">
							<Heading level={3} size="md">Couldn't load setup wizard</Heading>
							<Text size="sm" color="danger">Rust returned: {copyError}</Text>
							<Text size="xs" color="muted">
								Make sure the engine booted successfully - check the app log for
								<code>get_wizard_copy</code> errors.
							</Text>
						</div>
					</Card>
				{:else if !copy}
					<div class="loading-block">
						<Spinner size="md" />
						<Text size="sm" color="muted">Loading wizard...</Text>
						<div class="mt-4 w-full max-w-[28rem]">
							<LoadingContentCard rotateEveryMs={8000} />
						</div>
					</div>
				{:else if phase === "welcome"}
					<WelcomeStep
						greeting={copy.greeting}
						hardware={copy.hardware}
						tooltips={copy.clyffy_tooltips}
						onContinue={handleStart}
					/>
				{:else if phase === "scanning"}
					<img
						src="/imgs/mascot/clyffyloading.gif"
						alt={copy.scanning.mascot_alt}
						class="mascot-loading"
					/>
					<Heading level={2} size="lg">{copy.scanning.title}</Heading>
					<Text size="sm" color="muted">{copy.scanning.subtitle}</Text>
					<Spinner size="md" />
					<div class="mt-4 w-full max-w-[28rem]">
						<LoadingContentCard rotateEveryMs={7000} />
					</div>
				{:else if wizardState.currentPhase === "clyffy"}
					<ClyfActivationStep
						onBack={() => wizardState.goTo("models")}
						onContinue={() => wizardState.goTo("project")}
						continueBlockers={["Send three messages to confirm the main brain is stable."]}
					/>
				{:else if wizardState.currentPhase === "project"}
					<ProjectSetupStep
						onBack={() => wizardState.goTo("clyffy")}
						onContinue={() => wizardState.goTo("completion")}
					/>
				{:else if wizardState.currentPhase === "completion"}
					<CompletionStep
						onComplete={() => {
							phase = "welcome";
							wizardState.goTo("hardware");
							wizardState.close();
						}}
					/>
				{:else if wizardState.currentPhase === "browse"}
					<SearchBrowseStep
						onBack={() => wizardState.goTo("models")}
						onDone={() => wizardState.goTo("models")}
					/>
				{:else if wizardState.currentPhase === "customize"}
					<CustomizeStep
						onBack={() => wizardState.goTo("models")}
						onBrowse={() => wizardState.goTo("browse")}
						onDone={() => wizardState.goTo("models")}
					/>
				{:else}
					<ModelsStep
						copy={copy.models}
						downloadsCopy={copy.downloads}
						allPresets={presets}
						loadingRecommendations={presets.length === 0 && !presetsError}
						recommendationsError={scanError ?? presetsError}
						switchingTier={switchingTier as HardwareTier | null}
						onSelectTier={(tier) => void handlePickTier(tier)}
						onRetryRecommendations={() => void handleStart()}
						onContinue={handleRecommendedContinue}
						onBack={() => {
							phase = "welcome";
							wizardState.goTo("hardware");
						}}
						onCustomize={() => wizardState.goTo("customize")}
						onBrowse={() => wizardState.goTo("browse")}
					/>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.wizard-scrim {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: clamp(1rem, 3vw, 2.5rem);
		isolation: isolate;
		overflow-y: auto;
		background: linear-gradient(
			180deg,
			color-mix(in oklch, var(--overlay-bg, var(--overlay-scrim)) 24%, transparent),
			color-mix(in oklch, var(--overlay-bg-heavy, var(--overlay-scrim-heavy)) 46%, transparent)
		);
	}

	.wizard-background-layer {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		overflow: hidden;
	}

	:global(.wizard-background) {
		--dynamic-background-image-opacity: 0.64;
		--dynamic-background-image-filter: saturate(1.18) brightness(0.82) contrast(1.08);
		--dynamic-background-overlay-opacity: 0.96;
	}

	:global(.wizard-scene) {
		z-index: 1;
		opacity: 0.18;
	}

	.wizard-vignette {
		position: absolute;
		inset: 0;
		z-index: 2;
		background:
			radial-gradient(
				circle at 50% 22%,
				transparent 0%,
				color-mix(in oklch, var(--wizard-surface-base, var(--color-void-base)) 18%, transparent) 48%,
				color-mix(in oklch, var(--wizard-surface-base, var(--color-void-base)) 54%, transparent) 100%
			),
			linear-gradient(
				180deg,
				color-mix(in oklch, var(--wizard-surface-overlay, var(--surface-overlay)) 12%, transparent),
				color-mix(in oklch, var(--wizard-surface-base, var(--color-void-base)) 38%, transparent)
			);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
	}

	.wizard-panel {
		position: relative;
		z-index: 3;
		width: 100%;
		max-width: min(72rem, 100vw);
		display: flex;
		flex-direction: column;
		align-items: stretch;
		overflow: hidden;
		background: linear-gradient(
			160deg,
			color-mix(in oklch, var(--wizard-surface-card-raised, var(--surface-raised)) 86%, transparent) 0%,
			color-mix(in oklch, var(--wizard-surface-overlay, var(--surface-overlay)) 94%, transparent) 56%,
			color-mix(in oklch, var(--wizard-surface-inset, var(--surface-inset)) 88%, transparent) 100%
		);
		border: var(--border-width-medium) solid var(--wizard-border-subtle, var(--border-subtle));
		border-radius: var(--radius-lg);
		box-shadow: var(--wizard-shadow-glow-lg, var(--shadow-z4)), var(--shadow-z4);
		backdrop-filter: blur(18px) saturate(1.08);
		-webkit-backdrop-filter: blur(18px) saturate(1.08);
	}

	.wizard-panel::before {
		content: "";
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: inherit;
		background: linear-gradient(
			145deg,
			color-mix(in oklch, var(--accent-teal-fill) 20%, transparent) 0%,
			transparent 38%,
			color-mix(in oklch, var(--accent-purple-fill) 14%, transparent) 100%
		);
		opacity: 0.78;
	}

	.wizard-header-actions {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		z-index: 2;
	}

	.wizard-token-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		border-radius: 999px;
		border: 0.0625rem solid var(--wizard-border-subtle, var(--border-subtle));
		background: color-mix(
			in oklch,
			var(--wizard-surface-overlay, var(--surface-overlay)) 88%,
			transparent
		);
		color: var(--text-secondary);
		font-size: 0.6875rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			background var(--motion-duration-fast),
			border-color var(--motion-duration-fast),
			color var(--motion-duration-fast);
	}
	.wizard-token-pill:hover {
		background: color-mix(
			in oklch,
			var(--wizard-surface-card-raised, var(--surface-raised)) 92%,
			transparent
		);
		color: var(--text-primary);
		border-color: var(--accent-cyan-main);
	}
	.wizard-token-pill-set {
		border-color: var(--accent-teal-main);
		color: var(--accent-teal-main);
	}
	.wizard-token-pill-set:hover {
		border-color: var(--accent-teal-main);
	}

	.wizard-close {
		width: 2rem;
		height: 2rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		border-radius: var(--radius-md);
		transition: background var(--motion-duration-fast), color var(--motion-duration-fast);
	}
	.wizard-close:hover {
		background: color-mix(
			in oklch,
			var(--wizard-surface-overlay, var(--surface-overlay)) 92%,
			transparent
		);
		color: var(--text-primary);
	}

	.wizard-body {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		gap: clamp(0.75rem, 2vw, 1.5rem);
		padding: clamp(1.25rem, 3vw, 2.5rem);
		text-align: center;
		box-sizing: border-box;
	}

	.loading-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: clamp(1rem, 3vw, 2rem);
	}

	.err-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: clamp(0.75rem, 2vw, 1.25rem);
		text-align: left;
	}

	.mascot-loading {
		width: clamp(3rem, 6vw, 5rem);
		height: clamp(3rem, 6vw, 5rem);
		object-fit: contain;
	}
</style>
