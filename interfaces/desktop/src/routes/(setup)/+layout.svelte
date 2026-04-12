<script lang="ts">
import type { Snippet } from "svelte";
import { DynamicBackground } from "$lib/design/components/dynamic-background/index.js";
import { Text } from "$lib/design/components/text/index.js";

interface Props {
	children: Snippet;
}

let { children }: Props = $props();
</script>

<DynamicBackground
	variant="boot"
	src="/imgs/backgrounds/maincontentbackground.png"
	animated
/>

<div class="setup-shell" data-layout="setup">
	<main class="setup-panel" aria-labelledby="setup-shell-title">
		<header class="setup-header">
			<div class="setup-heading">
				<Text size="xs" color="muted">First Run Setup</Text>
				<Text id="setup-shell-title" size="sm" weight="semibold">
					Configure Clyffy and the model pipeline
				</Text>
			</div>
		</header>

		<section class="setup-body">
			{@render children()}
		</section>
	</main>
</div>

<style>
	.setup-shell {
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
		border: var(--border-preset-default-width) solid var(--border-subtle);
		border-radius: clamp(1rem, 0.75rem + 1vw, 1.75rem);
		background:
			linear-gradient(180deg, color-mix(in oklch, var(--glass-smoke) 82%, transparent), transparent 9rem),
			color-mix(in oklch, var(--glass-deep) 90%, transparent);
		box-shadow: var(--shadow-z4);
		backdrop-filter: blur(1.25rem) saturate(1.05);
		color: var(--text-primary);
	}

	.setup-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: clamp(0.875rem, 0.625rem + 1vw, 1.5rem) clamp(1rem, 0.75rem + 1.25vw, 1.75rem);
		border-bottom: var(--border-preset-default-width) solid var(--border-soft);
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

	.setup-body {
		flex: 1;
		overflow: auto;
		padding: clamp(1rem, 0.75rem + 1vw, 1.5rem);
	}

	@media (max-width: var(--breakpoint-md)) {
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
