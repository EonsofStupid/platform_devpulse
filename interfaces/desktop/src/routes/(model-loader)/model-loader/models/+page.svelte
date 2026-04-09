<!--
  @file Model Setup
  @route /model-loader/models
  @domain models

  MANDATORY page. Auto-detects best models for hardware. Role-colored cards.
  One-click "Download & Set Up Everything". No skip.
  Required slots: chat.brain, minion.shared, rag.embedder, rag.reranker
  Optional: vision.embedder, voice.stt, voice.tts
-->
<script lang="ts">
import {
	ArrowLeft,
	ArrowRight,
	Brain,
	Check,
	Download,
	Eye,
	LoaderCircle,
	Mic,
	Search,
	Settings2,
	Volume2,
} from "lucide-svelte";
import { goto } from "$app/navigation";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Card } from "$lib/design/components/card/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import {
	bulkDownloadAndAssign,
	fetchRecommendations,
	friendlyName,
	getSlotLabel,
	ROLE_COLORS,
	WizardHelpTip,
	WizardInfoPopup,
	wizardState,
} from "$lib/domains/app/models/features/setup-wizard/index.js";
import { formatMb, hardwareState, modelsState } from "$lib/domains/app/models/index.js";

let setupInProgress = $state(false);
let setupComplete = $state(false);
let setupError = $state<string | null>(null);
let loadingRecs = $state(false);
let recsError = $state<string | null>(null);
let showPageHelp = $state(false);

const recs = $derived(wizardState.recommendations);
const hasRecs = $derived(recs.length > 0);

/** Role icon by slot. */
function roleIcon(slotId: string): typeof Brain {
	const label = getSlotLabel(slotId);
	if (!label) return Brain;
	switch (label.role) {
		case "reasoning":
			return Brain;
		case "observation":
			return Eye;
		case "encoder":
			return Search;
		case "voice":
			return slotId === "voice.stt" ? Mic : Volume2;
		default:
			return Brain;
	}
}

function roleColor(slotId: string): string {
	const label = getSlotLabel(slotId);
	if (!label) return "var(--text-muted)";
	return ROLE_COLORS[label.role]?.accent ?? "var(--text-muted)";
}

/** Required slots shown first, optional below. */
const requiredSlots = ["chat.brain", "minion.shared", "rag.embedder", "rag.reranker"];
const requiredRecs = $derived(recs.filter((r) => requiredSlots.includes(r.slot)));
const optionalRecs = $derived(recs.filter((r) => !requiredSlots.includes(r.slot)));

/** Auto-fetch on mount if empty. */
$effect(() => {
	if (!hasRecs && !loadingRecs && !recsError) {
		loadingRecs = true;
		fetchRecommendations()
			.then(() => {
				loadingRecs = false;
			})
			.catch((e) => {
				loadingRecs = false;
				recsError = e instanceof Error ? e.message : String(e);
			});
	}
});

async function handleSetup(): Promise<void> {
	setupInProgress = true;
	setupError = null;
	const { toast } = await import("svelte-sonner");
	try {
		const toDownload = recs.filter((r) => !r.alreadyDownloaded);
		if (toDownload.length > 0) {
			toast.info(`Downloading ${toDownload.length} model${toDownload.length > 1 ? "s" : ""}...`);
			await bulkDownloadAndAssign(toDownload);
		}
		for (const rec of recs.filter((r) => r.alreadyDownloaded)) {
			const model = modelsState.models.find((m) => m.filename === rec.file);
			if (model) {
				try {
					await modelsState.assign(rec.slot, model.id);
				} catch {
					/* ok */
				}
			}
		}
		await modelsState.scan();
		await modelsState.refresh();
		setupComplete = true;
		toast.success("All models set up!");
	} catch (e) {
		setupError = e instanceof Error ? e.message : String(e);
	} finally {
		setupInProgress = false;
	}
}

const canContinue = $derived(
	setupComplete || modelsState.userSlots.some((s) => !!s.assigned_model_id),
);
</script>

<div class="models-page">
	<Text size="xl" weight="bold">Set Up Your AI</Text>
	<div class="help-row">
		<WizardHelpTip tip="Required models are the minimum to use Clyffy. Optional models add voice and vision." />
		<Button preset="ghost" size="sm" onclick={() => (showPageHelp = true)}>
			How model setup works
		</Button>
	</div>

	{#if loadingRecs}
		<div class="loading-state">
			<img src="/imgs/mascot/clyffyloading.gif" alt="Loading" class="loading-mascot" />
			<Text size="base" weight="semibold">Analyzing your {hardwareState.gpuName ?? "hardware"}...</Text>
			<Text size="sm" color="muted">Finding the best models</Text>
		</div>

	{:else if recsError && !hasRecs}
		<Card class="error-card">
			<Text size="sm" weight="semibold" color="danger">Couldn't auto-detect the best models</Text>
			<Text size="xs" color="muted">{recsError}</Text>
			<div class="error-actions">
				<Button preset="primary" size="sm" onclick={() => { recsError = null; loadingRecs = true; fetchRecommendations().then(() => { loadingRecs = false; }).catch((e) => { loadingRecs = false; recsError = e instanceof Error ? e.message : String(e); }); }}>
					Try Again
				</Button>
				<Button preset="secondary" size="sm" onclick={() => goto("/model-loader/browse")}>
					Browse Models
				</Button>
			</div>
		</Card>

	{:else if hasRecs}
		<Text size="sm" color="secondary">
			Recommended for your {hardwareState.gpuName ?? "hardware"} — one click to set up.
		</Text>

		<!-- REQUIRED models -->
		<div class="section">
			<div class="section-label-row">
				<Text size="xs" weight="bold" color="muted" class="section-label">REQUIRED</Text>
				<WizardHelpTip tip="These are needed for chat + memory search. Without them, setup is incomplete." />
			</div>
			<div class="rec-list">
				{#each requiredRecs as rec (rec.slot)}
					{@const color = roleColor(rec.slot)}
					{@const Icon = roleIcon(rec.slot)}
					{@const label = getSlotLabel(rec.slot)}
					<div class="rec-card" style="border-left: var(--border-width-thick) solid {color};">
						<div class="rec-icon" style="color: {color};">
							<Icon size={18} />
						</div>
						<div class="rec-info">
							<span class="rec-name">{friendlyName(rec.slot)}</span>
							<span class="rec-desc">{label?.description ?? rec.purpose}</span>
							<span class="rec-tech">{rec.name} · {formatMb(rec.sizeMb)}</span>
						</div>
						{#if rec.alreadyDownloaded}
							<Badge preset="glass"><Check size={10} /> On disk</Badge>
						{:else}
							<Badge preset="default"><Download size={10} /> {formatMb(rec.sizeMb)}</Badge>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- OPTIONAL models -->
		{#if optionalRecs.length > 0}
			<div class="section">
				<div class="section-label-row">
					<Text size="xs" weight="bold" color="muted" class="section-label">OPTIONAL — loads on demand</Text>
					<WizardHelpTip tip="Optional models improve voice and vision features. You can add them later." />
				</div>
				<div class="rec-list">
					{#each optionalRecs as rec (rec.slot)}
						{@const color = roleColor(rec.slot)}
						{@const Icon = roleIcon(rec.slot)}
						{@const label = getSlotLabel(rec.slot)}
						<div class="rec-card rec-optional" style="border-left: var(--border-width-thick) solid {color};">
							<div class="rec-icon" style="color: {color};">
								<Icon size={18} />
							</div>
							<div class="rec-info">
								<span class="rec-name">{friendlyName(rec.slot)}</span>
								<span class="rec-desc">{label?.description ?? rec.purpose}</span>
								<span class="rec-tech">{rec.name} · {formatMb(rec.sizeMb)}</span>
							</div>
							{#if rec.alreadyDownloaded}
								<Badge preset="glass"><Check size={10} /> On disk</Badge>
							{:else}
								<Badge preset="default"><Download size={10} /> {formatMb(rec.sizeMb)}</Badge>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Download queue -->
		{#if wizardState.hasActiveDownloads}
			<div class="download-queue">
				{#each wizardState.downloadList as dl (dl.downloadId)}
					<div class="dl-row" class:active={dl.status === "downloading"}>
						<span class="dl-name">{dl.friendlyName}</span>
						{#if dl.status === "downloading" || dl.status === "queued"}
							<div class="dl-bar">
								<div class="dl-fill" style="width: {dl.totalBytes > 0 ? (dl.bytesDownloaded / dl.totalBytes) * 100 : 0}%;"></div>
							</div>
							<span class="dl-pct">
								{dl.totalBytes > 0 ? `${Math.round((dl.bytesDownloaded / dl.totalBytes) * 100)}%` : "..."}
							</span>
						{:else if dl.status === "complete"}
							<Check size={14} style="color: var(--brand-green);" />
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<!-- BIG CTA -->
		{#if !setupComplete}
			<Button preset="primary" size="lg" onclick={handleSetup} disabled={setupInProgress}>
				{#if setupInProgress}
					<LoaderCircle size={18} class="animate-spin" /> Setting up...
				{:else}
					<Download size={18} /> Download & Set Up Everything
				{/if}
			</Button>
		{:else}
			<div class="success-banner">
				<Check size={18} /> All models ready!
			</div>
		{/if}

		{#if setupError}
			<div class="error-banner">
				<Text size="sm" color="danger">{setupError}</Text>
				<Button preset="secondary" size="sm" onclick={() => { setupError = null; handleSetup(); }}>Retry</Button>
			</div>
		{/if}
	{/if}

	<!-- Escape hatches -->
	<div class="escape">
		<Button preset="ghost" size="sm" onclick={() => goto("/model-loader/customize")}>
			<Settings2 size={14} /> Customize
		</Button>
		<Button preset="ghost" size="sm" onclick={() => goto("/model-loader/browse")}>
			<Search size={14} /> Browse / Import
		</Button>
	</div>

	<!-- Nav -->
	<div class="nav">
		<Button preset="ghost" size="sm" onclick={() => goto("/model-loader")}>
			<ArrowLeft size={14} /> Back
		</Button>
		{#if canContinue}
			<Button preset="primary" size="md" onclick={() => goto("/model-loader/activate")}>
				Continue <ArrowRight size={14} />
			</Button>
		{/if}
	</div>
</div>

<WizardInfoPopup
	open={showPageHelp}
	title="Model Setup in Plain English"
	summary="This page picks models for each job, then downloads and assigns them automatically."
	points={[
		"Main AI (brain): handles chat and reasoning.",
		"Helper AI (minion): handles lighter background tasks.",
		"Memory models: improve project search quality.",
		"Optional voice/vision models can be added now or later.",
		"After setup, you can still swap any model in Customize.",
	]}
	imageSrc="/imgs/mascot/clyffy-df-icon-interaction1.png"
	onClose={() => (showPageHelp = false)}
/>

<style>
	.models-page {
		display: flex; flex-direction: column; align-items: center; gap: 1.25rem;
		width: 100%; max-width: 38rem; padding: 1rem 0;
	}
	.help-row {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.375rem;
	}
	.section-label-row {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.loading-state {
		display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
		padding: 3rem 0;
	}
	.loading-mascot { width: 4rem; height: 4rem; object-fit: contain; }

	.section { display: flex; flex-direction: column; gap: 0.5rem; width: 100%; }

	.rec-list { display: flex; flex-direction: column; gap: 0.5rem; }
	.rec-card {
		display: flex; align-items: center; gap: 0.75rem;
		padding: 0.75rem 1rem; border-radius: 0.5rem;
		background: var(--glass-deep);
		border: var(--border-preset-default-width) solid var(--border-subtle);
	}
	.rec-card.rec-optional { opacity: 0.8; }
	.rec-icon { flex-shrink: 0; }
	.rec-info { display: flex; flex-direction: column; gap: 0.125rem; flex: 1; min-width: 0; }
	.rec-name { font-size: 0.875rem; font-weight: 700; color: var(--text-primary); }
	.rec-desc { font-size: 0.75rem; color: var(--text-muted); }
	.rec-tech { font-size: 0.75rem; color: var(--color-void-400); font-family: monospace; }

	.download-queue { display: flex; flex-direction: column; gap: 0.375rem; width: 100%; }
	.dl-row {
		display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem;
		border-radius: 0.375rem; background: var(--glass-deep);
	}
	.dl-row.active { border: var(--border-preset-default-width) solid var(--brand-cyan); }
	.dl-name { font-size: 0.8125rem; font-weight: 600; color: var(--text-primary); flex: 0 0 8rem; }
	.dl-bar { flex: 1; height: 0.25rem; border-radius: var(--radius-full); background: var(--color-void-800); overflow: hidden; }
	.dl-fill { height: 100%; border-radius: var(--radius-full); background: var(--brand-cyan); transition: width var(--motion-duration-fast); }
	.dl-pct { font-size: 0.75rem; color: var(--text-muted); width: 2.5rem; text-align: right; }

	.success-banner {
		display: flex; align-items: center; gap: 0.5rem; justify-content: center;
		width: 100%; padding: 0.875rem; border-radius: 0.5rem;
		background: var(--wiz-fill-green); border: var(--border-preset-default-width) solid var(--brand-green);
		color: var(--brand-green); font-size: 0.875rem; font-weight: 700;
	}
	.error-banner {
		display: flex; align-items: center; gap: 0.75rem; width: 100%; padding: 0.75rem;
		border-radius: 0.5rem; background: var(--wiz-fill-ember);
		border: var(--border-preset-default-width) solid var(--brand-salmon);
	}
	:global(.error-card) { padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
	.error-actions { display: flex; gap: 0.5rem; }

	.escape { display: flex; gap: 1rem; }
	.nav { display: flex; justify-content: space-between; width: 100%; padding-top: 0.5rem; }
</style>
