<!--
  @file Model Setup
  @route /model-loader/models
  @domain models

  Happy-path wizard page. Shows an auto-detected recommendation set
  with a brain chooser chip row above the cards so the user can swap
  between every tier (Ultra / High / Jesse / Mid / Floor / Minimal /
  CPU) without leaving the page. Every card has a layman name, a
  role colour, a tooltip explaining what the model does, and either
  an "On disk" check or a download size badge. One big CTA runs the
  download queue with a visible loading overlay and per-file progress.
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
	Sparkles,
	Volume2,
} from "lucide-svelte";
import { onMount } from "svelte";
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
	listAllPresets,
	selectPreset,
	WizardHelpTip,
	WizardInfoPopup,
	wizardState,
} from "$lib/domains/app/models/features/setup-wizard/index.js";
import {
	type AutoConfig,
	formatMb,
	type HardwareTier,
	hardwareState,
	modelsState,
} from "$lib/domains/app/models/index.js";
import { logError, logInfo } from "$lib/sys/logger.js";

// ── local state ─────────────────────────────────────────────
let setupInProgress = $state(false);
let setupComplete = $state(false);
let setupError = $state<string | null>(null);
let loadingRecs = $state(false);
let recsError = $state<string | null>(null);
let showPageHelp = $state(false);
let allPresets = $state<AutoConfig[]>([]);
let switchingTier = $state<HardwareTier | null>(null);

// ── derived ─────────────────────────────────────────────────
const recs = $derived(wizardState.recommendations);
const hasRecs = $derived(recs.length > 0);
const activeTier = $derived(wizardState.selectedTier);
const activePresetName = $derived(wizardState.selectedPresetName);

/** Required slots shown first, optional below. */
const requiredSlots = ["chat.brain", "minion.shared", "rag.embedder", "rag.reranker"];
const requiredRecs = $derived(recs.filter((r) => requiredSlots.includes(r.slot)));
const optionalRecs = $derived(recs.filter((r) => !requiredSlots.includes(r.slot)));

/** Brain row from every preset, deduped by filename. */
const brainOptions = $derived.by(() => {
	const seen = new Set<string>();
	const out: Array<{
		tier: HardwareTier;
		presetName: string;
		filename: string;
		displayName: string;
		sizeMb: number;
		vramMb: number;
		alreadyDownloaded: boolean;
	}> = [];
	for (const preset of allPresets) {
		const brain = preset.recommendations.find((r) => r.slot_id === "chat.brain");
		if (!brain) continue;
		if (seen.has(brain.model_filename)) continue;
		seen.add(brain.model_filename);
		out.push({
			tier: preset.tier,
			presetName: preset.preset_name,
			filename: brain.model_filename,
			displayName: prettifyBrainName(brain.model_filename),
			sizeMb: brain.model_size_mb,
			vramMb: brain.vram_estimate_mb,
			alreadyDownloaded: brain.already_downloaded,
		});
	}
	// Sort heaviest to lightest so the flagship brain is first.
	return out.sort((a, b) => b.sizeMb - a.sizeMb);
});

function prettifyBrainName(filename: string): string {
	return filename
		.replace(/\.gguf$|\.safetensors$|\.onnx$/i, "")
		.replace(/-Instruct|-Chat/i, "")
		.replace(/-Q\d_K_M|-Q\d_K_S|-Q\d_0/i, "")
		.replace(/_/g, " ");
}

/** Role icon by slot. */
function roleIcon(slotId: string): typeof Brain {
	const label = getSlotLabel(slotId);
	if (!label) return Brain;
	switch (label.role) {
		case "reasoning":
			return Brain;
		case "observation":
			return Sparkles;
		case "encoder":
			return slotId === "vision.embedder" ? Eye : Search;
		case "voice":
			return slotId === "voice.stt" ? Mic : Volume2;
		default:
			return Brain;
	}
}

function roleKey(slotId: string): "reasoning" | "observation" | "encoder" | "voice" | null {
	return getSlotLabel(slotId)?.role ?? null;
}

function roleTooltip(slotId: string): string {
	switch (slotId) {
		case "chat.brain":
			return "The main AI that thinks, writes code, and answers questions. Bigger = smarter, but uses more memory.";
		case "minion.shared":
			return "A small helper AI that handles background tasks while the main brain stays fast. Always loaded alongside the brain.";
		case "minion.escalation":
			return "A bigger brain that only loads when a task is hard enough to need it. Saves memory the rest of the time.";
		case "rag.embedder":
			return "Turns your code and docs into searchable memory. Without this, project search is keyword-only.";
		case "rag.reranker":
			return "Re-scores the best matches from memory search so the top result is actually the best one.";
		case "vision.embedder":
			return "Lets Clyffy understand screenshots and images you paste or drop into chat.";
		case "voice.stt":
			return "Speech-to-text. Converts what you say into text Clyffy can read.";
		case "voice.tts":
			return "Text-to-speech. Speaks Clyffy's replies out loud.";
		case "voice.brain":
			return "Optional dedicated voice brain. If off, the main brain handles spoken conversations.";
		case "voice.wake":
			return "Wake word detector. Listens for 'Hey Clyffy' when voice mode is active.";
		default:
			return "";
	}
}

// ── lifecycle ───────────────────────────────────────────────
onMount(() => {
	void loadPresetsAndRecs();
});

async function loadPresetsAndRecs(): Promise<void> {
	loadingRecs = true;
	recsError = null;
	logInfo(
		"wizard.modelsPage",
		"loadPresetsAndRecs() start — listAllPresets + fetchRecommendations (parallel)",
	);
	try {
		// Fire both in parallel — they don't depend on each other.
		const [presets] = await Promise.all([listAllPresets(), fetchRecommendations()]);
		allPresets = presets;
		logInfo(
			"wizard.modelsPage",
			`loadPresetsAndRecs() ok — presets=${presets.length} wizardRecs=${wizardState.recommendations.length}`,
		);
	} catch (e) {
		recsError = e instanceof Error ? e.message : String(e);
		logError("wizard.modelsPage", `loadPresetsAndRecs() FAILED: ${recsError}`);
	} finally {
		loadingRecs = false;
		logInfo("wizard.modelsPage", "loadPresetsAndRecs() finally — loadingRecs=false");
	}
}

async function handleTierSwitch(tier: HardwareTier): Promise<void> {
	if (switchingTier !== null || setupInProgress) return;
	switchingTier = tier;
	logInfo("wizard.modelsPage", `handleTierSwitch() — tier=${tier}`);
	try {
		await selectPreset(tier);
		logInfo("wizard.modelsPage", `handleTierSwitch() ok — tier=${tier}`);
	} catch (e) {
		setupError = e instanceof Error ? e.message : String(e);
		logError("wizard.modelsPage", `handleTierSwitch() FAILED tier=${tier}: ${setupError}`);
	} finally {
		switchingTier = null;
	}
}

async function handleSetup(): Promise<void> {
	setupInProgress = true;
	setupError = null;
	const { toast } = await import("svelte-sonner");
	logInfo(
		"wizard.modelsPage",
		`handleSetup() start — recs=${recs.length} alreadyOnDisk=${recs.filter((r) => r.alreadyDownloaded).length}`,
	);
	try {
		const toDownload = recs.filter((r) => !r.alreadyDownloaded);
		if (toDownload.length > 0) {
			logInfo("wizard.modelsPage", `handleSetup() bulk download — count=${toDownload.length}`);
			toast.info(`Downloading ${toDownload.length} model${toDownload.length > 1 ? "s" : ""}...`);
			await bulkDownloadAndAssign(toDownload);
			logInfo("wizard.modelsPage", "handleSetup() bulk download branch finished");
		}
		const onDisk = recs.filter((r) => r.alreadyDownloaded);
		logInfo("wizard.modelsPage", `handleSetup() assign on-disk recs — count=${onDisk.length}`);
		for (const rec of onDisk) {
			const model = modelsState.models.find((m) => m.filename === rec.file);
			if (model) {
				try {
					logInfo(
						"wizard.modelsPage",
						`handleSetup() assign on-disk — slot=${rec.slot} modelId=${model.id}`,
					);
					await modelsState.assign(rec.slot, model.id);
				} catch (e) {
					logInfo(
						"wizard.modelsPage",
						`handleSetup() assign skipped/non-fatal — slot=${rec.slot}: ${e instanceof Error ? e.message : String(e)}`,
					);
				}
			} else {
				logInfo(
					"wizard.modelsPage",
					`handleSetup() no registry model for on-disk file=${rec.file} slot=${rec.slot}`,
				);
			}
		}
		logInfo("wizard.modelsPage", "handleSetup() scanModels + refresh()");
		await modelsState.scan();
		await modelsState.refresh();
		setupComplete = true;
		toast.success("All models set up!");
		logInfo("wizard.modelsPage", "handleSetup() complete");
	} catch (e) {
		setupError = e instanceof Error ? e.message : String(e);
		logError("wizard.modelsPage", `handleSetup() FAILED: ${setupError}`);
	} finally {
		setupInProgress = false;
	}
}

const canContinue = $derived(
	setupComplete || modelsState.userSlots.some((s) => !!s.assigned_model_id),
);
</script>

<div class="models-page">
	<header class="page-head">
		<Text size="xl" weight="bold">Set Up Your AI</Text>
		<div class="help-row">
			<WizardHelpTip
				tip="Required models are the minimum to run Clyffy. Optional models add voice and vision — you can add them later."
			/>
			<Button preset="ghost" size="sm" onclick={() => (showPageHelp = true)}>
				How model setup works
			</Button>
		</div>
	</header>

	{#if loadingRecs && !hasRecs}
		<div class="loading-state">
			<img src="/imgs/mascot/clyffyloading.gif" alt="Clyffy analyzing" class="loading-mascot" />
			<Text size="base" weight="semibold"
				>Analyzing your {hardwareState.gpuName ?? "hardware"}...</Text
			>
			<Text size="sm" color="muted">Finding the best models</Text>
		</div>
	{:else if recsError && !hasRecs}
		<Card class="error-card">
			<Text size="sm" weight="semibold" color="danger">Couldn't auto-detect your hardware</Text>
			<Text size="xs" color="muted">{recsError}</Text>
			<div class="error-actions">
				<Button preset="primary" size="sm" onclick={() => loadPresetsAndRecs()}>Try Again</Button>
				<Button preset="secondary" size="sm" onclick={() => goto("/model-loader/browse")}>
					Browse Models
				</Button>
			</div>
		</Card>
	{:else if hasRecs}
		<Text size="sm" color="secondary" class="subtitle">
			Recommended for your {hardwareState.gpuName ?? "hardware"} — pick a brain below or
			one-click the whole setup.
		</Text>

		<!-- Brain chooser row (Commandment #1, #2, #6: decision fork) -->
		{#if brainOptions.length > 0}
			<section class="brain-row">
				<div class="brain-row-head">
					<Text size="xs" weight="bold" color="muted" class="section-label">BRAIN OPTIONS</Text>
					<WizardHelpTip
						tip="Every option here is a different 'Clyffy's Brain'. Bigger = smarter but uses more memory. The Ultra 30B-A3B brain is a mixture-of-experts model — it's 30 billion parameters total but only ~3 billion are active per token, so it runs almost as fast as the 4B while reasoning like a 30B."
					/>
				</div>
				<div class="brain-chips">
					{#each brainOptions as brain (brain.filename)}
						{@const isActive = brain.tier === activeTier}
						{@const isSwitching = switchingTier === brain.tier}
						<button
							type="button"
							class="brain-chip"
							class:active={isActive}
							class:switching={isSwitching}
							disabled={setupInProgress || isSwitching}
							title={brain.presetName}
							onclick={() => handleTierSwitch(brain.tier)}
						>
							<div class="brain-chip-head">
								<Brain size={14} />
								<span class="brain-chip-name">{brain.displayName}</span>
								{#if brain.alreadyDownloaded}
									<Check size={12} class="brain-chip-check" />
								{/if}
							</div>
							<div class="brain-chip-meta">
								<span>{formatMb(brain.sizeMb)}</span>
								<span>·</span>
								<span>~{formatMb(brain.vramMb)} VRAM</span>
							</div>
							{#if isSwitching}
								<div class="brain-chip-spinner">
									<LoaderCircle size={14} class="animate-spin" />
								</div>
							{/if}
						</button>
					{/each}
				</div>
				{#if activePresetName}
					<div class="active-preset">
						<Text size="xs" color="muted">
							Active preset: <strong>{activePresetName}</strong>
						</Text>
					</div>
				{/if}
			</section>
		{/if}

		<!-- REQUIRED models -->
		<section class="section">
			<div class="section-label-row">
				<Text size="xs" weight="bold" color="muted" class="section-label">REQUIRED</Text>
				<WizardHelpTip
					tip="These four models are the minimum to run Clyffy. Without them, setup can't complete."
				/>
			</div>
			<div class="rec-list">
				{#each requiredRecs as rec (rec.slot)}
					{@const role = roleKey(rec.slot)}
					{@const Icon = roleIcon(rec.slot)}
					{@const label = getSlotLabel(rec.slot)}
					<div class="rec-card" data-role={role}>
						<div class="rec-icon"><Icon size={20} /></div>
						<div class="rec-info">
							<div class="rec-name-row">
								<span class="rec-name">{friendlyName(rec.slot)}</span>
								<WizardHelpTip tip={roleTooltip(rec.slot)} label={friendlyName(rec.slot)} />
							</div>
							<span class="rec-desc">{label?.description ?? rec.purpose}</span>
							<span class="rec-tech">{rec.name} · {formatMb(rec.sizeMb)}</span>
						</div>
						<div class="rec-status">
							{#if rec.alreadyDownloaded}
								<Badge preset="glass"><Check size={12} /> On disk</Badge>
							{:else}
								<Badge preset="default"><Download size={12} /> {formatMb(rec.sizeMb)}</Badge>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- OPTIONAL models -->
		{#if optionalRecs.length > 0}
			<section class="section">
				<div class="section-label-row">
					<Text size="xs" weight="bold" color="muted" class="section-label"
						>OPTIONAL — loads on demand</Text
					>
					<WizardHelpTip
						tip="These models load only when they're needed (e.g. you talk or you drop in a screenshot). Skipping them now is fine — you can add any of them later from the Slots page."
					/>
				</div>
				<div class="rec-list">
					{#each optionalRecs as rec (rec.slot)}
						{@const role = roleKey(rec.slot)}
						{@const Icon = roleIcon(rec.slot)}
						{@const label = getSlotLabel(rec.slot)}
						<div class="rec-card rec-optional" data-role={role}>
							<div class="rec-icon"><Icon size={20} /></div>
							<div class="rec-info">
								<div class="rec-name-row">
									<span class="rec-name">{friendlyName(rec.slot)}</span>
									<WizardHelpTip tip={roleTooltip(rec.slot)} label={friendlyName(rec.slot)} />
								</div>
								<span class="rec-desc">{label?.description ?? rec.purpose}</span>
								<span class="rec-tech">{rec.name} · {formatMb(rec.sizeMb)}</span>
							</div>
							<div class="rec-status">
								{#if rec.alreadyDownloaded}
									<Badge preset="glass"><Check size={12} /> On disk</Badge>
								{:else}
									<Badge preset="default"><Download size={12} /> {formatMb(rec.sizeMb)}</Badge>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Download queue (Commandment #7: visible progress) -->
		{#if wizardState.hasActiveDownloads}
			<section class="download-queue">
				<div class="section-label-row">
					<Text size="xs" weight="bold" color="muted" class="section-label">DOWNLOADING</Text>
				</div>
				{#each wizardState.downloadList as dl (dl.downloadId)}
					<div class="dl-row" class:active={dl.status === "downloading"}>
						<span class="dl-name">{dl.friendlyName}</span>
						{#if dl.status === "downloading" || dl.status === "queued"}
							<div class="dl-bar">
								<div
									class="dl-fill"
									style="width: {dl.totalBytes > 0
										? (dl.bytesDownloaded / dl.totalBytes) * 100
										: 0}%;"
								></div>
							</div>
							<span class="dl-pct">
								{dl.totalBytes > 0
									? `${Math.round((dl.bytesDownloaded / dl.totalBytes) * 100)}%`
									: "…"}
							</span>
						{:else if dl.status === "complete"}
							<span class="dl-done"><Check size={14} /> Done</span>
						{:else if dl.status === "failed"}
							<span class="dl-failed">Failed</span>
						{/if}
					</div>
				{/each}
			</section>
		{/if}

		<!-- BIG CTA (Commandment #10: 2-click happy path) -->
		{#if !setupComplete}
			<Button
				preset="primary"
				size="lg"
				onclick={handleSetup}
				disabled={setupInProgress}
				class="cta"
			>
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
				<div class="error-actions">
					<Button
						preset="primary"
						size="sm"
						onclick={() => {
							setupError = null;
							void handleSetup();
						}}
					>
						Retry
					</Button>
					<Button preset="secondary" size="sm" onclick={() => goto("/model-loader/browse")}>
						Browse Models
					</Button>
				</div>
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

<!-- Full-page loading overlay during setup -->
{#if setupInProgress}
	<div class="setup-overlay" aria-live="polite">
		<div class="setup-overlay-card">
			<img
				src="/imgs/mascot/clyffyloading.gif"
				alt="Clyffy setting up"
				class="setup-overlay-mascot"
			/>
			<Text size="base" weight="semibold">Setting up your AI...</Text>
			<Text size="sm" color="muted">
				{#if wizardState.hasActiveDownloads}
					Downloading {wizardState.downloadList.length} model{wizardState.downloadList.length >
					1
						? "s"
						: ""}. This can take a few minutes.
				{:else}
					Assigning models to slots...
				{/if}
			</Text>
			{#if wizardState.hasActiveDownloads}
				<div class="overlay-queue">
					{#each wizardState.downloadList as dl (dl.downloadId)}
						<div class="overlay-dl">
							<span class="overlay-dl-name">{dl.friendlyName}</span>
							<div class="overlay-dl-bar">
								<div
									class="overlay-dl-fill"
									style="width: {dl.totalBytes > 0
										? (dl.bytesDownloaded / dl.totalBytes) * 100
										: 0}%;"
								></div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<WizardInfoPopup
	open={showPageHelp}
	title="Model Setup in Plain English"
	summary="This page picks AI models for each job and downloads them."
	points={[
		"Main AI (brain): the big model that thinks and writes code.",
		"Helper AI (minion): smaller model that handles background tasks.",
		"Memory models: turn your code into searchable context.",
		"Optional voice/vision: can be added now or later — same result.",
		"Nothing locks you in — you can swap any model in Customize.",
	]}
	imageSrc="/imgs/mascot/clyffy-df-icon-interaction1.png"
	onClose={() => (showPageHelp = false)}
/>

<style>
	.models-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(1.25rem, 1rem + 1vw, 2rem);
		width: 100%;
		max-width: 44rem;
		padding: clamp(1.25rem, 1rem + 1vw, 2rem) clamp(1rem, 0.75rem + 1vw, 1.5rem)
			clamp(2rem, 1.5rem + 2vw, 3.5rem);
		margin: 0 auto;
	}

	.page-head {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(0.5rem, 0.375rem + 0.5vw, 0.75rem);
		width: 100%;
	}

	.help-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
	}

	:global(.subtitle) {
		text-align: center;
		max-width: 38rem;
	}

	.section-label-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(0.75rem, 0.5rem + 1vw, 1rem);
		padding-block: clamp(2rem, 1rem + 4vw, 3.5rem);
	}
	.loading-mascot {
		width: clamp(4rem, 3.25rem + 2vw, 5rem);
		height: clamp(4rem, 3.25rem + 2vw, 5rem);
		object-fit: contain;
	}

	/* ── Brain chooser ───────────────────────────────── */
	.brain-row {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		padding: clamp(0.875rem, 0.75rem + 0.5vw, 1rem) clamp(1rem, 0.75rem + 1vw, 1.25rem);
		border-radius: 1rem;
		background: linear-gradient(
			135deg,
			color-mix(in oklch, var(--accent-purple-fill) 85%, transparent),
			var(--glass-deep) 60%
		);
		border: var(--border-preset-default-width) solid var(--border-subtle);
		box-shadow: var(--shadow-z2);
	}
	.brain-row-head {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.brain-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.brain-chip {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.625rem 0.875rem;
		border-radius: 0.875rem;
		background: var(--surface-inset);
		border: var(--border-preset-default-width) solid var(--border-subtle);
		color: var(--text-primary);
		cursor: pointer;
		transition:
			background var(--motion-duration-fast),
			border-color var(--motion-duration-fast),
			box-shadow var(--motion-duration-fast),
			transform var(--motion-duration-fast);
		min-width: clamp(10rem, 8rem + 6vw, 13rem);
	}
	.brain-chip:hover:not(:disabled) {
		border-color: var(--accent-purple-main);
		box-shadow:
			0 0 0 var(--space-1) color-mix(in oklch, var(--accent-purple-main) 28%, transparent),
			var(--shadow-z2);
		transform: translateY(-0.125rem);
	}
	.brain-chip.active {
		background: linear-gradient(
			135deg,
			color-mix(in oklch, var(--accent-purple-fill) 85%, transparent),
			var(--glass-smoke)
		);
		border-color: var(--accent-purple-main);
		box-shadow:
			0 0 0 var(--space-1) color-mix(in oklch, var(--accent-purple-main) 32%, transparent),
			var(--shadow-z2);
	}
	.brain-chip.switching {
		opacity: 0.7;
	}
	.brain-chip:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
	.brain-chip-head {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.875rem;
		font-weight: 700;
	}
	.brain-chip-name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	:global(.brain-chip-check) {
		color: var(--accent-green-main);
	}
	.brain-chip-meta {
		display: flex;
		align-items: center;
		gap: 0.3125rem;
		font-size: 0.75rem;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}
	.brain-chip-spinner {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		color: var(--accent-purple-main);
	}
	.active-preset {
		text-align: right;
	}

	/* ── Sections ────────────────────────────────────── */
	.section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
	}

	/* ── Rec cards ───────────────────────────────────── */
	.rec-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.rec-card {
		display: flex;
		align-items: center;
		gap: clamp(0.75rem, 0.625rem + 0.5vw, 0.875rem);
		padding: clamp(0.875rem, 0.75rem + 0.5vw, 1rem) clamp(1rem, 0.75rem + 1vw, 1.25rem);
		border-radius: 1rem;
		background: var(--glass-deep);
		border: var(--border-preset-default-width) solid var(--border-subtle);
		border-left: 0.25rem solid var(--role-accent, var(--border-strong));
		transition:
			box-shadow var(--motion-duration-fast),
			border-color var(--motion-duration-fast),
			background var(--motion-duration-fast);
	}
	.rec-card:hover {
		background: var(--glass-smoke);
		box-shadow:
			0 0 0 var(--space-1) color-mix(in oklch, var(--role-accent, var(--border-strong)) 20%, transparent),
			var(--shadow-z2);
	}
	.rec-card.rec-optional {
		opacity: 0.9;
	}
	.rec-card[data-role="reasoning"] {
		--role-accent: var(--accent-purple-main);
		background: linear-gradient(
			90deg,
			color-mix(in oklch, var(--accent-purple-fill) 92%, transparent),
			var(--glass-deep) 30%
		);
	}
	.rec-card[data-role="observation"] {
		--role-accent: var(--accent-green-main);
		background: linear-gradient(
			90deg,
			color-mix(in oklch, var(--accent-green-fill) 92%, transparent),
			var(--glass-deep) 30%
		);
	}
	.rec-card[data-role="encoder"] {
		--role-accent: var(--accent-blue-main);
		background: linear-gradient(
			90deg,
			color-mix(in oklch, var(--accent-teal-fill) 92%, transparent),
			var(--glass-deep) 30%
		);
	}
	.rec-card[data-role="voice"] {
		--role-accent: var(--accent-coral-main);
		background: linear-gradient(
			90deg,
			color-mix(in oklch, var(--accent-coral-fill) 92%, transparent),
			var(--glass-deep) 30%
		);
	}
	.rec-icon {
		flex-shrink: 0;
		color: var(--role-accent, var(--text-muted));
		filter: drop-shadow(0 0 0.75rem color-mix(in oklch, var(--role-accent, transparent) 38%, transparent));
	}
	.rec-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}
	.rec-name-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.rec-name {
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	.rec-desc {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}
	.rec-tech {
		font-size: 0.75rem;
		color: var(--text-muted);
		font-family: monospace;
	}
	.rec-status {
		flex-shrink: 0;
	}

	/* ── Download queue ───────────────────────────────── */
	.download-queue {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
	}
	.dl-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 0.75rem;
		border-radius: 0.875rem;
		background: var(--glass-deep);
		border: var(--border-preset-default-width) solid var(--border-subtle);
	}
	.dl-row.active {
		border-color: var(--accent-cyan-main);
		box-shadow: 0 0 0 var(--space-1) color-mix(in oklch, var(--accent-cyan-main) 20%, transparent);
	}
	.dl-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		flex: 0 0 9rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.dl-bar {
		flex: 1;
		height: 0.375rem;
		border-radius: var(--radius-full);
		background: var(--color-void-800);
		overflow: hidden;
	}
	.dl-fill {
		height: 100%;
		border-radius: var(--radius-full);
		background: linear-gradient(90deg, var(--accent-cyan-main), var(--accent-purple-main));
		transition: width var(--motion-duration-fast);
	}
	.dl-pct {
		font-size: 0.75rem;
		color: var(--text-muted);
		width: 2.5rem;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.dl-done {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		color: var(--accent-green-main);
		font-size: 0.75rem;
		font-weight: 600;
	}
	.dl-failed {
		color: var(--signal-error);
		font-size: 0.75rem;
		font-weight: 600;
	}

	/* ── Banners ─────────────────────────────────────── */
	.success-banner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		justify-content: center;
		width: 100%;
		padding: 0.875rem;
		border-radius: 1rem;
		background: color-mix(in oklch, var(--accent-green-main) 14%, transparent);
		border: var(--border-preset-default-width) solid var(--accent-green-main);
		color: var(--accent-green-main);
		font-size: 0.875rem;
		font-weight: 700;
	}
	.error-banner {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		padding: 0.875rem;
		border-radius: 1rem;
		background: color-mix(in oklch, var(--signal-error) 12%, transparent);
		border: var(--border-preset-default-width) solid color-mix(in oklch, var(--signal-error) 45%, transparent);
	}
	.error-actions {
		display: flex;
		gap: 0.5rem;
	}
	:global(.error-card) {
		padding: clamp(1rem, 0.75rem + 0.75vw, 1.25rem);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.escape {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
	}
	.nav {
		display: flex;
		justify-content: space-between;
		width: 100%;
		padding-top: 0.5rem;
	}

	:global(.cta) {
		width: 100%;
	}

	/* ── Full-page loading overlay ───────────────────── */
	.setup-overlay {
		position: fixed;
		inset: 0;
		background: color-mix(in oklch, var(--color-void-950) 88%, transparent);
		backdrop-filter: blur(0.75rem);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1100;
		animation: overlay-in var(--motion-duration-normal) ease-out;
	}
	@keyframes overlay-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	.setup-overlay-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: clamp(1.5rem, 1rem + 2vw, 2.5rem) clamp(1.25rem, 1rem + 1.5vw, 2rem);
		border-radius: clamp(1rem, 0.75rem + 0.5vw, 1.25rem);
		background: var(--glass-smoke);
		border: var(--border-preset-default-width) solid var(--border-strong);
		box-shadow: var(--shadow-z4);
		max-width: 32rem;
		width: min(90vw, 32rem);
	}
	.setup-overlay-mascot {
		width: 6rem;
		height: 6rem;
		object-fit: contain;
	}
	.overlay-queue {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		margin-top: 0.75rem;
	}
	.overlay-dl {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.overlay-dl-name {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}
	.overlay-dl-bar {
		height: 0.375rem;
		border-radius: var(--radius-full);
		background: var(--color-void-800);
		overflow: hidden;
	}
	.overlay-dl-fill {
		height: 100%;
		border-radius: var(--radius-full);
		background: linear-gradient(90deg, var(--accent-cyan-main), var(--accent-purple-main));
		transition: width var(--motion-duration-fast);
	}

	@media (max-width: var(--breakpoint-sm)) {
		.escape,
		.nav,
		.error-actions {
			flex-direction: column;
			align-items: stretch;
		}

		.dl-row,
		.rec-card {
			align-items: flex-start;
			flex-direction: column;
		}

		.dl-name,
		.rec-status {
			width: 100%;
			flex: initial;
		}
	}
</style>
