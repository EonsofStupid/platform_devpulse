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
import { listen } from "@tauri-apps/api/event";
import { onMount } from "svelte";
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
import { logError, logInfo } from "$lib/sys/logger.js";
import type { SubsystemState } from "$lib/sys/runes/platformState.svelte.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";

let visible = $state(true);
let fading = $state(false);
let bootFailureMessage = $state<string | null>(null);

onMount(() => {
	// Listen for platform:boot-failed emitted by the boot_task supervisor
	// in src-tauri/src/lib.rs. A non-empty payload means the Rust
	// boot_task panicked or failed in a way that the per-subsystem event
	// stream cannot recover from; surface the message verbatim so the
	// user sees a root cause instead of a frozen spinner.
	const unlistenPromise = listen<string>("platform:boot-failed", (event) => {
		const msg = typeof event.payload === "string" ? event.payload : String(event.payload);
		bootFailureMessage = msg;
		logError("layouts.app.BootOverlay", `platform:boot-failed → ${msg}`);
	})
		.then((fn) => {
			logInfo("layouts.app.BootOverlay", "listening for platform:boot-failed");
			return fn;
		})
		.catch((e) => {
			logError("layouts.app.BootOverlay", `failed to attach platform:boot-failed listener: ${e}`);
			return null;
		});
	return () => {
		void unlistenPromise.then((unlisten) => unlisten?.());
	};
});

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
// a model. There is no auto-install path. There never was a
// product-supported one: the prior `baselineState.kick()` here
// silently fired 13 concurrent installs against a tier-keyed preset
// table whose entries had drifted (dead repos, wrong filename
// casing), and lock-fought hf-hub's shared blob cache. The fix is
// not to repair the preset table — the lock says cloud sync /
// preset downloads stay opt-in and never gate the app. The fix is
// to never fire on boot. User-initiated downloads remain wired
// through the existing `installToSlot` / `downloadModel` IPC; this
// surface just stops auto-triggering them.
//
// Gate on `modelsStatusReceived` — the engine emits `platform:ready`
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
		// Wizard auto-open — TWO-STAGE (standalone-first). The app always
		// loads Tier-1; the only question the wizard must force on the
		// customer is the CONNECT-OR-SKIP decision, exactly once. The old
		// gate keyed off `platformState.modelsReady` (local slot
		// assignments) — permanently false under the connect-based model,
		// which force-opened the wizard on every launch. The decision flag
		// is persisted by connect_clyffy / skip_clyffy_setup; re-entry
		// stays available from the status surfaces after Skip.
		void import("$lib/sys/generated/bindings.js")
			.then(({ commands }) => commands.isClyffySetupDecided())
			.then((r) => {
				if (r.status === "ok" && !r.data) {
					wizardState.goTo("endpoint");
					wizardState.open();
					logInfo(
						"layouts.app.BootOverlay",
						"Connect-or-skip undecided — opened setup wizard on the endpoint step",
					);
				} else if (r.status === "error") {
					logInfo(
						"layouts.app.BootOverlay",
						`Couldn't read setup decision (${String(r.error)}) — staying standalone, no forced wizard`,
					);
				}
			})
			.catch((e) => {
				logError("layouts.app.BootOverlay", `setup-decision check failed: ${e}`);
			});
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
		{#if bootFailureMessage}
			<div
				class={cn(
					stack({ gap: "4", align: "start" }),
					"w-full rounded-md border border-[var(--accent-danger-main)] bg-[color-mix(in_oklch,var(--accent-danger-main)_18%,var(--color-void-base,oklch(0.08_0.01_220)))] p-4",
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
