<!--
  @file SlotSwapPopup.svelte
  Canonical per-slot configuration popup for the live setup wizard.
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import {
	Check,
	ChevronRight,
	Download,
	FolderOpen,
	LoaderCircle,
	Monitor,
	Search,
	Sparkles,
	Upload,
	X,
} from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import type { ModelInfo } from "$lib/sys/generated/bindings.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { importLocalModel } from "../../../services/download.service.js";
import type { SlotId } from "../../../types/models.types.js";
import { formatMb } from "../../../types/models.types.js";
import { wizardState } from "../wizard.runes.svelte.js";
import { downloadAndAssign, downloadAndAssignFile } from "../wizard.service.js";
import type { BrowseCopy, ClyffyTooltipsCopy, WizardCopy } from "../wizard.types.js";
import { friendlyName, getSlotLabel, ROLE_COLORS } from "../wizard.types.js";
import ClyffyTooltip from "./ClyffyTooltip.svelte";
import HuggingFaceSearch from "./HuggingFaceSearch.svelte";

type PopupTab = "recommended" | "local" | "search";

interface Props {
	slotId: string;
	onSelect: (modelId: string) => void | Promise<void>;
	onBrowseAll: () => void;
	onClose: () => void;
	initialTab?: PopupTab;
}

let { slotId, onSelect, onBrowseAll, onClose, initialTab = "recommended" }: Props = $props();

let activeTab = $state<PopupTab>("recommended");
let busyAction = $state<string | null>(null);
let popupError = $state<string | null>(null);
let browseCopy = $state<BrowseCopy | null>(null);
let tooltips = $state<ClyffyTooltipsCopy | null>(null);
let copyLoaded = false;

$effect(() => {
	activeTab = initialTab;
});

$effect(() => {
	if (copyLoaded) return;
	copyLoaded = true;
	void (async () => {
		try {
			const copy = await invoke<WizardCopy>("get_wizard_copy");
			browseCopy = copy.browse;
			tooltips = copy.clyffy_tooltips;
		} catch (error) {
			console.warn("[wizard][slot-popup] failed to load copy", error);
		}
	})();
});

const label = $derived(getSlotLabel(slotId));
const roleColor = $derived(label ? ROLE_COLORS[label.role] : null);
const slot = $derived(modelsState.slots.find((entry) => entry.id === slotId));
const assignedModel = $derived(modelsState.assignedModel(slotId));
const recommendation = $derived(
	wizardState.recommendations.find((entry) => entry.slot === slotId) ?? null,
);

const localOptions = $derived.by((): Array<ModelInfo & { fits: boolean; recommended: boolean }> => {
	const capability = slot?.capability ?? "";
	const compatible = modelsState.modelsForCapability(capability);
	const sorted = [...compatible].sort(
		(left, right) => left.vram_estimate_mb - right.vram_estimate_mb,
	);
	const vramFree = hardwareState.vramFreeMb ?? 0;
	let recommendedFound = false;
	return sorted.map((model) => {
		const fits = !hardwareState.hasGpu || model.vram_estimate_mb <= vramFree;
		const recommended = fits && !recommendedFound;
		if (recommended) recommendedFound = true;
		return { ...model, fits, recommended };
	});
});

const knowledgeDrops = $derived.by(() => {
	const slotName = friendlyName(slotId);
	return {
		recommended: [
			`${slotName} gets its quick-pick from the active hardware preset, not from a front-end-only default.`,
			`If the file is already on disk, the kernel can assign it immediately without downloading it again.`,
		],
		local: [
			`Local assignment is the fastest dev path because it stays offline and skips queue time entirely.`,
			`Fit badges compare the model's VRAM estimate against your current free VRAM, not a hardcoded guess.`,
		],
		search: [
			`Search downloads still use the real kernel queue, registry import, and slot assignment path you see in setup.`,
			`Use a HuggingFace token when you need private repos, gated access, or higher request limits.`,
		],
	};
});

function roleTooltipKey(): keyof ClyffyTooltipsCopy {
	if (label?.role === "reasoning") return "role_brain_info";
	if (label?.role === "observation") return "role_minion_info";
	if (label?.role === "voice") return "role_voice_info";
	return "role_encoder_info";
}

function prettyName(filename: string): string {
	return filename.replace(/\.(gguf|safetensors|onnx|bin)$/i, "").replace(/-/g, " ");
}

async function handleSelect(modelId: string): Promise<void> {
	busyAction = `assign:${modelId}`;
	popupError = null;
	try {
		await onSelect(modelId);
		onClose();
	} catch (error) {
		popupError = error instanceof Error ? error.message : String(error);
	} finally {
		busyAction = null;
	}
}

async function handleRecommendedAction(): Promise<void> {
	if (!recommendation) {
		activeTab = "search";
		return;
	}

	busyAction = "recommended";
	popupError = null;
	try {
		if (recommendation.alreadyDownloaded) {
			await modelsState.scan();
			await modelsState.refresh();
			const model = modelsState.models.find((entry) => entry.filename === recommendation.file);
			if (!model) {
				throw new Error("Recommended file is marked on disk but is not in the registry yet.");
			}
			await onSelect(model.id);
		} else {
			await downloadAndAssign(recommendation);
		}
		onClose();
	} catch (error) {
		popupError = error instanceof Error ? error.message : String(error);
	} finally {
		busyAction = null;
	}
}

async function handleImport(): Promise<void> {
	busyAction = "import";
	popupError = null;
	try {
		await importLocalModel(slotId, "symlink");
		await modelsState.scan();
		await modelsState.refresh();
		onClose();
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		if (message !== "Import failed: No file selected") {
			popupError = message;
		}
	} finally {
		busyAction = null;
	}
}

async function handleSearchDownload(
	repoId: string,
	filename: string,
	targetSlot: string,
): Promise<void> {
	busyAction = `search:${filename}`;
	popupError = null;
	try {
		await downloadAndAssignFile(repoId, filename, (targetSlot ?? slotId) as SlotId);
		onClose();
	} catch (error) {
		popupError = error instanceof Error ? error.message : String(error);
		throw error;
	} finally {
		busyAction = null;
	}
}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="popup-backdrop" onclick={onClose} onkeydown={(e) => e.key === "Escape" && onClose()}>
	<div
		class="popup"
		style={`--slot-accent: ${roleColor?.accent ?? "var(--accent-cyan-main)"};`}
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.key === "Escape" && onClose()}
		role="dialog"
		aria-label={`Manage ${label?.name ?? slotId}`}
		tabindex="-1"
	>
		<div class="popup-header">
			<div class="popup-title-wrap">
				<div class="popup-kicker-row">
					<span class="popup-kicker">Clyffy Config</span>
					{#if tooltips}
						<ClyffyTooltip copy={tooltips} copyKey={roleTooltipKey()} label={`What does ${label?.name ?? slotId} do?`} />
					{/if}
				</div>
				<Text size="lg" weight="bold">{label?.name ?? slotId}</Text>
				<Text size="sm" class="popup-subtitle">{label?.description ?? friendlyName(slotId)}</Text>
			</div>
			<button class="btn-close" onclick={onClose} aria-label="Close"><X size={16} /></button>
		</div>

		<div class="popup-callout">
			<img src="/imgs/mascot/clyffy-df-icon-interaction2.png" alt="" aria-hidden="true" class="popup-mascot" />
			<div class="popup-callout-copy">
				<Text size="xs" weight="bold" class="callout-kicker">Knowledge Drop</Text>
				<Text size="sm" class="callout-text">
					{#if activeTab === "recommended"}
						Pick the preset-backed option when you want the fastest clean baseline for this slot.
					{:else if activeTab === "local"}
						Assign a local file when you want zero network delay and a fast dev loop.
					{:else}
						Search here when the preset is not enough or you want a different file family for this role.
					{/if}
				</Text>
				<ul class="knowledge-list">
					{#each knowledgeDrops[activeTab] as point (point)}
						<li>{point}</li>
					{/each}
				</ul>
			</div>
		</div>

		<div class="tab-bar" role="tablist" aria-label="Model source for this slot">
			<button class="tab" class:tab-active={activeTab === "recommended"} onclick={() => (activeTab = "recommended")} role="tab" aria-selected={activeTab === "recommended"}>
				<Sparkles size={14} /> Quick Pick
			</button>
			<button class="tab" class:tab-active={activeTab === "local"} onclick={() => (activeTab = "local")} role="tab" aria-selected={activeTab === "local"}>
				<FolderOpen size={14} /> On Your Computer
			</button>
			<button class="tab" class:tab-active={activeTab === "search"} onclick={() => (activeTab = "search")} role="tab" aria-selected={activeTab === "search"}>
				<Search size={14} /> Search HuggingFace
			</button>
		</div>

		{#if popupError}
			<div class="popup-error">{popupError}</div>
		{/if}

		<div class="popup-body">
			{#if activeTab === "recommended"}
				<section class="panel">
					<div class="panel-head">
						<div>
							<Text size="sm" weight="bold">Preset-backed recommendation</Text>
							<Text size="xs" class="panel-copy">This follows the kernel preset and the current hardware tier.</Text>
						</div>
						{#if tooltips}
							<ClyffyTooltip copy={tooltips} copyKey="preset_picker_info" label="What is a preset-backed recommendation?" />
						{/if}
					</div>

					{#if recommendation}
						<div class="recommendation-card">
							<div class="recommendation-copy">
								<Text size="sm" weight="bold">{recommendation.name}</Text>
								<Text size="xs" class="recommendation-meta">{formatMb(recommendation.sizeMb)} · ~{formatMb(recommendation.vramMb)} VRAM · {recommendation.device}</Text>
								<Text size="xs" class="recommendation-state">
									{#if recommendation.alreadyDownloaded}
										Already on disk. The kernel can assign it immediately.
									{:else}
										Needs a real download. The live setup queue will track the bundle and import.
									{/if}
								</Text>
							</div>
							<Button preset="primary" size="md" onclick={handleRecommendedAction} disabled={busyAction === "recommended"}>
								{#if busyAction === "recommended"}
									<LoaderCircle size={14} class="animate-spin" /> Working...
								{:else if recommendation.alreadyDownloaded}
									<Check size={14} /> Use Recommended
								{:else}
									<Download size={14} /> Download Recommended
								{/if}
							</Button>
						</div>
					{:else}
						<div class="empty-card">
							<Text size="sm" weight="bold">No preset pick for this slot yet</Text>
							<Text size="xs" class="empty-copy">Use local browse or HuggingFace search to fill this role manually.</Text>
							<div class="empty-actions">
								<Button preset="secondary" size="sm" onclick={() => (activeTab = "local")}>
									<FolderOpen size={14} /> Browse local
								</Button>
								<Button preset="ghost" size="sm" onclick={() => (activeTab = "search")}>
									<Search size={14} /> Search online
								</Button>
							</div>
						</div>
					{/if}
				</section>
			{:else if activeTab === "local"}
				<section class="panel">
					<div class="panel-head">
						<div>
							<Text size="sm" weight="bold">Compatible local models</Text>
							<Text size="xs" class="panel-copy">Assign something from disk or import a new file into this slot.</Text>
						</div>
						<div class="panel-head-actions">
							<div class="hardware-pill">
								<Monitor size={12} /> {formatMb(hardwareState.vramFreeMb ?? 0)} free VRAM
							</div>
							<Button preset="ghost" size="sm" onclick={handleImport} disabled={busyAction === "import"}>
								{#if busyAction === "import"}
									<LoaderCircle size={14} class="animate-spin" /> Importing...
								{:else}
									<Upload size={14} /> Import file
								{/if}
							</Button>
						</div>
					</div>

					{#if localOptions.length === 0}
						<div class="empty-card">
							<Text size="sm" weight="bold">No compatible local models yet</Text>
							<Text size="xs" class="empty-copy">Import one from disk or switch to HuggingFace search for a fresh download.</Text>
							<div class="empty-actions">
								<Button preset="secondary" size="sm" onclick={handleImport} disabled={busyAction === "import"}>
									<Upload size={14} /> Import from file
								</Button>
								<Button preset="ghost" size="sm" onclick={() => (activeTab = "search")}>
									<Search size={14} /> Search HuggingFace
								</Button>
							</div>
						</div>
					{:else}
						<div class="local-list">
							{#each localOptions as option (option.id)}
								<button class="local-row" onclick={() => void handleSelect(option.id)} disabled={busyAction === `assign:${option.id}`}>
									<div class="local-copy">
										<Text size="sm" weight="bold">{prettyName(option.filename)}</Text>
										<Text size="xs" class="local-meta">{formatMb(option.size_mb)} · {formatMb(option.vram_estimate_mb)} VRAM{#if option.quant_level} · {option.quant_level}{/if}</Text>
									</div>
									<div class="local-badges">
										<span class:fit-pill={option.fits} class:no-fit-pill={!option.fits}>{option.fits ? "Fits" : "Tight fit"}</span>
										{#if assignedModel?.id === option.id}
											<span class="assigned-pill">Assigned</span>
										{:else if option.recommended}
											<span class="recommended-pill"><Check size={10} /> Best local fit</span>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</section>
			{:else}
				<section class="panel panel-search">
					<div class="panel-head">
						<div>
							<Text size="sm" weight="bold">Search and download</Text>
							<Text size="xs" class="panel-copy">Downloads still go through the real kernel queue, registry import, and slot assignment path.</Text>
						</div>
						{#if tooltips}
							<ClyffyTooltip copy={tooltips} copyKey="hf_token_info" label="Why would I add a HuggingFace token?" />
						{/if}
					</div>
					<HuggingFaceSearch copy={browseCopy} onDownload={handleSearchDownload} />
				</section>
			{/if}
		</div>

		<div class="popup-footer">
			<Button preset="ghost" size="sm" onclick={() => { onBrowseAll(); onClose(); }}>
				<ChevronRight size={14} /> Open full browser
			</Button>
			<Button preset="primary" size="sm" onclick={onClose}>Done</Button>
		</div>
	</div>
</div>

<style>
	.popup-backdrop {
		position: fixed;
		inset: 0;
		z-index: 240;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: rgba(4, 8, 16, 0.72);
		backdrop-filter: blur(0.5rem);
	}

	.popup {
		width: min(66rem, 96vw);
		max-height: min(54rem, 92vh);
		display: flex;
		flex-direction: column;
		border-radius: 1.5rem;
		overflow: hidden;
		background:
			linear-gradient(150deg, color-mix(in oklch, var(--accent-cyan-fill) 12%, transparent), transparent 38%),
			linear-gradient(330deg, color-mix(in oklch, var(--accent-purple-fill) 14%, transparent), transparent 46%),
			var(--surface-base, #0c1220);
		border: var(--border-preset-default-width) solid color-mix(in oklch, var(--slot-accent, var(--accent-cyan-main)) 32%, var(--border-subtle));
		box-shadow: var(--shadow-z4), 0 0 0 1px color-mix(in oklch, var(--slot-accent, var(--accent-cyan-main)) 14%, transparent);
	}

	.popup-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.125rem 0.875rem;
		border-bottom: var(--border-preset-default-width) solid color-mix(in oklch, var(--slot-accent, var(--accent-cyan-main)) 24%, var(--border-subtle));
	}

	.popup-title-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.popup-kicker-row {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.popup-kicker {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--slot-accent, var(--accent-cyan-main));
	}

	:global(.popup-subtitle) {
		color: var(--text-secondary);
	}

	.btn-close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: var(--border-preset-default-width) solid var(--border-subtle);
		border-radius: 999px;
		background: color-mix(in oklch, var(--glass-elevated) 82%, transparent);
		color: var(--text-muted);
		cursor: pointer;
		transition: var(--transition-all-fast);
	}

	.btn-close:hover {
		color: var(--text-primary);
		border-color: var(--slot-accent, var(--accent-cyan-main));
	}

	.popup-callout {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.875rem;
		padding: 1rem 1.125rem 0.25rem;
	}

	.popup-mascot {
		width: 4.25rem;
		height: 4.25rem;
		object-fit: contain;
		filter: drop-shadow(0 0 1rem color-mix(in oklch, var(--slot-accent, var(--accent-cyan-main)) 30%, transparent));
	}

	.popup-callout-copy {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.875rem 1rem;
		border-radius: 1rem;
		background:
			linear-gradient(135deg, color-mix(in oklch, var(--slot-accent, var(--accent-cyan-main)) 12%, transparent), transparent 58%),
			var(--glass-deep);
		border: var(--border-preset-default-width) solid color-mix(in oklch, var(--slot-accent, var(--accent-cyan-main)) 24%, var(--border-subtle));
	}

	:global(.callout-kicker) {
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--slot-accent, var(--accent-cyan-main));
	}

	:global(.callout-text) {
		color: var(--text-secondary);
	}

	.knowledge-list {
		margin: 0;
		padding-left: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		color: var(--text-muted);
		font-size: 0.8125rem;
		line-height: 1.45;
	}

	.tab-bar {
		display: flex;
		gap: 0.5rem;
		padding: 0.875rem 1.125rem 0;
		flex-wrap: wrap;
	}

	.tab {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border-radius: 999px;
		border: var(--border-preset-default-width) solid var(--border-subtle);
		background: color-mix(in oklch, var(--surface-inset) 84%, transparent);
		color: var(--text-secondary);
		font-size: 0.8125rem;
		font-weight: 700;
		cursor: pointer;
		transition: var(--transition-all-fast);
	}

	.tab:hover,
	.tab-active {
		color: var(--text-primary);
		border-color: var(--slot-accent, var(--accent-cyan-main));
		background: color-mix(in oklch, var(--slot-accent, var(--accent-cyan-main)) 18%, transparent);
	}

	.popup-error {
		margin: 0.875rem 1.125rem 0;
		padding: 0.75rem 0.875rem;
		border-radius: 0.875rem;
		background: color-mix(in oklch, var(--signal-error) 10%, transparent);
		border: var(--border-preset-default-width) solid color-mix(in oklch, var(--signal-error) 34%, transparent);
		color: var(--text-secondary);
		font-size: 0.8125rem;
	}

	.popup-body {
		flex: 1;
		min-height: 0;
		overflow: auto;
		padding: 0.875rem 1.125rem 1rem;
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.panel-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.panel-head-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	:global(.panel-copy) {
		color: var(--text-muted);
	}

	.hardware-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.3125rem;
		padding: 0.375rem 0.625rem;
		border-radius: 999px;
		background: color-mix(in oklch, var(--glass-elevated) 82%, transparent);
		border: var(--border-preset-default-width) solid var(--border-subtle);
		color: var(--text-secondary);
		font-size: 0.75rem;
	}

	.recommendation-card,
	.empty-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem;
		border-radius: 1rem;
		background:
			linear-gradient(135deg, color-mix(in oklch, var(--slot-accent, var(--accent-cyan-main)) 10%, transparent), transparent 60%),
			var(--glass-deep);
		border: var(--border-preset-default-width) solid color-mix(in oklch, var(--slot-accent, var(--accent-cyan-main)) 24%, var(--border-subtle));
	}

	.recommendation-copy {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
		flex: 1;
	}

	:global(.recommendation-meta),
	:global(.recommendation-state),
	:global(.empty-copy) {
		color: var(--text-muted);
	}

	.empty-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.local-list {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.local-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		border-radius: 1rem;
		border: var(--border-preset-default-width) solid var(--border-subtle);
		background: color-mix(in oklch, var(--glass-elevated) 80%, transparent);
		cursor: pointer;
		transition: var(--transition-all-fast);
	}

	.local-row:hover:not(:disabled) {
		border-color: color-mix(in oklch, var(--slot-accent, var(--accent-cyan-main)) 44%, transparent);
		transform: translateY(-0.0625rem);
	}

	.local-copy {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
		flex: 1;
	}

	:global(.local-meta) {
		color: var(--text-muted);
	}

	.local-badges {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.fit-pill,
	.no-fit-pill,
	.recommended-pill,
	.assigned-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.1875rem;
		padding: 0.1875rem 0.5rem;
		border-radius: 999px;
		font-size: 0.6875rem;
		font-weight: 700;
	}

	.fit-pill {
		background: color-mix(in oklch, var(--accent-green-main) 18%, transparent);
		color: var(--accent-green-main);
	}

	.no-fit-pill {
		background: color-mix(in oklch, var(--accent-gold-main) 18%, transparent);
		color: var(--accent-gold-main);
	}

	.recommended-pill {
		background: color-mix(in oklch, var(--slot-accent, var(--accent-cyan-main)) 18%, transparent);
		color: var(--slot-accent, var(--accent-cyan-main));
	}

	.assigned-pill {
		background: color-mix(in oklch, var(--accent-purple-main) 18%, transparent);
		color: var(--accent-purple-main);
	}

	.popup-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.875rem 1.125rem 1rem;
		border-top: var(--border-preset-default-width) solid var(--border-subtle);
		background: color-mix(in oklch, var(--surface-base, #0c1220) 88%, transparent);
	}

	@media (max-width: 48rem) {
		.popup {
			width: min(100vw, 100%);
			max-height: 96vh;
			border-radius: 1.125rem;
		}

		.popup-callout {
			grid-template-columns: 1fr;
		}

		.popup-mascot {
			width: 3.5rem;
			height: 3.5rem;
		}

		.recommendation-card,
		.empty-card,
		.local-row,
		.popup-footer {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
