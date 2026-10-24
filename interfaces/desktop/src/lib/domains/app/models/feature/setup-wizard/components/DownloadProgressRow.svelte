<!--
  @file DownloadProgressRow.svelte
  @domain models/setup-wizard

  Live download progress row consumed by the overlay role cards.
  Reads its state from a single `DownloadTracker` rune — the whole
  download event bridge (model:download-started / progress / complete
  / failed / cancelled) already routes into `wizardState` via
  `download-bootstrap.ts`, so this component is pure render.

  **What it shows**
  - Layman model name (not the raw filename).
  - Determinate progress bar with role-color fill.
  - Live MB-of-MB counter, MB/s speed, and ETA.
  - Phase label that swaps between "Starting...", "Downloading",
    "Verifying file...", "Importing into registry...", "Complete"
    based on the tracker's status + bytes state.
  - Cancel button while in flight. Retry + dismiss on failed /
    cancelled. Dismiss only on complete.

  **Accessibility**
  - The bar exposes `role="progressbar"` via the ColdLight
    `<Progress>` primitive with `aria-valuenow`, `aria-valuemin`,
    `aria-valuemax`, and a human-readable `aria-valuetext` built
    from the downloads copy templates.

  **Parent contract**
    interface Props {
      tracker: DownloadTracker;
      copy: DownloadsCopy;
      roleAccent?: "brain" | "minion" | "encoder" | "voice";
      onCancel: (downloadId: string) => void;
      onRetry: (tracker: DownloadTracker) => void;
      onDismiss: (downloadId: string) => void;
    }
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Progress } from "@devpulse/coldlight/components/progress";
import { Text } from "@devpulse/coldlight/components/text";
import { Check, RotateCcw, Trash2, X } from "lucide-svelte";
import type { DownloadsCopy, DownloadTracker } from "../wizard.types.js";

interface Props {
	tracker: DownloadTracker;
	copy: DownloadsCopy;
	/**
	 * Which of the four wizard role accents to tint the bar with.
	 * Defaults to the cyan accent when unset.
	 */
	roleAccent?: "brain" | "minion" | "encoder" | "voice";
	onCancel: (downloadId: string) => void;
	onRetry: (tracker: DownloadTracker) => void;
	onDismiss: (downloadId: string) => void;
}

let { tracker, copy, roleAccent, onCancel, onRetry, onDismiss }: Props = $props();

const percent = $derived(() => {
	if (tracker.totalBytes === 0) return 0;
	const raw = (tracker.bytesDownloaded / tracker.totalBytes) * 100;
	return Math.max(0, Math.min(100, Math.round(raw)));
});

function formatMb(bytes: number): string {
	if (bytes <= 0) return "0";
	return (bytes / (1024 * 1024)).toFixed(bytes < 100 * 1024 * 1024 ? 1 : 0);
}

function formatSpeedMbPerS(bytesPerSec: number): string {
	if (bytesPerSec <= 0) return "0";
	return (bytesPerSec / (1024 * 1024)).toFixed(1);
}

const bytesMbLabel = $derived(formatMb(tracker.bytesDownloaded));
const totalMbLabel = $derived(formatMb(tracker.totalBytes));
const speedMbLabel = $derived(formatSpeedMbPerS(tracker.speedBps));

const etaLabel = $derived(() => {
	if (tracker.speedBps <= 0) return copy.eta_computing_label;
	const remaining = Math.max(0, tracker.totalBytes - tracker.bytesDownloaded);
	const seconds = Math.ceil(remaining / tracker.speedBps);
	if (seconds <= 60) {
		return copy.eta_seconds_template.replace("{seconds}", String(seconds));
	}
	const minutes = Math.ceil(seconds / 60);
	return copy.eta_template.replace("{minutes}", String(minutes));
});

const phaseLabel = $derived(() => {
	switch (tracker.status) {
		case "queued":
			return copy.starting_label;
		case "downloading":
			if (tracker.totalBytes === 0) return copy.starting_label;
			return `${percent()}%`;
		case "complete":
			return copy.complete_label;
		case "failed":
			return copy.failed_label_template.replace("{error}", tracker.error ?? "Unknown error");
		case "cancelled":
			return copy.cancelled_label;
	}
});

const ariaValueText = $derived(
	copy.progress_aria_template
		.replace("{percent}", String(percent()))
		.replace("{bytes_mb}", bytesMbLabel)
		.replace("{total_mb}", totalMbLabel)
		.replace("{speed_mb_per_s}", speedMbLabel),
);

const rowAriaLabel = $derived(
	copy.row_aria_template
		.replace("{model_name}", tracker.friendlyName)
		.replace("{percent}", String(percent()))
		.replace("{total_mb}", `${totalMbLabel} MB`),
);

const isInFlight = $derived(tracker.status === "queued" || tracker.status === "downloading");
const isFailed = $derived(tracker.status === "failed" || tracker.status === "cancelled");
const isComplete = $derived(tracker.status === "complete");
</script>

<div
	class="dpr"
	class:dpr-brain={roleAccent === "brain"}
	class:dpr-minion={roleAccent === "minion"}
	class:dpr-encoder={roleAccent === "encoder"}
	class:dpr-voice={roleAccent === "voice"}
	aria-label={rowAriaLabel}
>
	<div class="dpr-head">
		<div class="dpr-name">
			<Text size="sm" weight="bold">{tracker.friendlyName}</Text>
			<Text size="xs" color="muted">{phaseLabel()}</Text>
		</div>
		<div class="dpr-actions">
			{#if isInFlight}
				<Button
					variant="ghost"
					size="sm"
					onclick={() => onCancel(tracker.downloadId)}
					aria-label={copy.cancel_aria}
				>
					<X size={14} aria-hidden="true" />
					{copy.cancel_label}
				</Button>
			{:else if isFailed}
				<Button
					variant="secondary"
					size="sm"
					onclick={() => onRetry(tracker)}
					aria-label={copy.retry_aria}
				>
					<RotateCcw size={14} aria-hidden="true" />
					{copy.retry_label}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onclick={() => onDismiss(tracker.downloadId)}
					aria-label={copy.dismiss_aria}
				>
					<Trash2 size={14} aria-hidden="true" />
				</Button>
			{:else if isComplete}
				<Button
					variant="ghost"
					size="sm"
					onclick={() => onDismiss(tracker.downloadId)}
					aria-label={copy.dismiss_aria}
				>
					<Check size={14} aria-hidden="true" />
					{copy.dismiss_label}
				</Button>
			{/if}
		</div>
	</div>

	<Progress
		value={percent()}
		min={0}
		max={100}
		size="md"
		aria-label={rowAriaLabel}
		aria-valuetext={ariaValueText}
	/>

	{#if isInFlight && tracker.totalBytes > 0}
		<div class="dpr-stats">
			<Text size="xs" color="muted">
				{bytesMbLabel} MB / {totalMbLabel} MB
			</Text>
			<Text size="xs" color="muted">
				{copy.speed_template.replace("{mb_per_s}", speedMbLabel)}
			</Text>
			<Text size="xs" color="muted">{etaLabel()}</Text>
		</div>
	{/if}
</div>

<style>
	.dpr {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 0.875rem;
		border-radius: var(--radius-md, 0.5rem);
		border: 0.0625rem solid var(--border-subtle, #1a2030);
		background: color-mix(in oklch, var(--surface-inset, #080d18) 70%, transparent);
	}
	.dpr-brain {
		border-color: color-mix(in oklch, var(--wizard-role-brain-main) 45%, transparent);
		background: color-mix(in oklch, var(--wizard-role-brain-fill) 60%, var(--surface-inset));
	}
	.dpr-minion {
		border-color: color-mix(in oklch, var(--wizard-role-minion-main) 45%, transparent);
		background: color-mix(in oklch, var(--wizard-role-minion-fill) 60%, var(--surface-inset));
	}
	.dpr-encoder {
		border-color: color-mix(in oklch, var(--wizard-role-encoder-main) 45%, transparent);
		background: color-mix(in oklch, var(--wizard-role-encoder-fill) 60%, var(--surface-inset));
	}
	.dpr-voice {
		border-color: color-mix(in oklch, var(--wizard-role-voice-main) 45%, transparent);
		background: color-mix(in oklch, var(--wizard-role-voice-fill) 60%, var(--surface-inset));
	}

	.dpr-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}
	.dpr-name {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
		flex: 1;
	}
	.dpr-actions {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.dpr-stats {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
</style>
