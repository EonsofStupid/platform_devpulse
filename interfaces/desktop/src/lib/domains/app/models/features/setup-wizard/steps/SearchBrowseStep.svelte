<!--
  @file SearchBrowseStep.svelte
  Commandment #9: Detect local models first.
  Tabbed: Browse Local | Search Online.
  Local tab shows models on disk. Import button uses fixed AsyncFileDialog.
  Online tab wraps HuggingFaceSearch.
-->
<script lang="ts">
import { ArrowLeft, Check, FolderOpen, Search, Upload } from "lucide-svelte";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { importLocalModel } from "../../../services/download.service.js";
import { formatMb } from "../../../types/models.types.js";
import VramBar from "../components/VramBar.svelte";
import { wizardState } from "../wizard.runes.svelte.js";
import { friendlyName, getSlotLabel, ROLE_COLORS } from "../wizard.types.js";
import HuggingFaceSearch from "./HuggingFaceSearch.svelte";

interface Props {
	onBack: () => void;
	onDone: () => void;
}
let { onBack, onDone }: Props = $props();

let activeTab = $state<"local" | "online">("local");
let importError = $state<string | null>(null);

/** All discovered models grouped by inferred capability. */
const localModels = $derived(modelsState.models);

async function handleImport(): Promise<void> {
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

<div class="browse-step">
	<div class="step-header">
		<button class="btn-back" onclick={onBack}><ArrowLeft size={14} /> Back to Setup</button>
		<h2 class="step-title">Find Models</h2>
		<p class="step-desc">Browse models on your computer or search HuggingFace to download new ones.</p>
	</div>

	<!-- Tab bar -->
	<div class="tab-bar">
		<button class="tab" class:active={activeTab === "local"} onclick={() => (activeTab = "local")}>
			<FolderOpen size={14} /> On Your Computer
		</button>
		<button class="tab" class:active={activeTab === "online"} onclick={() => (activeTab = "online")}>
			<Search size={14} /> Search Online
		</button>
	</div>

	<!-- Local tab -->
	{#if activeTab === "local"}
		<div class="local-section">
			{#if localModels.length === 0}
				<div class="empty-state">
					<p>No models found on disk yet.</p>
					<p class="empty-hint">Import a model file or download one from the online tab.</p>
				</div>
			{:else}
				<div class="local-list">
					{#each localModels as model (model.id)}
						<div class="local-row">
							<div class="local-info">
								<span class="local-name">{model.filename}</span>
								<span class="local-meta">
									{formatMb(model.size_mb)}
									{#if model.quant_level} · {model.quant_level}{/if}
									{#if model.architecture !== "unknown"} · {model.architecture}{/if}
								</span>
								<span class="local-caps">
									{model.compatible_capabilities.join(", ")}
								</span>
							</div>
							<div class="local-actions">
								{#each modelsState.userSlots.filter((s) => model.compatible_capabilities.includes(s.capability)) as slot (slot.id)}
									{@const isAssigned = slot.assigned_model_id === model.id}
									<button
										class="btn-assign"
										class:assigned={isAssigned}
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

			<button class="btn-import" onclick={handleImport}>
				<Upload size={14} /> Import Model from File
			</button>

			{#if importError}
				<div class="import-error">
					<span>{importError}</span>
					<button class="error-dismiss" onclick={() => (importError = null)}>Dismiss</button>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Online tab -->
	{#if activeTab === "online"}
		<HuggingFaceSearch
			onDownload={async (repoId, filename, targetSlot) => {
				const { downloadModel } = await import("../../../services/download.service.js");
				const { toast } = await import("svelte-sonner");
				try {
					const dlId = await downloadModel(repoId, filename);
					wizardState.trackDownload(dlId, targetSlot ?? "chat.brain", filename);
					toast.info(`Downloading ${filename}...`);
				} catch (e) {
					toast.error(e instanceof Error ? e.message : String(e));
				}
			}}
		/>
	{/if}

	<VramBar />

	<div class="nav">
		<button class="btn-done" onclick={onDone}>
			<Check size={14} /> Done
		</button>
	</div>
</div>

<style>
	.browse-step {
		display: flex; flex-direction: column; gap: 1rem;
		width: 100%; max-width: 40rem; padding: 1rem 0;
	}
	.step-header { display: flex; flex-direction: column; gap: 0.375rem; }
	.step-title { font-size: 1.25rem; font-weight: 800; color: var(--wiz-text); margin: 0; }
	.step-desc { font-size: var(--wiz-text-sm); color: var(--wiz-text-sub); margin: 0; }
	.btn-back {
		display: inline-flex; align-items: center; gap: 0.25rem; align-self: flex-start;
		border: none; background: transparent; color: var(--wiz-text-muted);
		font-size: var(--wiz-text-xs); cursor: pointer; padding: 0; margin-bottom: 0.25rem;
	}
	.btn-back:hover { color: var(--wiz-cyan); }

	/* Tabs */
	.tab-bar { display: flex; gap: 0.25rem; border-bottom: 1px solid var(--wiz-border); }
	.tab {
		display: inline-flex; align-items: center; gap: 0.375rem;
		padding: 0.5rem 1rem; border: none; background: transparent;
		color: var(--wiz-text-muted); font-size: var(--wiz-text-sm); cursor: pointer;
		border-bottom: 2px solid transparent; transition: all var(--wiz-duration-fast);
	}
	.tab:hover { color: var(--wiz-text-sub); }
	.tab.active {
		color: var(--wiz-cyan); border-bottom-color: var(--wiz-cyan);
		background: var(--wiz-fill-cyan);
	}

	/* Local section */
	.local-section { display: flex; flex-direction: column; gap: 0.75rem; }
	.empty-state { padding: 2rem; text-align: center; }
	.empty-state p { font-size: var(--wiz-text-sm); color: var(--wiz-text-muted); margin: 0; }
	.empty-hint { font-size: var(--wiz-text-xs); color: var(--wiz-void-500); }

	.local-list { display: flex; flex-direction: column; gap: 0.375rem; max-height: 24rem; overflow-y: auto; }
	.local-row {
		display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
		padding: 0.625rem 0.75rem; border-radius: var(--wiz-radius-md);
		background: var(--wiz-card); border: 1px solid var(--wiz-border);
	}
	.local-info { display: flex; flex-direction: column; gap: 0.125rem; min-width: 0; flex: 1; }
	.local-name {
		font-size: var(--wiz-text-sm); font-weight: 600; color: var(--wiz-text);
		overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
	}
	.local-meta { font-size: var(--wiz-text-xs); color: var(--wiz-text-muted); }
	.local-caps { font-size: var(--wiz-text-xs); color: var(--wiz-void-400); }
	.local-actions { display: flex; flex-wrap: wrap; gap: 0.25rem; }

	.btn-assign {
		display: inline-flex; align-items: center; gap: 0.25rem;
		padding: 0.25rem 0.5rem; border-radius: var(--wiz-radius-sm);
		border: 1px solid var(--wiz-border); background: transparent;
		color: var(--wiz-text-muted); font-size: var(--wiz-text-xs); cursor: pointer;
		transition: all var(--wiz-duration-fast);
	}
	.btn-assign:hover { border-color: var(--wiz-cyan); color: var(--wiz-text); }
	.btn-assign.assigned {
		border-color: var(--wiz-green); color: var(--wiz-green);
		background: var(--wiz-fill-green);
	}
	.btn-assign:disabled { cursor: default; }

	.btn-import {
		display: inline-flex; align-items: center; justify-content: center; gap: 0.375rem;
		padding: 0.625rem 1rem; border-radius: var(--wiz-radius-md);
		border: 1px dashed var(--wiz-border); background: transparent;
		color: var(--wiz-text-sub); font-size: var(--wiz-text-sm); cursor: pointer;
		transition: all var(--wiz-duration-fast);
	}
	.btn-import:hover { border-color: var(--wiz-cyan); color: var(--wiz-text); }

	.import-error {
		display: flex; align-items: center; justify-content: space-between;
		padding: 0.5rem 0.75rem; border-radius: var(--wiz-radius-md);
		background: var(--wiz-fill-ember); border: 1px solid var(--wiz-ember-600);
		font-size: var(--wiz-text-xs); color: var(--wiz-ember-200);
	}
	.error-dismiss {
		border: none; background: transparent; color: var(--wiz-ember-300);
		font-size: var(--wiz-text-xs); cursor: pointer; text-decoration: underline;
	}

	/* Navigation */
	.nav { display: flex; justify-content: flex-end; padding-top: 0.5rem; }
	.btn-done {
		display: inline-flex; align-items: center; gap: 0.375rem;
		padding: 0.5rem 1.25rem; border-radius: var(--wiz-radius-md); border: none;
		background: var(--wiz-cyan); color: var(--wiz-void-950);
		font-size: var(--wiz-text-sm); font-weight: 700; cursor: pointer;
	}
	.btn-done:hover { filter: brightness(1.15); }
</style>
