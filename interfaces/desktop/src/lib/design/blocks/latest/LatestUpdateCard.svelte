<!--
	@block LatestUpdateCard
	@module @devpulse/design/blocks/latest

	The Latest tab's primary affordance: current build version, available
	update banner, install + restart button, channel picker, live download
	progress.

	# Lifecycle states

	The card mirrors `updatesState.phase`:

	- `idle`        — last check returned no update OR no check has run yet
	- `checking`    — IPC in flight to `check_for_update`
	- `available`   — endpoint advertised a newer version, install button live
	- `downloading` — bytes flowing, progress bar showing real percentage
	- `restarting`  — installer launched, app about to die
	- `error`       — last attempt threw; reason shown in inline-message

	# Local-first

	Network failures (no internet, GitHub down, malformed `latest.json`) land
	in `error` phase with a recoverable inline message. The card never blocks
	the rest of the Latest tab from rendering — knowledge + community panels
	mount independently.

	# Accessibility

	`role="region"` with `aria-labelledby` so screen readers announce the
	whole card by its title. The download progress is `role="progressbar"`
	with explicit `aria-valuenow/min/max` when bytes are known, falling back
	to `aria-valuetext="downloading"` for indeterminate sources.
-->
<script lang="ts">
import { RefreshCcw, Sparkles } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { InlineMessage } from "$lib/design/components/inline-message/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { updatesState } from "$lib/domains/app/updates/index.js";

const titleId = "latest-update-card-title";
const progressId = "latest-update-card-progress";

const info = $derived(updatesState.info);
const phase = $derived(updatesState.phase);
const progress = $derived(updatesState.progress);
const channel = $derived(updatesState.channel);
const lastCheckedAt = $derived(updatesState.lastCheckedAt);

const downloadPercent = $derived.by(() => {
	const p = updatesState.progress;
	if (!p || !p.totalBytes || p.totalBytes <= 0) return null;
	return Math.min(100, Math.round((p.downloadedBytes / p.totalBytes) * 100));
});

const lastCheckedLabel = $derived.by(() => {
	if (lastCheckedAt === null) return "never";
	const secondsAgo = Math.max(0, Math.round((Date.now() - lastCheckedAt) / 1000));
	if (secondsAgo < 60) return `${secondsAgo}s ago`;
	if (secondsAgo < 3600) return `${Math.round(secondsAgo / 60)}m ago`;
	return `${Math.round(secondsAgo / 3600)}h ago`;
});

async function onCheck(): Promise<void> {
	await updatesState.checkNow();
}

async function onInstall(): Promise<void> {
	await updatesState.installNow();
}
</script>

<section
	aria-labelledby={titleId}
	class={cn(
		"relative w-full rounded-[var(--radius-lg,0.75rem)]",
		"border border-[var(--border-soft,oklch(0.4234_0.081_173.37_/_0.22))]",
		"bg-[var(--surface-1,oklch(0.0901_0.017_224.61_/_0.8))]",
		"shadow-[0_0.0625rem_0.1875rem_oklch(0_0_0_/_0.12),0_0.0625rem_0.125rem_oklch(0_0_0_/_0.24)]",
		"p-[clamp(1rem,2.5vw,1.75rem)]",
		stack({ gap: "4" }),
	)}
	data-block="latest-update-card"
	data-phase={phase}
>
	<!-- Accent ribbon — fluid clamp, semantic accent token -->
	<div
		aria-hidden="true"
		class="absolute left-0 top-0 h-full w-1 rounded-l-[var(--radius-lg,0.75rem)]"
		style="background: var(--accent-blue-main, oklch(0.65 0.18 240))"
	></div>

	<!-- Header: current version + channel -->
	<header class="flex items-start justify-between gap-4">
		<div class={stack({ gap: "1" })}>
			<Heading level={2} size="md" id={titleId} class="font-semibold">
				This build
			</Heading>
			<Text size="sm" color="muted">
				DevPulse <span class="font-mono">v{info?.currentVersion ?? "—"}</span> ·
				channel <span class="font-mono">{channel}</span>
			</Text>
		</div>
		<div class="text-right">
			<Text size="xs" color="muted">last checked</Text>
			<Text size="sm">{lastCheckedLabel}</Text>
		</div>
	</header>

	<!-- Body switches on phase -->
	{#if phase === "available" && info?.available}
		<div
			class={cn(stack({ gap: "3" }), "rounded-md border p-4")}
			style="background: color-mix(in oklch, var(--accent-blue-main) 18%, transparent); border-color: var(--accent-blue-main)"
		>
			<div class="flex items-center gap-2">
				<Sparkles size={16} aria-hidden="true" />
				<Text size="base" weight="bold">
					v{info.latestVersion} is ready to install
				</Text>
			</div>

			{#if info.publishedAt}
				<Text size="xs" color="muted">published {info.publishedAt}</Text>
			{/if}

			{#if info.notes}
				<details class="rounded-md border border-[var(--border-subtle,oklch(0.42_0.08_173_/_0.22))] p-3">
					<summary class="cursor-pointer text-sm font-medium">Release notes</summary>
					<div class="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{info.notes}</div>
				</details>
			{/if}

			<div class="flex flex-wrap gap-2">
				<Button preset="primary" size="md" onclick={onInstall}>
					Install and restart
				</Button>
				<Button preset="ghost" size="md" onclick={onCheck}>
					<RefreshCcw size={14} class="mr-1" /> Re-check
				</Button>
			</div>
		</div>
	{:else if phase === "downloading"}
		<div class={stack({ gap: "2" })}>
			<Text size="sm" weight="bold">Downloading v{info?.latestVersion ?? "?"}…</Text>
			<div
				id={progressId}
				role="progressbar"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={downloadPercent ?? undefined}
				aria-valuetext={downloadPercent === null ? "downloading" : `${downloadPercent} percent`}
				class="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2,oklch(0.16_0.03_224_/_0.6))]"
			>
				<div
					class="h-full transition-[width] duration-150 ease-out"
					style="width: {downloadPercent ?? 30}%; background: var(--accent-blue-main, oklch(0.65 0.18 240));"
				></div>
			</div>
			{#if progress}
				<Text size="xs" color="muted">
					{(progress.downloadedBytes / 1_048_576).toFixed(1)} MB
					{#if progress.totalBytes}
						/ {(progress.totalBytes / 1_048_576).toFixed(1)} MB
					{/if}
				</Text>
			{/if}
		</div>
	{:else if phase === "restarting"}
		<InlineMessage tone="info">
			Restarting DevPulse to finish the update…
		</InlineMessage>
	{:else if phase === "checking"}
		<InlineMessage tone="info">Checking for updates…</InlineMessage>
	{:else if phase === "error"}
		<div class={stack({ gap: "2" })}>
			<InlineMessage tone="danger">
				Update check failed: {updatesState.error ?? "unknown error"}
			</InlineMessage>
			<Button preset="ghost" size="sm" onclick={onCheck}>
				<RefreshCcw size={14} class="mr-1" /> Try again
			</Button>
		</div>
	{:else}
		<!-- idle / up-to-date -->
		<div class={stack({ gap: "3" })}>
			<Text size="sm">
				{#if lastCheckedAt !== null}
					You're on the latest version. Click below to re-check.
				{:else}
					No check has run yet. Click below to look for updates.
				{/if}
			</Text>
			<div>
				<Button preset="primary" size="md" onclick={onCheck}>
					<RefreshCcw size={14} class="mr-2" />
					Check for updates
				</Button>
			</div>
		</div>
	{/if}

	<!-- Channel footer — only stable is shipping; surface is forward-compatible. -->
	<footer class="border-t border-[var(--border-soft,oklch(0.4234_0.081_173.37_/_0.22))] pt-3">
		<Text size="xs" color="muted">
			Currently on the <strong>stable</strong> channel. Beta and nightly
			channels arrive once the publish workflow grows tag-based splits.
		</Text>
	</footer>
</section>
