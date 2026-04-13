<!--
  @file ModelsStep.svelte
  Canonical second screen for setup.
  Preset-aware brain chooser, layman role cards, one-click setup, and visible progress.
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
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import type { AutoConfig, HardwareTier } from "../../../types/models.types.js";
import { formatMb } from "../../../types/models.types.js";
import VramBar from "../components/VramBar.svelte";
import WizardHelpTip from "../components/WizardHelpTip.svelte";
import WizardInfoPopup from "../components/WizardInfoPopup.svelte";
import { wizardState } from "../wizard.runes.svelte.js";
import { bulkDownloadAndAssign } from "../wizard.service.js";
import { friendlyName, getSlotLabel, type ModelsCopy } from "../wizard.types.js";

interface Props {
	copy: ModelsCopy;
	allPresets: AutoConfig[];
	loadingRecommendations?: boolean;
	recommendationsError?: string | null;
	switchingTier: HardwareTier | null;
	onSelectTier: (tier: HardwareTier) => void;
	onRetryRecommendations: () => void;
	onContinue: () => void;
	onBack: () => void;
	onCustomize: () => void;
	onBrowse: () => void;
}

let {
	copy,
	allPresets,
	loadingRecommendations = false,
	recommendationsError = null,
	switchingTier,
	onSelectTier,
	onRetryRecommendations,
	onContinue,
	onBack,
	onCustomize,
	onBrowse,
}: Props = $props();

let setupInProgress = $state(false);
let setupComplete = $state(false);
let setupError = $state<string | null>(null);
let showPageHelp = $state(false);

const recs = $derived(wizardState.recommendations);
const hasRecs = $derived(recs.length > 0);
const activeTier = $derived(wizardState.selectedTier);
const activePresetName = $derived(wizardState.selectedPresetName);
const canContinue = $derived(
	setupComplete || modelsState.userSlots.some((slot) => !!slot.assigned_model_id),
);

const requiredSlots = ["chat.brain", "minion.shared", "rag.embedder", "rag.reranker"];
const requiredRecs = $derived(recs.filter((rec) => requiredSlots.includes(rec.slot)));
const optionalRecs = $derived(recs.filter((rec) => !requiredSlots.includes(rec.slot)));

const brainOptions = $derived.by(() => {
	const seen = new Set<string>();
	return allPresets
		.map((preset) => {
			const brain = preset.recommendations.find((rec) => rec.slot_id === "chat.brain");
			if (!brain || seen.has(brain.model_filename)) return null;
			seen.add(brain.model_filename);
			return {
				tier: preset.tier,
				presetName: preset.preset_name,
				filename: brain.model_filename,
				displayName: prettifyBrainName(brain.model_filename),
				sizeMb: brain.model_size_mb,
				vramMb: brain.vram_estimate_mb,
				alreadyDownloaded: brain.already_downloaded,
			};
		})
		.filter((value): value is NonNullable<typeof value> => value !== null)
		.sort((left, right) => right.sizeMb - left.sizeMb);
});

function prettifyBrainName(filename: string): string {
	return filename
		.replace(/\.gguf$|\.safetensors$|\.onnx$/i, "")
		.replace(/-Instruct|-Chat/i, "")
		.replace(/-Q\d_K_M|-Q\d_K_S|-Q\d_0/i, "")
		.replace(/_/g, " ");
}

function roleIcon(slotId: string): typeof Brain {
	const label = getSlotLabel(slotId);
	if (!label) return Brain;
	if (label.role === "reasoning") return Brain;
	if (label.role === "observation") return Sparkles;
	if (label.role === "encoder") return slotId === "vision.embedder" ? Eye : Search;
	if (label.role === "voice") return slotId === "voice.stt" ? Mic : Volume2;
	return Brain;
}

function roleKey(slotId: string): "reasoning" | "observation" | "encoder" | "voice" | null {
	return getSlotLabel(slotId)?.role ?? null;
}

function roleTooltip(slotId: string): string {
	if (slotId === "chat.brain") {
		return "The main AI that thinks, writes code, and answers questions. Bigger usually means smarter, but it uses more memory.";
	}
	if (slotId === "minion.shared") {
		return "A smaller helper AI that handles background tasks so the main brain stays responsive.";
	}
	if (slotId === "minion.escalation") {
		return "A heavier fallback brain that only needs to load when a task is hard enough to justify it.";
	}
	if (slotId === "rag.embedder") {
		return "Turns your code and docs into searchable memory so the assistant can find the right files.";
	}
	if (slotId === "rag.reranker") {
		return "Re-scores search results so the best match rises to the top instead of relying on raw keyword order.";
	}
	if (slotId === "vision.embedder") {
		return "Lets the assistant understand screenshots and image drops.";
	}
	if (slotId === "voice.stt") {
		return "Speech-to-text. Converts what you say into text the assistant can read.";
	}
	if (slotId === "voice.tts") {
		return "Text-to-speech. Speaks the assistant's replies out loud.";
	}
	if (slotId === "voice.brain") {
		return "Optional dedicated voice brain. If you skip it, spoken conversations fall back to the main brain.";
	}
	return "";
}

async function handleSetup(): Promise<void> {
	setupInProgress = true;
	setupError = null;
	const { toast } = await import("svelte-sonner");

	try {
		const toDownload = recs.filter((rec) => !rec.alreadyDownloaded);
		if (toDownload.length > 0) {
			toast.info(`${copy.setup_in_progress_label} (${toDownload.length})`);
			await bulkDownloadAndAssign(toDownload);
		}

		const alreadyLocal = recs.filter((rec) => rec.alreadyDownloaded);
		for (const rec of alreadyLocal) {
			const model = modelsState.models.find((entry) => entry.filename === rec.file);
			if (!model) continue;
			try {
				await modelsState.assign(rec.slot, model.id);
			} catch {
				// Non-fatal: existing assignment is acceptable during setup.
			}
		}

		await modelsState.scan();
		await modelsState.refresh();
		setupComplete = true;
		toast.success(copy.setup_complete_message);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		setupError = message;
		toast.error(`Setup failed: ${message}`);
	} finally {
		setupInProgress = false;
	}
}

async function handleRetry(): Promise<void> {
	setupError = null;
	await handleSetup();
}
</script>

<div class="models-step">
	<header class="step-header">
		<Text size="xl" weight="bold">{copy.title}</Text>
		<Text size="sm" class="step-subtitle">
			{#if hasRecs}
				{copy.subtitle_with_recs}
			{:else}
				{copy.subtitle_no_recs}
			{/if}
		</Text>
		<Text size="sm" class="step-guidance">
			This page keeps the choices readable: one brain decision, required roles first, optional roles after that.
		</Text>
		<div class="step-help-row">
			<WizardHelpTip tip="Use the main setup button for the full recommended local-first stack. Customize and Browse stay available if you want to override anything." />
			<Button preset="ghost" size="sm" onclick={() => (showPageHelp = true)}>
				Model setup in plain English
			</Button>
		</div>
	</header>

	{#if loadingRecommendations && !hasRecs}
		<div class="loading-state">
			<img src="/imgs/mascot/clyffyloading.gif" alt="Clyffy analyzing hardware" class="loading-mascot" />
			<Text size="base" weight="semibold">Analyzing your {hardwareState.gpuName ?? "hardware"}...</Text>
			<Text size="sm" class="loading-copy">Finding the cleanest local model plan.</Text>
		</div>
	{:else if recommendationsError && !hasRecs}
		<div class="error-banner">
			<Text size="sm" weight="semibold">Couldn't auto-detect your model plan</Text>
			<Text size="sm" class="error-copy">{recommendationsError}</Text>
			<div class="error-actions">
				<Button preset="primary" size="sm" onclick={onRetryRecommendations}>{copy.error_retry_label}</Button>
				<Button preset="secondary" size="sm" onclick={onBrowse}>{copy.browse_link_label}</Button>
			</div>
		</div>
	{:else if hasRecs}
		<section class="brain-row" aria-label="Brain options">
			<div class="section-head">
				<div class="section-title-row">
					<Text size="xs" weight="bold" class="section-kicker">Brain Options</Text>
					<WizardHelpTip tip="This is the main coding brain. Larger options generally reason better, but they need more VRAM and take longer to download." />
				</div>
				<Text size="sm" class="section-copy">
					Pick the main model first. Everything else below is grouped by what it does for you.
				</Text>
			</div>

			<div class="brain-chips">
				{#each brainOptions as brain (brain.filename)}
					{@const isActive = brain.tier === activeTier}
					{@const isSwitching = switchingTier === brain.tier}
					<button
						type="button"
						class="brain-chip"
						class:brain-chip-active={isActive}
						class:brain-chip-switching={isSwitching}
						disabled={setupInProgress || isSwitching}
						title={brain.presetName}
						onclick={() => onSelectTier(brain.tier)}
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
							<div class="brain-chip-spinner"><LoaderCircle size={14} class="animate-spin" /></div>
						{/if}
					</button>
				{/each}
			</div>

			{#if activePresetName}
				<Text size="xs" class="active-preset">Active preset: {activePresetName}</Text>
			{/if}
		</section>

		<section class="model-section">
			<div class="section-head">
				<div class="section-title-row">
					<Text size="xs" weight="bold" class="section-kicker">Required</Text>
					<WizardHelpTip tip="These are the minimum roles required for a clean first-run baseline: core reasoning plus memory search." />
				</div>
				<Text size="sm" class="section-copy">These are the minimum models needed to make the assistant usable.</Text>
			</div>

			<div class="rec-list">
				{#each requiredRecs as rec (rec.slot)}
					{@const role = roleKey(rec.slot)}
					{@const Icon = roleIcon(rec.slot)}
					{@const label = getSlotLabel(rec.slot)}
					<article class="rec-card" data-role={role}>
						<div class="rec-icon"><Icon size={20} /></div>
						<div class="rec-info">
							<div class="rec-name-row">
								<div class="rec-name-line">
									<span class="rec-name">{friendlyName(rec.slot)}</span>
									<WizardHelpTip tip={roleTooltip(rec.slot)} label={friendlyName(rec.slot)} />
								</div>
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
					</article>
				{/each}
			</div>
		</section>

		{#if optionalRecs.length > 0}
			<section class="model-section">
				<div class="section-head">
					<div class="section-title-row">
						<Text size="xs" weight="bold" class="section-kicker">Optional</Text>
						<WizardHelpTip tip="Voice and vision are useful enhancements, but they do not block the core coding workflow if you skip them now." />
					</div>
					<Text size="sm" class="section-copy">Voice and vision can be added now or later without changing the architecture.</Text>
				</div>

				<div class="rec-list">
					{#each optionalRecs as rec (rec.slot)}
						{@const role = roleKey(rec.slot)}
						{@const Icon = roleIcon(rec.slot)}
						{@const label = getSlotLabel(rec.slot)}
						<article class="rec-card rec-card-optional" data-role={role}>
							<div class="rec-icon"><Icon size={20} /></div>
							<div class="rec-info">
								<div class="rec-name-row">
									<div class="rec-name-line">
										<span class="rec-name">{friendlyName(rec.slot)}</span>
										<WizardHelpTip tip={roleTooltip(rec.slot)} label={friendlyName(rec.slot)} />
									</div>
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
						</article>
					{/each}
				</div>
			</section>
		{/if}

		{#if wizardState.hasActiveDownloads}
			<section class="download-queue">
				<div class="section-head">
					<Text size="xs" weight="bold" class="section-kicker">Downloading</Text>
				</div>
				{#each wizardState.downloadList as dl (dl.downloadId)}
					<div class="dl-row" class:dl-row-active={dl.status === "downloading"}>
						<span class="dl-name">{dl.friendlyName}</span>
						{#if dl.status === "downloading" || dl.status === "queued"}
							<div class="dl-bar">
								<div class="dl-fill" style="width: {dl.totalBytes > 0 ? (dl.bytesDownloaded / dl.totalBytes) * 100 : 0}%;"></div>
							</div>
							<span class="dl-pct">
								{dl.totalBytes > 0 ? `${Math.round((dl.bytesDownloaded / dl.totalBytes) * 100)}%` : "…"}
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

		{#if !setupComplete}
			<Button preset="primary" size="lg" onclick={handleSetup} disabled={setupInProgress} class="setup-cta">
				{#if setupInProgress}
					<LoaderCircle size={18} class="animate-spin" /> {copy.setup_in_progress_label}
				{:else}
					<Download size={18} /> {copy.setup_button_label}
				{/if}
			</Button>
		{:else}
			<div class="success-banner">
				<Check size={18} />
				<span>{copy.setup_complete_message}</span>
			</div>
		{/if}

		{#if setupError}
			<div class="error-banner">
				<Text size="sm" weight="semibold">Setup hit a real error</Text>
				<Text size="sm" class="error-copy">{setupError}</Text>
				<div class="error-actions">
					<Button preset="primary" size="sm" onclick={handleRetry}>{copy.error_retry_label}</Button>
					<Button preset="secondary" size="sm" onclick={onBrowse}>{copy.browse_link_label}</Button>
					<Button preset="ghost" size="sm" onclick={onCustomize}>{copy.error_pick_manually_label}</Button>
				</div>
			</div>
		{/if}
	{/if}

	<div class="escape-actions">
		<Button preset="ghost" size="sm" onclick={onCustomize}>
			<Settings2 size={14} /> {copy.customize_link_label}
		</Button>
		<Button preset="ghost" size="sm" onclick={onBrowse}>
			<Search size={14} /> {copy.browse_link_label}
		</Button>
	</div>

	<VramBar />

	<div class="nav">
		<Button preset="ghost" size="sm" onclick={onBack}>
			<ArrowLeft size={14} /> {copy.back_label}
		</Button>
		<Button preset="primary" size="md" onclick={onContinue} disabled={!canContinue || setupInProgress}>
			{copy.continue_label} <ArrowRight size={14} />
		</Button>
	</div>
</div>

{#if setupInProgress}
	<div class="setup-overlay" aria-live="polite">
		<div class="setup-overlay-card">
			<img src="/imgs/mascot/clyffyloading.gif" alt="Clyffy setting up your AI" class="setup-overlay-mascot" />
			<Text size="base" weight="semibold">Setting up your AI...</Text>
			<Text size="sm" class="setup-overlay-copy">
				{#if wizardState.hasActiveDownloads}
					Downloading {wizardState.downloadList.length} model{wizardState.downloadList.length > 1 ? "s" : ""}. This can take a few minutes.
				{:else}
					Assigning the models that are already on disk.
				{/if}
			</Text>
			{#if wizardState.hasActiveDownloads}
				<div class="overlay-queue">
					{#each wizardState.downloadList as dl (dl.downloadId)}
						<div class="overlay-dl">
							<span class="overlay-dl-name">{dl.friendlyName}</span>
							<div class="overlay-dl-bar">
								<div class="overlay-dl-fill" style="width: {dl.totalBytes > 0 ? (dl.bytesDownloaded / dl.totalBytes) * 100 : 0}%;"></div>
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
	title="Model setup in plain English"
	summary="This page chooses one main brain and the supporting roles around it, then downloads or assigns everything needed for a working local baseline."
	points={[
		"Brain: the main model that thinks and writes code.",
		"Required roles: the minimum stack for coding and memory retrieval.",
		"Optional roles: voice and vision, safe to add later.",
		"Customize and Browse are escape hatches if you want to override the recommended plan.",
	]}
	imageSrc="/imgs/mascot/clyffy-df-icon-interaction1.png"
	onClose={() => (showPageHelp = false)}
/>

<style>
	.models-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(1rem, 0.75rem + 1vw, 1.5rem);
		width: 100%;
		max-width: 44rem;
		padding: clamp(1rem, 0.75rem + 1vw, 1.5rem) 0;
	}

	.step-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		text-align: center;
	}

	:global(.step-subtitle) {
		max-width: 38rem;
		color: var(--text-secondary);
	}

	:global(.step-guidance) {
		max-width: 38rem;
		color: var(--text-muted);
	}

	.step-help-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding-block: 2rem;
	}

	.loading-mascot {
		width: 4.5rem;
		height: 4.5rem;
		object-fit: contain;
	}

	:global(.loading-copy) {
		color: var(--text-muted);
	}

	.section-head {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		width: 100%;
	}

	.section-title-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	:global(.section-kicker) {
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-muted);
	}

	:global(.section-copy) {
		color: var(--text-secondary);
	}

	.brain-row {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		padding: 1rem 1.125rem;
		border-radius: 1rem;
		background:
			linear-gradient(135deg, color-mix(in oklch, var(--accent-purple-fill) 85%, transparent), transparent 55%),
			var(--glass-deep);
		border: var(--border-preset-default-width) solid var(--border-subtle);
		box-shadow: var(--shadow-z2);
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
		min-width: 10.5rem;
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
	}

	.brain-chip:hover:not(:disabled) {
		border-color: var(--accent-purple-main);
		box-shadow: 0 0 0 var(--space-1) color-mix(in oklch, var(--accent-purple-main) 24%, transparent), var(--shadow-z2);
		transform: translateY(-0.125rem);
	}

	.brain-chip-active {
		background:
			linear-gradient(135deg, color-mix(in oklch, var(--accent-purple-fill) 88%, transparent), transparent 60%),
			var(--glass-smoke);
		border-color: var(--accent-purple-main);
		box-shadow: 0 0 0 var(--space-1) color-mix(in oklch, var(--accent-purple-main) 28%, transparent), var(--shadow-z2);
	}

	.brain-chip-switching,
	.brain-chip:disabled {
		opacity: 0.65;
		cursor: not-allowed;
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

	:global(.active-preset) {
		width: 100%;
		text-align: right;
		color: var(--text-muted);
	}

	.model-section,
	.download-queue {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
	}

	.rec-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.rec-card {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 0.875rem 1rem;
		border-radius: 1rem;
		background: var(--glass-deep);
		border: var(--border-preset-default-width) solid var(--border-subtle);
		border-left: 0.25rem solid var(--role-accent, var(--border-strong));
	}

	.rec-card-optional {
		opacity: 0.94;
	}

	.rec-card[data-role="reasoning"] {
		--role-accent: var(--accent-purple-main);
		background: linear-gradient(90deg, color-mix(in oklch, var(--accent-purple-fill) 92%, transparent), var(--glass-deep) 30%);
	}

	.rec-card[data-role="observation"] {
		--role-accent: var(--accent-green-main);
		background: linear-gradient(90deg, color-mix(in oklch, var(--accent-green-fill) 92%, transparent), var(--glass-deep) 30%);
	}

	.rec-card[data-role="encoder"] {
		--role-accent: var(--accent-blue-main);
		background: linear-gradient(90deg, color-mix(in oklch, var(--accent-teal-fill) 92%, transparent), var(--glass-deep) 30%);
	}

	.rec-card[data-role="voice"] {
		--role-accent: var(--accent-coral-main);
		background: linear-gradient(90deg, color-mix(in oklch, var(--accent-coral-fill) 92%, transparent), var(--glass-deep) 30%);
	}

	.rec-icon {
		flex-shrink: 0;
		color: var(--role-accent, var(--text-muted));
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
		flex-direction: column;
		gap: 0.1875rem;
	}

	.rec-name-line {
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

	.dl-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 0.75rem;
		border-radius: 0.875rem;
		background: var(--glass-deep);
		border: var(--border-preset-default-width) solid var(--border-subtle);
	}

	.dl-row-active {
		border-color: var(--accent-cyan-main);
		box-shadow: 0 0 0 var(--space-1) color-mix(in oklch, var(--accent-cyan-main) 20%, transparent);
	}

	.dl-name {
		flex: 0 0 9rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.dl-bar,
	.overlay-dl-bar {
		flex: 1;
		height: 0.375rem;
		border-radius: var(--radius-full);
		background: var(--color-void-800);
		overflow: hidden;
	}

	.dl-fill,
	.overlay-dl-fill {
		height: 100%;
		border-radius: var(--radius-full);
		background: linear-gradient(90deg, var(--accent-cyan-main), var(--accent-purple-main));
		transition: width var(--motion-duration-fast);
	}

	.dl-pct {
		width: 2.5rem;
		text-align: right;
		font-size: 0.75rem;
		font-variant-numeric: tabular-nums;
		color: var(--text-muted);
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

	.success-banner {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
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

	:global(.error-copy) {
		color: var(--text-secondary);
	}

	.error-actions,
	.escape-actions,
	.nav {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}

	.escape-actions {
		justify-content: center;
		flex-wrap: wrap;
	}

	.nav {
		justify-content: space-between;
		padding-top: 0.5rem;
	}

	:global(.setup-cta) {
		width: 100%;
	}

	.setup-overlay {
		position: fixed;
		inset: 0;
		z-index: 1100;
		display: flex;
		align-items: center;
		justify-content: center;
		background: color-mix(in oklch, var(--color-void-950) 88%, transparent);
		backdrop-filter: blur(0.75rem);
	}

	.setup-overlay-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		width: min(90vw, 32rem);
		max-width: 32rem;
		padding: 1.75rem 1.5rem;
		border-radius: 1.25rem;
		background: var(--glass-smoke);
		border: var(--border-preset-default-width) solid var(--border-strong);
		box-shadow: var(--shadow-z4);
	}

	.setup-overlay-mascot {
		width: 6rem;
		height: 6rem;
		object-fit: contain;
	}

	:global(.setup-overlay-copy) {
		text-align: center;
		color: var(--text-secondary);
	}

	.overlay-queue {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		margin-top: 0.5rem;
	}

	.overlay-dl {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.overlay-dl-name {
		flex: 0 0 8rem;
		font-size: 0.75rem;
		color: var(--text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
