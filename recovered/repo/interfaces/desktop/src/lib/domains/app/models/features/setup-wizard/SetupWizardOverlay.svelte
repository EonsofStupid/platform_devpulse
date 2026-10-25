<!--
  @file SetupWizardOverlay.svelte
  Route-hosted overlay shell for the setup wizard.

  Source of truth for setup rendering now lives under src/routes/(setup)/.
  This component owns the overlay chrome, token aliases consumed by the
  remaining setup pages, and the shared panel structure. Route pages render
  inside this shell; the app frame should not own wizard rendering.
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { Text } from "$lib/design/components/text/index.js";

interface Props {
	children?: Snippet;
}

let { children }: Props = $props();
</script>

{#if children}
	<div class="wizard-scrim" data-layout="setup-overlay">
		<div class="wizard-panel" role="dialog" aria-modal="true" aria-label="Clyffy setup wizard">
			<header class="wizard-header">
				<div class="wizard-heading">
					<Text size="xs" color="muted">First Run Setup</Text>
					<Text size="sm" weight="semibold">Configure Clyffy and the model pipeline</Text>
				</div>
			</header>

			<div class="wizard-body">
				{@render children()}
			</div>
		</div>
	</div>
{/if}

<style>
	.wizard-scrim {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-12);
	}

	.wizard-panel {
		--wiz-role-brain: var(--accent-purple-main);
		--wiz-role-minion: var(--accent-green-main);
		--wiz-role-encoder: var(--accent-blue-main);
		--wiz-role-voice: var(--accent-coral-main);
		--wiz-glow-purple: 0 0 var(--space-24) color-mix(in oklch, var(--accent-purple-main) 35%, transparent);
		--wiz-glow-green: 0 0 var(--space-24) color-mix(in oklch, var(--accent-green-main) 35%, transparent);
		--wiz-glow-cyan: 0 0 var(--space-24) color-mix(in oklch, var(--accent-cyan-main) 35%, transparent);
		--wiz-glow-ember: 0 0 var(--space-24) color-mix(in oklch, var(--accent-coral-main) 35%, transparent);
		--wiz-fill-purple: var(--accent-purple-fill);
		--wiz-fill-green: var(--accent-green-fill);
		--wiz-fill-cyan: var(--accent-teal-fill);
		--wiz-fill-ember: var(--accent-coral-fill);
		--wiz-fill-magenta: var(--accent-hotpink-fill);
		--wiz-cyan: var(--accent-cyan-main);
		--wiz-green: var(--accent-green-main);
		--wiz-blue: var(--accent-blue-main);
		--wiz-coral: var(--accent-coral-main);
		--wiz-gold: var(--color-brand-gold-500);
		--wiz-hotpink: var(--accent-hotpink-main);
		--wiz-salmon: var(--color-brand-salmon-500);
		--wiz-ember-200: var(--color-brand-salmon-200);
		--wiz-ember-300: var(--color-brand-salmon-300);
		--wiz-ember-600: var(--color-brand-salmon-600);
		--wiz-card: var(--glass-deep);
		--wiz-card-raised: var(--glass-smoke);
		--wiz-inset: var(--surface-inset);
		--wiz-overlay: color-mix(in oklch, var(--color-void-950) 88%, transparent);
		--wiz-void-950: var(--color-void-950);
		--wiz-void-800: var(--color-void-800);
		--wiz-void-700: var(--color-void-700);
		--wiz-void-600: var(--color-void-600);
		--wiz-void-500: var(--color-void-500);
		--wiz-void-400: var(--color-void-400);
		--wiz-border: var(--border-subtle);
		--wiz-border-strong: var(--border-strong);
		--wiz-border-focus: var(--accent-cyan-main);
		--wiz-text: var(--text-primary);
		--wiz-text-sub: var(--text-secondary);
		--wiz-text-muted: var(--text-muted);
		--wiz-text-xs: 0.75rem;
		--wiz-text-sm: 0.875rem;
		--wiz-radius-xs: var(--radius-xs);
		--wiz-radius-sm: var(--radius-sm);
		--wiz-radius-md: var(--radius-md);
		--wiz-radius-lg: var(--radius-lg);
		--wiz-radius-xl: var(--radius-xl);
		--wiz-radius-full: var(--radius-full);
		--wiz-shadow-md: var(--shadow-z2);
		--wiz-shadow-lg: var(--shadow-z3);
		--wiz-shadow-xl: var(--shadow-z4);
		--wiz-duration-fast: var(--motion-duration-fast);
		--wiz-duration-normal: var(--motion-duration-normal);
		--wiz-z-tooltip: 1000;
		--wiz-z-modal: 1100;
		width: min(72rem, 100%);
		min-height: calc(100vh - var(--space-24));
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border: var(--border-preset-default-width) solid var(--border-subtle);
		border-radius: var(--radius-2xl);
		background:
			linear-gradient(180deg, color-mix(in oklch, var(--glass-smoke) 82%, transparent), transparent 8rem),
			var(--glass-deep);
		box-shadow: var(--shadow-z4);
		color: var(--wiz-text);
		backdrop-filter: blur(1.25rem);
	}

	.wizard-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-8) var(--space-10);
		border-bottom: var(--border-preset-default-width) solid var(--border-soft);
		background: color-mix(in oklch, var(--glass-frost) 55%, transparent);
	}

	.wizard-heading {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.wizard-body {
		flex: 1;
		overflow: auto;
		padding: var(--space-10);
	}

	@media (max-width: 768px) {
		.wizard-scrim {
			padding: 0;
		}

		.wizard-panel {
			width: 100%;
			min-height: 100vh;
			border-radius: 0;
		}

		.wizard-header,
		.wizard-body {
			padding-left: var(--space-6);
			padding-right: var(--space-6);
		}
	}
</style>