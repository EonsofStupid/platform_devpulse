<!--
  @file Setup shell
  @route (setup)

  The full-screen shell every model setup page renders in: the background,
  "First Run Setup", the progress steps, the Setup button and close. No Frame,
  no sidebar. Restored from routes/(setup)/+layout.svelte; the progress steps,
  Setup button and close come from routes/(app)/model-loader/+layout.svelte.

  Leaving setup goes back to first run while it is still open (your place in
  Your AI is Rust's state), otherwise to the dashboard.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { DynamicBackground } from "@devpulse/coldlight/components/dynamic-background";
import { Text } from "@devpulse/coldlight/components/text";
import { Settings2, X } from "lucide-svelte";
import type { Snippet } from "svelte";
import {
	CurrentSetupPopup,
	hardwareState,
	PHASE_INFO,
	PROGRESS_PHASES,
	setupWizardOverlayState,
	type WizardPhase,
	wizardState,
} from "#lib/domains/app/models/index.js";
import { onboardingState } from "#lib/domains/app/onboarding/index.js";
import { copyState } from "#lib/sys/copy/index.js";
import { hrefOf, routeAt } from "#lib/sys/routing/index.js";
import { goto } from "$app/navigation";
import { page } from "$app/state";

interface Props {
	children: Snippet;
}

let { children }: Props = $props();

const text = $derived(copyState.catalog?.setup_wizard.shell ?? null);

// Setup needs the slots, the live hardware and its drafts; none of these
// download or load anything.
$effect(() => onboardingState.start());
$effect(() => hardwareState.subscribe("setup-shell"));
$effect(() => {
	void setupWizardOverlayState.start();
	return () => setupWizardOverlayState.stop();
});

const firstRun = routeAt("/onboarding");
const dashboard = routeAt("/devpulse");

function leave(): void {
	const target = onboardingState.isOpen ? firstRun : dashboard;
	if (target) void goto(hrefOf(target));
}

/** Close: a wizard that is open closes first; closing is what leaves. */
function handleClose(): void {
	if (wizardState.isOpen) wizardState.close();
	else leave();
}

// The views finish by closing the wizard.
let wasOpen = false;
$effect(() => {
	const open = wizardState.isOpen;
	if (wasOpen && !open) leave();
	wasOpen = open;
});

/** The pages that choose models count as the Brain step onward. */
const modelPages = [
	routeAt("/model-loader/models"),
	routeAt("/model-loader/browse"),
	routeAt("/model-loader/assign"),
];

const VIEW_PHASE: Record<typeof setupWizardOverlayState.view, WizardPhase> = {
	welcome: "welcome",
	"system-check": "systemcheck",
	config: "brain",
	validate: "activate",
	done: "complete",
};

/** Current step index, from the page and the view it shows. */
const currentStep = $derived.by(() => {
	const onModelPage = modelPages.some((node) => node && page.url.pathname === hrefOf(node));
	const phase = onModelPage ? "brain" : VIEW_PHASE[setupWizardOverlayState.view];
	return PROGRESS_PHASES.indexOf(phase);
});

const stepLabels = PROGRESS_PHASES.map(
	(phase) => PHASE_INFO.find((p) => p.phase === phase)?.label ?? phase,
);
</script>

<DynamicBackground
	variant="boot"
	src="/imgs/backgrounds/maincontentbackground.png"
	animated
/>

<div class="setup-shell" data-layout="setup">
	<main class="setup-panel" aria-labelledby="setup-shell-title">
		{#if text}
			<header class="setup-header" data-tauri-drag-region>
				<div class="setup-heading">
					<Text size="xs" color="muted">{text.kicker}</Text>
					<Text id="setup-shell-title" size="sm" weight="semibold">{text.title}</Text>
				</div>
				<div class="header-actions">
					<Button
						variant="ghost"
						size="sm"
						aria-label={text.setup_aria}
						onclick={() => (wizardState.showCurrentSetup = !wizardState.showCurrentSetup)}
					>
						<Settings2 size={14} />
						{text.setup_button}
					</Button>
					<Button variant="ghost" size="sm" aria-label={text.close_aria} onclick={handleClose}>
						<X size={14} />
					</Button>
				</div>
			</header>

			<nav class="setup-steps" aria-label={text.progress_aria}>
				{#each stepLabels as label, i (label)}
					<div class="step-item">
						<span
							class="step-dot"
							data-state={currentStep > i ? "done" : currentStep === i ? "current" : "todo"}
						></span>
						<span
							class="step-label"
							data-state={currentStep > i ? "done" : currentStep === i ? "current" : "todo"}
						>{label}</span>
					</div>
					{#if i < stepLabels.length - 1}
						<span class="step-line" data-state={currentStep > i ? "done" : "todo"}></span>
					{/if}
				{/each}
			</nav>
		{/if}

		<section class="setup-body">
			{@render children()}
		</section>
	</main>

	<CurrentSetupPopup />
</div>

<style>
	.setup-shell {
		/* The wizard's aliases (from the owner's overlay shell): VramBar and
		   CurrentSetupPopup read them. */
		--wiz-green: var(--accent-green-main);
		--wiz-gold: var(--accent-gold-main);
		--wiz-salmon: var(--accent-coral-main);
		--wiz-card: var(--glass-deep);
		--wiz-overlay: var(--overlay-scrim);
		--wiz-void-800: var(--color-void-800);
		--wiz-void-500: var(--color-void-500);
		--wiz-border: var(--border-subtle);
		--wiz-border-strong: var(--border-strong);
		--wiz-text: var(--text-primary);
		--wiz-text-sub: var(--text-secondary);
		--wiz-text-muted: var(--text-muted);
		--wiz-text-xs: 0.875rem;
		--wiz-text-sm: 0.875rem;
		--wiz-radius-sm: var(--radius-sm);
		--wiz-radius-md: var(--radius-md);
		--wiz-radius-xl: var(--radius-xl);
		--wiz-radius-full: var(--radius-full);
		--wiz-shadow-lg: var(--popover-box-shadow);
		--wiz-shadow-xl: var(--dialog-box-shadow);
		--wiz-duration-normal: var(--duration-normal);
		--wiz-z-tooltip: 1000;
		--wiz-z-modal: 1100;

		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: clamp(0.75rem, 0.5rem + 1vw, 1.5rem);
		isolation: isolate;
	}

	.setup-panel {
		width: min(100%, 72rem);
		min-height: 42rem;
		max-height: calc(100vh - clamp(1.5rem, 1rem + 2vw, 3rem));
		aspect-ratio: 16 / 10;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border: var(--border-width-thin) solid var(--border-subtle);
		border-radius: clamp(1rem, 0.75rem + 1vw, 1.75rem);
		background:
			linear-gradient(180deg, color-mix(in oklch, var(--glass-smoke) 82%, transparent), transparent 9rem),
			color-mix(in oklch, var(--glass-deep) 90%, transparent);
		box-shadow: var(--dialog-box-shadow);
		backdrop-filter: blur(1.25rem) saturate(1.05);
		color: var(--text-primary);
	}

	.setup-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: clamp(0.875rem, 0.625rem + 1vw, 1.5rem) clamp(1rem, 0.75rem + 1.25vw, 1.75rem);
		border-bottom: var(--border-width-thin) solid var(--border-soft);
		background: linear-gradient(
			180deg,
			color-mix(in oklch, var(--glass-frost) 60%, transparent),
			transparent
		);
	}

	.setup-heading {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.setup-steps {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0.75rem clamp(1rem, 0.75rem + 1.25vw, 1.75rem) 0;
	}

	.step-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.step-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: var(--radius-full);
		background: var(--color-void-700);
		transition: all var(--duration-fast);
	}

	.step-dot[data-state="done"] {
		background: var(--brand-green);
		box-shadow: var(--wizard-shadow-glow-sm);
	}

	.step-dot[data-state="current"] {
		background: var(--brand-cyan);
		box-shadow: var(--wizard-shadow-glow-md);
	}

	.step-label {
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	.step-label[data-state="current"] {
		color: var(--text-primary);
		font-weight: 700;
	}

	.step-label[data-state="done"] {
		color: var(--text-secondary);
	}

	.step-line {
		width: 1.5rem;
		height: var(--border-width-thin);
		background: var(--color-void-700);
	}

	.step-line[data-state="done"] {
		background: var(--brand-green);
	}

	.setup-body {
		flex: 1;
		overflow: auto;
		padding: clamp(1rem, 0.75rem + 1vw, 1.5rem);
	}

	@media (max-width: 48rem) {
		.setup-shell {
			padding: 0;
		}

		.setup-panel {
			width: 100%;
			min-height: 100vh;
			max-height: none;
			aspect-ratio: auto;
			border-radius: 0;
		}
	}
</style>
