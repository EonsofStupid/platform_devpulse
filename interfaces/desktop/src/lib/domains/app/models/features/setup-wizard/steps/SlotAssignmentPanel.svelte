<!--
  @file SlotAssignmentPanel.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/SlotAssignmentPanel

  Glass cards per slot. Inline expandable model list for assignment.
  Download progress with speed/ETA/cancel. VRAM guard on Load.
  Subsystem grouping. chat.brain always first. No floating layers.
-->
<script lang="ts">
import {
	Brain,
	ChevronDown,
	ChevronUp,
	Cpu,
	Download,
	Eye,
	FolderOpen,
	Mic,
	Power,
	PowerOff,
	Search,
	Volume2,
	X,
} from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { Progress } from "$lib/design/components/progress/index.js";
import { Separator } from "$lib/design/components/separator/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ModelInfo, SlotInfo } from "$lib/sys/generated/bindings.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import type { ModelStatus, SlotId } from "../../../types/models.types.js";
import {
	calculateFit,
	fitColor,
	fitLabel,
	formatContext,
	formatEta,
	formatMb,
	formatSpeed,
	friendlySlotLabel,
	isInferenceReady,
	slotDescription,
	statusLabel,
} from "../../../types/models.types.js";
import { wizardState } from "../wizard.runes.svelte.js";
import {
	autoAssignAllSlots,
	bulkDownloadAndAssign,
	cancelActiveDownload,
	downloadAndAssign,
} from "../wizard.service.js";
import type { ModelRec } from "../wizard.types.js";
import HuggingFaceSearch from "./HuggingFaceSearch.svelte";

interface Props {
	onBrowseModels: () => void;
	onImport: (slotId: SlotId) => void;
}

let { onBrowseModels, onImport }: Props = $props();

// ── State ──────────────────────────────────────────────
let expandedSlot = $state<string | null>(null);
const cardMacro = $derived(renderForge({ kind: "card", preset: "glass" }));

// ── Icon map ───────────────────────────────────────────
const SUB_ICON: Record<string, typeof Brain> = {
	chat: Brain,
	minion: Cpu,
	rag: Search,
	vision: Eye,
	voice: Mic,
};
function slotIcon(slotId: string): typeof Brain {
	if (slotId === "voice.tts") return Volume2;
	const sub = slotId.split(".")[0];
	return SUB_ICON[sub] ?? Brain;
}

// ── Slot ordering: chat.brain first, then by subsystem ─
const orderedGroups = $derived.by(() => {
	const subs = modelsState.userSubsystems;
	const order = ["chat", "minion", "rag", "vision", "voice"];
	return order
		.filter((k) => subs[k]?.length > 0)
		.map((k) => ({
			key: k,
			label: modelsState.subsystemLabels[k] ?? k,
			slots:
				k === "chat"
					? [
							...subs[k].filter((s) => s.id === "chat.brain"),
							...subs[k].filter((s) => s.id !== "chat.brain"),
						]
					: subs[k],
		}));
});

// ── Status helpers ─────────────────────────────────────
function statusToVariant(status: ModelStatus): "positive" | "informative" | "negative" | "neutral" {
	switch (status.type) {
		case "hot":
		case "standby":
			return "positive";
		case "warm":
		case "loading":
			return "informative";
		case "failed":
			return "negative";
		case "cold":
		case "unloading":
			return "neutral";
	}
}

// ── VRAM guard ─────────────────────────────────────────
function canLoadModel(model: ModelInfo | null): boolean {
	if (!model) return false;
	if (!hardwareState.hasGpu) return true;
	return model.vram_estimate_mb <= hardwareState.vramTotalMb;
}
function vramGuardMsg(model: ModelInfo | null): string | null {
	if (!model || !hardwareState.hasGpu) return null;
	if (model.vram_estimate_mb > hardwareState.vramTotalMb) {
		return `Too large for your GPU (needs ${formatMb(model.vram_estimate_mb)}, GPU has ${formatMb(hardwareState.vramTotalMb)})`;
	}
	return null;
}

// ── Actions ────────────────────────────────────────────
async function handleDownload(rec: ModelRec): Promise<void> {
	await downloadAndAssign(rec);
}
async function handleLoad(slotId: string): Promise<void> {
	try {
		await modelsState.load(slotId);
	} catch {
		/* error in modelsState.statuses */
	}
}
async function handleUnload(slotId: string): Promise<void> {
	try {
		await modelsState.unload(slotId);
	} catch {
		/* error in modelsState.error */
	}
}
async function handleAssign(slotId: string, modelId: string): Promise<void> {
	try {
		await modelsState.assign(slotId, modelId);
		expandedSlot = null;
	} catch {
		/* error in modelsState.error */
	}
}
</script>

<div class="flex flex-col gap-6 overflow-y-auto flex-1">

	<!-- Subsystem readiness bar -->
	<div class="flex gap-4 items-center flex-wrap">
		{#each orderedGroups as group (group.key)}
			{@const allAssigned = group.slots.every((s) => s.assigned_model_id)}
			{@const anyLoaded = group.slots.some((s) => isInferenceReady(modelsState.statuses[s.id] ?? { type: "cold" }))}
			<div class="flex items-center gap-1.5">
				<div
					class="w-2.5 h-2.5 rounded-full"
					style="background: {allAssigned ? (anyLoaded ? 'var(--signal-success)' : 'var(--accent-teal-main)') : 'var(--signal-error)'};"
				></div>
				<Text size="sm" color={allAssigned ? "primary" : "muted"}>{group.label}</Text>
			</div>
		{/each}
	</div>

	<!-- Slot cards grouped by subsystem -->
	{#each orderedGroups as group, gi (group.key)}
		{#if gi > 0}
			<Separator />
		{/if}
		<Text size="lg" weight="bold" color="primary">{group.label}</Text>

		{#each group.slots as slot (slot.id)}
			{@const model = modelsState.assignedModel(slot.id)}
			{@const status = modelsState.statuses[slot.id] ?? { type: "cold" as const }}
			{@const rec = wizardState.recommendations.find((r) => r.slot === slot.id)}
			{@const dl = wizardState.downloadForSlot(slot.id as SlotId)}
			{@const isLoaded = status.type === "hot" || status.type === "standby"}
			{@const isFailed = status.type === "failed"}
			{@const isExpanded = expandedSlot === slot.id}
			{@const Icon = slotIcon(slot.id)}
			{@const fit = model ? calculateFit(model.vram_estimate_mb, hardwareState.vramFreeMb, hardwareState.vramTotalMb) : "gray"}

			<div
				{...cardMacro.dataAttrs}
				style={cssVarString(cardMacro.cssVars)}
				class={cn("slot-card rounded-lg p-4")}
				data-loaded={isLoaded}
				data-status={isFailed ? "failed" : undefined}
			>
				<!-- HEADER: icon + label + description + status badge -->
				<div class="flex items-start gap-3 mb-3">
					<div class="mt-0.5" style="color: var(--accent-teal-main);">
						<Icon size={20} />
					</div>
					<div class="flex-1 min-w-0">
						<Text size="base" weight="bold" color="primary">
							{friendlySlotLabel(slot.id)}
						</Text>
						<Text size="sm" color="muted">{slotDescription(slot.id)}</Text>
					</div>
					<Badge variant={statusToVariant(status)} size="sm">
						{statusLabel(status)}
					</Badge>
				</div>

				<!-- MODEL INFO (when assigned) -->
				{#if model}
					<div class="rounded-md p-3 mb-3" style="background: var(--surface-elevated);">
						<Text size="sm" weight="semibold" color="primary" class="mb-1">{model.filename}</Text>
						<div class="flex flex-wrap items-center gap-2 mb-1">
							{#if model.quant_level}
								<Badge variant="neutral" size="sm">{model.quant_level}</Badge>
							{/if}
							<Badge variant="neutral" size="sm">{model.architecture}</Badge>
							<Text size="sm" color="muted">{formatMb(model.size_mb)}</Text>
							<Text size="sm" color="muted">{formatContext(model.context_length)}</Text>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-2 h-2 rounded-full" style="background: {fitColor(fit)};"></div>
							<Text size="sm" color="muted">
								{formatMb(model.vram_estimate_mb)} VRAM — {fitLabel(fit)}
							</Text>
						</div>
						{#if model.supported_backends.length > 0}
							<Text size="sm" color="muted" class="mt-1">
								Backends: {model.supported_backends.join(", ")}
							</Text>
						{/if}
					</div>
				{:else if rec}
					<!-- Recommendation but no model assigned -->
					<div class="rounded-md p-3 mb-3 border border-dashed" style="border-color: var(--border-subtle);">
						<div class="flex items-center gap-3">
							<Text size="sm" color="muted" class="flex-1">
								Suggested: {rec.name} — {formatMb(rec.sizeMb)}
							</Text>
							<button
								class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-bold transition-colors"
								style="background: var(--accent-teal-main); color: var(--surface-base);"
								onclick={() => handleDownload(rec)}
								aria-label="Download and assign {rec.name} to {friendlySlotLabel(slot.id)}"
							>
								<Download size={14} />
								Download & Assign
							</button>
						</div>
					</div>
				{:else}
					<Text size="sm" color="muted" class="mb-3 italic">
						No model assigned — click Assign to pick one
					</Text>
				{/if}

				<!-- DOWNLOAD PROGRESS (when active) -->
				{#if dl}
					{@const pct = dl.totalBytes > 0 ? Math.round((dl.bytesDownloaded / dl.totalBytes) * 100) : 0}
					{@const etaSecs = dl.speedBps > 0 ? (dl.totalBytes - dl.bytesDownloaded) / dl.speedBps : -1}
					<div class="rounded-md p-3 mb-3" style="background: var(--surface-elevated);">
						<Progress value={pct} max={100} size="lg" class="mb-2" />
						<div class="flex items-center justify-between">
							<Text size="sm" color="muted">
								{dl.filename} — {formatMb(Math.round(dl.bytesDownloaded / (1024 * 1024)))} / {formatMb(Math.round(dl.totalBytes / (1024 * 1024)))} — {formatSpeed(dl.speedBps)} — {formatEta(etaSecs)}
							</Text>
							<button
								class="flex items-center gap-1 rounded px-2 py-1 text-sm transition-colors"
								style="color: var(--signal-error);"
								onclick={() => cancelActiveDownload(dl.downloadId)}
								aria-label="Cancel download of {dl.filename}"
							>
								<X size={14} />
								Cancel
							</button>
						</div>
					</div>
				{/if}

				<!-- FAILED STATE -->
				{#if isFailed && "error" in status}
					<div class="rounded-md p-3 mb-3 border" style="background: var(--signal-error); border-color: var(--signal-error);">
						<Text size="sm" color="primary" class="mb-2">{status.error}</Text>
						<div class="flex gap-2">
							<button
								class="rounded-md px-3 py-1.5 text-sm font-bold transition-colors"
								style="background: var(--accent-teal-main); color: var(--surface-base);"
								onclick={() => handleLoad(slot.id)}
								aria-label="Retry loading model for {friendlySlotLabel(slot.id)}"
							>
								Retry
							</button>
							{#if status.error.toLowerCase().match(/vram|memory|out of/)}
								<button
									class="rounded-md px-3 py-1.5 text-sm transition-colors border"
									style="border-color: var(--border-subtle); color: var(--text-secondary);"
									aria-label="Try loading with CPU instead"
								>
									Try CPU Mode
								</button>
							{/if}
						</div>
					</div>
				{/if}

				<!-- INLINE EXPANDABLE MODEL LIST -->
				{#if isExpanded}
					<div class="model-list-enter rounded-md p-3 mb-3 border" style="background: var(--surface-elevated); border-color: var(--border-subtle);">
						<Text size="sm" weight="bold" color="secondary" class="mb-2">
							Compatible models ({modelsState.models.filter((m) => m.compatible_capabilities.includes(slot.capability)).length})
						</Text>
						{#each modelsState.models.filter((m) => m.compatible_capabilities.includes(slot.capability)) as m (m.id)}
							{@const mFit = calculateFit(m.vram_estimate_mb, hardwareState.vramFreeMb, hardwareState.vramTotalMb)}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<div
								class="model-row flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer transition-colors"
								data-assigned={slot.assigned_model_id === m.id}
								role="option"
								aria-selected={slot.assigned_model_id === m.id}
								tabindex="0"
								onclick={() => handleAssign(slot.id, m.id)}
								onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleAssign(slot.id, m.id); } }}
							>
								<Text size="sm" weight="semibold" color="primary" class="flex-1 truncate">{m.filename}</Text>
								{#if m.quant_level}
									<Badge variant="neutral" size="sm">{m.quant_level}</Badge>
								{/if}
								<Text size="sm" color="muted">{m.architecture}</Text>
								<Text size="sm" color="muted">{formatMb(m.size_mb)}</Text>
								<div class="w-2 h-2 rounded-full" style="background: {fitColor(mFit)};"></div>
							</div>
						{/each}

						{#if modelsState.models.filter((m) => !m.compatible_capabilities.includes(slot.capability)).length > 0}
							<Text size="sm" color="muted" class="mt-3 mb-1">Other models — may not work</Text>
							{#each modelsState.models.filter((m) => !m.compatible_capabilities.includes(slot.capability)) as m (m.id)}
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<div
									class="model-row flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer opacity-50"
									role="option"
									aria-selected={false}
									tabindex="0"
									onclick={() => handleAssign(slot.id, m.id)}
									onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleAssign(slot.id, m.id); } }}
								>
									<Text size="sm" color="muted" class="flex-1 truncate">{m.filename}</Text>
									<Text size="sm" color="muted">{formatMb(m.size_mb)}</Text>
								</div>
							{/each}
						{/if}

						<!-- Import for this slot -->
						<button
							class="flex items-center gap-1.5 rounded-md px-3 py-2 mt-2 text-sm transition-colors w-full border border-dashed"
							style="color: var(--text-secondary); border-color: var(--border-subtle);"
							onclick={() => onImport(slot.id as SlotId)}
							aria-label="Import model file for {friendlySlotLabel(slot.id)}"
						>
							<FolderOpen size={14} />
							Import from disk
						</button>
					</div>
				{/if}

				<!-- ACTIONS -->
				<div class="flex items-center gap-2 flex-wrap">
					<!-- Assign / Change -->
					<button
						class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors border"
						style="border-color: var(--border-subtle); color: var(--text-secondary);"
						onclick={() => (expandedSlot = isExpanded ? null : slot.id)}
						aria-label="{model ? 'Change' : 'Assign'} model for {friendlySlotLabel(slot.id)}"
					>
						{#if isExpanded}<ChevronUp size={14} />{:else}<ChevronDown size={14} />{/if}
						{model ? "Change Model" : "Assign"}
					</button>

					<!-- Load -->
					{#if model && (status.type === "cold" || isFailed)}
						{@const guardMsg = vramGuardMsg(model)}
						<button
							class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
							style="background: var(--accent-teal-main); color: var(--surface-base);"
							onclick={() => handleLoad(slot.id)}
							disabled={!canLoadModel(model)}
							aria-label="Load {friendlySlotLabel(slot.id)} model into memory"
							title={guardMsg ?? undefined}
						>
							<Power size={14} />
							Load into Memory
						</button>
						{#if guardMsg}
							<Text size="sm" style="color: var(--signal-error);">{guardMsg}</Text>
						{/if}
					{/if}

					<!-- Unload -->
					{#if isLoaded}
						<button
							class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors border"
							style="border-color: var(--signal-warning); color: var(--signal-warning);"
							onclick={() => handleUnload(slot.id)}
							aria-label="Unload {friendlySlotLabel(slot.id)} model from memory"
						>
							<PowerOff size={14} />
							Unload
						</button>
					{/if}

					<!-- Loading spinner -->
					{#if status.type === "loading"}
						<Spinner size="sm" />
						<Text size="sm" color="muted">
							{#if "stage" in status}{status.stage}{:else}Loading...{/if}
						</Text>
					{/if}
				</div>
			</div>
		{/each}
	{/each}

	{#if modelsState.userSlots.length === 0}
		<div class="flex flex-col items-center gap-2 py-12">
			<Text size="base" color="muted">No slots available</Text>
			<Text size="sm" color="muted">Platform may still be starting...</Text>
		</div>
	{/if}

	<!-- Global error -->
	{#if wizardState.error}
		<div class="rounded-lg p-4 border" style="background: var(--signal-error); border-color: var(--signal-error);">
			<Text size="sm" color="primary">{wizardState.error}</Text>
		</div>
	{/if}

	<!-- Bulk actions -->
	<div class="flex items-center gap-3 justify-center flex-wrap">
		<button
			class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm transition-colors border"
			style="border-color: var(--border-subtle); color: var(--text-secondary);"
			onclick={autoAssignAllSlots}
			aria-label="Auto-configure all slots with compatible models"
		>
			Auto-Configure All
		</button>

		{#if wizardState.recommendations.length > 0}
			<button
				class="flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-bold transition-colors"
				style="background: var(--accent-teal-main); color: var(--surface-base);"
				onclick={() => bulkDownloadAndAssign(wizardState.recommendations)}
				aria-label="Download and assign all suggested models"
			>
				<Download size={14} />
				Download All Recommended
			</button>
		{/if}

	</div>

	<!-- Summary -->
	<div class="text-center">
		<Text size="sm" color="muted">
			{modelsState.models.length} models on disk · {modelsState.userSlots.filter((s) => s.assigned_model_id).length} / {modelsState.userSlots.length} slots filled
		</Text>
	</div>

	<!-- Inline HuggingFace search -->
	<Separator class="my-4" />
	<HuggingFaceSearch
		onDownload={async (repoId, filename, targetSlot) => {
			const rec: ModelRec = {
				name: filename.replace(/\.gguf$/i, "").replace(/-/g, " "),
				purpose: "",
				slot: targetSlot as SlotId,
				sizeMb: 0,
				vramMb: 0,
				repo: repoId,
				file: filename,
				device: "any",
			};
			await downloadAndAssign(rec);
		}}
	/>
</div>

<style>
	.slot-card {
		transition: border-color var(--motion-duration-fast) var(--motion-ease-spring),
			box-shadow var(--motion-duration-fast) var(--motion-ease-spring);
	}
	.slot-card[data-loaded="true"] {
		border-color: var(--accent-teal-main);
		box-shadow: var(--glow-teal);
	}
	.slot-card[data-status="failed"] {
		border-color: var(--signal-error);
		box-shadow: var(--glow-ember);
	}
	.model-list-enter {
		animation: model-list-expand var(--motion-duration-fast) ease-out;
	}
	@keyframes model-list-expand {
		from { opacity: 0; transform: translateY(var(--space-2, -0.5rem)); }
		to { opacity: 1; transform: translateY(0); }
	}
	.model-row:hover {
		background: var(--surface-elevated);
	}
	.model-row[data-assigned="true"] {
		outline: var(--frame-accent-teal);
	}
</style>
