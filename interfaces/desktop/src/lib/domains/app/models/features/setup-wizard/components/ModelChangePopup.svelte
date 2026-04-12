<!--
  @file ModelChangePopup.svelte
  @domain models/setup-wizard

  In-overlay sub-panel for changing the model assigned to a role card.
  Slides in from the right when the user clicks "Change" on any of the
  four role cards (brain / minion / encoder / voice). Three tabs:

    1. Recommended — curated models for the current hardware tier
    2. HF Search   — wraps existing `HuggingFaceSearch.svelte`
    3. Local Browse — file picker via `import_local_model` command

  **Not a separate route, not a separate window.** Lives inline inside
  the wizard overlay panel. Back button returns to the four-card view.

  **Parent contract**
    interface Props {
      open: boolean;
      slotId: SlotId;
      roleName: string;         // "Thinking" / "Helpers" / "Searching" / "Talking"
      roleAccent: RoleId;
      copy: BrowseCopy;
      tooltips: ClyffyTooltipsCopy;
      onClose: () => void;
      onDownload: (repoId: string, filename: string, targetSlot: string) => Promise<void>;
      onImport: (slotId: string, importMode: "copy" | "symlink") => Promise<void>;
    }
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft, Download, FolderOpen, Sparkles } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import Text from "$lib/design/components/text/Text.svelte";

import type { SlotId } from "../../../types/models.types.js";
import ImportPrompt from "../steps/ImportPrompt.svelte";
import { wizardState } from "../wizard.runes.svelte.js";
import type { BrowseCopy, ClyffyTooltipsCopy } from "../wizard.types.js";
import ClyffyTooltip from "./ClyffyTooltip.svelte";
import HuggingFaceSearch from "./HuggingFaceSearch.svelte";
import type { RoleId } from "./RoleCard.svelte";

type Tab = "recommended" | "search" | "browse";

interface Props {
	open: boolean;
	slotId: SlotId;
	roleName: string;
	roleAccent: RoleId;
	copy: BrowseCopy;
	tooltips: ClyffyTooltipsCopy;
	onClose: () => void;
	onDownload: (repoId: string, filename: string, targetSlot: string) => Promise<void>;
	onImport: (slotId: string, importMode: "copy" | "symlink") => Promise<void>;
}

let { open, slotId, roleName, roleAccent, copy, tooltips, onClose, onDownload, onImport }: Props =
	$props();

let activeTab = $state<Tab>("recommended");

// Import prompt state — toggles when the user picks a file via the
// native file picker and needs to choose copy vs symlink.
let importPromptOpen = $state(false);
let importFilePath = $state("");

// Recommended models for this slot from the selected preset's
// recommendation list. One entry per slot — filtered to the
// `slotId` this popup is opened for.
const recommendations = $derived(wizardState.recommendations.filter((r) => r.slot === slotId));

async function handleDownload(repoId: string, filename: string, targetSlot: string): Promise<void> {
	await onDownload(repoId, filename, targetSlot);
	onClose();
}

async function handleBrowseLocal(): Promise<void> {
	try {
		const result = await invoke<string | null>("import_local_model", {
			targetSlot: slotId,
			importMode: "symlink",
		});
		if (result) {
			onClose();
		}
	} catch (e) {
		console.error("[model-change] local browse failed", e);
	}
}

function handleTabKeydown(e: KeyboardEvent, tabs: Tab[]): void {
	const current = tabs.indexOf(activeTab);
	if (e.key === "ArrowRight" || e.key === "ArrowDown") {
		e.preventDefault();
		activeTab = tabs[(current + 1) % tabs.length];
	} else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
		e.preventDefault();
		activeTab = tabs[(current - 1 + tabs.length) % tabs.length];
	} else if (e.key === "Home") {
		e.preventDefault();
		activeTab = tabs[0];
	} else if (e.key === "End") {
		e.preventDefault();
		activeTab = tabs[tabs.length - 1];
	}
}

const TABS: Tab[] = ["recommended", "search", "browse"];
</script>

{#if open}
	<div class="mcp mcp-{roleAccent}">
		<header class="mcp-header">
			<Button preset="ghost" size="md" onclick={onClose} aria-label="Back to role cards">
				<ArrowLeft size={16} aria-hidden="true" />
				Back
			</Button>
			<Heading level={3} size="md">Change {roleName}</Heading>
		</header>

		<!-- WAI-ARIA tablist pattern — arrow keys navigate, Enter/Space activates -->
		<div
			class="mcp-tabs"
			role="tablist"
			aria-label="Model source"
			tabindex="0"
			onkeydown={(e) => handleTabKeydown(e, TABS)}
		>
			<button
				type="button"
				role="tab"
				class="mcp-tab"
				class:mcp-tab-active={activeTab === "recommended"}
				aria-selected={activeTab === "recommended"}
				aria-controls="panel-recommended"
				tabindex={activeTab === "recommended" ? 0 : -1}
				onclick={() => (activeTab = "recommended")}
			>
				<Sparkles size={14} aria-hidden="true" />
				{copy.local_tab_label || "Recommended"}
			</button>
			<button
				type="button"
				role="tab"
				class="mcp-tab"
				class:mcp-tab-active={activeTab === "search"}
				aria-selected={activeTab === "search"}
				aria-controls="panel-search"
				tabindex={activeTab === "search" ? 0 : -1}
				onclick={() => (activeTab = "search")}
			>
				{copy.online_tab_label || "Search HuggingFace"}
			</button>
			<button
				type="button"
				role="tab"
				class="mcp-tab"
				class:mcp-tab-active={activeTab === "browse"}
				aria-selected={activeTab === "browse"}
				aria-controls="panel-browse"
				tabindex={activeTab === "browse" ? 0 : -1}
				onclick={() => (activeTab = "browse")}
			>
				<FolderOpen size={14} aria-hidden="true" />
				{copy.import_button_label || "Local Browse"}
			</button>
		</div>

		<!-- Tab panels -->
		<div class="mcp-panel-area">
			{#if activeTab === "recommended"}
				<div id="panel-recommended" role="tabpanel" aria-labelledby="tab-recommended" class="mcp-panel">
					{#if recommendations.length === 0}
						<div class="mcp-empty">
							<Text size="sm" color="muted">No recommendations for this slot yet. Pick a hardware preset first, or search HuggingFace.</Text>
						</div>
					{:else}
						<div class="mcp-rec-list" role="list">
							{#each recommendations as rec (rec.file)}
								<div class="mcp-rec-card" role="listitem">
									<div class="mcp-rec-info">
										<Text size="sm" weight="bold">{rec.name}</Text>
										<Text size="xs" color="muted">{rec.purpose}</Text>
										<div class="mcp-rec-badges">
											<Badge preset="glass">{rec.sizeMb} MB</Badge>
											{#if rec.vramMb > 0}
												<Badge preset="glass">VRAM {rec.vramMb} MB</Badge>
											{/if}
											{#if rec.alreadyDownloaded}
												<Badge preset="matte">On disk</Badge>
											{/if}
										</div>
									</div>
									<Button
										preset="primary"
										size="lg"
										onclick={() => handleDownload(rec.repo, rec.file, slotId)}
										disabled={rec.alreadyDownloaded}
									>
										<Download size={16} aria-hidden="true" />
										{rec.alreadyDownloaded ? "Ready" : "Download"}
									</Button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{:else if activeTab === "search"}
				<div id="panel-search" role="tabpanel" aria-labelledby="tab-search" class="mcp-panel">
					<HuggingFaceSearch onDownload={handleDownload} />
				</div>
			{:else}
				<div id="panel-browse" role="tabpanel" aria-labelledby="tab-browse" class="mcp-panel">
					<div class="mcp-browse-body">
						<Text size="sm" color="secondary">{copy.subtitle}</Text>
						<ClyffyTooltip copy={tooltips} copyKey="symlink_info" label="What is a symlink?" size="md" />
						<Button preset="primary" size="lg" onclick={handleBrowseLocal}>
							<FolderOpen size={18} aria-hidden="true" />
							{copy.import_button_label}
						</Button>
						<Text size="xs" color="muted">
							Supported formats: .gguf, .safetensors, .onnx
						</Text>
					</div>
				</div>
			{/if}
		</div>

		<ImportPrompt
			open={importPromptOpen}
			filePath={importFilePath}
			{slotId}
			onConfirm={(mode) => {
				importPromptOpen = false;
				void onImport(slotId, mode);
			}}
			onCancel={() => (importPromptOpen = false)}
		/>
	</div>
{/if}

<style>
	.mcp {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		animation: slide-in 200ms ease-out;
	}
	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateX(1rem);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.mcp-brain {
		--mcp-accent: var(--wizard-role-brain-main);
	}
	.mcp-minion {
		--mcp-accent: var(--wizard-role-minion-main);
	}
	.mcp-encoder {
		--mcp-accent: var(--wizard-role-encoder-main);
	}
	.mcp-voice {
		--mcp-accent: var(--wizard-role-voice-main);
	}

	.mcp-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.mcp-tabs {
		display: flex;
		gap: 0.25rem;
		border-bottom: 0.0625rem solid var(--border-subtle, #1a2030);
		padding-bottom: 0;
	}

	.mcp-tab {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.625rem 1rem;
		border: none;
		background: transparent;
		color: var(--text-secondary, #8b9bb8);
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		border-bottom: 0.125rem solid transparent;
		transition:
			color var(--motion-duration-fast, 150ms),
			border-color var(--motion-duration-fast, 150ms);
	}
	.mcp-tab:hover {
		color: var(--text-primary, #e6eaf3);
	}
	.mcp-tab-active {
		color: var(--mcp-accent, var(--accent-cyan-main, #58c4e6));
		border-bottom-color: var(--mcp-accent, var(--accent-cyan-main, #58c4e6));
	}

	.mcp-panel-area {
		min-height: 16rem;
	}
	.mcp-panel {
		width: 100%;
	}
	.mcp-empty {
		padding: 2rem 1rem;
		text-align: center;
	}

	.mcp-rec-list {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}
	.mcp-rec-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.875rem 1rem;
		border: 0.0625rem solid var(--border-subtle, #1a2030);
		border-radius: var(--radius-md, 0.5rem);
		background: var(--surface-raised, #0c1220);
	}
	.mcp-rec-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
		flex: 1;
	}
	.mcp-rec-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-top: 0.25rem;
	}

	.mcp-browse-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem 1rem;
		text-align: center;
	}
</style>
