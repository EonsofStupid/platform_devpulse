<!--
  @file BootOverlay.svelte
  @module @devpulse/layouts/app/BootOverlay
  @layer lib

  Full-viewport overlay displayed during platform boot.
  Shows per-subsystem progress with status indicators and latencies.
  Fades out and unmounts when boot completes.
-->
<script lang="ts">
import { platformState } from "$lib/sys/runes/platformState.svelte.js";
import { DEV_MODE, devLabel, resolveLabel } from "$lib/sys/generated/terminology.js";
import { getIcon } from "$lib/sys/generated/terminology-icons.js";
import { Text, Stack, HStack } from "$lib/design/index.js";

let visible = $state(true);
let fading = $state(false);

const subsystems = $derived(platformState.subsystemList());

$effect(() => {
	if (platformState.isReady && !fading) {
		fading = true;
		setTimeout(() => {
			visible = false;
		}, 600);
	}
});
</script>

{#if visible}
<div
	class="boot-overlay"
	class:boot-overlay--fading={fading}
	aria-label="Platform booting"
	role="status"
>
	<div class="boot-overlay__content">
		<!-- Wordmark -->
		<div class="boot-overlay__wordmark">
			<Text size="lg" weight="bold">DevPulse</Text>
			<Text size="xs" color="muted">Platform Engine</Text>
		</div>

		<!-- Subsystem list -->
		<Stack gap="2" class="boot-overlay__subsystems">
			{#each subsystems as sub (sub.name)}
				{@const Icon = getIcon(sub.name)}
				<HStack gap="3" align="center" class="boot-overlay__row">
					<span
						class="boot-overlay__dot"
						data-state={sub.state}
						aria-hidden="true"
					></span>
					{#if Icon}
						<svelte:component this={Icon} size={14} class="shrink-0 text-text-muted" />
					{/if}
					<Text size="sm" color="secondary" class="flex-1">
						{DEV_MODE ? devLabel(sub.name) : resolveLabel(sub.name)}
					</Text>
					<Text size="xs" color="muted">
						{#if sub.state === "loading"}
							...
						{:else if sub.state === "ready" && sub.latencyMs !== null}
							{sub.latencyMs}ms
						{:else if sub.state === "failed"}
							failed
						{:else if sub.state === "ready"}
							ok
						{/if}
					</Text>
				</HStack>
			{/each}

			{#if subsystems.length === 0}
				<Text size="xs" color="muted">Waiting for subsystems...</Text>
			{/if}
		</Stack>

		<!-- Progress bar -->
		<div class="boot-overlay__progress-track">
			<div
				class="boot-overlay__progress-fill"
				style="width: {platformState.progress}%"
			></div>
		</div>

		<!-- Error state -->
		{#if platformState.hasFailed && platformState.error}
			<div class="boot-overlay__error">
				<Text size="xs" color="accent">{platformState.error}</Text>
			</div>
		{/if}
	</div>
</div>
{/if}

<style>
	.boot-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--surface-base, #0a0a0f);
		opacity: 1;
		transition: opacity 500ms ease-out;
	}

	.boot-overlay--fading {
		opacity: 0;
		pointer-events: none;
	}

	.boot-overlay__content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		min-width: 320px;
		max-width: 400px;
		padding: 2rem;
	}

	.boot-overlay__wordmark {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		margin-bottom: 0.5rem;
	}

	.boot-overlay__subsystems {
		width: 100%;
	}

	.boot-overlay__row {
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		background: var(--surface-raised, rgba(255, 255, 255, 0.03));
	}

	.boot-overlay__dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.boot-overlay__dot[data-state="pending"] {
		background: var(--text-muted, #555);
	}

	.boot-overlay__dot[data-state="loading"] {
		background: var(--color-purple-400, #a78bfa);
		box-shadow: 0 0 6px var(--color-purple-400, #a78bfa);
		animation: pulse 1s ease-in-out infinite;
	}

	.boot-overlay__dot[data-state="ready"] {
		background: var(--color-teal-400, #2dd4bf);
		box-shadow: 0 0 6px var(--color-teal-400, #2dd4bf);
	}

	.boot-overlay__dot[data-state="failed"] {
		background: var(--signal-error, #ef4444);
		box-shadow: 0 0 6px var(--signal-error, #ef4444);
	}

	.boot-overlay__progress-track {
		width: 100%;
		height: 2px;
		background: var(--border-subtle, rgba(255, 255, 255, 0.06));
		border-radius: 1px;
		overflow: hidden;
	}

	.boot-overlay__progress-fill {
		height: 100%;
		background: var(--color-teal-400, #2dd4bf);
		box-shadow: 0 0 8px var(--accent-teal-glow, rgba(45, 212, 191, 0.4));
		transition: width 300ms ease-out;
	}

	.boot-overlay__error {
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		width: 100%;
		text-align: center;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
	}
</style>
