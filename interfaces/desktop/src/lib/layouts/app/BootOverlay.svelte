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
import { invoke } from "@tauri-apps/api/core";
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
	if (platformState.isFullyReady && !fading) {
		fading = true;
		setTimeout(() => {
			visible = false;
		}, 600);
	}
});

// Boot timeout — if the engine hasn't finished in 30 seconds,
// dismiss the overlay anyway so the user can interact. The
// platform continues booting services in the background. Better
// a partially-booted app than a permanently-frozen splash.
$effect(() => {
	if (!visible) return;
	const timer = setTimeout(() => {
		if (visible && !platformState.isFullyReady) {
			console.warn("[boot-overlay] Boot timeout after 30s — dismissing overlay to unblock UI");
			fading = true;
			setTimeout(() => {
				visible = false;
			}, 600);
		}
	}, 30_000);
	return () => clearTimeout(timer);
});

// When the wizard phase kicks in (platform is ready but models
// need setup), open the SetupWizardOverlay (which lives as a
// sibling inside Frame.svelte) and dismiss this boot overlay.
// The old implementation navigated to `/model-loader/models`
// which was a route that NO LONGER EXISTS — the wizard was
// absorbed into the overlay component per the 2026-04-11 ruling.
let wizardNavigated = $state(false);
$effect(() => {
	if (isWizardPhase && !wizardNavigated) {
		wizardNavigated = true;
		// Import wizardState lazily to avoid a circular dep
		// (BootOverlay lives under layouts/, wizardState under domains/).
		import("$lib/domains/app/models/features/setup-wizard/wizard.runes.svelte.js")
			.then(({ wizardState }) => {
				wizardState.open();
				visible = false;
			})
			.catch((e) => {
				console.error("[boot-overlay] Failed to open wizard:", e);
				visible = false;
			});
	}
});
</script>

{#if visible}
<div
	class={cn(
		"fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none",
		"transition-opacity duration-500 ease-out",
		fading && "opacity-0",
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
		"overflow-y-auto scrollbar-thin pointer-events-auto",
		isWizardPhase
			? "w-full h-full"
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

		<!--
			Model Setup Wizard Phase — navigation happens in the
			`$effect` at the top of the script block. Nothing renders
			here because the route-based wizard at /model-loader/models
			owns the wizard UI and this overlay is about to unmount.
		-->
	</div>
</div>
{/if}

<style>
	.wizard-gate {
		width: 100%;
		max-width: 26rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.625rem;
		text-align: center;
		padding: 1rem 1.25rem;
		border-radius: 0.875rem;
		border: 1px solid var(--border-subtle, #1a2030);
		background: var(--glass-deep, oklch(0.12 0.015 220 / 0.84));
		box-shadow: 0 14px 32px oklch(0 0 0 / 0.35);
	}
	.wizard-gate-chip {
		display: inline-flex;
		align-items: center;
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.2rem 0.5rem;
		border-radius: 9999px;
		color: var(--brand-cyan, #17deef);
		background: oklch(0.82 0.14 195 / 0.11);
		border: 1px solid oklch(0.82 0.14 195 / 0.3);
	}
</style>
