<!--
  @file SetupWizardOverlay — 5-view model configuration overlay.
  @domain models/setup-wizard

  Mounted in `layouts/app/Frame.svelte` as a sibling of `SwapOverlay`.
  `wizardState.isOpen` controls visibility.

  ┌──────────────────────────────────────────────────────────┐
  │ welcome → system-check → config → validate → done        │
  │                                                           │
  │  • welcome: profile form + Jesse Config preset button    │
  │  • system-check: hardware detection + tier badge         │
  │  • config: 4 slot cards (Brain/Memory/Vision/Voice)      │
  │  • validate: 3-exchange test chat with the brain         │
  │  • done: celebration + Start Chatting CTA                │
  │                                                           │
  │  + HfTokenModal: HF token entry (top-right pill)         │
  │  + LoadStageOverlay: mounts when ANY slot is loading     │
  │  + SlotSwapOverlay: mounts when ANY slot is swapping     │
  └──────────────────────────────────────────────────────────┘

  ColdLight teal glass chrome. Rust pushes all state via
  `platform:models-status`. Frontend never triggers scans.
-->
<script lang="ts">
import { KeyRound, Lock, X } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import DynamicBackground from "$lib/design/components/dynamic-background/DynamicBackground.svelte";
import Text from "$lib/design/components/text/Text.svelte";
import { logInfo } from "$lib/sys/logger.js";
import { setupWizardOverlayState } from "../../data-access/setup-wizard-overlay.state.svelte.js";
import HfTokenModal from "./components/HfTokenModal.svelte";
import LoadStageOverlay from "./overlays/LoadStageOverlay.svelte";
import ConfigView from "./views/ConfigView.svelte";
import DoneView from "./views/DoneView.svelte";
import SystemCheckView from "./views/SystemCheckView.svelte";
import ValidateView from "./views/ValidateView.svelte";
import WelcomeView from "./views/WelcomeView.svelte";
import { wizardState } from "./wizard.state.svelte.js";

const overlayState = setupWizardOverlayState;

function handleClose(): void {
	logInfo("wizard.overlay", "Close (X) clicked");
	wizardState.close();
}

function handleBackToWelcome(): void {
	logInfo("wizard.overlay", "Back to welcome clicked");
	overlayState.showWelcome();
}

// ── Top bar title per view ─────────────────────────────
const topbarTitle = $derived(
	overlayState.view === "welcome"
		? "DevPulse Setup"
		: overlayState.view === "system-check"
			? "System Check"
			: overlayState.view === "config"
				? "Model Configuration"
				: overlayState.view === "validate"
					? "Test Your Setup"
					: "All Set",
);

// ── Init ────────────────────────────────────────────────
$effect(() => {
	if (wizardState.isOpen) {
		logInfo("wizard.overlay", "overlay opening → start()");
		void overlayState.start();
		return () => {
			logInfo("wizard.overlay", "overlay closing → stop()");
			overlayState.stop();
		};
	}
});
</script>

{#if wizardState.isOpen}
	<div class="wizard-overlay">
		<DynamicBackground variant="boot" animated={true} class="wizard-bg" />
		<div class="wizard-backdrop"></div>

		<div class="wizard-chrome">
			<!-- Top bar -->
			<div class="wizard-topbar">
				<div class="topbar-left">
					{#if overlayState.view !== "welcome" && overlayState.view !== "done"}
						<Button preset="button-ghost" size="sm" onclick={handleBackToWelcome}>
							← Back
						</Button>
					{/if}
					<Text size="sm" weight="bold" class="topbar-title">{topbarTitle}</Text>
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
					<Button preset="button-ghost" size="sm" onclick={handleClose} aria-label="Close">
						<X size={16} />
					</Button>
				</div>
			</div>

			<!-- Content — one view at a time -->
			<div class="wizard-content">
				{#if overlayState.copyError}
					<div class="state-msg">
						<Text size="sm">Failed to load: {overlayState.copyError}</Text>
						<Button preset="button-secondary" size="sm" onclick={() => overlayState.retryCopy()}>Retry</Button>
					</div>

				{:else if overlayState.view === "welcome"}
					<!-- ═══ VIEW 1 — WELCOME (rich profile + snapshot) ═══ -->
					<WelcomeView />

				{:else if overlayState.view === "system-check"}
					<!-- ═══ VIEW 2 — SYSTEM CHECK ═══ -->
					<SystemCheckView />

				{:else if overlayState.view === "config"}
					<!-- ═══ VIEW 3 — CONFIG (tabbed: Brain / Encoder / Voice / Helpers) ═══ -->
					<ConfigView />

				{:else if overlayState.view === "validate"}
					<!-- ═══ VIEW 4 — VALIDATE (test chat) ═══ -->
					<ValidateView />

				{:else}
					<!-- ═══ VIEW 5 — DONE ═══ -->
					<DoneView />
				{/if}
			</div>
		</div>
	</div>

	<!-- Sub-overlays — mount when their state is active -->
	{#if overlayState.copy}
		<HfTokenModal
			open={overlayState.showHfModal}
			copy={overlayState.copy.hf_token}
			initiallyHasToken={overlayState.hfHasToken}
			onClose={() => overlayState.closeHfModal()}
			onSaved={(has) => overlayState.handleHfSaved(has)}
		/>
	{/if}

	<LoadStageOverlay />
{/if}

<style>
	.wizard-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		flex-direction: column;
	}

	:global(.wizard-bg) {
		z-index: 0;
	}

	.wizard-backdrop {
		position: absolute;
		inset: 0;
		z-index: 0;
		background: oklch(0.06 0.01 220 / 0.55);
		backdrop-filter: blur(0.5rem);
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

	/* Config view + hardware summary + card grid styles moved to
	   views/ConfigView.svelte — the overlay is a pure view router. */
</style>
