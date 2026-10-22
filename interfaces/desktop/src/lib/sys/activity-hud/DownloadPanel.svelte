<!--
  @file DownloadPanel.svelte
  Platform-level download tracker. NOT part of the wizard.
  Shows all active model downloads with progress/speed/ETA.
  Accessible via devtools. Downloads survive wizard close.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Text } from "@devpulse/coldlight/components/text";
import { Download, X } from "lucide-svelte";
import { onMount } from "svelte";
import { cancelDownload } from "$lib/domains/app/models/index.js";
import { type ActiveDownload, downloadState } from "./download.state.svelte.js";
import { installState } from "./install.state.svelte.js";

// Activity-hud states attach their Tauri event listeners lazily — the
// first time any consumer mounts. Both classes guard with an internal
// `booted` flag, so calling boot() repeatedly is a no-op. We boot the
// install state alongside the download state because the new
// install_to_slot chain emits both `model:download-*` and
// `model:install-*` events; consumers of either need both to wire.
onMount(() => {
	void downloadState.boot();
	void installState.boot();
});

function formatSpeed(bps: number): string {
	const mbps = bps / (1024 * 1024);
	if (mbps >= 1) return `${mbps.toFixed(1)} MB/s`;
	const kbps = bps / 1024;
	return `${kbps.toFixed(0)} KB/s`;
}

function formatEta(dl: ActiveDownload): string {
	if (dl.totalBytes <= 0 || dl.speedBps <= 0) return "";
	const remaining = dl.totalBytes - dl.bytesDownloaded;
	const secs = remaining / dl.speedBps;
	if (secs > 60) return `${Math.ceil(secs / 60)} min`;
	return `${Math.ceil(secs)}s`;
}

function formatMb(bytes: number): string {
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function progressPct(dl: ActiveDownload): number {
	if (dl.totalBytes <= 0) return 0;
	return Math.min(100, (dl.bytesDownloaded / dl.totalBytes) * 100);
}

async function handleCancel(downloadId: string): Promise<void> {
	try {
		await cancelDownload(downloadId);
	} catch (e) {
		console.error("Cancel failed:", e);
	}
}

function statusTone(
	status: ActiveDownload["status"],
): "positive" | "negative" | "informative" | "neutral" {
	if (status === "complete") return "positive";
	if (status === "failed") return "negative";
	if (status === "downloading") return "informative";
	return "neutral";
}
</script>

<div class="download-panel">
	<div class="panel-header">
		<Heading level={4} size="sm">
			<Download size={16} />
			Downloads
		</Heading>
		{#if downloadState.activeCount > 0}
			<Badge variant="informative" size="sm">{downloadState.activeCount} active</Badge>
		{/if}
	</div>

	{#if downloadState.list.length === 0}
		<div class="empty-state">
			<Text size="sm" class="empty-text">No active downloads</Text>
		</div>
	{:else}
		<div class="download-list">
			{#each downloadState.list as dl (dl.downloadId)}
				<div class="download-row">
					<div class="dl-info">
						<Text size="sm" weight="bold" class="dl-filename">{dl.filename}</Text>
						{#if dl.repoId}
							<Text size="xs" class="dl-repo">{dl.repoId}</Text>
						{/if}
					</div>

					{#if dl.status === "downloading"}
						<div class="dl-progress">
							<div class="progress-bar">
								<div class="progress-fill" style:width="{progressPct(dl)}%"></div>
							</div>
							<div class="dl-stats">
								<Text size="xs" class="dl-stat">{formatMb(dl.bytesDownloaded)} / {formatMb(dl.totalBytes)}</Text>
								<Text size="xs" class="dl-stat">{formatSpeed(dl.speedBps)}</Text>
								{#if formatEta(dl)}
									<Text size="xs" class="dl-stat">{formatEta(dl)} left</Text>
								{/if}
							</div>
						</div>
						<Button variant="ghost" size="sm" onclick={() => handleCancel(dl.downloadId)} aria-label="Cancel download">
							<X size={14} />
						</Button>
					{:else}
						<Badge variant={statusTone(dl.status)} size="sm">
							{dl.status === "complete" ? "Complete" : dl.status === "failed" ? "Failed" : "Cancelled"}
						</Badge>
						{#if dl.error}
							<Text size="xs" class="dl-error">{dl.error}</Text>
						{/if}
						<Button variant="ghost" size="sm" onclick={() => downloadState.dismiss(dl.downloadId)} aria-label="Dismiss">
							<X size={12} />
						</Button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.download-panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 0.75rem;
		background: var(--surface-raised);
		border: 0.0625rem solid var(--border-soft);
	}

	.panel-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.empty-state {
		padding: 1rem;
		text-align: center;
	}
	:global(.empty-text) { color: var(--text-muted); }

	.download-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.download-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 0.75rem;
		border-radius: 0.5rem;
		background: var(--surface-base);
		border: 0.0625rem solid var(--border-soft);
	}

	.dl-info {
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
		min-width: 8rem;
	}

	:global(.dl-filename) {
		font-family: var(--font-mono);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	:global(.dl-repo) { color: var(--text-muted); }

	.dl-progress {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.progress-bar {
		height: 0.375rem;
		border-radius: 62.4375rem;
		background: var(--surface-raised);
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		border-radius: 62.4375rem;
		background: var(--accent-teal-main);
		transition: width 300ms ease-out;
	}

	.dl-stats {
		display: flex;
		gap: 0.5rem;
	}

	:global(.dl-stat) { color: var(--text-muted); }
	:global(.dl-error) { color: var(--signal-error); }
</style>
