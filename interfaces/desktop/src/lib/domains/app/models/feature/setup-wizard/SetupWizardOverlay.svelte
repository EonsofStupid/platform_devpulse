<!--
  @file SetupWizardOverlay — first-run wizard mounted inside the app shell.
  @domain models

  Mounted in `layouts/app/Frame.svelte` as a sibling of `SwapOverlay`.
  wizardState.isOpen controls visibility. Phase router renders one step at a time.
  Rust SSOT for all copy via get_wizard_copy command.

  8 sequential phases: welcome → systemcheck → brain → encoder → voice → helpers → activate → complete
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { KeyRound, Lock, X } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { logError, logInfo, logWarn } from "$lib/sys/logger.js";
import HfTokenModal from "./components/HfTokenModal.svelte";
import Step0Welcome from "./steps/Step0Welcome.svelte";
import Step1SystemCheck from "./steps/Step1SystemCheck.svelte";
import Step2Brain from "./steps/Step2Brain.svelte";
import Step3Encoder from "./steps/Step3Encoder.svelte";
import Step4Voice from "./steps/Step4Voice.svelte";
import Step5Helpers from "./steps/Step5Helpers.svelte";
import Step6Activate from "./steps/Step6Activate.svelte";
import Step7Complete from "./steps/Step7Complete.svelte";
import { wizardState } from "./wizard.state.svelte.js";
import { WIZARD_PHASES, type WizardCopy, type WizardPhase } from "./wizard.types.js";

// ── Copy from Rust SSOT ─────────────────────────────────
let copy = $state<WizardCopy | null>(null);
let copyError = $state<string | null>(null);
let hfHasToken = $state(false);
let showHfModal = $state(false);

$effect(() => {
	logInfo(
		"wizard.overlay",
		`$effect — isOpen=${wizardState.isOpen} hasCopy=${!!copy} phase=${wizardState.currentPhase}`,
	);
	if (wizardState.isOpen && !copy) {
		logInfo("wizard.overlay", "Loading wizard copy from Rust SSOT...");
		void loadCopy();
		void checkHfToken();
	}
});

async function loadCopy(): Promise<void> {
	try {
		copy = await invoke<WizardCopy>("get_wizard_copy");
		logInfo("wizard.overlay", "Wizard copy loaded successfully");
	} catch (e) {
		copyError = e instanceof Error ? e.message : String(e);
		logError("wizard.overlay", `Failed to load wizard copy: ${copyError}`);
	}
}

async function checkHfToken(): Promise<void> {
	try {
		const result = await invoke<boolean>("has_hf_token");
		hfHasToken = result;
		logInfo("wizard.overlay", `HF token check: ${hfHasToken}`);
	} catch (e) {
		logWarn("wizard.overlay", `HF token check failed (non-critical): ${e}`);
	}
}

// ── Progress dots ────────────────────────────────────────
const currentIndex = $derived(WIZARD_PHASES.indexOf(wizardState.currentPhase));
</script>

{#if wizardState.isOpen}
<div class="wizard-overlay">
	<div class="wizard-backdrop"></div>

	<div class="wizard-chrome">
		<!-- Top bar: progress dots + HF token pill + close button -->
		<div class="wizard-topbar">
			<div class="progress-dots">
				{#each WIZARD_PHASES as phase, i (phase)}
					<button
						class="dot"
						class:active={i === currentIndex}
						class:done={i < currentIndex}
						onclick={() => { if (i < currentIndex) wizardState.goTo(phase); }}
						disabled={i > currentIndex}
						aria-label="Step {i + 1}: {phase}"
					>
						<span class="dot-inner"></span>
					</button>
				{/each}
			</div>

			<div class="topbar-right">
				<!-- HF Token pill -->
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

				<!-- Close button -->
				<Button preset="button-ghost" size="sm" onclick={() => wizardState.close()} aria-label="Close wizard">
					<X size={16} />
				</Button>
			</div>
		</div>

		<!-- Phase router -->
		<div class="wizard-content">
			{#if copyError}
				<div class="copy-error">
					<Text size="sm">Failed to load wizard text: {copyError}</Text>
					<Button preset="button-secondary" size="sm" onclick={loadCopy}>Retry</Button>
				</div>
			{:else if !copy}
				<div class="copy-loading">
					<Text size="sm" class="loading-text">Loading wizard...</Text>
				</div>
			{:else if wizardState.currentPhase === "welcome"}
				<Step0Welcome
					onContinue={() => wizardState.advance()}
					greeting={copy.greeting}
					hardware={copy.hardware}
					tooltips={copy.clyffy_tooltips}
				/>
			{:else if wizardState.currentPhase === "systemcheck"}
				<Step1SystemCheck onComplete={() => wizardState.advance()} />
			{:else if wizardState.currentPhase === "brain"}
				<Step2Brain
					onContinue={() => wizardState.advance()}
					onBack={() => wizardState.goBack()}
				/>
			{:else if wizardState.currentPhase === "encoder"}
				<Step3Encoder
					onContinue={() => wizardState.advance()}
					onBack={() => wizardState.goBack()}
				/>
			{:else if wizardState.currentPhase === "voice"}
				<Step4Voice
					onContinue={() => wizardState.advance()}
					onBack={() => wizardState.goBack()}
				/>
			{:else if wizardState.currentPhase === "helpers"}
				<Step5Helpers
					onContinue={() => wizardState.advance()}
					onBack={() => wizardState.goBack()}
				/>
			{:else if wizardState.currentPhase === "activate"}
				<Step6Activate
					onComplete={() => wizardState.advance()}
					onBack={() => wizardState.goBack()}
				/>
			{:else if wizardState.currentPhase === "complete"}
				<Step7Complete onFinish={() => {}} />
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
		padding: 0.75rem 1.25rem;
		border-bottom: 1px solid var(--border-soft);
		flex-shrink: 0;
	}

	.progress-dots {
		display: flex;
		gap: 0.375rem;
		align-items: center;
	}

	.dot {
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		border: none;
		background: transparent;
		padding: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 200ms ease-out;
	}
	.dot:disabled {
		cursor: default;
	}

	.dot-inner {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: var(--border-soft);
		transition: all 200ms ease-out;
	}
	.dot.active .dot-inner {
		width: 0.625rem;
		height: 0.625rem;
		background: var(--accent-teal-main);
		box-shadow: 0 0 0.5rem var(--accent-teal-glow);
	}
	.dot.done .dot-inner {
		background: var(--signal-success);
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
		border-color: var(--border-default);
		color: var(--text-secondary);
	}

	.wizard-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		overflow-y: auto;
		padding: 1rem 1.5rem;
	}

	.copy-error, .copy-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 3rem;
	}

	:global(.loading-text) {
		color: var(--text-muted);
	}
</style>
