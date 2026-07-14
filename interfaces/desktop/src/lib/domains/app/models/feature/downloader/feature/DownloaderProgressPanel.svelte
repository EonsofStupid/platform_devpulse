<!--
	@feature DownloaderProgressPanel
	@module @devpulse/domains/app/models/feature/downloader/feature

	Downloading-phase panel — aggregate progress bar + cancel button.

	Pulls bytes / total / speed from the activity-hud `downloadState`
	rune. For the install-chain path (`installToSlot`), the underlying
	HF download fires its own `DownloadStarted/Progress/Complete`
	events, which `downloadState` captures with the same repo_id +
	filename the downloader selected — so we match on that key rather
	than threading a separate id through the install chain.

	ARIA:
	  - `<progress>` element carries `aria-valuetext` from the copy
	    template (units in layman words for screen readers).
	  - "Cancel download" is a `<button>` with explicit `aria-label`.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { downloadState } from "$lib/sys/activity-hud/download.state.svelte.js";
import type { DownloaderCopy } from "$lib/sys/generated/bindings.js";
import { modelDownloaderState } from "../data-access/downloader.state.svelte.js";

interface Props {
	copy: DownloaderCopy;
	class?: string;
}

let { copy, class: className }: Props = $props();

// Match the in-flight download by repo + filename. Install chains
// don't surface the inner download_id, so identity falls back to the
// repo/filename pair the user selected. There can only be one
// in-flight download per repo+filename at a time (kernel-side dedupe).
const active = $derived.by(() => {
	const sel = modelDownloaderState.selection;
	if (!sel) return null;
	const direct = modelDownloaderState.activeDownloadId
		? (downloadState.list.find((d) => d.downloadId === modelDownloaderState.activeDownloadId) ??
			null)
		: null;
	if (direct) return direct;
	return (
		downloadState.list.find(
			(d) =>
				d.repoId === sel.repoId && d.filename === sel.primaryFilename && d.status === "downloading",
		) ?? null
	);
});

const percent = $derived.by(() => {
	if (!active || active.totalBytes <= 0) return 0;
	const raw = (active.bytesDownloaded / active.totalBytes) * 100;
	return Math.max(0, Math.min(100, Math.round(raw * 10) / 10));
});

const bytesMb = $derived(active ? (active.bytesDownloaded / 1_048_576).toFixed(1) : "0");
const totalMb = $derived(active ? (active.totalBytes / 1_048_576).toFixed(1) : "—");
const speedMbPerS = $derived(active ? (active.speedBps / 1_048_576).toFixed(2) : "—");

const progressLabel = $derived(
	copy.downloading_progress_template
		.replace("{percent}", String(percent))
		.replace("{bytes_mb}", bytesMb)
		.replace("{total_mb}", totalMb)
		.replace("{speed_mb_per_s}", speedMbPerS),
);

const ariaLabel = $derived(
	copy.downloading_aria_template
		.replace("{percent}", String(percent))
		.replace("{bytes_mb}", bytesMb)
		.replace("{total_mb}", totalMb)
		.replace("{speed_mb_per_s}", speedMbPerS),
);

async function handleCancel(): Promise<void> {
	await modelDownloaderState.cancel();
}
</script>

<section
	class={cn("progress-panel", className)}
	aria-labelledby="downloader-progress-heading"
>
	<h3 id="downloader-progress-heading" class="progress-panel__heading">
		{copy.downloading_phase_heading}
	</h3>

	{#if modelDownloaderState.selection}
		<p class="progress-panel__repo">{modelDownloaderState.selection.repoId}</p>
	{/if}

	<div class="progress-panel__bar-wrapper">
		<div
			class="progress-panel__bar-track"
			role="progressbar"
			aria-valuemin="0"
			aria-valuemax="100"
			aria-valuenow={percent}
			aria-valuetext={ariaLabel}
		>
			<div class="progress-panel__bar-fill" style:width="{percent}%"></div>
		</div>
		<p class="progress-panel__bar-label">{progressLabel}</p>
	</div>

	<div class="progress-panel__actions">
		<button
			type="button"
			class="progress-panel__cancel"
			aria-label={copy.downloading_cancel_aria}
			onclick={handleCancel}
		>
			{copy.downloading_cancel_label}
		</button>
	</div>
</section>

<style>
	.progress-panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-14);
		min-height: 0;
		flex: 1;
		justify-content: center;
	}

	.progress-panel__heading {
		margin: 0;
		font-size: var(--space-16);
		font-weight: 600;
		color: var(--text-primary);
		text-align: center;
	}

	.progress-panel__repo {
		margin: 0;
		font-size: var(--space-12);
		font-family: var(--font-family-mono, monospace);
		color: var(--accent-teal-main);
		text-align: center;
	}

	.progress-panel__bar-wrapper {
		display: flex;
		flex-direction: column;
		gap: var(--space-7);
	}

	.progress-panel__bar-track {
		position: relative;
		width: 100%;
		height: var(--space-14);
		border-radius: var(--radius-md);
		background: var(--surface-inset);
		overflow: hidden;
		border: 0.0625rem solid var(--border-subtle);
	}

	.progress-panel__bar-fill {
		position: absolute;
		inset: 0;
		background: var(--gradient-mesh-aurora);
		transition: width 0.2s ease-out;
	}

	.progress-panel__bar-label {
		margin: 0;
		text-align: center;
		font-size: var(--space-12);
		color: var(--text-secondary);
		font-variant-numeric: tabular-nums;
	}

	.progress-panel__actions {
		display: flex;
		justify-content: center;
	}

	.progress-panel__cancel {
		padding: var(--space-8) var(--space-16);
		border-radius: var(--radius-sm);
		background: transparent;
		border: 0.0625rem solid var(--accent-danger-main, var(--border-strong));
		color: var(--accent-danger-main, var(--text-primary));
		font-size: var(--space-12);
		font-weight: 600;
		cursor: pointer;
	}

	.progress-panel__cancel:hover {
		opacity: 0.85;
	}

	.progress-panel__cancel:focus-visible {
		outline: 0.125rem solid var(--border-focus);
		outline-offset: 0.125rem;
	}
</style>
