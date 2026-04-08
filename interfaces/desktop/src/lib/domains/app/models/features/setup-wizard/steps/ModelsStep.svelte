<!--
  @file ModelsStep.svelte
  Commandment #10: Happy path = 2 clicks.
  Shows PresetCard with recommended config. One button: "Download & Set Up".
  Small "Customize" and "Browse Models" links for power users.
  VramBar always visible at bottom.
  DownloadQueue appears when downloads are active.
-->
<script lang="ts">
import { ArrowLeft, ArrowRight, Search, Settings2 } from "lucide-svelte";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { formatMb } from "../../../types/models.types.js";
import PresetCard from "../components/PresetCard.svelte";
import VramBar from "../components/VramBar.svelte";
import { wizardState } from "../wizard.runes.svelte.js";
import { bulkDownloadAndAssign } from "../wizard.service.js";

interface Props {
	onContinue: () => void;
	onBack: () => void;
	onCustomize: () => void;
	onBrowse: () => void;
}
let { onContinue, onBack, onCustomize, onBrowse }: Props = $props();

let setupInProgress = $state(false);
let setupComplete = $state(false);
let setupError = $state<string | null>(null);

const recs = $derived(wizardState.recommendations);
const hasRecs = $derived(recs.length > 0);
const allDownloaded = $derived(recs.every((r) => r.alreadyDownloaded));

/** Commandment #10: One-click setup. Downloads in background (Commandment #7). */
async function handleSetup(): Promise<void> {
	setupInProgress = true;
	setupError = null;
	const { toast } = await import("svelte-sonner");

	try {
		// Filter to only models that need downloading
		const toDownload = recs.filter((r) => !r.alreadyDownloaded);

		if (toDownload.length > 0) {
			toast.info(`Downloading ${toDownload.length} model${toDownload.length > 1 ? "s" : ""}...`);
			await bulkDownloadAndAssign(toDownload);
		}

		// Assign models already on disk
		const alreadyLocal = recs.filter((r) => r.alreadyDownloaded);
		for (const rec of alreadyLocal) {
			const model = modelsState.models.find((m) => m.filename === rec.file);
			if (model) {
				try {
					await modelsState.assign(rec.slot, model.id);
				} catch {
					// Non-fatal — model may already be assigned
				}
			}
		}

		await modelsState.scan();
		await modelsState.refresh();
		setupComplete = true;
		toast.success("Models set up successfully!");
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		setupError = msg;
		toast.error(`Setup failed: ${msg}`);
	} finally {
		setupInProgress = false;
	}
}

/** Commandment #8: Errors are actions. */
async function handleRetry(): Promise<void> {
	setupError = null;
	await handleSetup();
}
</script>

<div class="models-step">
	<h2 class="step-title">Set Up Your AI</h2>
	<p class="step-desc">
		{#if hasRecs}
			We picked the best models for your hardware. One click and you're ready.
		{:else}
			Scan your hardware first to get recommendations.
		{/if}
	</p>

	<!-- Preset Card (Commandment #2) -->
	{#if hasRecs}
		<PresetCard
			recommendations={recs}
			onSetup={handleSetup}
			loading={setupInProgress}
		/>
	{/if}

	<!-- Error with action buttons (Commandment #8) -->
	{#if setupError}
		<div class="error-box">
			<span class="error-text">{setupError}</span>
			<div class="error-actions">
				<button class="btn-action" onclick={handleRetry}>Retry</button>
				<button class="btn-action-outline" onclick={onCustomize}>Pick manually</button>
				<button class="btn-action-ghost" onclick={onContinue}>Skip for now</button>
			</div>
		</div>
	{/if}

	<!-- Success state -->
	{#if setupComplete && !setupError}
		<div class="success-box">
			Models are ready. You can continue or customize individual slots.
		</div>
	{/if}

	<!-- Download queue (if active, Commandment #7) -->
	{#if wizardState.hasActiveDownloads}
		<div class="download-section">
			{#each wizardState.downloadList as dl (dl.downloadId)}
				{#if dl.status === "downloading" || dl.status === "queued"}
					<div class="dl-row">
						<span class="dl-name">{dl.friendlyName}</span>
						<div class="dl-bar">
							<div class="dl-fill" style="width: {dl.totalBytes > 0 ? (dl.bytesDownloaded / dl.totalBytes) * 100 : 0}%;"></div>
						</div>
						<span class="dl-info">
							{#if dl.totalBytes > 0}
								{formatMb(Math.round(dl.bytesDownloaded / (1024 * 1024)))} / {formatMb(Math.round(dl.totalBytes / (1024 * 1024)))}
							{:else}
								Starting...
							{/if}
						</span>
					</div>
				{:else if dl.status === "complete"}
					<div class="dl-row dl-done">
						<span class="dl-name">{dl.friendlyName}</span>
						<span class="dl-check">Downloaded</span>
					</div>
				{/if}
			{/each}
		</div>
	{/if}

	<!-- Power user escape hatches -->
	<div class="escape-hatches">
		<button class="link-btn" onclick={onCustomize}>
			<Settings2 size={14} /> Customize individual models
		</button>
		<button class="link-btn" onclick={onBrowse}>
			<Search size={14} /> Browse or import models
		</button>
	</div>

	<!-- VRAM bar (Commandment #5: always visible) -->
	<VramBar />

	<!-- Navigation -->
	<div class="nav">
		<button class="btn-back" onclick={onBack}><ArrowLeft size={14} /> Back</button>
		<button class="btn-continue" onclick={onContinue} disabled={setupInProgress}>
			{setupComplete ? "Continue" : "Skip for now"} <ArrowRight size={14} />
		</button>
	</div>
</div>

<style>
	.models-step {
		display: flex; flex-direction: column; align-items: center; gap: 1.25rem;
		width: 100%; max-width: 36rem; padding: 1rem 0;
	}
	.step-title { font-size: 1.25rem; font-weight: 800; color: var(--wiz-text); margin: 0; }
	.step-desc { font-size: var(--wiz-text-sm); color: var(--wiz-text-sub); margin: 0; text-align: center; }

	/* Error box (Commandment #8) */
	.error-box {
		width: 100%; padding: 1rem; border-radius: var(--wiz-radius-md);
		background: var(--wiz-fill-ember); border: 1px solid var(--wiz-ember-600);
		display: flex; flex-direction: column; gap: 0.75rem;
	}
	.error-text { font-size: var(--wiz-text-sm); color: var(--wiz-ember-200); }
	.error-actions { display: flex; gap: 0.5rem; }
	.btn-action {
		padding: 0.375rem 0.75rem; border-radius: var(--wiz-radius-md); border: none;
		background: var(--wiz-cyan); color: var(--wiz-void-950);
		font-size: var(--wiz-text-xs); font-weight: 700; cursor: pointer;
	}
	.btn-action-outline {
		padding: 0.375rem 0.75rem; border-radius: var(--wiz-radius-md);
		border: 1px solid var(--wiz-border); background: transparent;
		color: var(--wiz-text-sub); font-size: var(--wiz-text-xs); cursor: pointer;
	}
	.btn-action-ghost {
		padding: 0.375rem 0.75rem; border-radius: var(--wiz-radius-md);
		border: none; background: transparent;
		color: var(--wiz-text-muted); font-size: var(--wiz-text-xs); cursor: pointer;
	}

	/* Success */
	.success-box {
		width: 100%; padding: 0.75rem 1rem; border-radius: var(--wiz-radius-md);
		background: var(--wiz-fill-green); border: 1px solid var(--wiz-green);
		color: var(--wiz-green); font-size: var(--wiz-text-sm);
	}

	/* Downloads */
	.download-section {
		width: 100%; display: flex; flex-direction: column; gap: 0.5rem;
	}
	.dl-row {
		display: flex; align-items: center; gap: 0.75rem;
		padding: 0.5rem 0.75rem; border-radius: var(--wiz-radius-md);
		background: var(--wiz-card); border: 1px solid var(--wiz-border);
	}
	.dl-row.dl-done { opacity: 0.7; }
	.dl-name { font-size: var(--wiz-text-sm); color: var(--wiz-text); min-width: 8rem; }
	.dl-bar {
		flex: 1; height: 0.25rem; border-radius: var(--wiz-radius-full);
		background: var(--wiz-void-800); overflow: hidden;
	}
	.dl-fill {
		height: 100%; border-radius: var(--wiz-radius-full); background: var(--wiz-cyan);
		transition: width var(--wiz-duration-fast);
	}
	.dl-info { font-size: var(--wiz-text-xs); color: var(--wiz-text-muted); min-width: 6rem; text-align: right; }
	.dl-check { font-size: var(--wiz-text-xs); color: var(--wiz-green); margin-left: auto; }

	/* Escape hatches */
	.escape-hatches { display: flex; gap: 1.5rem; }
	.link-btn {
		display: inline-flex; align-items: center; gap: 0.25rem;
		border: none; background: transparent; color: var(--wiz-text-muted);
		font-size: var(--wiz-text-xs); cursor: pointer;
		transition: color var(--wiz-duration-fast);
	}
	.link-btn:hover { color: var(--wiz-cyan); }

	/* Navigation */
	.nav {
		display: flex; justify-content: space-between; align-items: center; width: 100%;
		padding-top: 0.5rem;
	}
	.btn-back {
		display: inline-flex; align-items: center; gap: 0.375rem;
		padding: 0.5rem 1rem; border-radius: var(--wiz-radius-md); border: none;
		background: transparent; color: var(--wiz-text-muted);
		font-size: var(--wiz-text-sm); cursor: pointer;
	}
	.btn-back:hover { color: var(--wiz-text-sub); }
	.btn-continue {
		display: inline-flex; align-items: center; gap: 0.375rem;
		padding: 0.5rem 1.5rem; border-radius: var(--wiz-radius-md); border: none;
		background: var(--wiz-cyan); color: var(--wiz-void-950);
		font-size: var(--wiz-text-sm); font-weight: 700; cursor: pointer;
		transition: all var(--wiz-duration-fast);
	}
	.btn-continue:hover { filter: brightness(1.15); }
	.btn-continue:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
