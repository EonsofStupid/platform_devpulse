<!--
	@file SlotsDevtool.svelte
	@module @devpulse/devtools/runtimes/orchestrator/slots

	Slot orchestrator devtool — view + manage slot↔model assignments,
	per-slot load/unload, VRAM headroom, plus the cortex anatomy
	bootstrap surface (Brain / Sparkles / Eyes / Ears / Mouth) absorbed
	from the legacy SetupWizardOverlay. Wraps `ServiceDevtoolShell` so
	it follows the same 5-tab template as every other devtool. The
	cortex constellation + tier readout + role sections live in Status;
	rescan + bulk verbs + Save-all live in Actions; the full registry
	browser + downloads panel live in extra tabs.

	## Bootstrap absorb

	The `slotsBootstrapState` rune (sibling data-access file) owns
	first-run detection, layman copy + tier display, auto-config
	recommendations, and the per-slot save chain (with Harrier
	ref-count paired fan-out for `rag.embedder`). The devtool mounts
	the constellation when recommendations are present; absent
	recommendations, the page just shows the existing slot table.
-->
<script lang="ts">
import {
	Brain,
	BrainCircuit,
	Check,
	Download,
	Ear,
	Eye,
	FolderOpen,
	Headphones,
	Mic,
	Play,
	RefreshCw,
	Search,
	Sparkles,
	Square,
	X,
	Zap,
} from "lucide-svelte";
import { onMount } from "svelte";
import { KnowledgeDeck } from "$lib/design/blocks/knowledge/index.js";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { InlineMessage } from "$lib/design/components/inline-message/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import {
	type CapturePayload,
	type ExtraTab,
	type HealthBadge,
	ScopedLogPanel,
	ServiceDevtoolShell,
} from "$lib/devtools/index.js";
import {
	formatMb,
	getSlotLabel,
	hardwareState,
	isInferenceReady,
	modelDownloaderState,
	modelsState,
	ROLE_FRAMES,
	VramBar,
} from "$lib/domains/app/models/index.js";
import DownloadPanel from "$lib/sys/activity-hud/DownloadPanel.svelte";
import InstallPanel from "$lib/sys/activity-hud/InstallPanel.svelte";
import { encoderEmbed, encoderIsLoaded, modelsDirPath } from "$lib/sys/bindings/models/index.js";
import { slotsBootstrapState } from "../data-access/slots-bootstrap.state.svelte.js";
import AnatomyConstellation from "../ui/AnatomyConstellation.svelte";
import AnatomyTile from "../ui/AnatomyTile.svelte";
import BootstrapBackdrop from "../ui/BootstrapBackdrop.svelte";
import type { SlotSaveEntry } from "../util/anatomy.types.js";

const RAG_EMBEDDER_SLOT = "rag.embedder";

/** Anatomy → kernel slot binding for the cortex constellation. Lives
 *  in the feature file because the binding is rendering-side glue
 *  (which named-area gets which kernel slot); the table is one-shot
 *  and small enough that pulling it into a separate util module adds
 *  more friction than value. */
const SLOT_BY_ANATOMY = {
	brain: "chat.brain",
	sparkles: "rag.embedder",
	eyes: "vision.embedder",
	ears: "voice.stt",
	mouth: "voice.tts",
} as const;

const ICON_MAP = { Eye, Ear, Mic, Sparkles, BrainCircuit } as const;

const findEntry = (entries: SlotSaveEntry[], slotId: string): SlotSaveEntry | undefined =>
	entries.find((s) => s.kernelSlotId === slotId);

let loading = $state(false);
let actionSlot = $state<string | null>(null);
let modelsDir = $state<string | null>(null);
let modelsDirError = $state<string | null>(null);
// Slot id whose local-library picker is currently open. Null = closed.
let pickLocalSlot = $state<string | null>(null);

/**
 * Open the singleton ModelDownloaderOverlay for the given slot. The
 * overlay is mounted at the root layout — calling `.open(...)`
 * surfaces it without owning the component here. Focus returns to
 * the triggering button when the overlay closes (APG dialog focus
 * contract handled inside `modelDownloaderState.finalize`).
 */
function openDownloader(slotId: string, e: MouseEvent): void {
	const trigger = e.currentTarget as HTMLElement;
	modelDownloaderState.open({ slotId }, trigger);
}
// Last assign error surfaced under the picker — capability mismatch,
// missing file, etc. Cleared when the dialog opens or another assign
// succeeds. Empty string = no error.
let pickLocalError = $state<string>("");

onMount(async () => {
	const r = await modelsDirPath();
	if (r.status === "ok") {
		modelsDir = r.data;
	} else {
		modelsDirError = String(r.error);
	}
	await refreshEncoderReady();
	// Bootstrap surface — load layman copy + tier + recommendations so
	// the cortex constellation can render. Each call is idempotent and
	// safe to re-run; running here keeps the data fresh whenever the
	// devtool is reopened. `refreshFirstRun` is best-effort — failure
	// is logged inside the rune, the devtool keeps working.
	void slotsBootstrapState.refreshFirstRun();
	await slotsBootstrapState.loadCopy();
	await slotsBootstrapState.recommend();
});

// Hardware live-state subscription. The cortex bootstrap reads tier +
// VRAM via the bootstrap state rune; the inline `VramBar` reads from
// `hardwareState` directly. Subscribe once for the lifetime of the
// devtool — ref-counting in `createTauriEvent` keeps the underlying
// listener attached only while at least one consumer is mounted.
$effect(() => hardwareState.subscribe("SlotsDevtool"));

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

/** Mark-complete UX state — surfaces the kernel error inline rather
 *  than relying on a toast. Owner-locked: errors visible in the
 *  Actions tab next to the trigger. */
let markCompleteBusy = $state(false);
let markCompleteError = $state<string | null>(null);

async function markBootstrapComplete(): Promise<void> {
	markCompleteBusy = true;
	markCompleteError = null;
	try {
		await slotsBootstrapState.markComplete();
	} catch (e) {
		markCompleteError = e instanceof Error ? e.message : String(e);
	} finally {
		markCompleteBusy = false;
	}
}

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

async function clearSlot(slotId: string): Promise<void> {
	actionSlot = slotId;
	try {
		await modelsState.clearAssignment(slotId);
	} catch (e) {
		console.error(`Clear assignment failed for ${slotId}:`, e);
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

function openLocalPicker(slotId: string): void {
	pickLocalError = "";
	pickLocalSlot = slotId;
}

function closeLocalPicker(): void {
	pickLocalSlot = null;
	pickLocalError = "";
}

async function applyLocal(slotId: string, modelId: string): Promise<void> {
	pickLocalError = "";
	actionSlot = slotId;
	try {
		await modelsState.assign(slotId, modelId);
		closeLocalPicker();
	} catch (e) {
		pickLocalError = e instanceof Error ? e.message : String(e);
		console.error(`Assign failed for ${slotId} ← ${modelId}:`, e);
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

// ── Encoder smoke test ─────────────────────────────────────────
// Single-shot inference verification: type text → click Embed →
// read back vector dim + first 5 floats. Gates on `encoderIsLoaded`
// so the button is disabled until the kernel adapter has weights.
let encoderText = $state("hello world");
let encoderResult = $state<{ dim: number; head: number[] } | null>(null);
let encoderError = $state<string | null>(null);
let encoderBusy = $state(false);
let encoderReady = $state(false);

async function refreshEncoderReady(): Promise<void> {
	const r = await encoderIsLoaded();
	encoderReady = r.status === "ok" && r.data === true;
}

async function runEncoderEmbed(): Promise<void> {
	encoderBusy = true;
	encoderError = null;
	encoderResult = null;
	try {
		const r = await encoderEmbed([encoderText]);
		if (r.status === "error") {
			encoderError = r.error;
			return;
		}
		const [vec] = r.data;
		if (!vec) {
			encoderError = "Backend returned an empty vector batch";
			return;
		}
		encoderResult = { dim: vec.length, head: vec.slice(0, 5) };
	} catch (e) {
		encoderError = e instanceof Error ? e.message : String(e);
	} finally {
		encoderBusy = false;
	}
}

// The kernel currently doesn't emit `model:slot-status` (statuses[]
// stays optimistic post-load), so we cheap-poll `encoderIsLoaded`
// while the encoder is not yet ready. Polling halts the instant we
// observe a loaded encoder, so the steady-state cost is one call
// at mount + one after each Embed run. Cleared on unmount.
$effect(() => {
	if (encoderReady) return;
	const handle = window.setInterval(() => {
		void refreshEncoderReady();
	}, 1500);
	return () => window.clearInterval(handle);
});

const readyCount = $derived(
	modelsState.slots.filter((s) => {
		const status = modelsState.statuses[s.id];
		return status && isInferenceReady(status);
	}).length,
);
const assignedCount = $derived(modelsState.slots.filter((s) => s.assigned_model_id).length);
const totalSlots = $derived(modelsState.slots.length);

/** Live install progress derived from the bootstrap rune. When the
 *  customer dispatches saves via the cortex constellation, the
 *  installs surface here so the header badge tells the truth even
 *  while the slot table is still empty. */
const installsRunning = $derived(slotsBootstrapState.installsRunning);
const installsComplete = $derived(slotsBootstrapState.installsComplete);
const installsFailed = $derived(slotsBootstrapState.installsFailed);
const installsTotal = $derived(slotsBootstrapState.installsTotal);

const badge = $derived<HealthBadge>(
	installsRunning > 0
		? {
				state: "starting",
				label: `Installing ${installsComplete + installsFailed}/${installsTotal}`,
			}
		: totalSlots === 0
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
	{ id: "encoder", label: "Encoder smoke", Icon: Zap },
];

// ── Capture (copy / export) ────────────────────────────────
// Shell calls this with the active tab id; we return a payload that
// reflects what the user is looking at. Returning `undefined` hides
// the Copy / Export buttons for that tab. Status + registry + debug
// pay off the most: status snapshots the slot table at a frozen
// moment, registry snapshots every discovered model with capability
// + VRAM data, debug captures the aggregate counts that drive the
// header badge.
function captureFor(tabId: string): CapturePayload | undefined {
	switch (tabId) {
		case "status":
			return {
				filename: "slot-orchestrator-status.json",
				mime: "application/json",
				content: JSON.stringify(
					{
						roles: ROLE_FRAMES.map((frame) => ({
							role: frame.id,
							label: frame.label,
							slots: frame.slots.map((id) => {
								const d = slotData(id);
								return {
									slot_id: id,
									slot_label: d.label?.name ?? id,
									assigned_model: d.model?.filename ?? null,
									vram_estimate_mb: d.model?.vram_estimate_mb ?? null,
									ready: d.ready,
									status_type: d.status?.type ?? null,
								};
							}),
						})),
						totals: {
							slots: totalSlots,
							assigned: assignedCount,
							ready: readyCount,
							registry_size: modelsState.models.length,
						},
					},
					null,
					2,
				),
			};
		case "config":
			return modelsDir
				? {
						filename: "slot-orchestrator-config.txt",
						mime: "text/plain",
						content: `models_dir = ${modelsDir}\n`,
					}
				: undefined;
		case "debug":
			return {
				filename: "slot-orchestrator-debug.txt",
				mime: "text/plain",
				content: [
					`total_slots: ${totalSlots}`,
					`assigned: ${assignedCount}`,
					`ready: ${readyCount}`,
					`registry_size: ${modelsState.models.length}`,
					`models_dir: ${modelsDir ?? "—"}`,
				].join("\n"),
			};
		case "registry":
			return modelsState.models.length === 0
				? undefined
				: {
						filename: "slot-orchestrator-registry.json",
						mime: "application/json",
						content: JSON.stringify(
							modelsState.models.map((m) => ({
								id: m.id,
								filename: m.filename,
								architecture: m.architecture,
								size_mb: m.size_mb,
								vram_estimate_mb: m.vram_estimate_mb,
								capabilities: m.compatible_capabilities,
							})),
							null,
							2,
						),
					};
		case "encoder":
			return encoderResult || encoderError
				? {
						filename: "encoder-smoke.json",
						mime: "application/json",
						content: JSON.stringify(
							{
								slot: RAG_EMBEDDER_SLOT,
								ready: encoderReady,
								input: encoderText,
								result: encoderResult,
								error: encoderError,
							},
							null,
							2,
						),
					}
				: undefined;
		default:
			return undefined;
	}
}
</script>

<ServiceDevtoolShell
	title="Slot Orchestrator"
	description="Slot ↔ model assignments · load / unload · VRAM headroom"
	icon={Brain}
	axis="capabilities"
	accent="teal"
	health={badge}
	{extraTabs}
	capture={captureFor}
>
	{#snippet status()}
		<div class="space-y-4">
			<!--
				Bootstrap header — tier readout + live VRAM. The
				`<VramBar/>` is the live hardware subscription; the
				adjacent tier badge reflects the kernel's auto-tuned
				`TierDisplay` payload. Together they answer the customer's
				"what is this machine running" question before they
				see the slot table.
			-->
			<div class="bootstrap-header">
				<VramBar />
				{#if slotsBootstrapState.tierDisplay}
					<div
						class="tier-readout"
						role="status"
						aria-label={`Detected tier: ${slotsBootstrapState.tierDisplay.name}`}
					>
						<Text size="xs" color="muted" class="tier-label">Tier</Text>
						<Text size="sm" weight="bold">{slotsBootstrapState.tierDisplay.name}</Text>
						<Text size="xs" color="muted">{slotsBootstrapState.tierDisplay.description}</Text>
					</div>
				{/if}
			</div>

			{#if slotsBootstrapState.error}
				<InlineMessage tone="error">{slotsBootstrapState.error}</InlineMessage>
			{/if}

			{#if slotsBootstrapState.slotSaveEntries.length > 0}
				<!--
					Cortex anatomy bootstrap — five tiles arranged through
					AnatomyConstellation, customer hits Apply on the ones
					they want now. The bootstrap rune owns the per-tile
					save chain (paired fan-out for `rag.embedder` → all
					five Harrier slots). Replaces the legacy
					SetupWizardOverlay cortex view; lives here so the
					customer never leaves the devtool to bootstrap models.
				-->
				<section class="cortex-section" aria-label="Cortex anatomy bootstrap">
					<BootstrapBackdrop />
					<div class="cortex-stack">
						<header class="cortex-header">
							<Heading level={3} size="md">Clyffy's cortex — five pieces, one mind</Heading>
							<Text size="sm" color="muted">
								Each tile maps to a sense or thought layer. Hit Apply on the ones you want now —
								every slot is pre-selected, so you can just click through.
							</Text>
						</header>
						<AnatomyConstellation>
							{#snippet brain()}
								{@const entry = findEntry(
									slotsBootstrapState.slotSaveEntries,
									SLOT_BY_ANATOMY.brain,
								)}
								{#if entry}
									<AnatomyTile
										slotId={entry.kernelSlotId}
										icon={ICON_MAP[entry.iconName]}
										purpose={entry.purpose}
										tagline={entry.tagline}
										modelName={entry.modelName}
										modelTagline={entry.modelTagline}
										sizeHint={entry.sizeHint}
										tierLabel={entry.tierLabel}
										aboutHref={entry.aboutHref}
										state={entry.state}
										errorText={entry.errorText}
										accentVar={entry.accentVar}
										onApply={() => slotsBootstrapState.saveOneSlot(entry.kernelSlotId)}
									/>
								{/if}
							{/snippet}
							{#snippet sparkles()}
								{@const entry = findEntry(
									slotsBootstrapState.slotSaveEntries,
									SLOT_BY_ANATOMY.sparkles,
								)}
								{#if entry}
									<AnatomyTile
										slotId={entry.kernelSlotId}
										icon={ICON_MAP[entry.iconName]}
										purpose={entry.purpose}
										tagline={entry.tagline}
										modelName={entry.modelName}
										modelTagline={entry.modelTagline}
										sizeHint={entry.sizeHint}
										tierLabel={entry.tierLabel}
										aboutHref={entry.aboutHref}
										state={entry.state}
										errorText={entry.errorText}
										accentVar={entry.accentVar}
										onApply={() => slotsBootstrapState.saveOneSlot(entry.kernelSlotId)}
									/>
								{/if}
							{/snippet}
							{#snippet eyes()}
								{@const entry = findEntry(
									slotsBootstrapState.slotSaveEntries,
									SLOT_BY_ANATOMY.eyes,
								)}
								{#if entry}
									<AnatomyTile
										slotId={entry.kernelSlotId}
										icon={ICON_MAP[entry.iconName]}
										purpose={entry.purpose}
										tagline={entry.tagline}
										modelName={entry.modelName}
										modelTagline={entry.modelTagline}
										sizeHint={entry.sizeHint}
										tierLabel={entry.tierLabel}
										aboutHref={entry.aboutHref}
										state={entry.state}
										errorText={entry.errorText}
										accentVar={entry.accentVar}
										onApply={() => slotsBootstrapState.saveOneSlot(entry.kernelSlotId)}
									/>
								{/if}
							{/snippet}
							{#snippet ears()}
								{@const entry = findEntry(
									slotsBootstrapState.slotSaveEntries,
									SLOT_BY_ANATOMY.ears,
								)}
								{#if entry}
									<AnatomyTile
										slotId={entry.kernelSlotId}
										icon={ICON_MAP[entry.iconName]}
										purpose={entry.purpose}
										tagline={entry.tagline}
										modelName={entry.modelName}
										modelTagline={entry.modelTagline}
										sizeHint={entry.sizeHint}
										tierLabel={entry.tierLabel}
										aboutHref={entry.aboutHref}
										state={entry.state}
										errorText={entry.errorText}
										accentVar={entry.accentVar}
										onApply={() => slotsBootstrapState.saveOneSlot(entry.kernelSlotId)}
									/>
								{/if}
							{/snippet}
							{#snippet mouth()}
								{@const entry = findEntry(
									slotsBootstrapState.slotSaveEntries,
									SLOT_BY_ANATOMY.mouth,
								)}
								{#if entry}
									<AnatomyTile
										slotId={entry.kernelSlotId}
										icon={ICON_MAP[entry.iconName]}
										purpose={entry.purpose}
										tagline={entry.tagline}
										modelName={entry.modelName}
										modelTagline={entry.modelTagline}
										sizeHint={entry.sizeHint}
										tierLabel={entry.tierLabel}
										aboutHref={entry.aboutHref}
										state={entry.state}
										errorText={entry.errorText}
										accentVar={entry.accentVar}
										onApply={() => slotsBootstrapState.saveOneSlot(entry.kernelSlotId)}
									/>
								{/if}
							{/snippet}
						</AnatomyConstellation>
					</div>
				</section>
			{/if}

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
										<Badge variant="positive" size="sm"><Check size={8} /> Ready</Badge>
									{:else if status?.type === "loading"}
										<Badge variant="informative" size="sm"><Spinner size="xs" /> Loading</Badge>
									{:else if status?.type === "failed"}
										<Badge variant="negative" size="sm"><X size={8} /> Failed</Badge>
									{:else if model}
										<Badge variant="neutral" size="sm">Assigned</Badge>
									{:else}
										<Badge variant="neutral" size="sm">Empty</Badge>
									{/if}
								</div>

								<div class="slot-actions">
									{#if !model}
										<Button
											preset="secondary"
											size="sm"
											onclick={() => openLocalPicker(slotId)}
											disabled={modelsState.models.length === 0}
											title={modelsState.models.length === 0
												? "No local models discovered yet — run Rescan or drop a GGUF into the models folder"
												: "Bind a model already on disk to this slot"}
										>
											<FolderOpen size={12} />
											Pick local
										</Button>
										<Button
											preset="primary"
											size="sm"
											onclick={(e: MouseEvent) => openDownloader(slotId, e)}
										>
											<Download size={12} />
											Install model
										</Button>
									{/if}
									{#if model && !ready}
										<Button preset="ghost" size="sm" onclick={() => openLocalPicker(slotId)} disabled={isActing}>
											<FolderOpen size={12} />
											Swap
										</Button>
										<Button preset="ghost" size="sm" onclick={() => clearSlot(slotId)} disabled={isActing}>
											<X size={12} />
											Clear
										</Button>
										<Button preset="secondary" size="sm" onclick={() => loadSlot(slotId)} disabled={isActing}>
											{#if isActing}<Spinner size="xs" />{:else}<Play size={12} />{/if}
											Load
										</Button>
									{/if}
									{#if ready}
										<Button preset="ghost" size="sm" onclick={() => unloadSlot(slotId)} disabled={isActing}>
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
			{#if slotsBootstrapState.slotSaveEntries.length > 0}
				<div class="rounded-lg p-3" style="background: var(--surface-raised); border: 1px solid var(--border-subtle);">
					<div class="flex items-center justify-between mb-2">
						<Text size="sm" weight="bold">Save every recommended slot</Text>
						<Button
							preset="primary"
							size="sm"
							onclick={() => slotsBootstrapState.saveAllSlots()}
							disabled={installsRunning > 0
								|| slotsBootstrapState.slotSaveEntries.every((e) => e.state === "saved")}
						>
							{#if installsRunning > 0}<Spinner size="xs" />{:else}<Check size={14} />{/if}
							Apply all
						</Button>
					</div>
					<Text size="xs" color="muted">
						Fires the install chain for every cortex tile that isn't already
						saved. Harrier-served slots fan out under the hood — one download,
						five symlinks.
					</Text>
				</div>
				{#if slotsBootstrapState.firstRun}
					<div class="rounded-lg p-3" style="background: var(--surface-raised); border: 1px solid var(--border-subtle);">
						<div class="flex items-center justify-between mb-2">
							<Text size="sm" weight="bold">Mark setup complete</Text>
							<Button
								preset="button-secondary"
								size="sm"
								onclick={markBootstrapComplete}
								disabled={markCompleteBusy}
							>
								{#if markCompleteBusy}<Spinner size="xs" />{:else}<Check size={14} />{/if}
								Mark complete
							</Button>
						</div>
						<Text size="xs" color="muted">
							Tells the kernel the first-run bootstrap is done. The cortex
							tiles stay editable afterwards — this just flips the
							`is_first_run` signal.
						</Text>
						{#if markCompleteError}
							<InlineMessage tone="error">{markCompleteError}</InlineMessage>
						{/if}
					</div>
				{/if}
			{/if}
			<div class="rounded-lg p-3" style="background: var(--surface-raised); border: 1px solid var(--border-subtle);">
				<div class="flex items-center justify-between mb-2">
					<Text size="sm" weight="bold">Rescan models on disk</Text>
					<Button preset="secondary" size="sm" onclick={rescan} disabled={loading}>
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
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Bootstrap first-run</span>
						<span class="font-mono">{slotsBootstrapState.firstRun ?? "—"}</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Recommendations</span>
						<span class="font-mono">{slotsBootstrapState.recommendations.length}</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Installs dispatched</span>
						<span class="font-mono">{slotsBootstrapState.dispatchedInstalls.length}</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Installs running</span>
						<span class="font-mono">{installsRunning}</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Installs complete</span>
						<span class="font-mono">{installsComplete}</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Installs failed</span>
						<span class="font-mono">{installsFailed}</span>
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
		{:else if tabId === "encoder"}
			{@render encoderBody()}
		{/if}
	{/snippet}
</ServiceDevtoolShell>

<!--
	Bootstrap KnowledgeDeck — pinned bottom-right, doesn't compete
	with the cortex constellation. The deck rotates between dyk /
	gloss / insight cards tagged for the `slots` tool scope so the
	customer sees fresh vocabulary while they work through the
	tiles. 45 s rotation matches the legacy wizard deck cadence.
-->
<div class="slots-knowledge-chip">
	<KnowledgeDeck
		context={{
			id: "slots-devtool",
			tool: "slots",
			scope: "slots:bootstrap",
			preferred: "dyk",
		}}
		refreshIntervalMs={45000}
	/>
</div>

<!--
	HfSearchDialog removed — the slot Install model button now opens
	the singleton ModelDownloaderOverlay mounted at the app root via
	`modelDownloaderState.open({ slotId }, triggerEl)`. The downloader
	carries the slot context, the HF token strip, bundle preview, and
	the second-acknowledgement CTA in a single ARIA APG dialog.
-->

{#if pickLocalSlot !== null}
	{@const slot = modelsState.slots.find((s) => s.id === pickLocalSlot)}
	{@const slotLabel = getSlotLabel(pickLocalSlot)}
	<div
		class="picker-backdrop"
		role="dialog"
		aria-modal="true"
		aria-label="Pick a local model for {slotLabel?.name ?? pickLocalSlot}"
		onclick={(e) => {
			if (e.target === e.currentTarget) closeLocalPicker();
		}}
		onkeydown={(e) => {
			if (e.key === "Escape") closeLocalPicker();
		}}
		tabindex="-1"
	>
		<div class="picker-card">
			<div class="picker-header">
				<div class="picker-title">
					<Text size="sm" weight="bold">Pick local model</Text>
					<Text size="xs" color="muted">
						→ {slotLabel?.name ?? pickLocalSlot}
						<span class="picker-slot-raw">({pickLocalSlot})</span>
					</Text>
				</div>
				<Button preset="ghost" size="sm" onclick={closeLocalPicker}>
					<X size={14} />
				</Button>
			</div>

			{#if pickLocalError}
				<InlineMessage tone="error">{pickLocalError}</InlineMessage>
			{/if}

			{#if modelsState.models.length === 0}
				<div class="picker-empty">
					<Text size="xs" color="muted">
						No models in the registry. Drop a GGUF / safetensors
						file into <code>{modelsDir ?? "the models folder"}</code>
						and hit Rescan in Actions.
					</Text>
				</div>
			{:else}
				<div class="picker-list">
					{#each modelsState.models as m (m.id)}
						{@const isCurrent = slot?.assigned_model_id === m.id}
						<button
							type="button"
							class="picker-row"
							class:picker-row--current={isCurrent}
							disabled={isCurrent || actionSlot === pickLocalSlot}
							onclick={() => applyLocal(pickLocalSlot!, m.id)}
						>
							<div class="picker-row-main">
								<Text size="xs" weight="bold" class="picker-row-name">{m.filename}</Text>
								<Text size="xs" class="picker-row-meta">
									{m.architecture} · {formatMb(m.size_mb)} · {formatMb(m.vram_estimate_mb)} VRAM
								</Text>
							</div>
							<div class="picker-row-caps">
								{#each m.compatible_capabilities as cap}
									<Badge variant="neutral" size="sm">{cap}</Badge>
								{/each}
							</div>
							{#if isCurrent}
								<Badge variant="positive" size="sm"><Check size={8} /> Assigned</Badge>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

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
							<Badge variant="neutral" size="sm">{cap}</Badge>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet encoderBody()}
	<div class="space-y-3">
		<Text size="sm" color="muted">
			One-shot text-embedding verification for the
			<code>{RAG_EMBEDDER_SLOT}</code> slot. Type a phrase, click
			Embed, read back the vector dimension + first five floats.
			The button is disabled until the kernel reports a loaded
			Burn encoder (assign + Load a safetensors model first).
		</Text>

		<div class="encoder-row">
			<label class="encoder-label" for="encoder-smoke-input">
				<Text size="xs" weight="bold">Input text</Text>
			</label>
			<input
				id="encoder-smoke-input"
				class="encoder-input"
				type="text"
				bind:value={encoderText}
				disabled={encoderBusy}
				placeholder="hello world"
			/>
		</div>

		<div class="encoder-actions">
			<Button
				preset="primary"
				size="sm"
				onclick={runEncoderEmbed}
				disabled={!encoderReady || encoderBusy || encoderText.length === 0}
			>
				{#if encoderBusy}<Spinner size="xs" />{:else}<Zap size={12} />{/if}
				Embed
			</Button>
			{#if encoderReady}
				<Badge variant="positive" size="sm"><Check size={8} /> Encoder loaded</Badge>
			{:else}
				<Badge variant="neutral" size="sm">Encoder not loaded</Badge>
			{/if}
		</div>

		{#if encoderError}
			<InlineMessage tone="error">{encoderError}</InlineMessage>
		{/if}

		{#if encoderResult}
			<div class="encoder-result">
				<div class="encoder-result-row">
					<Text size="xs" color="muted">Vector dimension</Text>
					<Text size="xs" weight="bold" class="encoder-mono">{encoderResult.dim}</Text>
				</div>
				<div class="encoder-result-row">
					<Text size="xs" color="muted">First 5 floats</Text>
					<Text size="xs" class="encoder-mono">
						[{encoderResult.head.map((f) => f.toFixed(4)).join(", ")}]
					</Text>
				</div>
			</div>
		{/if}
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

	.picker-backdrop {
		position: fixed; inset: 0;
		background: var(--overlay-scrim-heavy);
		display: flex; align-items: center; justify-content: center;
		z-index: 1000;
		padding: var(--space-12);
	}
	.picker-card {
		background: var(--surface-base);
		border: var(--border-width-hairline) solid var(--border-strong);
		border-radius: var(--radius-lg);
		box-shadow:
			var(--elevation-modal-1-offset-x) var(--elevation-modal-1-offset-y)
				var(--elevation-modal-1-blur) var(--elevation-modal-1-spread)
				var(--elevation-modal-1-color),
			var(--elevation-modal-2-offset-x) var(--elevation-modal-2-offset-y)
				var(--elevation-modal-2-blur) var(--elevation-modal-2-spread)
				var(--elevation-modal-2-color);
		width: min(38rem, 100%);
		max-height: min(36rem, 80vh);
		display: flex; flex-direction: column;
		gap: var(--space-7);
		padding: var(--space-10) var(--space-12);
	}
	.picker-header {
		display: flex; align-items: flex-start; justify-content: space-between;
		gap: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 0.0625rem solid var(--border-subtle);
	}
	.picker-title { display: flex; flex-direction: column; gap: 0.125rem; }
	.picker-slot-raw { font-family: var(--font-mono); color: var(--text-muted); }
	.picker-empty {
		padding: 1rem 0.5rem;
		text-align: center;
	}
	.picker-list {
		display: flex; flex-direction: column; gap: 0.25rem;
		overflow-y: auto;
		min-height: 0;
		padding-right: 0.125rem;
	}
	.picker-row {
		display: grid;
		grid-template-columns: 1fr auto auto;
		align-items: center; gap: 0.75rem;
		padding: 0.5rem 0.625rem;
		border-radius: 0.5rem;
		background: var(--surface-raised);
		border: 0.0625rem solid var(--border-soft);
		text-align: left;
		cursor: pointer;
		color: var(--text-primary);
		font: inherit;
	}
	.picker-row:hover:not(:disabled) {
		border-color: var(--accent-teal-main);
		background: var(--surface-elevated);
	}
	.picker-row:disabled { cursor: not-allowed; opacity: 0.6; }
	.picker-row--current { border-color: var(--accent-teal-main); }
	.picker-row-main { display: flex; flex-direction: column; gap: 0.125rem; min-width: 0; }
	:global(.picker-row-name) {
		font-family: var(--font-mono);
		overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
	}
	:global(.picker-row-meta) { color: var(--text-muted); }
	.picker-row-caps { display: flex; gap: 0.25rem; flex-wrap: wrap; }

	.encoder-row { display: flex; flex-direction: column; gap: 0.25rem; }
	.encoder-label { display: flex; }
	.encoder-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: var(--surface-raised);
		border: 0.0625rem solid var(--border-soft);
		color: var(--text-primary);
		font: inherit;
		font-family: var(--font-mono);
	}
	.encoder-input:focus {
		outline: none;
		border-color: var(--accent-teal-main);
	}
	.encoder-input:disabled { opacity: 0.6; cursor: not-allowed; }
	.encoder-actions { display: flex; align-items: center; gap: 0.5rem; }
	.encoder-result {
		display: flex; flex-direction: column; gap: 0.25rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: var(--surface-raised);
		border: 0.0625rem solid var(--border-soft);
	}
	.encoder-result-row { display: flex; justify-content: space-between; align-items: baseline; gap: 0.75rem; }
	:global(.encoder-mono) { font-family: var(--font-mono); }

	/* ── Bootstrap header — VRAM bar + tier readout side by side ── */
	.bootstrap-header {
		display: flex;
		align-items: stretch;
		gap: var(--space-7);
		flex-wrap: wrap;
	}
	.tier-readout {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: var(--space-5) var(--space-7);
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		border: var(--border-width-hairline) solid var(--border-subtle);
		min-width: 12rem;
	}
	:global(.tier-label) {
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	/* ── Cortex section — anatomy constellation + backdrop ── */
	.cortex-section {
		position: relative;
		padding: clamp(1rem, 2vw, 1.75rem);
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		border: var(--border-width-hairline) solid var(--border-subtle);
		overflow: hidden;
		isolation: isolate;
	}
	.cortex-stack {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		gap: clamp(0.875rem, 1.8vw, 1.5rem);
	}
	.cortex-header {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		text-align: center;
		max-width: 48rem;
		margin-inline: auto;
	}

	/* ── Knowledge deck chip — pinned bottom-right ── */
	.slots-knowledge-chip {
		position: fixed;
		bottom: clamp(0.75rem, 1.5vw, 1.25rem);
		right: clamp(0.75rem, 1.5vw, 1.25rem);
		z-index: 50;
		max-width: clamp(18rem, 30vw, 26rem);
		pointer-events: auto;
	}
</style>
