<!--
  @file SlotSwapPopup.svelte
  Canonical per-slot configuration popup for the live setup wizard.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Text } from "@devpulse/coldlight/components/text";
import {
	Check,
	ChevronRight,
	Download,
	FolderOpen,
	Monitor,
	Search,
	Sparkles,
	Upload,
	X,
} from "lucide-svelte";
import { copyState, fill } from "$lib/sys/copy/index.js";
import type { ModelInfo } from "$lib/sys/generated/bindings.js";
import { logWarn } from "$lib/sys/logger.js";
import { importLocalModel } from "../../../data-access/download.service.js";
import { hardwareState } from "../../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import type { SlotId } from "../../../util/models.types.js";
import { formatMb } from "../../../util/models.types.js";
import { downloadAndAssign, downloadAndAssignFile, loadWizardCopy } from "../wizard.service.js";
import { wizardState } from "../wizard.state.svelte.js";
import type { BrowseCopy, ClyffyTooltipsCopy } from "../wizard.types.js";
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

const text = $derived(copyState.catalog?.setup_wizard.swap_popup ?? null);

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
			const copy = await loadWizardCopy();
			browseCopy = copy.browse;
			tooltips = copy.clyffy_tooltips ?? null;
		} catch (error) {
			logWarn("wizard.slot-popup", `failed to load copy: ${String(error)}`);
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

const knowledgeDrops = $derived({
	recommended: (text?.drops_recommended ?? []).map((point: string) =>
		fill(point, { slot: friendlyName(slotId) }),
	),
	local: text?.drops_local ?? [],
	search: text?.drops_search ?? [],
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

const TABS: PopupTab[] = ["recommended", "local", "search"];

/** WAI-ARIA tablist: arrow keys, Home and End move between tabs. */
function handleTabKeydown(e: KeyboardEvent): void {
	const current = TABS.indexOf(activeTab);
	const last = TABS.length - 1;
	const next =
		e.key === "ArrowRight" || e.key === "ArrowDown"
			? current === last
				? 0
				: current + 1
			: e.key === "ArrowLeft" || e.key === "ArrowUp"
				? current === 0
					? last
					: current - 1
				: e.key === "Home"
					? 0
					: e.key === "End"
						? last
						: null;
	if (next === null) return;
	e.preventDefault();
	activeTab = TABS[next] ?? activeTab;
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
				throw new Error(text?.not_in_registry ?? "");
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
		if (!message.includes("No file selected")) {
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

{#if text}

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="popup-backdrop" onclick={onClose} onkeydown={(e) => e.key === "Escape" && onClose()}>
	<div
		class="popup"
		style:--slot-accent={roleColor?.accent ?? "var(--accent-cyan-main)"}
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.key === "Escape" && onClose()}
		role="dialog"
		aria-label={fill(text.manage_aria, { slot: label?.name ?? slotId })}
		tabindex="-1"
	>
		<div class="popup-header">
			<div class="popup-title-wrap">
				<div class="popup-kicker-row">
					<span class="popup-kicker">{text.kicker}</span>
					{#if tooltips}
						<ClyffyTooltip copy={tooltips} copyKey={roleTooltipKey()} label={fill(text.what_does, { slot: label?.name ?? slotId })} />
					{/if}
				</div>
				<Text size="lg" weight="bold">{label?.name ?? slotId}</Text>
				<Text size="sm" class="popup-subtitle">{label?.description ?? friendlyName(slotId)}</Text>
			</div>
			<button class="btn-close" onclick={onClose} aria-label={text.close}><X size={16} /></button>
		</div>

		<div class="popup-callout">
			<img src="/imgs/mascot/clyffy-df-icon-interaction2.png" alt="" aria-hidden="true" class="popup-mascot" />
			<div class="popup-callout-copy">
				<Text size="xs" weight="bold" class="callout-kicker">{text.knowledge_drop}</Text>
				<Text size="sm" class="callout-text">
					{#if activeTab === "recommended"}
						{text.callout_recommended}
					{:else if activeTab === "local"}
						{text.callout_local}
					{:else}
						{text.callout_search}
					{/if}
				</Text>
				<ul class="knowledge-list">
					{#each knowledgeDrops[activeTab] as point (point)}
						<li>{point}</li>
					{/each}
				</ul>
			</div>
		</div>

		<div class="tab-bar" role="tablist" tabindex="0" aria-label={text.source_aria} onkeydown={handleTabKeydown}>
			<button class="tab" class:tab-active={activeTab === "recommended"} onclick={() => (activeTab = "recommended")} role="tab" aria-selected={activeTab === "recommended"}>
				<Sparkles size={14} /> {text.tab_recommended}
			</button>
			<button class="tab" class:tab-active={activeTab === "local"} onclick={() => (activeTab = "local")} role="tab" aria-selected={activeTab === "local"}>
				<FolderOpen size={14} /> {text.tab_local}
			</button>
			<button class="tab" class:tab-active={activeTab === "search"} onclick={() => (activeTab = "search")} role="tab" aria-selected={activeTab === "search"}>
				<Search size={14} /> {text.tab_search}
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
							<Text size="sm" weight="bold">{text.preset_title}</Text>
							<Text size="xs" class="panel-copy">{text.preset_copy}</Text>
						</div>
						{#if tooltips}
							<ClyffyTooltip copy={tooltips} copyKey="preset_picker_info" label={text.preset_tip_label} />
						{/if}
					</div>

					{#if recommendation}
						<div class="recommendation-card">
							<div class="recommendation-copy">
								<Text size="sm" weight="bold">{recommendation.name}</Text>
								<Text size="xs" class="recommendation-meta">{fill(text.rec_meta, { size: formatMb(recommendation.sizeMb), vram: formatMb(recommendation.vramMb), device: recommendation.device })}</Text>
								<Text size="xs" class="recommendation-state">
									{#if recommendation.alreadyDownloaded}
										{text.rec_on_disk}
									{:else}
										{text.rec_download}
									{/if}
								</Text>
							</div>
							<Button variant="primary" size="md" onclick={handleRecommendedAction} disabled={busyAction === "recommended"}>
								{#if busyAction === "recommended"}
									<Spinner size="sm" tone="accent" /> {text.working}
								{:else if recommendation.alreadyDownloaded}
									<Check size={14} /> {text.use_recommended}
								{:else}
									<Download size={14} /> {text.download_recommended}
								{/if}
							</Button>
						</div>
					{:else}
						<div class="empty-card">
							<Text size="sm" weight="bold">{text.no_pick_title}</Text>
							<Text size="xs" class="empty-copy">{text.no_pick_copy}</Text>
							<div class="empty-actions">
								<Button variant="secondary" size="sm" onclick={() => (activeTab = "local")}>
									<FolderOpen size={14} /> {text.browse_local}
								</Button>
								<Button variant="ghost" size="sm" onclick={() => (activeTab = "search")}>
									<Search size={14} /> {text.search_online}
								</Button>
							</div>
						</div>
					{/if}
				</section>
			{:else if activeTab === "local"}
				<section class="panel">
					<div class="panel-head">
						<div>
							<Text size="sm" weight="bold">{text.local_title}</Text>
							<Text size="xs" class="panel-copy">{text.local_copy}</Text>
						</div>
						<div class="panel-head-actions">
							<div class="hardware-pill">
								<Monitor size={12} /> {fill(text.free_vram, { size: formatMb(hardwareState.vramFreeMb ?? 0) })}
							</div>
							<Button variant="ghost" size="sm" onclick={handleImport} disabled={busyAction === "import"}>
								{#if busyAction === "import"}
									<Spinner size="sm" tone="accent" /> {text.importing}
								{:else}
									<Upload size={14} /> {text.import_file}
								{/if}
							</Button>
						</div>
					</div>

					{#if localOptions.length === 0}
						<div class="empty-card">
							<Text size="sm" weight="bold">{text.no_local_title}</Text>
							<Text size="xs" class="empty-copy">{text.no_local_copy}</Text>
							<div class="empty-actions">
								<Button variant="secondary" size="sm" onclick={handleImport} disabled={busyAction === "import"}>
									<Upload size={14} /> {text.import_from_file}
								</Button>
								<Button variant="ghost" size="sm" onclick={() => (activeTab = "search")}>
									<Search size={14} /> {text.tab_search}
								</Button>
							</div>
						</div>
					{:else}
						<div class="local-list">
							{#each localOptions as option (option.id)}
								<button class="local-row" onclick={() => void handleSelect(option.id)} disabled={busyAction === `assign:${option.id}`}>
									<div class="local-copy">
										<Text size="sm" weight="bold">{prettyName(option.filename)}</Text>
										<Text size="xs" class="local-meta">{fill(text.local_meta, { size: formatMb(option.size_mb), vram: formatMb(option.vram_estimate_mb) })}{#if option.quant_level} · {option.quant_level}{/if}</Text>
									</div>
									<div class="local-badges">
										<span class:fit-pill={option.fits} class:no-fit-pill={!option.fits}>{option.fits ? text.fits : text.tight_fit}</span>
										{#if assignedModel?.id === option.id}
											<span class="assigned-pill">{text.assigned}</span>
										{:else if option.recommended}
											<span class="recommended-pill"><Check size={10} /> {text.best_local_fit}</span>
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
							<Text size="sm" weight="bold">{text.search_title}</Text>
							<Text size="xs" class="panel-copy">{text.search_copy}</Text>
						</div>
						{#if tooltips}
							<ClyffyTooltip copy={tooltips} copyKey="hf_token_info" label={text.token_tip_label} />
						{/if}
					</div>
					<HuggingFaceSearch copy={browseCopy} onDownload={handleSearchDownload} />
				</section>
			{/if}
		</div>

		<div class="popup-footer">
			<Button variant="ghost" size="sm" onclick={() => { onBrowseAll(); onClose(); }}>
				<ChevronRight size={14} /> {text.open_browser}
			</Button>
			<Button variant="primary" size="sm" onclick={onClose}>{text.done}</Button>
		</div>
	</div>
</div>
{/if}

<style>
	.popup-backdrop {
		position: fixed;
		inset: 0;
		z-index: 240;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: var(--overlay-scrim);
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
			var(--surface-base);
		border: var(--border-width-thin) solid color-mix(in oklch, var(--slot-accent, var(--accent-cyan-main)) 32%, var(--border-subtle));
		box-shadow: var(--dialog-box-shadow), 0 0 0 var(--border-width-thin) color-mix(in oklch, var(--slot-accent, var(--accent-cyan-main)) 14%, transparent);
	}

	.popup-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.125rem 0.875rem;
		border-bottom: var(--border-width-thin) solid color-mix(in oklch, var(--slot-accent, var(--accent-cyan-main)) 24%, var(--border-subtle));
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
		border: var(--border-width-thin) solid var(--border-subtle);
		border-radius: var(--radius-full);
		background: color-mix(in oklch, var(--glass-standard) 82%, transparent);
		color: var(--text-muted);
		cursor: pointer;
		transition: all var(--duration-fast);
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
		border: var(--border-width-thin) solid color-mix(in oklch, var(--slot-accent, var(--accent-cyan-main)) 24%, var(--border-subtle));
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
		border-radius: var(--radius-full);
		border: var(--border-width-thin) solid var(--border-subtle);
		background: color-mix(in oklch, var(--surface-inset) 84%, transparent);
		color: var(--text-secondary);
		font-size: 0.8125rem;
		font-weight: 700;
		cursor: pointer;
		transition: all var(--duration-fast);
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
		border: var(--border-width-thin) solid color-mix(in oklch, var(--signal-error) 34%, transparent);
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
		border-radius: var(--radius-full);
		background: color-mix(in oklch, var(--glass-standard) 82%, transparent);
		border: var(--border-width-thin) solid var(--border-subtle);
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
		border: var(--border-width-thin) solid color-mix(in oklch, var(--slot-accent, var(--accent-cyan-main)) 24%, var(--border-subtle));
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
		border: var(--border-width-thin) solid var(--border-subtle);
		background: color-mix(in oklch, var(--glass-standard) 80%, transparent);
		cursor: pointer;
		transition: all var(--duration-fast);
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
		border-radius: var(--radius-full);
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
		border-top: var(--border-width-thin) solid var(--border-subtle);
		background: color-mix(in oklch, var(--surface-base) 88%, transparent);
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
