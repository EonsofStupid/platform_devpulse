<!--
  @file ModelDetailPanel — Full model metadata display with actions.
  Shows architecture, quant, context length, file size, VRAM estimate, file path.
  Assign-to-slot button, delete button. Zero jargon in default mode.
  ALL styling via ColdLight semantic token vars.
-->
<script lang="ts">
import { Text } from "@devpulse/coldlight/components/text";
import { hstack } from "@devpulse/coldlight/utils/hstack";
import { stack } from "@devpulse/coldlight/utils/stack";
import { AlertTriangle, HardDrive, Trash2 } from "lucide-svelte";
import type { ModelInfo } from "#lib/sys/generated/bindings.js";
import { hardwareState } from "../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../data-access/models.state.svelte.js";
import { deleteModel } from "../../data-access/slots.service.js";
import {
	calculateFit,
	fitColor,
	fitLabel,
	formatContext,
	formatMb,
} from "../../util/models.types.js";

// ── Props ─────────────────────────────────────────────────────

interface Props {
	/** The model to display. */
	model: ModelInfo;
	/** Called after model is deleted (so parent can close/refresh). */
	onDelete?: () => void;
	/** Whether to show the file path (advanced mode). */
	showPath?: boolean;
}

let { model, onDelete, showPath = false }: Props = $props();

// ── State ─────────────────────────────────────────────────────

let deleting = $state(false);
let confirmDelete = $state(false);
let error = $state<string | null>(null);

// ── Derived ───────────────────────────────────────────────────

const fit = $derived(
	calculateFit(model.vram_estimate_mb, hardwareState.vramFreeMb, hardwareState.vramTotalMb),
);

const fitColorVal = $derived(fitColor(fit));
const fitLabelVal = $derived(fitLabel(fit));

/** Layman quant description. */
const quantDesc = $derived.by(() => {
	const q = model.quant_level;
	if (!q) return "Unknown quality";
	if (q.includes("Q4_K_M") || q.includes("Q4_K_S")) return "Balanced — good quality, moderate size";
	if (q.includes("Q8") || q.includes("F16") || q.includes("F32"))
		return "High quality — best results, larger file";
	if (q.includes("Q2") || q.includes("Q3")) return "Fast — smaller file, lower quality";
	if (q.includes("Q5") || q.includes("Q6")) return "Quality — better results, larger file";
	return q;
});

/** Layman context description. */
const contextDesc = $derived.by(() => {
	const tokens = model.context_length;
	if (tokens <= 0) return "Unknown memory";
	const pages = Math.round(tokens / 1300); // ~1300 tokens per page of text
	return `Can remember about ${pages} pages of conversation`;
});

/** Which slots currently use this model. */
const assignedSlots = $derived(
	modelsState.slots.filter((s) => s.assigned_model_id === model.id).map((s) => s.id),
);

// ── Actions ───────────────────────────────────────────────────

async function handleDelete(): Promise<void> {
	if (!confirmDelete) {
		confirmDelete = true;
		return;
	}
	deleting = true;
	error = null;
	try {
		await deleteModel(model.id);
		await modelsState.scan();
		await modelsState.refresh();
		onDelete?.();
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	} finally {
		deleting = false;
		confirmDelete = false;
	}
}
</script>

<div
	class="rounded-lg border p-4"
	style="border-color: var(--border-subtle); background: oklch(0.12 0.01 240 / 0.5);"
	data-component="model-detail-panel"
>
	<div class={stack({ gap: "3" })}>
		<!-- Header -->
		<div class={hstack({ gap: "2", align: "center" })}>
			<HardDrive size={16} style="color: var(--accent-teal-main);" />
			<Text size="sm" weight="bold" color="primary">{model.filename}</Text>
		</div>

		<!-- Metadata grid -->
		<div class="grid grid-cols-2 gap-x-4 gap-y-2">
			<div>
				<Text size="xs" color="muted">Architecture</Text>
				<Text size="sm" color="primary">{model.architecture}</Text>
			</div>
			<div>
				<Text size="xs" color="muted">Quality</Text>
				<Text size="sm" color="primary">{quantDesc}</Text>
			</div>
			<div>
				<Text size="xs" color="muted">Memory</Text>
				<Text size="sm" color="primary">{contextDesc}</Text>
			</div>
			<div>
				<Text size="xs" color="muted">File size</Text>
				<Text size="sm" color="primary">{formatMb(model.size_mb)}</Text>
			</div>
			<div>
				<Text size="xs" color="muted">GPU memory needed</Text>
				<div class={hstack({ gap: "1", align: "center" })}>
					<div
						class="h-2 w-2 rounded-full"
						style="background: {fitColorVal};"
					></div>
					<Text size="sm" color="primary">~{formatMb(model.vram_estimate_mb)}</Text>
					<Text size="xs" color="muted">({fitLabelVal})</Text>
				</div>
			</div>
			{#if model.context_length > 0}
				<div>
					<Text size="xs" color="muted">Context window</Text>
					<Text size="sm" color="primary">{formatContext(model.context_length)}</Text>
				</div>
			{/if}
		</div>

		<!-- Advanced: file path -->
		{#if showPath}
			<div class="rounded border px-2 py-1" style="border-color: var(--border-subtle);">
				<Text size="xs" color="muted">ID: {model.id}</Text>
			</div>
		{/if}

		<!-- Assigned slots -->
		{#if assignedSlots.length > 0}
			<div class={hstack({ gap: "1", align: "center" })}>
				<Text size="xs" color="muted">Used by:</Text>
				{#each assignedSlots as slotId (slotId)}
					<span
						class="rounded px-1.5 py-0.5 text-xs"
						style="background: var(--accent-teal-main); color: var(--surface-base);"
					>{slotId}</span>
				{/each}
			</div>
		{/if}

		<!-- Delete action -->
		<div class={hstack({ gap: "2", align: "center" })}>
			{#if confirmDelete}
				<div class={hstack({ gap: "1", align: "center" })}>
					<AlertTriangle size={12} style="color: var(--signal-warning);" />
					<Text size="xs" color="muted">Delete permanently? This cannot be undone.</Text>
				</div>
				<button
					class="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all hover:brightness-125"
					style="background: var(--signal-error); color: var(--surface-base);"
					onclick={handleDelete}
					disabled={deleting}
				>
					<Trash2 size={10} />
					{deleting ? "Deleting..." : "Yes, delete"}
				</button>
				<button
					class="rounded px-2 py-1 text-xs transition-colors hover:brightness-110"
					style="color: var(--text-muted);"
					onclick={() => { confirmDelete = false; }}
				>
					Cancel
				</button>
			{:else}
				<button
					class="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:brightness-110"
					style="color: var(--signal-error); border: 1px solid var(--border-subtle);"
					onclick={handleDelete}
					disabled={assignedSlots.length > 0}
					title={assignedSlots.length > 0
						? "Unassign this model from all slots before deleting"
						: "Remove this model file from disk permanently"}
				>
					<Trash2 size={10} />
					Delete from disk
				</button>
			{/if}
		</div>

		<!-- Error -->
		{#if error}
			<Text size="xs" color="negative">{error}</Text>
		{/if}
	</div>
</div>
