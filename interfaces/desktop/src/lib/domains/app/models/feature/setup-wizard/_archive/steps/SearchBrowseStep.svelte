<!--
  @file SearchBrowseStep.svelte
  Canonical browse/import step.
  Groups local inventory by layman role, keeps online search, and restores route help affordances.
-->
<script lang="ts">
import {
	ArrowLeft,
	Brain,
	Check,
	Cpu,
	Eye,
	FolderOpen,
	HardDrive,
	Monitor,
	Search,
	Upload,
	Volume2,
} from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { importLocalModel } from "../../../data-access/download.service.js";
import { hardwareState } from "../../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import type { SlotId } from "../../../util/models.types.js";
import { formatMb } from "../../../util/models.types.js";
import HuggingFaceSearch from "../components/HuggingFaceSearch.svelte";
import SlotSwapPopup from "../components/SlotSwapPopup.svelte";
import VramBar from "../components/VramBar.svelte";
import WizardHelpTip from "../components/WizardHelpTip.svelte";
import WizardInfoPopup from "../components/WizardInfoPopup.svelte";
import { downloadAndAssignFile } from "../wizard.service.js";
import { wizardState } from "../wizard.state.svelte.js";
import { friendlyName, ROLE_COLORS, type SlotRole } from "../wizard.types.js";

interface Props {
	onBack: () => void;
	onDone: () => void;
}

let { onBack, onDone }: Props = $props();

let activeTab = $state<"local" | "online">("local");
let importError = $state<string | null>(null);
let importing = $state(false);
let showPageHelp = $state(false);
let manageSlotId = $state<string | null>(null);
let manageInitialTab = $state<"recommended" | "local" | "search">("recommended");

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
	if (capability === "VisionLanguage") {
		return {
			label: "Vision Reasoning",
			role: "encoder",
			desc: "Answers questions about screenshots and images",
		};
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

function slotState(slotId: string): "ready" | "loading" | "failed" | "assigned" | "empty" {
	const status = modelsState.statuses[slotId];
	if (status?.type === "hot" || status?.type === "standby") return "ready";
	if (status?.type === "loading") return "loading";
	if (status?.type === "failed") return "failed";
	if (modelsState.assignedModel(slotId)) return "assigned";
	return "empty";
}

function slotStateLabel(slotId: string): string {
	const state = slotState(slotId);
	if (state === "ready") return "Ready";
	if (state === "loading") return "Loading";
	if (state === "failed") return "Failed";
	if (state === "assigned") return "Assigned";
	return "Not set";
}

const slotCards = $derived.by(() =>
	modelsState.userSlots.map((slot) => {
		const info = capInfo(slot.capability);
		const role = info.role;
		const assigned = modelsState.assignedModel(slot.id);
		return {
			slotId: slot.id,
			role,
			color: roleColor(role),
			label: friendlyName(slot.id),
			capabilityLabel: info.label,
			description: info.desc,
			assignedLabel: assigned ? cleanName(assigned.filename) : "No model assigned yet",
			state: slotState(slot.id),
			stateLabel: slotStateLabel(slot.id),
			hasAssignment: Boolean(assigned),
			recommended: wizardState.recommendations.find((entry) => entry.slot === slot.id) ?? null,
		};
	}),
);

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
		throw error;
	}
}

function openSlotManager(slotId: string, tab: "recommended" | "local" | "search"): void {
	manageSlotId = slotId;
	manageInitialTab = tab;
}

async function handlePopupAssign(modelId: string): Promise<void> {
	if (!manageSlotId) return;
	await handleAssign(manageSlotId, modelId);
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

	<section class="baseline-shell" aria-label="Kernel baseline configuration">
		<div class="baseline-summary">
			<div class="baseline-copy">
				<Text size="xs" weight="bold" class="baseline-kicker">Kernel-Gated Baseline</Text>
				<Text size="sm" class="baseline-text">
					{slotCards.filter((slot) => slot.hasAssignment).length}/{slotCards.length} roles assigned.
					Ready means the kernel has the slot hot or on standby, not just selected in the UI.
				</Text>
			</div>
			<div class="hardware-pills" aria-label="Hardware summary">
				<div class="hardware-pill">
					{#if hardwareState.gpuName}
						<Monitor size={14} />
						<span>{hardwareState.gpuName} · {formatMb(hardwareState.vramFreeMb ?? 0)} free VRAM</span>
					{:else}
						<Cpu size={14} />
						<span>CPU-only baseline</span>
					{/if}
				</div>
				{#if hardwareState.ramTotalMb}
					<div class="hardware-pill">
						<Brain size={14} />
						<span>{formatMb(hardwareState.ramTotalMb)} RAM</span>
					</div>
				{/if}
				{#if hardwareState.diskFreeMb}
					<div class="hardware-pill">
						<HardDrive size={14} />
						<span>{formatMb(hardwareState.diskFreeMb)} free disk</span>
					</div>
				{/if}
			</div>
		</div>

		<div class="slot-grid">
			{#each slotCards as slot (slot.slotId)}
				<article class="slot-card" data-state={slot.state} style="--slot-color: {slot.color};">
					<div class="slot-card-head">
						<div class="slot-card-copy">
							<Text size="sm" weight="bold">{slot.label}</Text>
							<Text size="xs" class="slot-capability">{slot.capabilityLabel}</Text>
						</div>
						<span class="slot-state-pill">{slot.stateLabel}</span>
					</div>
					<Text size="sm" class="slot-model-name">{slot.assignedLabel}</Text>
					<Text size="xs" class="slot-description">{slot.description}</Text>
					<div class="slot-card-actions">
						<Button preset="secondary" size="sm" onclick={() => openSlotManager(slot.slotId, slot.recommended ? "recommended" : "local")}>
							{slot.recommended ? "Recommended" : "Manage"}
						</Button>
						<Button preset="ghost" size="sm" onclick={() => openSlotManager(slot.slotId, "local")}>Browse</Button>
						<Button preset="ghost" size="sm" onclick={() => openSlotManager(slot.slotId, "search")}>Search HF</Button>
					</div>
				</article>
			{/each}
		</div>
	</section>

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
				try {
					await downloadAndAssignFile(repoId, filename, (targetSlot ?? "chat.brain") as SlotId);
				} catch (error) {
					const { toast } = await import("svelte-sonner");
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
		"Every slot card opens the same in-wizard popup for recommended picks, local browsing, imports, and HuggingFace search.",
		"On Your Computer stays best for fast dev iteration because it avoids queue time and keeps the stack fully local.",
		"Search HuggingFace still routes through the real kernel queue and slot assignment flow, not a fake side downloader.",
		"This page is the manual override path when the preset recommendation is not the exact dev baseline you want.",
	]}
	imageSrc="/imgs/mascot/clyffy-df-icon-interaction2.png"
	onClose={() => (showPageHelp = false)}
/>

{#if manageSlotId}
	<SlotSwapPopup
		slotId={manageSlotId}
		initialTab={manageInitialTab}
		onSelect={handlePopupAssign}
		onBrowseAll={() => {
			activeTab = "online";
		}}
		onClose={() => (manageSlotId = null)}
	/>
{/if}

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

	.baseline-shell {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		padding: 0.875rem;
		border-radius: 1rem;
		background: var(--glass-deep);
		border: var(--border-preset-default-width) solid var(--border-subtle);
	}

	.baseline-summary {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.baseline-copy {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
		flex: 1;
	}

	:global(.baseline-kicker) {
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--accent-cyan-main);
	}

	:global(.baseline-text) {
		color: var(--text-secondary);
	}

	.hardware-pills {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.hardware-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		border-radius: 999px;
		background: color-mix(in oklch, var(--glass-elevated) 86%, transparent);
		border: var(--border-preset-default-width) solid var(--border-subtle);
		color: var(--text-secondary);
		font-size: 0.75rem;
	}

	.slot-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
		gap: 0.625rem;
	}

	.slot-card {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.75rem 0.875rem;
		border-radius: 0.875rem;
		background: color-mix(in oklch, var(--glass-elevated) 82%, transparent);
		border: var(--border-preset-default-width) solid var(--border-subtle);
		border-left: 0.1875rem solid var(--slot-color, var(--border-strong));
	}

	.slot-card[data-state="ready"] {
		box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--accent-green-main) 35%, transparent);
	}

	.slot-card[data-state="failed"] {
		box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--accent-red-main) 35%, transparent);
	}

	.slot-card-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.slot-card-copy {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	:global(.slot-capability) {
		color: var(--text-muted);
	}

	.slot-state-pill {
		display: inline-flex;
		align-items: center;
		padding: 0.1875rem 0.5rem;
		border-radius: 999px;
		background: color-mix(in oklch, var(--glass-elevated) 80%, transparent);
		border: var(--border-preset-default-width) solid var(--border-subtle);
		color: var(--text-secondary);
		font-size: 0.6875rem;
		font-weight: 700;
		white-space: nowrap;
	}

	.slot-card[data-state="ready"] .slot-state-pill {
		color: var(--accent-green-main);
		border-color: color-mix(in oklch, var(--accent-green-main) 40%, transparent);
	}

	.slot-card[data-state="loading"] .slot-state-pill {
		color: var(--accent-cyan-main);
		border-color: color-mix(in oklch, var(--accent-cyan-main) 40%, transparent);
	}

	.slot-card[data-state="failed"] .slot-state-pill {
		color: var(--signal-error);
		border-color: color-mix(in oklch, var(--signal-error) 40%, transparent);
	}

	:global(.slot-model-name) {
		color: var(--text-primary);
	}

	:global(.slot-description) {
		color: var(--text-muted);
	}

	.slot-card-actions {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
		padding-top: 0.25rem;
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

	@media (max-width: 48rem) {
		.baseline-summary {
			flex-direction: column;
		}

		.local-row {
			flex-direction: column;
			align-items: flex-start;
		}

		.local-actions {
			width: 100%;
		}
	}
</style>
