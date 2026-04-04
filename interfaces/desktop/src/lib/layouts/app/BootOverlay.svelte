<!--
  @file BootOverlay.svelte
  @module @devpulse/layouts/app/BootOverlay

  Full-viewport overlay during platform boot.
  Phase 1: Subsystem progress (narrow centered column).
  Phase 2: Model setup wizard (wider, scrollable).
  Fades out and unmounts when boot completes.

  All layout via utils (hstack, stack, box -> class strings).
  All visual via ColdLight components (Badge, Text, Progress).

	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { Badge, type BadgeVariant } from "$lib/design/components/badge/index.js";
import { DynamicBackground } from "$lib/design/components/dynamic-background/index.js";
import { Progress } from "$lib/design/components/progress/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { DEV_MODE, devLabel, resolveLabel } from "$lib/sys/generated/terminology.js";
import { getIcon } from "$lib/sys/generated/terminology-icons.js";
import type { SubsystemState } from "$lib/sys/runes/platformState.svelte.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";

let visible = $state(true);
let fading = $state(false);

const subsystems = $derived(platformState.subsystemList());
const isWizardPhase = $derived(platformState.needsModelSetup);

function stateToVariant(state: SubsystemState): BadgeVariant {
	switch (state) {
		case "ready":
			return "positive";
		case "loading":
			return "informative";
		case "failed":
			return "negative";
		case "skipped":
			return "neutral";
		case "pending":
			return "neutral";
	}
}

function stateToLabel(state: SubsystemState, latencyMs: number | null): string {
	switch (state) {
		case "pending":
			return "";
		case "loading":
			return "...";
		case "ready":
			return latencyMs !== null ? `${latencyMs}ms` : "ok";
		case "skipped":
			return "disabled";
		case "failed":
			return "failed";
	}
}

$effect(() => {
	// Gate on FULL readiness: platform services AND models configured.
	// If platform is ready but models aren't, the wizard phase takes over
	// inside this overlay — keeping the gate closed until setup completes.
	if (platformState.isFullyReady && !fading) {
		fading = true;
		setTimeout(() => {
			visible = false;
		}, 600);
	}
});

let setupError = $state<string | null>(null);

/** Called when the SetupWizard finishes (models downloaded + assigned). */
async function handleWizardComplete(): Promise<void> {
	setupError = null;
	try {
		const { commands } = await import("$lib/sys/generated/bindings.js");
		const result = await commands.completeModelSetup();
		if (result.status === "error") {
			setupError = result.error;
			console.error("[BootOverlay] complete_model_setup:", result.error);
		}
		// On success, the command emits "platform:models-status" with ready=true,
		// which updates platformState.modelsReady → isFullyReady → fade.
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		setupError = msg;
		console.error("[BootOverlay] complete_model_setup failed:", msg);
	}
}
</script>

{#if visible}
<div
	class={cn(
		"fixed inset-0 z-[9999] flex items-center justify-center",
		"transition-opacity duration-500 ease-out",
		fading && "opacity-0 pointer-events-none",
	)}
	aria-label="Platform booting"
	role="status"
>
	<DynamicBackground
		variant="boot"
		src="/imgs/backgrounds/maincontentbackground.png"
	/>

	<!--
		Two-phase container:
		Boot phase → narrow centered column (400px) for subsystem list.
		Wizard phase → wider (768px) with scroll for model setup.
	-->
	<div class={cn(
		stack({ gap: "6", align: "center" }),
		"overflow-y-auto scrollbar-thin",
		isWizardPhase
			? "w-full max-w-3xl max-h-[90vh] px-8 py-6"
			: "min-w-[320px] max-w-[400px] max-h-[85vh] p-8",
		"transition-all duration-300 ease-out",
	)}>
		<!-- Wordmark -->
		<div class={stack({ gap: "4", align: "center" })}>
			<Text size="lg" weight="bold">DevPulse</Text>
			<div class={hstack({ gap: "8", align: "center", justify: "center" })}>
				<span
					class="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent-teal-main)] shrink-0 animate-pulse"
				></span>
				<Text size="xs" color="muted">{platformState.bootStepLabel}</Text>
			</div>
		</div>

		<!-- Subsystem list — always visible during boot, collapses during wizard -->
		{#if !isWizardPhase}
			<div class={cn(stack({ gap: "8" }), "w-full")}>
				{#each subsystems as sub (sub.name)}
					{@const Icon = getIcon(sub.name)}
					{@const label = stateToLabel(sub.state, sub.latencyMs)}
					<div
						class={cn(
							box({ paddingX: "12", paddingY: "6" }),
							"rounded-md",
							sub.state === "skipped" && "opacity-50",
						)}
						data-kind="box"
						data-slot="root"
					>
						<div class={hstack({ gap: "12", align: "center" })}>
							<Badge
								variant={stateToVariant(sub.state)}
								size="sm"
								decorative
								class="h-2 w-2 min-w-0 p-0"
							>
								&ZeroWidthSpace;
							</Badge>
							{#if Icon}
								{@const IconComponent = Icon}
								<IconComponent size={14} class="shrink-0 text-text-muted" />
							{/if}
							<Text size="sm" color={sub.state === "skipped" ? "muted" : "secondary"} class="flex-1">
								{DEV_MODE ? devLabel(sub.name) : resolveLabel(sub.name)}
							</Text>
							{#if label}
								<Text size="xs" color="muted">{label}</Text>
							{/if}
						</div>
					</div>
				{/each}

				{#if subsystems.length === 0}
					<Text size="xs" color="muted">Waiting for engine to start...</Text>
				{/if}
			</div>

			<!-- Progress bar -->
			<Progress
				value={platformState.progress}
				max={100}
				size="sm"
				class="w-full"
			/>

			<!-- Elapsed time -->
			{#if platformState.isBooting}
				<Text size="xs" color="muted">{platformState.bootElapsedFormatted} elapsed</Text>
			{/if}

			<!-- Error state -->
			{#if platformState.hasFailed && platformState.error}
				<div
					class={cn(
						box({ paddingX: "12", paddingY: "8" }),
						"w-full text-center rounded-md border border-[var(--signal-error)]/20 bg-[var(--signal-error)]/10",
					)}
					data-kind="box"
					data-slot="root"
				>
					<Text size="xs" color="accent">{platformState.error}</Text>
				</div>
			{/if}
		{/if}

		<!-- Model Setup Wizard Phase -->
		<!-- Shows when platform is ready but models aren't configured -->
		{#if isWizardPhase}
			{#await import("$lib/domains/app/models/components/ModelLoaderPanel.svelte") then module}
				<module.default onComplete={handleWizardComplete} />
			{/await}
		{/if}
	</div>
</div>
{/if}
