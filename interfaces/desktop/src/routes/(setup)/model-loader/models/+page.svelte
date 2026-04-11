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
	try {
		// Fire both in parallel — they don't depend on each other.
		const [presets] = await Promise.all([listAllPresets(), fetchRecommendations()]);
		allPresets = presets;
	} catch (e) {
		recsError = e instanceof Error ? e.message : String(e);
	} finally {
		loadingRecs = false;
	}
}

async function handleTierSwitch(tier: HardwareTier): Promise<void> {
	if (switchingTier !== null || setupInProgress) return;
	switchingTier = tier;
	try {
		await selectPreset(tier);
	} catch (e) {
		setupError = e instanceof Error ? e.message : String(e);
	} finally {
		switchingTier = null;
	}
}

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
					/* already assigned, non-fatal */
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
		gap: var(--space-20);
		width: 100%;
		max-width: 44rem;
		padding: var(--space-24) var(--space-16) var(--space-48);
		margin: 0 auto;
	}

	.page-head {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-8);
		width: 100%;
	}

	.help-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-6);
	}

	:global(.subtitle) {
		text-align: center;
	}

	.section-label-row {
		display: flex;
		align-items: center;
		gap: var(--space-6);
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-12);
		padding: var(--space-48) 0;
	}
	.loading-mascot {
		width: 5rem;
		height: 5rem;
		object-fit: contain;
	}

	/* ── Brain chooser ───────────────────────────────── */
	.brain-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		width: 100%;
		padding: var(--space-14) var(--space-16);
		border-radius: var(--wiz-radius-lg);
		background: linear-gradient(
			135deg,
			var(--wiz-fill-purple),
			var(--wiz-card) 60%
		);
		border: var(--space-1) solid var(--wiz-border);
		box-shadow: var(--wiz-shadow-md);
	}
	.brain-row-head {
		display: flex;
		align-items: center;
		gap: var(--space-6);
	}
	.brain-chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-8);
	}
	.brain-chip {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-8) var(--space-12);
		border-radius: var(--wiz-radius-md);
		background: var(--wiz-inset);
		border: var(--space-1) solid var(--wiz-border);
		color: var(--wiz-text);
		cursor: pointer;
		transition:
			background var(--wiz-duration-fast),
			border-color var(--wiz-duration-fast),
			box-shadow var(--wiz-duration-fast),
			transform var(--wiz-duration-fast);
		min-width: 10rem;
	}
	.brain-chip:hover:not(:disabled) {
		border-color: var(--wiz-role-brain);
		box-shadow: var(--wiz-glow-purple);
		transform: translateY(calc(-1 * var(--space-1)));
	}
	.brain-chip.active {
		background: linear-gradient(
			135deg,
			var(--wiz-fill-purple),
			var(--wiz-card-raised)
		);
		border-color: var(--wiz-role-brain);
		box-shadow: var(--wiz-glow-purple);
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
		gap: var(--space-6);
		font-size: var(--wiz-text-sm);
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
		color: var(--wiz-green);
	}
	.brain-chip-meta {
		display: flex;
		align-items: center;
		gap: var(--space-5);
		font-size: 0.7rem;
		color: var(--wiz-text-muted);
		font-variant-numeric: tabular-nums;
	}
	.brain-chip-spinner {
		position: absolute;
		top: var(--space-6);
		right: var(--space-6);
		color: var(--wiz-role-brain);
	}
	.active-preset {
		text-align: right;
	}

	/* ── Sections ────────────────────────────────────── */
	.section {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		width: 100%;
	}

	/* ── Rec cards ───────────────────────────────────── */
	.rec-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-10);
	}
	.rec-card {
		display: flex;
		align-items: center;
		gap: var(--space-14);
		padding: var(--space-14) var(--space-16);
		border-radius: var(--wiz-radius-lg);
		background: var(--wiz-card);
		border: var(--space-1) solid var(--wiz-border);
		border-left: var(--space-4) solid var(--role-accent, var(--wiz-border-strong));
		transition:
			box-shadow var(--wiz-duration-fast),
			border-color var(--wiz-duration-fast),
			background var(--wiz-duration-fast);
	}
	.rec-card:hover {
		background: var(--wiz-card-raised);
		box-shadow: var(--role-glow, var(--wiz-shadow-md));
	}
	.rec-card.rec-optional {
		opacity: 0.86;
	}
	.rec-card[data-role="reasoning"] {
		--role-accent: var(--wiz-role-brain);
		--role-glow: var(--wiz-glow-purple);
		background: linear-gradient(
			90deg,
			var(--wiz-fill-purple),
			var(--wiz-card) 30%
		);
	}
	.rec-card[data-role="observation"] {
		--role-accent: var(--wiz-role-minion);
		--role-glow: var(--wiz-glow-green);
		background: linear-gradient(
			90deg,
			var(--wiz-fill-green),
			var(--wiz-card) 30%
		);
	}
	.rec-card[data-role="encoder"] {
		--role-accent: var(--wiz-role-encoder);
		--role-glow: var(--wiz-glow-cyan);
		background: linear-gradient(
			90deg,
			var(--wiz-fill-cyan),
			var(--wiz-card) 30%
		);
	}
	.rec-card[data-role="voice"] {
		--role-accent: var(--wiz-role-voice);
		--role-glow: var(--wiz-glow-ember);
		background: linear-gradient(
			90deg,
			var(--wiz-fill-ember),
			var(--wiz-card) 30%
		);
	}
	.rec-icon {
		flex-shrink: 0;
		color: var(--role-accent, var(--wiz-text-muted));
		filter: drop-shadow(0 0 var(--space-6) var(--role-accent, transparent));
	}
	.rec-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		flex: 1;
		min-width: 0;
	}
	.rec-name-row {
		display: flex;
		align-items: center;
		gap: var(--space-6);
	}
	.rec-name {
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--wiz-text);
	}
	.rec-desc {
		font-size: var(--wiz-text-xs);
		color: var(--wiz-text-sub);
	}
	.rec-tech {
		font-size: 0.7rem;
		color: var(--wiz-text-muted);
		font-family: monospace;
	}
	.rec-status {
		flex-shrink: 0;
	}

	/* ── Download queue ───────────────────────────────── */
	.download-queue {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		width: 100%;
	}
	.dl-row {
		display: flex;
		align-items: center;
		gap: var(--space-8);
		padding: var(--space-8) var(--space-12);
		border-radius: var(--wiz-radius-md);
		background: var(--wiz-card);
		border: var(--space-1) solid var(--wiz-border);
	}
	.dl-row.active {
		border-color: var(--wiz-cyan);
	}
	.dl-name {
		font-size: var(--wiz-text-sm);
		font-weight: 600;
		color: var(--wiz-text);
		flex: 0 0 9rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.dl-bar {
		flex: 1;
		height: 0.375rem;
		border-radius: var(--wiz-radius-full);
		background: var(--wiz-void-800);
		overflow: hidden;
	}
	.dl-fill {
		height: 100%;
		border-radius: var(--wiz-radius-full);
		background: linear-gradient(90deg, var(--wiz-cyan), var(--wiz-role-brain));
		transition: width var(--wiz-duration-fast);
	}
	.dl-pct {
		font-size: var(--wiz-text-xs);
		color: var(--wiz-text-muted);
		width: 2.5rem;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.dl-done {
		display: inline-flex;
		align-items: center;
		gap: var(--space-4);
		color: var(--wiz-green);
		font-size: var(--wiz-text-xs);
		font-weight: 600;
	}
	.dl-failed {
		color: var(--wiz-ember-300);
		font-size: var(--wiz-text-xs);
		font-weight: 600;
	}

	/* ── Banners ─────────────────────────────────────── */
	.success-banner {
		display: flex;
		align-items: center;
		gap: var(--space-8);
		justify-content: center;
		width: 100%;
		padding: var(--space-14);
		border-radius: var(--wiz-radius-lg);
		background: var(--wiz-fill-green);
		border: var(--space-1) solid var(--wiz-green);
		color: var(--wiz-green);
		font-size: var(--wiz-text-sm);
		font-weight: 700;
	}
	.error-banner {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		width: 100%;
		padding: var(--space-14);
		border-radius: var(--wiz-radius-lg);
		background: var(--wiz-fill-ember);
		border: var(--space-1) solid var(--wiz-ember-600);
	}
	.error-actions {
		display: flex;
		gap: var(--space-8);
	}
	:global(.error-card) {
		padding: var(--space-16);
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.escape {
		display: flex;
		gap: var(--space-16);
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
		background: var(--wiz-overlay);
		backdrop-filter: blur(var(--space-8));
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: var(--wiz-z-modal);
		animation: overlay-in var(--wiz-duration-normal) ease-out;
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
		gap: var(--space-12);
		padding: var(--space-32) var(--space-40);
		border-radius: var(--wiz-radius-xl);
		background: var(--wiz-card-raised);
		border: var(--space-1) solid var(--wiz-border-strong);
		box-shadow: var(--wiz-shadow-xl);
		max-width: 32rem;
		width: 90vw;
	}
	.setup-overlay-mascot {
		width: 6rem;
		height: 6rem;
		object-fit: contain;
	}
	.overlay-queue {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		width: 100%;
		margin-top: 0.75rem;
	}
	.overlay-dl {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	.overlay-dl-name {
		font-size: var(--wiz-text-xs);
		color: var(--wiz-text-sub);
	}
	.overlay-dl-bar {
		height: 0.375rem;
		border-radius: var(--wiz-radius-full);
		background: var(--wiz-void-800);
		overflow: hidden;
	}
	.overlay-dl-fill {
		height: 100%;
		border-radius: var(--wiz-radius-full);
		background: linear-gradient(90deg, var(--wiz-cyan), var(--wiz-role-brain));
		transition: width var(--wiz-duration-fast);
	}
</style>
