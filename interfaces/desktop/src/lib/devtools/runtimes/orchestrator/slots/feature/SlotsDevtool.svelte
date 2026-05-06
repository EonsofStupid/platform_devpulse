<!--
	@file SlotsDevtool.svelte
	@module @devpulse/devtools/runtimes/orchestrator/slots

	Slot orchestrator devtool — view + manage slot↔model assignments,
	per-slot load/unload, VRAM headroom. Wraps `ServiceDevtoolShell` so
	it follows the same 5-tab template as every other devtool. The role
	sections live in Status; rescan + bulk verbs live in Actions; the
	full registry browser + download panel live in extra tabs.
-->
<script lang="ts">
import {
	Brain,
	Check,
	Download,
	Headphones,
	Play,
	RefreshCw,
	Search,
	Sparkles,
	Square,
	X,
} from "lucide-svelte";
import { onMount } from "svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import HfSearchDialog from "$lib/devtools/_shared/HfSearchDialog.svelte";
import {
	type ExtraTab,
	type HealthBadge,
	ScopedLogPanel,
	ServiceDevtoolShell,
} from "$lib/devtools/index.js";
import {
	formatMb,
	getSlotLabel,
	isInferenceReady,
	modelsState,
	ROLE_FRAMES,
	VramBar,
} from "$lib/domains/app/models/index.js";
import DownloadPanel from "$lib/sys/activity-hud/DownloadPanel.svelte";
import InstallPanel from "$lib/sys/activity-hud/InstallPanel.svelte";
import { modelsDirPath } from "$lib/sys/bindings/models/index.js";

let loading = $state(false);
let actionSlot = $state<string | null>(null);
let modelsDir = $state<string | null>(null);
let modelsDirError = $state<string | null>(null);
// Slot id whose Browse-models dialog is currently open. Null = closed.
let browseSlot = $state<string | null>(null);

onMount(async () => {
	const r = await modelsDirPath();
	if (r.status === "ok") {
		modelsDir = r.data;
	} else {
		modelsDirError = String(r.error);
	}
});

const ROLE_ICONS = {
	brain: Brain,
	encoder: Search,
	voice: Headphones,
	helpers: Sparkles,
} as const;

const ROLE_ACCENT: Record<string, string> = {
	brain: "var(--accent-teal-main)",
	encoder: "var(--accent-purple-main)",
	voice: "var(--accent-coral-main)",
	helpers: "var(--text-muted)",
};

async function rescan(): Promise<void> {
	loading = true;
	try {
		await modelsState.scan();
		await modelsState.refresh();
	} finally {
		loading = false;
	}
}

async function loadSlot(slotId: string): Promise<void> {
	actionSlot = slotId;
	try {
		await modelsState.load(slotId);
	} catch (e) {
		console.error(`Load failed for ${slotId}:`, e);
	} finally {
		actionSlot = null;
	}
}

async function unloadSlot(slotId: string): Promise<void> {
	actionSlot = slotId;
	try {
		await modelsState.unload(slotId);
	} catch (e) {
		console.error(`Unload failed for ${slotId}:`, e);
	} finally {
		actionSlot = null;
	}
}

function slotData(slotId: string) {
	const slot = modelsState.slots.find((s) => s.id === slotId);
	const model = slot?.assigned_model_id
		? (modelsState.models.find((m) => m.id === slot.assigned_model_id) ?? null)
		: null;
	const status = modelsState.statuses[slotId];
	const ready = status ? isInferenceReady(status) : false;
	const label = getSlotLabel(slotId);
	return { slot, model, status, ready, label };
}

const readyCount = $derived(
	modelsState.slots.filter((s) => {
		const status = modelsState.statuses[s.id];
		return status && isInferenceReady(status);
	}).length,
);
const assignedCount = $derived(modelsState.slots.filter((s) => s.assigned_model_id).length);
const totalSlots = $derived(modelsState.slots.length);

const badge = $derived<HealthBadge>(
	totalSlots === 0
		? { state: "unknown", label: "No slots" }
		: readyCount === 0 && assignedCount === 0
			? { state: "stopped", label: "No slots assigned" }
			: readyCount === assignedCount && readyCount > 0
				? { state: "up", label: `${readyCount}/${assignedCount} ready` }
				: readyCount > 0
					? { state: "degraded", label: `${readyCount}/${assignedCount} ready` }
					: { state: "starting", label: `${assignedCount} assigned, none loaded yet` },
);

const extraTabs: ExtraTab[] = [
	{ id: "registry", label: "Registry", Icon: Search },
	{ id: "downloads", label: "Downloads", Icon: Play },
];
</script>

<ServiceDevtoolShell
	title="Slot Orchestrator"
	description="Slot ↔ model assignments · load / unload · VRAM headroom"
	icon={Brain}
	axis="capabilities"
	accent="teal"
	health={badge}
	{extraTabs}
>
	{#snippet status()}
		<div class="space-y-4">
			<VramBar />

			{#each ROLE_FRAMES as frame (frame.id)}
				{@const Icon = ROLE_ICONS[frame.id as keyof typeof ROLE_ICONS] ?? Sparkles}
				{@const accent = ROLE_ACCENT[frame.id] ?? "var(--text-muted)"}

				<section class="role-section">
					<div class="role-header" style:border-left-color={accent}>
						<Icon size={18} />
						<Text size="sm" weight="bold">{frame.label}</Text>
						<Text size="xs" class="role-desc">{frame.description}</Text>
					</div>

					<div class="slot-table">
						{#each frame.slots as slotId (slotId)}
							{@const { model, status, ready, label } = slotData(slotId)}
							{@const isActing = actionSlot === slotId}

							<div class="slot-row">
								<div class="slot-id">
									<Text size="xs" weight="bold">{label?.name ?? slotId}</Text>
									<Text size="xs" class="slot-raw-id">{slotId}</Text>
								</div>

								<div class="slot-model">
									{#if model}
										<Text size="xs" class="model-name">{model.filename}</Text>
										<Text size="xs" class="model-vram">{formatMb(model.vram_estimate_mb)} VRAM</Text>
									{:else}
										<Text size="xs" class="model-empty">No model assigned</Text>
									{/if}
								</div>

								<div class="slot-status">
									{#if ready}
										<Badge tone="positive" size="sm"><Check size={8} /> Ready</Badge>
									{:else if status?.type === "loading"}
										<Badge tone="informative" size="sm"><Spinner size="xs" /> Loading</Badge>
									{:else if status?.type === "failed"}
										<Badge tone="negative" size="sm"><X size={8} /> Failed</Badge>
									{:else if model}
										<Badge tone="neutral" size="sm">Assigned</Badge>
									{:else}
										<Badge tone="neutral" size="sm">Empty</Badge>
									{/if}
								</div>

								<div class="slot-actions">
									{#if !model}
										<Button
											preset="button-primary"
											size="sm"
											onclick={() => (browseSlot = slotId)}
										>
											<Download size={12} />
											Install model
										</Button>
									{/if}
									{#if model && !ready}
										<Button preset="button-secondary" size="sm" onclick={() => loadSlot(slotId)} disabled={isActing}>
											{#if isActing}<Spinner size="xs" />{:else}<Play size={12} />{/if}
											Load
										</Button>
									{/if}
									{#if ready}
										<Button preset="button-ghost" size="sm" onclick={() => unloadSlot(slotId)} disabled={isActing}>
											<Square size={12} />
											Unload
										</Button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	{/snippet}

	{#snippet config()}
		<div class="space-y-3">
			<div class="rounded-lg p-3" style="background: var(--surface-raised); border: 1px solid var(--border-subtle);">
				<Text size="sm" weight="bold" class="block mb-1">Models directory</Text>
				{#if modelsDir}
					<Text size="xs" class="font-mono block">{modelsDir}</Text>
				{:else if modelsDirError}
					<Text size="xs" color="muted">Could not read path: {modelsDirError}</Text>
				{:else}
					<Text size="xs" color="muted">Reading…</Text>
				{/if}
				<Text size="xs" color="muted" class="block mt-1">
					Every downloaded model lands here. Drop existing GGUF or
					safetensors bundles into this folder and hit Rescan in
					Actions to pick them up — symlinks work too.
				</Text>
			</div>
			<Text size="sm" color="muted">
				Slot definitions and per-tier presets live in the kernel
				<code>model-loader</code> crate
				(<code>kernel/model-loader/src/slots/</code>,
				<code>config/presets.default.toml</code>). The kernel
				picks the right model variant per tier; this devtool just
				surfaces what's currently bound.
			</Text>
		</div>
	{/snippet}

	{#snippet logs()}
		<ScopedLogPanel target="devtools.slots" />
	{/snippet}

	{#snippet actions()}
		<div class="space-y-3">
			<div class="rounded-lg p-3" style="background: var(--surface-raised); border: 1px solid var(--border-subtle);">
				<div class="flex items-center justify-between mb-2">
					<Text size="sm" weight="bold">Rescan models on disk</Text>
					<Button preset="button-secondary" size="sm" onclick={rescan} disabled={loading}>
						{#if loading}
							<Spinner size="xs" />
						{:else}
							<RefreshCw size={14} />
						{/if}
						Rescan
					</Button>
				</div>
				<Text size="xs" color="muted">
					Walks the model directory + refreshes the in-memory registry.
					Use after copying new GGUFs / safetensors into the model
					folder.
				</Text>
			</div>
			<Text size="sm" color="muted">
				Per-slot load / unload verbs live inline on each slot row in
				the Status tab — they're contextual to the slot they affect.
			</Text>
		</div>
	{/snippet}

	{#snippet debug()}
		<div class="space-y-3">
			<Text size="sm" color="muted">
				Power-user readouts. Aggregate state below correlates with what
				the badge in the header reports.
			</Text>
			<div class="rounded-lg p-3" style="background: var(--surface-raised); border: 1px solid var(--border-subtle);">
				<Text size="sm" weight="bold" class="block mb-2">Aggregate state</Text>
				<div class="text-xs space-y-1">
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Total slots</span>
						<span class="font-mono">{totalSlots}</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Assigned</span>
						<span class="font-mono">{assignedCount}</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Ready</span>
						<span class="font-mono">{readyCount}</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Models in registry</span>
						<span class="font-mono">{modelsState.models.length}</span>
					</div>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet extra(tabId: string)}
		{#if tabId === "registry"}
			{@render registryBody()}
		{:else if tabId === "downloads"}
			<div class="space-y-3">
				<InstallPanel />
				<DownloadPanel />
			</div>
		{/if}
	{/snippet}
</ServiceDevtoolShell>

<HfSearchDialog
	slotId={browseSlot ?? ""}
	open={browseSlot !== null}
	onClose={() => (browseSlot = null)}
/>

{#snippet registryBody()}
	<div class="space-y-3">
		<Text size="sm" color="muted">
			{modelsState.models.length} models in the registry. The list
			refreshes when Rust pushes <code>platform:models-status</code>
			(after every mutation + on boot) — you don't need to manually
			refresh unless you've copied new files in.
		</Text>
		<div class="registry-table">
			{#each modelsState.models as model (model.id)}
				<div class="registry-row">
					<Text size="xs" weight="bold" class="reg-filename">{model.filename}</Text>
					<Text size="xs" class="reg-detail">{model.architecture}</Text>
					<Text size="xs" class="reg-detail">{formatMb(model.size_mb)}</Text>
					<Text size="xs" class="reg-detail">{formatMb(model.vram_estimate_mb)} VRAM</Text>
					<div class="reg-caps">
						{#each model.compatible_capabilities as cap}
							<Badge tone="neutral" size="sm">{cap}</Badge>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
{/snippet}

<style>
	.role-section { display: flex; flex-direction: column; gap: 0.5rem; }
	.role-header {
		display: flex; align-items: center; gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-left: 0.1875rem solid var(--text-muted);
		color: var(--text-primary);
	}
	:global(.role-desc) { color: var(--text-muted); margin-left: auto; }
	.slot-table { display: flex; flex-direction: column; gap: 0.25rem; }
	.slot-row {
		display: grid;
		grid-template-columns: 10rem 1fr 6rem auto;
		align-items: center; gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: var(--surface-raised);
		border: 0.0625rem solid var(--border-soft);
	}
	.slot-id { display: flex; flex-direction: column; gap: 0.0625rem; }
	:global(.slot-raw-id) { color: var(--text-muted); font-family: var(--font-mono); }
	.slot-model { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
	:global(.model-name) { font-family: var(--font-mono); color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	:global(.model-vram) { color: var(--text-muted); flex-shrink: 0; }
	:global(.model-empty) { color: var(--text-muted); font-style: italic; }
	.slot-status { flex-shrink: 0; }
	.slot-actions { display: flex; gap: 0.25rem; }

	.registry-table { display: flex; flex-direction: column; gap: 0.25rem; }
	.registry-row {
		display: flex; align-items: center; gap: 0.75rem;
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		background: var(--surface-raised);
		border: 0.0625rem solid var(--border-soft);
		flex-wrap: wrap;
	}
	:global(.reg-filename) { font-family: var(--font-mono); min-width: 12rem; }
	:global(.reg-detail) { color: var(--text-muted); }
	.reg-caps { display: flex; gap: 0.25rem; margin-left: auto; }
</style>
