<!--
  @file BrowseLocalPopup.svelte
  Modal showing scanned models from models/ filtered by slot capability.
  Absorbs: SlotSwapPopup "Local" tab, SearchBrowseStep local tab, ImportPrompt.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Text } from "@devpulse/coldlight/components/text";
import { Check, FolderOpen, Upload, X } from "lucide-svelte";
import { importLocalModel } from "../../../data-access/download.service.js";
import { hardwareState } from "../../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import { assignModelToSlot } from "../../../data-access/slots.service.js";
import type { SlotId } from "../../../util/models.types.js";
import { calculateFit, formatMb } from "../../../util/models.types.js";
import { friendlyName, getSlotLabel } from "../wizard.types.js";

type FormatFilter = "all" | "gguf" | "safetensors" | "onnx";
type ImportMode = "copy" | "symlink";

interface Props {
	slotId: SlotId;
	capability: string;
	open: boolean;
	onSelect: (modelId: string) => void;
	onClose: () => void;
}

let { slotId, capability, open, onSelect, onClose }: Props = $props();

let formatFilter = $state<FormatFilter>("all");
let importMode = $state<ImportMode>("copy");
let importing = $state(false);
let assigning = $state<string | null>(null);
let error = $state<string | null>(null);

const slotLabel = $derived(getSlotLabel(slotId)?.name ?? slotId);

const compatibleModels = $derived.by(() => {
	return modelsState.models.filter((m) =>
		m.compatible_capabilities.some((c) => c.toLowerCase() === capability.toLowerCase()),
	);
});

const filteredModels = $derived.by(() => {
	if (formatFilter === "all") return compatibleModels;
	return compatibleModels.filter((m) => {
		const fn = m.filename.toLowerCase();
		if (formatFilter === "gguf") return fn.endsWith(".gguf");
		if (formatFilter === "safetensors") return fn.endsWith(".safetensors");
		if (formatFilter === "onnx") return fn.endsWith(".onnx");
		return true;
	});
});

function modelFormat(filename: string): string {
	const fn = filename.toLowerCase();
	if (fn.endsWith(".gguf")) return "GGUF";
	if (fn.endsWith(".safetensors")) return "SafeTensors";
	if (fn.endsWith(".onnx")) return "ONNX";
	return "Unknown";
}

function formatTone(fmt: string): "positive" | "informative" | "neutral" {
	if (fmt === "GGUF") return "positive";
	if (fmt === "SafeTensors") return "informative";
	return "neutral";
}

async function handleSelect(modelId: string): Promise<void> {
	error = null;
	assigning = modelId;
	try {
		await assignModelToSlot(slotId, modelId);
		const { toast } = await import("svelte-sonner");
		toast.success(`Model assigned to ${slotLabel}`);
		onSelect(modelId);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		error = msg;
		const { toast } = await import("svelte-sonner");
		toast.error(`Failed to assign: ${msg}`);
	} finally {
		assigning = null;
	}
}

async function handleImport(): Promise<void> {
	error = null;
	importing = true;
	try {
		await importLocalModel(slotId, importMode);
		await modelsState.scan();
		const { toast } = await import("svelte-sonner");
		toast.success(
			importMode === "symlink"
				? "Model linked — original file stays where it is."
				: "Model imported — copied into the DevPulse models folder.",
		);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		// User cancelled file picker — not an error
		if (!msg.includes("No file selected") && !msg.includes("cancelled")) {
			error = msg;
			const { toast } = await import("svelte-sonner");
			toast.error(`Import failed: ${msg}`);
		}
	} finally {
		importing = false;
	}
}

function handleKeydown(e: KeyboardEvent): void {
	if (e.key === "Escape") onClose();
}
</script>

{#if open}
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="popup-backdrop" onclick={onClose} onkeydown={handleKeydown}>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div class="popup-panel" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Local Models — {slotLabel}">
		<div class="popup-header">
			<Heading level={3} size="lg">Local Models — {slotLabel}</Heading>
			<Button preset="ghost" size="sm" onclick={onClose} aria-label="Close">
				<X size={16} />
			</Button>
		</div>

		<div class="popup-toolbar">
			<div class="popup-import-group">
				<Button preset="secondary" size="sm" onclick={handleImport} disabled={importing}>
					{#if importing}
						<Spinner size="xs" />
						Importing...
					{:else}
						<Upload size={14} />
						Import from File
					{/if}
				</Button>

				<div
					class="import-mode-tabs"
					role="radiogroup"
					aria-label="Import mode"
					title="Copy makes a duplicate in the DevPulse models folder. Link points at the original file in place — saves disk but breaks if you move the source."
				>
					<button
						type="button"
						class="import-mode-tab"
						class:active={importMode === "copy"}
						role="radio"
						aria-checked={importMode === "copy"}
						onclick={() => (importMode = "copy")}
					>
						Copy
					</button>
					<button
						type="button"
						class="import-mode-tab"
						class:active={importMode === "symlink"}
						role="radio"
						aria-checked={importMode === "symlink"}
						onclick={() => (importMode = "symlink")}
					>
						Link
					</button>
				</div>
			</div>

			<div class="format-tabs">
				{#each (["all", "gguf", "safetensors", "onnx"] as const) as fmt}
					<button
						class="format-tab"
						class:active={formatFilter === fmt}
						onclick={() => (formatFilter = fmt)}
					>
						{fmt === "all" ? "All" : fmt.toUpperCase()}
					</button>
				{/each}
			</div>
		</div>

		{#if error}
			<div class="error-banner">
				<Text size="sm" class="error-text">{error}</Text>
				<Button preset="ghost" size="sm" onclick={() => (error = null)}>Dismiss</Button>
			</div>
		{/if}

		<div class="model-list">
			{#if filteredModels.length === 0}
				<div class="empty-state">
					<FolderOpen size={32} />
					<Text size="sm">No compatible models found.</Text>
					<Text size="xs" class="empty-hint">Try importing a model file or searching HuggingFace.</Text>
				</div>
			{:else}
				{#each filteredModels as model (model.id)}
					{@const fmt = modelFormat(model.filename)}
					{@const fit = calculateFit(model.vram_estimate_mb, hardwareState.vramFreeMb, hardwareState.vramTotalMb)}
					{@const fitColor = fit === "green" ? "var(--signal-success)" : fit === "yellow" ? "var(--signal-warning)" : fit === "red" ? "var(--signal-error)" : "var(--text-muted)"}
					{@const isAssigning = assigning === model.id}

					<div class="model-row">
						<div class="model-info">
							<Text size="sm" weight="bold" class="model-filename">{model.filename}</Text>
							<div class="model-meta-row">
								<Badge variant={formatTone(fmt)} size="sm">{fmt}</Badge>
								<Text size="xs" class="model-detail">{model.architecture}</Text>
								{#if model.parameter_count}
									<Text size="xs" class="model-detail">{(model.parameter_count / 1e9).toFixed(1)}B params</Text>
								{/if}
								<Text size="xs" class="model-detail">{formatMb(model.size_mb)}</Text>
								<Text size="xs" class="model-detail">{formatMb(model.vram_estimate_mb)} VRAM</Text>
								<span class="fit-dot" style:background-color={fitColor} title="{fit} fit"></span>
							</div>
						</div>

						<Button
							preset="primary"
							size="sm"
							onclick={() => handleSelect(model.id)}
							disabled={isAssigning}
						>
							{#if isAssigning}
								<Spinner size="xs" />
							{:else}
								<Check size={14} />
							{/if}
							Select
						</Button>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
{/if}

<style>
	.popup-backdrop {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		background: oklch(0 0 0 / 0.6);
		backdrop-filter: blur(0.5rem);
	}

	.popup-panel {
		display: flex;
		flex-direction: column;
		width: min(48rem, 90vw);
		max-height: 80vh;
		background: var(--surface-base);
		border: 1px solid var(--border-soft);
		border-radius: 1rem;
		box-shadow: var(--shadow-z3);
		overflow: hidden;
	}

	.popup-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--border-soft);
	}

	.popup-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.75rem 1.25rem;
		border-bottom: 1px solid var(--border-soft);
		flex-wrap: wrap;
	}

	.format-tabs {
		display: flex;
		gap: 0.25rem;
	}

	.popup-import-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.import-mode-tabs {
		display: inline-flex;
		gap: 0;
		border-radius: 0.375rem;
		border: 1px solid var(--border-soft);
		overflow: hidden;
	}

	.import-mode-tab {
		padding: 0.25rem 0.625rem;
		border: none;
		background: transparent;
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 150ms ease-out, color 150ms ease-out;
	}
	.import-mode-tab:hover {
		color: var(--text-secondary);
		background: color-mix(in oklch, var(--surface-raised) 70%, transparent);
	}
	.import-mode-tab.active {
		background: var(--accent-teal-main);
		color: var(--surface-base);
	}

	.format-tab {
		padding: 0.25rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid var(--border-soft);
		background: transparent;
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms ease-out;
	}
	.format-tab:hover {
		border-color: var(--border-default);
		color: var(--text-secondary);
	}
	.format-tab.active {
		background: var(--surface-raised);
		border-color: var(--accent-teal-main);
		color: var(--accent-teal-main);
	}

	.error-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1.25rem;
		background: oklch(0.35 0.12 25 / 0.15);
		border-bottom: 1px solid oklch(0.5 0.15 25 / 0.3);
	}
	:global(.error-text) {
		color: var(--signal-error);
	}

	.model-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 3rem 1rem;
		color: var(--text-muted);
	}
	:global(.empty-hint) {
		color: var(--text-muted);
	}

	.model-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem;
		border-radius: 0.625rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
		transition: border-color 150ms ease-out;
	}
	.model-row:hover {
		border-color: var(--border-default);
	}

	.model-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	:global(.model-filename) {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-family: var(--font-mono);
	}

	.model-meta-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	:global(.model-detail) {
		color: var(--text-muted);
	}

	.fit-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		flex-shrink: 0;
	}
</style>
