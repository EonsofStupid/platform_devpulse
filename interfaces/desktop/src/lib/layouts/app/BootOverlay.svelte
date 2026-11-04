<!--
  @file BootOverlay.svelte
  @module @devpulse/layouts/app/BootOverlay

  Full-viewport overlay during platform boot.
  Dual-mode boot progress: the owner's FriendlyBootView in the simple display,
  TechnicalBootView in the advanced one (the display setting picks, not the build).
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
import { Button } from "@devpulse/coldlight/components/button";
import { DynamicBackground } from "@devpulse/coldlight/components/dynamic-background";
import { Text } from "@devpulse/coldlight/components/text";
import { box, cn, stack } from "@devpulse/coldlight/utils";
import { presentationState } from "$lib/domains/app/devpulse/index.js";
import { LoadingContentCard } from "$lib/domains/clyffy/index.js";
import { logError, logInfo } from "$lib/sys/logger.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";
import FriendlyBootView from "./FriendlyBootView.svelte";
import TechnicalBootView from "./TechnicalBootView.svelte";

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

	<!-- Centered column: narrow for the friendly view, wide for the terminal log. -->
	<div class={cn(
		stack({ gap: "6", align: "center" }),
		"overflow-y-auto scrollbar-thin pointer-events-auto",
		"w-full max-h-[85vh] p-8",
		presentationState.advanced ? "max-w-3xl" : "max-w-md",
		"transition-all duration-300 ease-out",
	)}>
		{#if bootFailureMessage}
			<div class={cn(stack({ gap: "4", align: "start" }), "w-full p-4")} data-slot="boot-failure" role="alert">
				<Text size="lg" weight="bold">Boot failed</Text>
				<Text size="sm" color="secondary">
					DevPulse background services could not start. Details below;
					the full log is in the logs folder.
				</Text>
				<pre class="w-full overflow-auto whitespace-pre-wrap break-words p-2" data-slot="boot-failure-detail">{bootFailureMessage}</pre>
				<Button variant="secondary" size="sm" class="pointer-events-auto" onclick={openLogsFolder}>
					Open logs folder
				</Button>
			</div>
		{/if}

		<!-- Subsystem progress always visible during boot -->
		{#if presentationState.advanced}
			<TechnicalBootView />
		{:else}
			<FriendlyBootView />
		{/if}

		{#if !bootFailureMessage}
			<div class="flex items-center justify-center gap-2">
				<span class="inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full" data-slot="boot-pulse"></span>
				<Text size="sm" color="muted">{platformState.bootStepLabel}</Text>
			</div>
		{/if}

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
						"w-full",
					)}
					data-kind="box"
					data-slot="boot-failures"
				>
					<Text size="sm" weight="semibold" color="accent" class="mb-2">
						Core service failed — fix and restart the app
					</Text>
					<ul class="list-disc pl-4 text-left space-y-1">
						{#each subsystems.filter((s) => s.state === "failed") as sub (sub.name)}
							<li>
								<Text size="xs" color="secondary">
									{presentationState.label(sub.name)}
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

<style>
	[data-slot="boot-failure"] {
		border: var(--border-width-hairline) solid var(--signal-error);
		border-radius: var(--radius-md);
		background: color-mix(in oklch, var(--signal-error) 18%, var(--color-void-base));
	}

	[data-slot="boot-failure-detail"] {
		border-radius: var(--radius-sm);
		background: var(--color-void-base);
		font-size: var(--font-size-sm);
		opacity: 0.8;
	}

	[data-slot="boot-failures"] {
		border: var(--border-width-hairline) solid color-mix(in oklch, var(--signal-error) 25%, transparent);
		border-radius: var(--radius-md);
		background: color-mix(in oklch, var(--signal-error) 8%, transparent);
	}

	[data-slot="boot-pulse"] {
		background: var(--accent-teal-main);
	}
</style>
