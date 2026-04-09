<!--
  @file Browse & Search Models
  @route /model-loader/browse
  @domain models

  Local models grouped by role with color. Search HuggingFace tab.
  Layman names everywhere. Import button with loading state.
-->
<script lang="ts">
import {
	ArrowLeft,
	Brain,
	Check,
	Eye,
	FolderOpen,
	Mic,
	Search,
	Upload,
	Volume2,
} from "lucide-svelte";
import { goto } from "$app/navigation";
import { Button } from "$lib/design/components/button/index.js";
import { Card } from "$lib/design/components/card/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import {
	friendlyName,
	HuggingFaceSearch,
	ROLE_COLORS,
	type SlotRole,
	WizardHelpTip,
	WizardInfoPopup,
	wizardState,
} from "$lib/domains/app/models/features/setup-wizard/index.js";
import type { SlotId } from "$lib/domains/app/models/index.js";
import { formatMb, importLocalModel, modelsState } from "$lib/domains/app/models/index.js";

let activeTab = $state<"local" | "online">("local");
let importing = $state(false);
let importError = $state<string | null>(null);
let showPageHelp = $state(false);

/** Map capability string to role info. */
function capInfo(cap: string): { label: string; role: SlotRole; desc: string } {
	switch (cap) {
		case "TextGeneration":
			return {
				label: "Chat & Thinking",
				role: "reasoning",
				desc: "Powers Clyffy's brain and helpers",
			};
		case "Embedding":
			return {
				label: "Memory Search",
				role: "encoder",
				desc: "Finds relevant code in your project",
			};
		case "Reranking":
			return { label: "Quality Filter", role: "encoder", desc: "Picks the best search results" };
		case "VisionEmbedding":
			return { label: "Screen Reader", role: "encoder", desc: "Understands screenshots" };
		case "SpeechToText":
			return { label: "Voice Input", role: "voice", desc: "Clyffy hears you" };
		case "TextToSpeech":
			return { label: "Voice Output", role: "voice", desc: "Clyffy talks back" };
		default:
			return { label: cap, role: "encoder", desc: "" };
	}
}

function roleColor(role: SlotRole): string {
	return ROLE_COLORS[role]?.accent ?? "var(--text-muted)";
}

function roleIcon(role: SlotRole): typeof Brain {
	switch (role) {
		case "reasoning":
			return Brain;
		case "observation":
			return Eye;
		case "encoder":
			return Search;
		case "voice":
			return Volume2;
	}
}

/** Strip extension for display. */
function cleanName(filename: string): string {
	return filename.replace(/\.(gguf|safetensors|onnx|bin)$/i, "").replace(/-/g, " ");
}

/** Group models by their primary capability's role. */
const grouped = $derived.by(() => {
	const groups: Record<SlotRole, Array<(typeof modelsState.models)[0]>> = {
		reasoning: [],
		observation: [],
		encoder: [],
		voice: [],
	};
	modelsState.models.forEach((m) => {
		const primaryCap = m.compatible_capabilities[0] ?? "";
		const info = capInfo(primaryCap);
		groups[info.role].push(m);
	});
	return groups;
});

const groupOrder: Array<{ role: SlotRole; title: string; desc: string }> = [
	{
		role: "reasoning",
		title: "Thinking",
		desc: "Brain and helper models — powers Clyffy's intelligence",
	},
	{ role: "encoder", title: "Understanding", desc: "Search, ranking, and vision models" },
	{ role: "voice", title: "Voice", desc: "Speech recognition and text-to-speech" },
	{ role: "observation", title: "Helpers", desc: "Background analysis and monitoring" },
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
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		if (msg !== "Import failed: No file selected") {
			importError = msg;
			toast.error(`Import failed: ${msg}`);
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
	} catch (e) {
		toast.error(e instanceof Error ? e.message : String(e));
	}
}
</script>

<div class="browse-page">
	<Button preset="ghost" size="sm" onclick={() => goto("/model-loader/models")}>
		<ArrowLeft size={14} /> Back to Setup
	</Button>

	<Text size="xl" weight="bold">Find Models</Text>
	<Text size="sm" color="secondary">Browse models on your computer or search HuggingFace.</Text>
	<div class="help-row">
		<WizardHelpTip tip="Use local models first if they already exist on your machine. Use online search when you need new ones." />
		<Button preset="ghost" size="sm" onclick={() => (showPageHelp = true)}>
			How this page works
		</Button>
	</div>

	<!-- Tabs -->
	<div class="tab-bar">
		<button class="tab" class:active={activeTab === "local"} onclick={() => (activeTab = "local")}>
			<FolderOpen size={18} /> On Your Computer
		</button>
		<button class="tab" class:active={activeTab === "online"} onclick={() => (activeTab = "online")}>
			<Search size={18} /> Search HuggingFace
		</button>
	</div>

	<!-- Download progress (visible on both tabs) -->
	{#if wizardState.hasActiveDownloads}
		<Card class="dl-banner">
			<Text size="xs" weight="bold" color="accent">Downloading models...</Text>
			{#each wizardState.downloadList as dl (dl.downloadId)}
				{#if dl.status === "downloading" || dl.status === "queued"}
					<div class="dl-row">
						<span class="dl-name">{dl.friendlyName}</span>
						<div class="dl-bar"><div class="dl-fill" style="width: {dl.totalBytes > 0 ? (dl.bytesDownloaded / dl.totalBytes) * 100 : 0}%;"></div></div>
					</div>
				{/if}
			{/each}
		</Card>
	{/if}

	{#if activeTab === "local"}
		<!-- LOCAL MODELS — grouped by role with color -->
		{#each groupOrder as group (group.role)}
			{@const models = grouped[group.role]}
			{@const color = roleColor(group.role)}
			{@const Icon = roleIcon(group.role)}

			<div class="group">
				<div class="group-header" style="color: {color};">
					<Icon size={16} />
					<Text size="sm" weight="bold">{group.title}</Text>
					<Text size="xs" color="muted">{group.desc}</Text>
				</div>

				{#if models.length === 0}
					<div class="group-empty">
						<Text size="sm" color="muted">No {group.title.toLowerCase()} models found.</Text>
						<Button preset="ghost" size="sm" onclick={() => (activeTab = "online")}>
							Download from HuggingFace
						</Button>
					</div>
				{:else}
					{#each models as model (model.id)}
						<div class="model-card" style="border-left: var(--border-width-thick) solid {color};">
							<div class="model-info">
								<span class="model-name">{cleanName(model.filename)}</span>
								<span class="model-meta">
									{formatMb(model.size_mb)}
									{#if model.quant_level} · {model.quant_level}{/if}
									{#if model.architecture !== "unknown"} · {model.architecture}{/if}
								</span>
								<span class="model-caps">
									{model.compatible_capabilities.map((c) => capInfo(c).label).join(", ")}
								</span>
							</div>
							<div class="model-actions">
								{#each modelsState.userSlots.filter((s) => model.compatible_capabilities.includes(s.capability)) as slot (slot.id)}
									{@const isAssigned = slot.assigned_model_id === model.id}
									<button
										class="btn-assign"
										class:assigned={isAssigned}
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
				{/if}
			</div>
		{/each}

		<!-- Import -->
		<Button preset="secondary" size="md" onclick={handleImport} disabled={importing}>
			{#if importing}
				<Upload size={14} /> Importing — please wait...
			{:else}
				<Upload size={14} /> Import Model from File
			{/if}
		</Button>

		{#if importError}
			<div class="import-error">
				<Text size="xs" color="danger">{importError}</Text>
				<Button preset="ghost" size="sm" onclick={() => (importError = null)}>Dismiss</Button>
			</div>
		{/if}

	{:else}
		<!-- ONLINE — HuggingFace search -->
		<HuggingFaceSearch
			onDownload={async (repoId, filename, targetSlot) => {
				const { downloadModel } = await import("$lib/domains/app/models/index.js");
				const { toast } = await import("svelte-sonner");
				try {
					const dlId = await downloadModel(repoId, filename);
					wizardState.trackDownload(dlId, (targetSlot ?? "chat.brain") as SlotId, filename);
					toast.info(`Downloading ${cleanName(filename)}...`);
				} catch (e) {
					toast.error(e instanceof Error ? e.message : String(e));
				}
			}}
		/>
	{/if}

	<!-- Done -->
	<div class="nav">
		<Button preset="primary" size="md" onclick={() => goto("/model-loader/models")}>
			<Check size={14} /> Done
		</Button>
	</div>
</div>

<WizardInfoPopup
	open={showPageHelp}
	title="Browse and Assign Models"
	summary="This page helps you pick where each model should be used, even if file names look technical."
	points={[
		"On Your Computer: assign models you already have.",
		"Search HuggingFace: download new models by role.",
		"You can assign one model to multiple compatible slots.",
		"Prefer smaller models first if VRAM is limited.",
	]}
	imageSrc="/imgs/mascot/clyffy-df-icon-interaction2.png"
	onClose={() => (showPageHelp = false)}
/>

<style>
	.browse-page {
		display: flex; flex-direction: column; gap: 1rem;
		width: 100%; max-width: 40rem; padding: 1rem 0;
	}
	.help-row {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.375rem;
	}

	/* Tabs */
	.tab-bar { display: flex; gap: 0; border-bottom: var(--border-width-medium) solid var(--border-subtle); }
	.tab {
		display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
		flex: 1; padding: 0.75rem 1rem; border: none; background: transparent;
		color: var(--text-muted); font-size: 0.9375rem; font-weight: 600; cursor: pointer;
		border-bottom: var(--border-width-thick) solid transparent; transition: var(--transition-all-fast);
	}
	.tab:hover { color: var(--text-secondary); background: var(--glass-deep); }
	.tab.active {
		color: var(--brand-cyan);
		border-bottom-color: var(--brand-cyan);
		background: var(--wiz-fill-cyan);
		font-weight: 700;
	}

	/* Groups */
	.group { display: flex; flex-direction: column; gap: 0.375rem; }
	.group-header { display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0; }
	.group-empty {
		padding: 1rem; text-align: center; border-radius: 0.5rem;
		background: var(--glass-deep);
		border: var(--border-preset-default-width) dashed var(--border-subtle);
		display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
	}

	/* Model cards */
	.model-card {
		display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
		padding: 0.625rem 0.75rem; border-radius: 0.5rem;
		background: var(--glass-deep);
		border: var(--border-preset-default-width) solid var(--border-subtle);
	}
	.model-info { display: flex; flex-direction: column; gap: 0.125rem; min-width: 0; flex: 1; }
	.model-name {
		font-size: 0.875rem; font-weight: 600; color: var(--text-primary);
		overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
	}
	.model-meta { font-size: 0.75rem; color: var(--text-muted); }
	.model-caps { font-size: 0.75rem; color: var(--text-secondary); }
	.model-actions { display: flex; flex-wrap: wrap; gap: 0.25rem; }

	.btn-assign {
		display: inline-flex; align-items: center; gap: 0.25rem;
		padding: 0.25rem 0.5rem; border-radius: 0.25rem;
		border: var(--border-preset-default-width) solid var(--border-subtle); background: transparent;
		color: var(--text-muted); font-size: 0.75rem; cursor: pointer;
		transition: var(--transition-all-fast);
	}
	.btn-assign:hover { border-color: var(--assign-color); color: var(--text-primary); }
	.btn-assign.assigned {
		border-color: var(--brand-green); color: var(--brand-green);
		background: var(--wiz-fill-green);
	}
	.btn-assign:disabled { cursor: default; }

	/* Downloads */
	:global(.dl-banner) { padding: 0.75rem; display: flex; flex-direction: column; gap: 0.375rem; }
	.dl-row { display: flex; align-items: center; gap: 0.5rem; }
	.dl-name { font-size: 0.75rem; font-weight: 600; color: var(--text-primary); min-width: 6rem; }
	.dl-bar { flex: 1; height: 0.25rem; border-radius: var(--radius-full); background: var(--color-void-800); overflow: hidden; }
	.dl-fill { height: 100%; border-radius: var(--radius-full); background: var(--brand-cyan); transition: width var(--motion-duration-fast); }

	/* Import error */
	.import-error {
		display: flex; align-items: center; justify-content: space-between;
		padding: 0.5rem 0.75rem; border-radius: 0.5rem;
		background: var(--wiz-fill-ember); border: var(--border-preset-default-width) solid var(--brand-salmon);
	}

	/* Nav */
	.nav { display: flex; justify-content: flex-end; padding-top: 0.5rem; }
</style>
