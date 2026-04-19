<!--
  @file BootOverlay.svelte
  @module @devpulse/layouts/app/BootOverlay

  Full-viewport overlay during platform boot.
  Phase 1: Subsystem progress (narrow centered column).
  Phase 2: Model setup wizard (wider, scrollable).
  Fades out and unmounts only when platform + models are fully ready.
  No timeout dismissal — core services must complete or fail visibly.

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
import { wizardState } from "$lib/domains/app/models/feature/setup-wizard/index.js";
import { LoadingContentCard } from "$lib/domains/clyffy/index.js";
import { DEV_MODE, devLabel, resolveLabel } from "$lib/sys/generated/terminology.js";
import { getIcon } from "$lib/sys/generated/terminology-icons.js";
import type { SubsystemState } from "$lib/sys/runes/platformState.svelte.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";

let visible = $state(true);
let fading = $state(false);

const subsystems = $derived(platformState.subsystemList());
const bootComplete = $derived(platformState.isReady);
const hasSubsystemFailure = $derived(platformState.hasSubsystemFailure);

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

// When boot completes, open wizard ONLY if first run or models not ready.
// If setup is already done → dismiss overlay, user lands on dashboard.
let wizardOpened = $state(false);
$effect(() => {
	if (bootComplete && !wizardOpened) {
		wizardOpened = true;

		if (platformState.modelsFirstRun || !platformState.modelsReady) {
			console.info("[BootOverlay] Boot complete — first run or models not ready, opening wizard");
			wizardState.goTo("welcome");
			wizardState.open();
		} else {
			console.info("[BootOverlay] Boot complete — setup done, skipping wizard → dashboard");
		}

		fading = true;
		setTimeout(() => {
			visible = false;
		}, 600);
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
		animated
	/>

	<!--
		Two-phase container:
		Boot phase → narrow centered column (400px) for subsystem list.
		Wizard phase → wider (768px) with scroll for model setup.
	-->
	<div class={cn(
		stack({ gap: "6", align: "center" }),
		"overflow-y-auto scrollbar-thin pointer-events-auto",
		"min-w-[320px] max-w-[400px] max-h-[85vh] p-8",
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
		<!-- Subsystem progress always visible during boot -->
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

			<!-- Rotating DYK / KDROPS / T&T content while waiting -->
			{#if platformState.isBooting}
				<div class="w-full max-w-[24rem]">
					<LoadingContentCard rotateEveryMs={9000} />
				</div>
			{/if}

			<!-- Error state — boot phase failed or platform error string -->
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

			<!-- Subsystem failures — blocking until resolved; no timeout escape -->
			{#if hasSubsystemFailure}
				<div
					class={cn(
						box({ paddingX: "12", paddingY: "8" }),
						"w-full rounded-md border border-[var(--signal-error)]/25 bg-[var(--signal-error)]/8",
					)}
					data-kind="box"
					data-slot="root"
				>
					<Text size="sm" weight="semibold" color="accent" class="mb-2">
						Core service failed — fix and restart the app
					</Text>
					<ul class="list-disc pl-4 text-left space-y-1">
						{#each subsystems.filter((s) => s.state === "failed") as sub (sub.name)}
							<li>
								<Text size="xs" color="secondary">
									{DEV_MODE ? devLabel(sub.name) : resolveLabel(sub.name)}
									{#if sub.message}
										— {sub.message}
									{/if}
								</Text>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

		<!-- Model setup now lives in the shell-mounted overlay. -->
	</div>
</div>
{/if}
