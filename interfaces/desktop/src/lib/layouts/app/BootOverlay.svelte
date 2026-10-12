<!--
  @file BootOverlay.svelte
  @module @devpulse/layouts/app/BootOverlay

  Full-viewport overlay during platform boot.
  Subsystem progress (narrow centered column).
  Fades out and unmounts once the platform is ready and the first models
  readiness snapshot has arrived.
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
import { LoadingContentCard } from "$lib/domains/clyffy/index.js";
import { DEV_MODE, devLabel, resolveLabel } from "$lib/sys/generated/terminology.js";
import { getIcon } from "$lib/sys/generated/terminology-icons.js";
import { logError, logInfo } from "$lib/sys/logger.js";
import type { SubsystemState } from "$lib/sys/runes/platformState.svelte.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";

let visible = $state(true);
let fading = $state(false);

// Rust's boot state carries the failure — a failed boot step or a panic in
// the boot task — so the user sees the root cause instead of a frozen spinner.
const bootFailureMessage = $derived(platformState.hasFailed ? platformState.error : null);

async function openLogsFolder() {
	try {
		const { commands } = await import("$lib/sys/generated/bindings.js");
		const r = await commands.openActionLogsFolder();
		if (r.status === "error") {
			throw new Error(typeof r.error === "string" ? r.error : String(r.error));
		}
	} catch (e) {
		logError("layouts.app.BootOverlay", `could not open logs folder: ${e}`);
	}
}

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

// Boot is silent on model loading. The platform reports ready, the
// BootOverlay fades, the dashboard renders the registry contents
// (DevPulse models dir + the Hugging Face hub cache merged via
// `Registry::scan`). The user opens the `ModelDownloaderOverlay`
// explicitly — from the dashboard widget, the sidebar nav, or a
// per-slot card in the slot orchestrator devtool — to add or assign
// a model. Nothing installs on boot; every download starts from the
// user's click (`installToSlot` / `downloadModel`).
//
// Gate on `modelsStatusReceived` — the kernel emits `platform:ready`
// and `platform:models-status` as separate events. Without this gate
// the overlay would fade before the first authoritative models
// snapshot reaches the rune store, leaving the dashboard briefly
// rendering against the default `modelsReady=false` / `modelsFirstRun=true`
// placeholder values.
let faded = $state(false);
$effect(() => {
	if (bootComplete && platformState.modelsStatusReceived && !faded) {
		faded = true;
		logInfo(
			"layouts.app.BootOverlay",
			`Boot complete — modelsReady=${platformState.modelsReady} firstRun=${platformState.modelsFirstRun} — dashboard takes over`,
		);
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

	<!-- Narrow centered column (400px) for the subsystem list. -->
	<div class={cn(
		stack({ gap: "6", align: "center" }),
		"overflow-y-auto scrollbar-thin pointer-events-auto",
		"min-w-[320px] max-w-[400px] max-h-[85vh] p-8",
		"transition-all duration-300 ease-out",
	)}>
		{#if bootFailureMessage}
			<div
				class={cn(
					stack({ gap: "4", align: "start" }),
					"w-full rounded-md border border-[var(--accent-red-main,oklch(0.62_0.22_25))] bg-[color-mix(in_oklch,var(--accent-red-main,oklch(0.62_0.22_25))_18%,var(--color-void-base,oklch(0.08_0.01_220)))] p-4",
				)}
				role="alert"
			>
				<Text size="lg" weight="bold">Boot failed</Text>
				<Text size="sm" color="secondary">
					DevPulse background services could not start. Details below;
					the full log is in the logs folder.
				</Text>
				<pre
					class="w-full overflow-auto whitespace-pre-wrap break-words rounded bg-[var(--color-void-base,oklch(0.08_0.01_220))] p-2 text-xs opacity-80"
				>{bootFailureMessage}</pre>
				<button
					type="button"
					class="pointer-events-auto rounded border border-[var(--accent-teal-main)] bg-[color-mix(in_oklch,var(--accent-teal-main)_18%,transparent)] px-3 py-1.5 text-xs hover:bg-[color-mix(in_oklch,var(--accent-teal-main)_28%,transparent)]"
					onclick={openLogsFolder}
				>
					Open logs folder
				</button>
			</div>
		{:else}
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
		{/if}

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
