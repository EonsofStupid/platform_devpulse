<!--
  @file Model Loader Layout
  @route (model-loader)/model-loader

  Shell for all wizard pages. Background image, progress steps, current setup button.
  ColdLight components. Rune state from domain.
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { Settings2, X } from "lucide-svelte";
import { page } from "$app/stores";
import { Button } from "$lib/design/components/button/index.js";
import { Steps } from "$lib/design/components/steps/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import {
	PHASE_INFO,
	PROGRESS_PHASES,
	wizardState,
} from "$lib/domains/app/models/features/setup-wizard/index.js";

interface Props {
	children: import("svelte").Snippet;
}
let { children }: Props = $props();

function handleClose(): void {
	invoke("close_window", { label: "model-loader" });
}

/** Current step index based on URL path. */
const currentStep = $derived.by(() => {
	const path = $page.url.pathname;
	if (path.includes("/models")) return 1;
	if (path.includes("/browse")) return 2;
	if (path.includes("/customize")) return 2;
	if (path.includes("/activate")) return 3;
	if (path.includes("/profile")) return 4;
	if (path.includes("/complete")) return 5;
	return 0; // hardware / welcome
});

const stepLabels = PROGRESS_PHASES.map((phase) => {
	const info = PHASE_INFO.find((p) => p.phase === phase);
	return info?.label ?? phase;
});
</script>

<div class="wizard-layout">
	<!-- Background -->
	<img
		src="/imgs/backgrounds/maincontentbackground.png"
		alt=""
		class="wizard-bg"
		aria-hidden="true"
	/>

	<!-- Title bar -->
	<header class="wizard-header" data-tauri-drag-region>
		<Text size="sm" weight="semibold" preset="default">CLYFFY SETUP</Text>
		<div class="header-actions">
			<Button preset="ghost" size="sm" onclick={() => (wizardState.showCurrentSetup = !wizardState.showCurrentSetup)}>
				<Settings2 size={14} />
				Setup
			</Button>
			<Button preset="ghost" size="sm" onclick={handleClose}>
				<X size={14} />
			</Button>
		</div>
	</header>

	<!-- Progress steps -->
	<nav class="wizard-steps" aria-label="Setup progress">
		<div class="steps-row">
			{#each stepLabels as label, i (label)}
				{@const isDone = currentStep > i}
				{@const isCurrent = currentStep === i}
				<div class="step-item">
					<span
						class="step-dot"
						class:done={isDone}
						class:current={isCurrent}
					></span>
					<span
						class="step-label"
						class:active={isCurrent}
						class:done-label={isDone}
					>{label}</span>
				</div>
				{#if i < stepLabels.length - 1}
					<span class="step-line" class:done-line={isDone}></span>
				{/if}
			{/each}
		</div>
	</nav>

	<!-- Page content -->
	<main class="wizard-main">
		{@render children()}
	</main>
</div>

<style>
	.wizard-layout {
		display: flex; flex-direction: column; align-items: center;
		width: 100%; height: 100%; position: relative; overflow: hidden;
		background: var(--surface-base);
		color: var(--text-primary);
	}
	.wizard-bg {
		position: absolute; inset: 0; width: 100%; height: 100%;
		object-fit: cover; object-position: center top;
		opacity: clamp(0.08, 0.15, 0.2);
		pointer-events: none; z-index: 0;
		mask-image: linear-gradient(to bottom, black 0%, black 60%, transparent 100%);
		-webkit-mask-image: linear-gradient(to bottom, black 0%, black 60%, transparent 100%);
	}
	.wizard-header {
		display: flex; align-items: center; justify-content: space-between;
		width: 100%; height: 2.5rem; padding: 0 1rem;
		border-bottom: var(--border-preset-default-width) solid var(--border-subtle);
		position: relative; z-index: 1;
	}
	.header-actions { display: flex; align-items: center; gap: 0.25rem; }

	.wizard-steps {
		width: 100%; max-width: 48rem; padding: 1rem 1.5rem 0;
		position: relative; z-index: 1;
	}
	.steps-row {
		display: flex; align-items: center; justify-content: center; gap: 0.5rem;
	}
	.step-item { display: flex; align-items: center; gap: 0.375rem; }
	.step-dot {
		width: 0.5rem; height: 0.5rem; border-radius: var(--radius-full);
		background: var(--color-void-700);
		transition: var(--transition-all-fast);
	}
	.step-dot.done { background: var(--brand-green); box-shadow: var(--wiz-glow-sm); }
	.step-dot.current { background: var(--brand-cyan); box-shadow: var(--wiz-glow-md); }
	.step-label { font-size: 0.75rem; color: var(--text-muted); }
	.step-label.active { color: var(--text-primary); font-weight: 700; }
	.step-label.done-label { color: var(--text-secondary); }
	.step-line {
		width: 1.5rem; height: var(--border-preset-default-width);
		background: var(--color-void-700);
		transition: background var(--motion-duration-fast);
	}
	.step-line.done-line { background: var(--brand-green); }

	.wizard-main {
		flex: 1; width: 100%; max-width: 48rem;
		display: flex; flex-direction: column; align-items: center;
		overflow-y: auto; padding: 1.5rem;
		position: relative; z-index: 1;
	}
</style>
