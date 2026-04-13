<!--
  @file SearchBrowseStep.svelte
  Canonical browse/import step.
  Groups local inventory by layman role, keeps online search, and restores route help affordances.
-->
<script lang="ts">
import { ArrowLeft, Brain, Check, Eye, FolderOpen, Search, Upload, Volume2 } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { importLocalModel } from "../../../services/download.service.js";
import type { SlotId } from "../../../types/models.types.js";
import { formatMb } from "../../../types/models.types.js";
import VramBar from "../components/VramBar.svelte";
import WizardHelpTip from "../components/WizardHelpTip.svelte";
import WizardInfoPopup from "../components/WizardInfoPopup.svelte";
import { wizardState } from "../wizard.runes.svelte.js";
import { friendlyName, ROLE_COLORS, type SlotRole } from "../wizard.types.js";
import HuggingFaceSearch from "./HuggingFaceSearch.svelte";

interface Props {
	onBack: () => void;
	onDone: () => void;
}

let { onBack, onDone }: Props = $props();

let activeTab = $state<"local" | "online">("local");
let importError = $state<string | null>(null);
let importing = $state(false);
let showPageHelp = $state(false);

function capInfo(capability: string): { label: string; role: SlotRole; desc: string } {
	if (capability === "TextGeneration") {
		return {
			label: "Chat & Thinking",
			role: "reasoning",
			desc: "Powers the main coding brain and helpers",
		};
	}
	if (capability === "Embedding") {
		return { label: "Memory Search", role: "encoder", desc: "Turns code into searchable memory" };
	}
	if (capability === "Reranking") {
		return { label: "Quality Filter", role: "encoder", desc: "Picks the best search results" };
	}
	if (capability === "VisionEmbedding") {
		return { label: "Screen Reader", role: "encoder", desc: "Understands screenshots and images" };
	}
	if (capability === "SpeechToText") {
		return { label: "Voice Input", role: "voice", desc: "Converts speech into text" };
	}
	if (capability === "TextToSpeech") {
		return { label: "Voice Output", role: "voice", desc: "Speaks replies out loud" };
	}
	return { label: capability, role: "encoder", desc: "Supporting model role" };
}

function roleColor(role: SlotRole): string {
	return ROLE_COLORS[role]?.accent ?? "var(--text-muted)";
}

function roleIcon(role: SlotRole): typeof Brain {
	if (role === "reasoning") return Brain;
	if (role === "observation") return Eye;
	if (role === "encoder") return Search;
	if (role === "voice") return Volume2;
	return Brain;
}

function cleanName(filename: string): string {
	return filename.replace(/\.(gguf|safetensors|onnx|bin)$/i, "").replace(/-/g, " ");
}

const grouped = $derived.by(() => {
	const groups: Record<SlotRole, Array<(typeof modelsState.models)[0]>> = {
		reasoning: [],
		observation: [],
		encoder: [],
		voice: [],
	};

	modelsState.models.forEach((model) => {
		const primaryCap = model.compatible_capabilities[0] ?? "";
		const info = capInfo(primaryCap);
		groups[info.role].push(model);
	});

	return groups;
});

const groupOrder: Array<{ role: SlotRole; title: string; desc: string }> = [
	{
		role: "reasoning",
		title: "Thinking",
		desc: "Brain and helper models for coding and reasoning",
	},
	{ role: "encoder", title: "Understanding", desc: "Search, ranking, and vision models" },
	{ role: "voice", title: "Voice", desc: "Speech recognition and spoken replies" },
	{ role: "observation", title: "Helpers", desc: "Background and support tasks" },
];

async function handleImport(): Promise<void> {
	importing = true;
	importError = null;
	const { toast } = await import("svelte-sonner");
	try {
		await importLocalModel();
		await modelsState.scan();
		await modelsState.refresh();
		toast.success("Model imported");
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		if (message !== "Import failed: No file selected") {
			importError = message;
			toast.error(`Import failed: ${message}`);
		}
	} finally {
		importing = false;
	}
}

async function handleAssign(slotId: string, modelId: string): Promise<void> {
	const { toast } = await import("svelte-sonner");
	try {
		await modelsState.assign(slotId, modelId);
		toast.success(`Assigned to ${friendlyName(slotId)}`);
	} catch (error) {
		toast.error(error instanceof Error ? error.message : String(error));
	}
}
</script>

<div class="browse-step">
	<header class="step-header">
		<Button preset="ghost" size="sm" onclick={onBack}>
			<ArrowLeft size={14} /> Back to Setup
		</Button>
		<Text size="xl" weight="bold">Find Models</Text>
		<Text size="sm" class="step-subtitle">
			Browse models on your computer first, or search HuggingFace when you need to download new ones.
		</Text>
		<div class="help-row">
			<WizardHelpTip tip="Use local models first if they already exist on disk. Use online search when you need to fill missing roles or replace a model." />
			<Button preset="ghost" size="sm" onclick={() => (showPageHelp = true)}>
				How this page works
			</Button>
		</div>
	</header>

	<div class="tab-bar">
		<button class="tab" class:tab-active={activeTab === "local"} onclick={() => (activeTab = "local")}>
			<FolderOpen size={16} /> On Your Computer
		</button>
		<button class="tab" class:tab-active={activeTab === "online"} onclick={() => (activeTab = "online")}>
			<Search size={16} /> Search HuggingFace
		</button>
	</div>

	{#if wizardState.hasActiveDownloads}
		<div class="download-banner">
			<Text size="xs" weight="bold" class="download-kicker">Downloading models...</Text>
			{#each wizardState.downloadList as dl (dl.downloadId)}
				{#if dl.status === "downloading" || dl.status === "queued"}
					<div class="download-row">
						<span class="download-name">{dl.friendlyName}</span>
						<div class="download-bar">
							<div class="download-fill" style="width: {dl.totalBytes > 0 ? (dl.bytesDownloaded / dl.totalBytes) * 100 : 0}%;"></div>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/if}

	{#if activeTab === "local"}
		<div class="local-groups">
			{#each groupOrder as group (group.role)}
				{@const models = grouped[group.role]}
				{@const color = roleColor(group.role)}
				{@const Icon = roleIcon(group.role)}

				<section class="group">
					<div class="group-header" style="color: {color};">
						<Icon size={16} />
						<div class="group-copy">
							<Text size="sm" weight="bold">{group.title}</Text>
							<Text size="xs" class="group-desc">{group.desc}</Text>
						</div>
					</div>

					{#if models.length === 0}
						<div class="group-empty">
							<Text size="sm" class="empty-copy">No {group.title.toLowerCase()} models found yet.</Text>
							<Button preset="ghost" size="sm" onclick={() => (activeTab = "online")}>
								Download from HuggingFace
							</Button>
						</div>
					{:else}
						<div class="local-list">
							{#each models as model (model.id)}
								<div class="local-row" style="--group-color: {color};">
									<div class="local-info">
										<span class="local-name">{cleanName(model.filename)}</span>
										<span class="local-meta">
											{formatMb(model.size_mb)}
											{#if model.quant_level} · {model.quant_level}{/if}
											{#if model.architecture !== "unknown"} · {model.architecture}{/if}
										</span>
										<span class="local-caps">
											{model.compatible_capabilities.map((capability) => capInfo(capability).label).join(", ")}
										</span>
									</div>
									<div class="local-actions">
										{#each modelsState.userSlots.filter((slot) => model.compatible_capabilities.includes(slot.capability)) as slot (slot.id)}
											{@const isAssigned = slot.assigned_model_id === model.id}
											<button
												class="assign-btn"
												class:assign-btn-assigned={isAssigned}
												style="--assign-color: {roleColor(capInfo(slot.capability).role)};"
												onclick={() => handleAssign(slot.id, model.id)}
												disabled={isAssigned}
											>
												{#if isAssigned}
													<Check size={10} /> {friendlyName(slot.id)}
												{:else}
													Use for {friendlyName(slot.id)}
												{/if}
											</button>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</section>
			{/each}

			<Button preset="secondary" size="md" onclick={handleImport} disabled={importing}>
				<Upload size={14} />
				{#if importing}Importing - please wait...{:else}Import Model from File{/if}
			</Button>

			{#if importError}
				<div class="import-error">
					<Text size="xs" class="import-error-copy">{importError}</Text>
					<Button preset="ghost" size="sm" onclick={() => (importError = null)}>Dismiss</Button>
				</div>
			{/if}
		</div>
	{:else}
		<HuggingFaceSearch
			onDownload={async (repoId, filename, targetSlot) => {
				const { downloadModel } = await import("../../../services/download.service.js");
				const { toast } = await import("svelte-sonner");
				try {
					const downloadId = await downloadModel(repoId, filename);
					wizardState.trackDownload(downloadId, (targetSlot ?? "chat.brain") as SlotId, filename);
					toast.info(`Downloading ${cleanName(filename)}...`);
				} catch (error) {
					toast.error(error instanceof Error ? error.message : String(error));
				}
			}}
		/>
	{/if}

	<VramBar />

	<div class="nav">
		<Button preset="primary" size="md" onclick={onDone}>
			<Check size={14} /> Done
		</Button>
	</div>
</div>

<WizardInfoPopup
	open={showPageHelp}
	title="Browse and assign models"
	summary="This page helps you fill missing roles using either models already on your machine or fresh downloads from HuggingFace."
	points={[
		"On Your Computer: assign models you already have before downloading anything new.",
		"Search HuggingFace: download missing models directly into the right role.",
		"Model names are cleaned for display, but assignments still use the real file underneath.",
		"This step is the manual override path when the recommended plan is not what you want.",
	]}
	imageSrc="/imgs/mascot/clyffy-df-icon-interaction2.png"
	onClose={() => (showPageHelp = false)}
/>

<style>
	.browse-step {
		display: flex;
		flex-direction: column;
		gap: clamp(1rem, 0.75rem + 1vw, 1.5rem);
		width: 100%;
		max-width: 42rem;
		padding: clamp(1rem, 0.75rem + 1vw, 1.5rem) 0;
	}

	.step-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	:global(.step-subtitle) {
		color: var(--text-secondary);
	}

	.help-row {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.tab-bar {
		display: flex;
		gap: 0;
		border-bottom: var(--border-preset-default-width) solid var(--border-subtle);
	}

	.tab {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		flex: 1;
		padding: 0.75rem 1rem;
		border: none;
		background: transparent;
		color: var(--text-muted);
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		border-bottom: 0.1875rem solid transparent;
		transition: var(--transition-all-fast);
	}

	.tab:hover {
		color: var(--text-secondary);
		background: var(--glass-deep);
	}

	.tab-active {
		color: var(--accent-cyan-main);
		border-bottom-color: var(--accent-cyan-main);
		background: color-mix(in oklch, var(--accent-teal-fill) 92%, transparent);
	}

	.download-banner {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.75rem;
		border-radius: 1rem;
		background: var(--glass-deep);
		border: var(--border-preset-default-width) solid var(--border-subtle);
	}

	:global(.download-kicker) {
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--accent-cyan-main);
	}

	.download-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.download-name {
		flex: 0 0 7rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.download-bar {
		flex: 1;
		height: 0.25rem;
		border-radius: var(--radius-full);
		background: var(--color-void-800);
		overflow: hidden;
	}

	.download-fill {
		height: 100%;
		border-radius: var(--radius-full);
		background: linear-gradient(90deg, var(--accent-cyan-main), var(--accent-purple-main));
		transition: width var(--motion-duration-fast);
	}

	.local-groups {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.group-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0;
	}

	.group-copy {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	:global(.group-desc) {
		color: var(--text-muted);
	}

	.group-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		border-radius: 0.875rem;
		background: var(--glass-deep);
		border: var(--border-preset-default-width) dashed var(--border-subtle);
	}

	:global(.empty-copy) {
		color: var(--text-muted);
	}

	.local-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.local-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.75rem 0.875rem;
		border-radius: 0.875rem;
		background: var(--glass-deep);
		border: var(--border-preset-default-width) solid var(--border-subtle);
		border-left: 0.1875rem solid var(--group-color, var(--border-strong));
	}

	.local-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
		flex: 1;
	}

	.local-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.local-meta {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.local-caps {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.local-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.assign-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-sm);
		border: var(--border-preset-default-width) solid var(--border-subtle);
		background: transparent;
		color: var(--text-muted);
		font-size: 0.75rem;
		cursor: pointer;
		transition: var(--transition-all-fast);
	}

	.assign-btn:hover {
		border-color: var(--assign-color);
		color: var(--text-primary);
	}

	.assign-btn-assigned {
		border-color: var(--accent-green-main);
		color: var(--accent-green-main);
		background: color-mix(in oklch, var(--accent-green-fill) 92%, transparent);
	}

	.assign-btn:disabled {
		cursor: default;
	}

	.import-error {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.625rem 0.75rem;
		border-radius: 0.875rem;
		background: color-mix(in oklch, var(--signal-error) 12%, transparent);
		border: var(--border-preset-default-width) solid color-mix(in oklch, var(--signal-error) 45%, transparent);
	}

	:global(.import-error-copy) {
		color: var(--text-secondary);
	}

	.nav {
		display: flex;
		justify-content: flex-end;
		padding-top: 0.5rem;
	}
</style>
