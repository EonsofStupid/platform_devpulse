<!--
	@component FriendlyBootView
	Simple display's boot screen — clean, professional loading screen.
	Shows friendly names, progress bar, status indicators.
	Rendered by BootOverlay while the platform starts.
-->
<script lang="ts">
import { Progress } from "@devpulse/coldlight/components/progress";
import { Text } from "@devpulse/coldlight/components/text";
import { presentationState } from "#lib/domains/app/devpulse/index.js";
import { copyState } from "#lib/sys/copy/index.js";
import { BOOT_STEP_MANIFEST } from "#lib/sys/generated/service-manifest.js";
import { getIcon } from "#lib/sys/generated/terminology-icons.js";
import type { SubsystemState } from "#lib/sys/runes/platformState.svelte.js";
import { platformState } from "#lib/sys/runes/platformState.svelte.js";

const copy = $derived(copyState.catalog?.hubs.boot);

interface StepDisplay {
	step: string;
	label: string;
	status: SubsystemState;
}

// Build display list from known steps + any unknown steps that appear
const steps = $derived.by((): StepDisplay[] => {
	const known = BOOT_STEP_MANIFEST.map((s) => s.step_id);
	const unknown = platformState
		.subsystemList()
		.map((s) => s.name)
		.filter((name) => !known.includes(name));
	return [...known, ...unknown].map((step) => ({
		step,
		label: presentationState.label(step),
		status: platformState.subsystemStatus(step)?.state ?? "pending",
	}));
});

function statusIndicator(status: SubsystemState): string {
	switch (status) {
		case "ready":
			return "✓";
		case "loading":
			return "◼";
		case "failed":
			return "✗";
		case "skipped":
			return "—";
		case "pending":
			return "○";
	}
}

function statusLabel(status: SubsystemState): string | undefined {
	switch (status) {
		case "ready":
			return copy?.status_ready;
		case "loading":
			return copy?.status_loading;
		case "failed":
			return copy?.status_failed;
		case "skipped":
			return copy?.status_skipped;
		case "pending":
			return copy?.status_waiting;
	}
}

/** Bottom message based on progress. */
function bootMessage(progress: number, hasErrors: boolean): string | undefined {
	if (hasErrors) return copy?.message_failed;
	if (progress >= 100) return copy?.message_ready;
	if (progress >= 75) return copy?.message_almost;
	if (progress >= 50) return copy?.message_workspace;
	return copy?.message_starting;
}
</script>

<div class="flex w-full flex-col items-center gap-8" data-slot="friendly-boot">
	<header class="text-center">
		<Text as="div" size="lg" weight="bold" data-text-effect="emboss" data-text-glow="teal">{copy?.wordmark}</Text>
	</header>

	<div class="flex w-full flex-col gap-3" data-slot="steps">
		{#each steps as step (step.step)}
			{@const Icon = getIcon(step.step)}
			<div class="flex items-center gap-3" data-slot="step" data-state={step.status}>
				<span class="w-5 shrink-0 text-center" data-slot="indicator" aria-hidden="true">{statusIndicator(step.status)}</span>
				{#if Icon}
					<Icon size={14} class="shrink-0" aria-hidden="true" />
				{/if}
				<span class="min-w-0 flex-1 truncate" data-slot="label">{step.label}</span>
				<span class="shrink-0" data-slot="status">{statusLabel(step.status)}</span>
			</div>
		{/each}
	</div>

	<div class="flex w-full items-center gap-3">
		<Progress value={platformState.progress} max={100} size="sm" class="flex-1" />
		<Text size="sm" color="muted" class="w-10 shrink-0 text-right">{platformState.progress}%</Text>
	</div>

	<footer class="text-center">
		<Text size="sm" color="muted">{bootMessage(platformState.progress, platformState.hasSubsystemFailure)}</Text>
	</footer>
</div>

<style>
	[data-slot="step"] {
		font-size: var(--font-size-sm);
		color: var(--text-primary);
	}

	[data-slot="indicator"] {
		font-size: var(--font-size-base);
	}

	[data-slot="status"] {
		color: var(--text-muted);
	}

	[data-state="ready"] [data-slot="indicator"],
	[data-state="ready"] [data-slot="status"] {
		color: var(--signal-success);
	}

	[data-state="loading"] [data-slot="indicator"] {
		color: var(--signal-warning);
		animation: pulse 1.2s ease-in-out infinite;
	}

	[data-state="loading"] [data-slot="status"] {
		color: var(--signal-warning);
	}

	[data-state="failed"] [data-slot="indicator"],
	[data-state="failed"] [data-slot="label"],
	[data-state="failed"] [data-slot="status"] {
		color: var(--signal-error);
	}

	[data-state="skipped"] [data-slot="indicator"],
	[data-state="skipped"] [data-slot="label"],
	[data-state="pending"] [data-slot="indicator"],
	[data-state="pending"] [data-slot="label"] {
		color: var(--text-muted);
	}
</style>
