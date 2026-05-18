<!--
	@file SetupWizardOverlay.svelte
	@module @devpulse/domains/app/models/feature/setup-wizard

	Thin dispatcher — maps `wizardState.view` to one of the five
	per-step view files under `feature/views/`. NO inline view bodies,
	NO direct `<div class="card">` chrome (that lives in
	`feature/OverlayShell.svelte`). This file:

	1. Loads `WizardCopy` + `TierDisplay` once on open.
	2. Subscribes to `hardwareState` for live VRAM.
	3. Owns the install-chain dispatch (`applyAutoConfig`).
	4. Auto-advances from `installing` to `complete` once every
	   dispatched install terminates.
	5. Wires the bundled MP4 backdrop snippet — `MP4_BACKDROP_URL`
	   points at the asset that ships with the desktop binary; the
	   dispatcher renders a `<video>` element behind every view so
	   the wizard has a consistent atmospheric backdrop. A later
	   batch lands `cargo xtask optimize-media` to emit AV1/WebM +
	   H.264/MP4 variants for multi-source playback.
	6. Routes `Skip → assign manually` to the Slot Orchestrator
	   devtool (where Pick-local + Clear-assignment already work).

	The active overlay is provided BY THE VIEW FILE itself
	(each view wraps `OverlayShell` internally) — the dispatcher
	only switches which view file mounts.
-->
<script lang="ts">
import { goto } from "$app/navigation";
import { KnowledgeDeck } from "$lib/design/blocks/knowledge/index.js";
import { installState } from "$lib/sys/activity-hud/install.state.svelte.js";
import {
	autoConfigure,
	getTierDisplay,
	getWizardCopy,
	installToSlot,
} from "$lib/sys/bindings/models/index.js";
import type { TierDisplay, WizardCopy } from "$lib/sys/generated/bindings.js";
import { hardwareState } from "../../data-access/hardware.state.svelte.js";
import ClyffyCollabView from "./feature/views/ClyffyCollabView.svelte";
import CompleteView from "./feature/views/CompleteView.svelte";
import CortexView from "./feature/views/CortexView.svelte";
import HardwareView from "./feature/views/HardwareView.svelte";
import InstallingView from "./feature/views/InstallingView.svelte";
import PresetView from "./feature/views/PresetView.svelte";
import WelcomeView from "./feature/views/WelcomeView.svelte";
import type {
	SlotRecommendation,
	SlotSaveEntryProps,
	WizardCallbacks,
} from "./util/wizard.types.js";
import { wizardState } from "./wizard.state.svelte.js";

/**
 * Animated MP4 backdrop for the wizard. Bundled with the desktop
 * binary — Tauri serves `static/` at the app root so this URL
 * resolves locally without a network round-trip.
 *
 * Optimization pipeline lands in a separate batch:
 * `cargo xtask optimize-media` will scan
 * `interfaces/desktop/static/imgs/backgrounds/` and emit per-source
 * AV1/WebM + H.264/MP4 variants (`ffmpeg` system-detected with a
 * portable fallback under `deps/ffmpeg-prebuilt/`). When that ships
 * the `<video>` below switches to a multi-source element so modern
 * WebView2 picks AV1 and falls back to H.264 on older runtimes.
 */
const MP4_BACKDROP_URL = "/imgs/backgrounds/bganimation_loop.mp4";

interface AutoConfigPayload {
	tier: string;
	preset_name: string;
	recommendations: SlotRecommendation[];
	total_vram_needed_mb: number;
	total_download_size_mb: number;
}

let copy = $state<WizardCopy | null>(null);
let tierDisplay = $state<TierDisplay | null>(null);
let copyError = $state<string | null>(null);
let busy = $state(false);

let recommendations = $state<SlotRecommendation[]>([]);
let dispatchedInstallIds = $state<string[]>([]);
let dispatchErrors = $state<Record<string, string>>({});

/**
 * Per-slot save state for the cortex view. Keyed by
 * `SlotRecommendation.slot_id`. Drives the SaveSlotCard's lifecycle
 * badge + button label per row.
 */
let slotSaveStates = $state<Record<string, "ready" | "saving" | "saved" | "error">>({});
let slotSaveErrors = $state<Record<string, string>>({});

/**
 * Translation table — kernel `slot_id` → layman card copy. Foundation
 * baseline today (SigLIP HD / Harrier 0.6B / Nemotron 7.6B); extends
 * naturally as the kernel adds slots. Anything missing from this map
 * falls through with the kernel slot_id rendered as the title, which
 * is visible enough to surface the gap during dev review.
 */
/**
 * Anatomy-only translation table — kernel `slot_id` → wizard tile's
 * **anatomy** identity (icon, accent color, role copy). Strictly
 * frontend-owned because anatomy ↔ slot mapping is a UI-side design
 * decision; the kernel doesn't know what an "Eye" is.
 *
 * The model NAME + model TAGLINE are NOT in this table — they live
 * on each [`SlotRecommendation`] (`display_name`, `display_tagline`)
 * so the preset author owns them in
 * `kernel/model-loader/config/presets.default.toml`. Tier-swapping a
 * model in the preset immediately reflects in the wizard tile, no
 * frontend edit. This matches the agnostic / format-driven recommender
 * pattern the kernel already uses for HF file picks.
 *
 * Slot ids MUST match `kernel/model-loader/config/slots.default.toml`
 * verbatim. `accentVar` must reference a generated token from
 * `interfaces/desktop/src/lib/design/generated/token-manifest.json`
 * (the real names carry `-main` / `-fill` / `-glow` suffixes; cards
 * point at `-main` because the surface gradient mixes the main hue).
 */
const SLOT_LAYMAN: Record<
	string,
	{
		purpose: string;
		tagline: string;
		iconName: "Eye" | "Ear" | "Mic" | "Sparkles" | "BrainCircuit";
		accentVar: string;
		aboutHref?: string;
	}
> = {
	"vision.embedder": {
		purpose: "Eyes · what Clyffy sees",
		tagline: "Encodes screenshots and uploads so Clyffy can reason about images.",
		iconName: "Eye",
		accentVar: "--accent-cyan-main",
	},
	"voice.stt": {
		purpose: "Ears · what Clyffy hears",
		tagline: "Listens to your microphone and turns speech into text.",
		iconName: "Ear",
		accentVar: "--accent-purple-main",
	},
	"voice.tts": {
		purpose: "Mouth · how Clyffy speaks",
		tagline: "Turns Clyffy's replies into natural-sounding speech.",
		iconName: "Mic",
		accentVar: "--accent-hotpink-main",
	},
	"minion.shared": {
		purpose: "Sparkles · Clyffy's quick mind",
		tagline: "Pre-sorts, ranks, and codes everything before the long-think wakes.",
		iconName: "Sparkles",
		accentVar: "--accent-teal-main",
	},
	"chat.brain": {
		purpose: "Brain · the long-think reasoner",
		tagline: "Handles the heavy reasoning once the quick mind has set the table.",
		iconName: "BrainCircuit",
		accentVar: "--accent-blue-main",
	},
};

/**
 * Derive a customer-facing model name from a kernel recommendation.
 * Preset author's `display_name` wins; absent, falls back to a clean
 * derivation of the HF repo id last segment (drops `-GGUF`,
 * `-Instruct`, version-and-quant suffixes). Never throws — worst case
 * returns the raw `model_repo_id` which is still recognizable.
 */
function deriveModelName(rec: SlotRecommendation): string {
	if (rec.display_name && rec.display_name.length > 0) return rec.display_name;
	const lastSeg = rec.model_repo_id.split("/").pop() ?? rec.model_repo_id;
	return lastSeg
		.replace(/-GGUF$/i, "")
		.replace(/-Instruct(-\d+)?$/i, "")
		.replace(/-v\d+(\.\d+)*$/i, "")
		.replace(/-Base$/i, "")
		.replace(/-/g, " ");
}

/**
 * Derive a one-line layman tagline. Preset author's `display_tagline`
 * wins; absent, falls back to a format-driven sentence
 * ("Runs through llama.cpp." for `.gguf`, "Through Candle." for
 * `.safetensors`, etc.) so the customer always sees engine context.
 */
function deriveModelTagline(rec: SlotRecommendation): string {
	if (rec.display_tagline && rec.display_tagline.length > 0) return rec.display_tagline;
	const fn = rec.model_filename.toLowerCase();
	if (fn.endsWith(".gguf")) return "Runs through llama.cpp.";
	if (fn.endsWith(".safetensors") || fn.endsWith(".safetensors.index.json")) {
		return "Runs through the matching native backend.";
	}
	if (fn.endsWith(".onnx") || fn.endsWith(".bin")) return "Runs through Sherpa / ONNX.";
	return "";
}

function formatSizeHint(mb: number): string {
	if (mb >= 1024) return `~${(mb / 1024).toFixed(1)} GB`;
	return `~${mb} MB`;
}

const slotSaveEntries = $derived<SlotSaveEntryProps[]>(
	recommendations.flatMap((rec) => {
		const layman = SLOT_LAYMAN[rec.slot_id];
		if (!layman) return [];
		const state = slotSaveStates[rec.slot_id] ?? "ready";
		return [
			{
				kernelSlotId: rec.slot_id,
				purpose: layman.purpose,
				tagline: layman.tagline,
				// Model name + tagline come from the kernel recommendation
				// (preset author owns them via `display_name` /
				// `display_tagline` in `presets.default.toml`); never
				// hardcoded in this UI layer. See deriveModelName /
				// deriveModelTagline for the fallback behavior.
				modelName: deriveModelName(rec),
				modelTagline: deriveModelTagline(rec),
				sizeHint: formatSizeHint(rec.model_size_mb),
				tierLabel: rec.already_downloaded ? "Already on disk" : "Recommended for this machine",
				iconName: layman.iconName,
				accentVar: layman.accentVar,
				aboutHref: layman.aboutHref,
				state,
				errorText: slotSaveErrors[rec.slot_id],
			},
		];
	}),
);

async function saveOneSlot(slotId: string): Promise<void> {
	const rec = recommendations.find((r) => r.slot_id === slotId);
	if (!rec) return;
	slotSaveStates = { ...slotSaveStates, [slotId]: "saving" };
	slotSaveErrors = { ...slotSaveErrors, [slotId]: "" };
	const ir = await installToSlot(rec.model_repo_id, rec.model_filename, rec.slot_id);
	if (ir.status === "ok") {
		dispatchedInstallIds = [...dispatchedInstallIds, ir.data];
		slotSaveStates = { ...slotSaveStates, [slotId]: "saved" };
	} else {
		slotSaveStates = { ...slotSaveStates, [slotId]: "error" };
		slotSaveErrors = { ...slotSaveErrors, [slotId]: String(ir.error) };
	}
}

async function saveAllSlots(): Promise<void> {
	busy = true;
	try {
		const unsaved = slotSaveEntries.filter((e) => e.state !== "saved");
		await Promise.all(unsaved.map((e) => saveOneSlot(e.kernelSlotId)));
	} finally {
		busy = false;
	}
}

$effect(() => {
	if (!wizardState.isOpen) return;
	void loadCopy();
});

/**
 * Load recommendations the first time the customer reaches the
 * cortex view (so each anatomy tile can render with real model
 * metadata). The autoConfigure call here POPULATES recommendations
 * without firing installs — the installs only run when the customer
 * clicks Apply on a tile. Compare with applyAutoConfig() (preset
 * view's "Install all") which both populates AND dispatches.
 */
$effect(() => {
	if (wizardState.view !== "cortex") return;
	if (recommendations.length > 0) return;
	void loadRecommendations();
});

async function loadRecommendations(): Promise<void> {
	busy = true;
	try {
		const r = await autoConfigure();
		if (r.status === "error") {
			copyError = `Couldn't compute recommendations: ${r.error}`;
			return;
		}
		try {
			const payload = JSON.parse(r.data) as AutoConfigPayload;
			recommendations = payload.recommendations;
		} catch (e) {
			copyError = `Couldn't parse auto-config response: ${(e as Error).message}`;
		}
	} finally {
		busy = false;
	}
}

$effect(() => {
	if (!wizardState.isOpen) return;
	return hardwareState.subscribe("SetupWizardOverlay");
});

async function loadCopy() {
	const [copyR, tierR] = await Promise.all([getWizardCopy(), getTierDisplay()]);
	if (copyR.status === "ok") copy = copyR.data;
	else copyError = String(copyR.error);
	if (tierR.status === "ok") tierDisplay = tierR.data;
}

/**
 * Kick off the kernel-side auto-config + install chain. Per slot:
 * download → scan → assign → load. Already-downloaded models pass
 * through the chain with the download step as a HF cache hit.
 */
async function applyAutoConfig() {
	if (!tierDisplay) return;
	busy = true;
	dispatchErrors = {};
	dispatchedInstallIds = [];

	try {
		const r = await autoConfigure();
		if (r.status === "error") {
			copyError = `Couldn't compute recommendations: ${r.error}`;
			return;
		}

		let payload: AutoConfigPayload;
		try {
			payload = JSON.parse(r.data) as AutoConfigPayload;
		} catch (e) {
			copyError = `Couldn't parse auto-config response: ${(e as Error).message}`;
			return;
		}

		recommendations = payload.recommendations;
		wizardState.goTo("installing");

		await Promise.all(
			recommendations.map(async (rec) => {
				const ir = await installToSlot(rec.model_repo_id, rec.model_filename, rec.slot_id);
				if (ir.status === "ok") {
					dispatchedInstallIds = [...dispatchedInstallIds, ir.data];
				} else {
					dispatchErrors = {
						...dispatchErrors,
						[rec.slot_id]: String(ir.error),
					};
				}
			}),
		);
	} finally {
		busy = false;
	}
}

const dispatchedInstalls = $derived(
	installState.list
		.filter((i) => dispatchedInstallIds.includes(i.installId))
		.map((i) => ({
			installId: i.installId,
			slotId: i.slotId,
			status: i.status,
			error: i.error,
		})),
);
const installsRunning = $derived(dispatchedInstalls.filter((i) => i.status === "running").length);
const installsComplete = $derived(dispatchedInstalls.filter((i) => i.status === "complete").length);
const installsFailed = $derived(dispatchedInstalls.filter((i) => i.status === "failed").length);
const installsTotal = $derived(recommendations.length);
const installsCachedSkippedDownload = $derived(
	recommendations.filter((r) => r.already_downloaded).length,
);

// Auto-advance: every dispatched install has terminated.
$effect(() => {
	if (wizardState.view !== "installing") return;
	if (installsTotal === 0) return;
	if (dispatchedInstallIds.length < installsTotal - Object.keys(dispatchErrors).length) return;
	if (installsRunning > 0) return;
	if (installsComplete + installsFailed === dispatchedInstallIds.length) {
		wizardState.goTo("complete");
	}
});

async function finish() {
	busy = true;
	try {
		await wizardState.finish();
	} finally {
		busy = false;
	}
}

/**
 * Mark setup complete + route to the Slot Orchestrator devtool.
 * Users who already have GGUFs on disk skip the download chain
 * entirely — Pick-local + Clear-assignment over there already work.
 */
async function skipToSlotOrchestrator() {
	busy = true;
	try {
		await wizardState.finish();
		await goto("/devtools/runtimes/orchestrator/slots");
	} catch (e) {
		copyError = `Couldn't skip wizard: ${(e as Error).message}`;
	} finally {
		busy = false;
	}
}

const callbacks: WizardCallbacks = {
	onNext: () => wizardState.next(),
	onBack: () => wizardState.back(),
	onSkip: skipToSlotOrchestrator,
	onApplyAutoConfig: applyAutoConfig,
	onFinish: finish,
};
</script>

{#if wizardState.isOpen}
	{#if copyError}
		<!--
			Dispatcher-level error overlay — view files don't get to
			render until copy loads (Layer 2 "no hardcoded English"
			contract). This banner is the one exception.
		-->
		<div class="dispatcher-error" role="alert">
			Couldn't load wizard copy: {copyError}
		</div>
	{/if}

	{#if wizardState.view === "welcome"}
		<WelcomeView copy={copy?.greeting ?? null} {busy} {callbacks} />
	{:else if wizardState.view === "hardware"}
		<HardwareView
			copy={copy?.hardware ?? null}
			tier={tierDisplay}
			gpuName={hardwareState.gpuName}
			hasGpu={hardwareState.hasGpu}
			vramTotalMb={hardwareState.vramTotalMb}
			{busy}
			{callbacks}
		/>
	{:else if wizardState.view === "preset"}
		<PresetView copy={copy?.profile ?? null} {busy} {callbacks} />
	{:else if wizardState.view === "cortex"}
		<CortexView
			title="Clyffy's cortex — five pieces, one mind"
			subtitle="Each tile maps to a sense or thought layer. Hit Apply on the ones you want now — every slot is pre-selected, so you can just click through."
			slotSaves={slotSaveEntries}
			{busy}
			onApplySlot={saveOneSlot}
			onApplyAll={saveAllSlots}
			{callbacks}
		/>
	{:else if wizardState.view === "installing"}
		<InstallingView
			copy={copy?.downloads ?? null}
			{recommendations}
			{dispatchedInstalls}
			{dispatchErrors}
			{installsRunning}
			{installsComplete}
			{installsFailed}
			{installsTotal}
			{installsCachedSkippedDownload}
		/>
	{:else if wizardState.view === "clyffy-collab"}
		<ClyffyCollabView {busy} {callbacks} />
	{:else if wizardState.view === "complete"}
		<CompleteView copy={copy?.completion ?? null} {busy} {callbacks} />
	{/if}

	<!--
		Per-phase knowledge chip — pinned bottom-right, doesn't
		compete with the phase content. `{#key view}` re-mounts the
		deck each phase transition so the context frame reflects
		"wizard:<phase>" — kernel selector then biases toward
		entries whose `tool` tag matches `wizard` and (when the
		catalog grows scope tags) the active phase. Ambient rotation
		every 45s so a user sitting on a phase sees variety.
	-->
	{#key wizardState.view}
		<div class="dispatcher-knowledge-chip">
			<KnowledgeDeck
				context={{
					id: `wizard-overlay-${wizardState.view}`,
					tool: "wizard",
					scope: `wizard:${wizardState.view}`,
					preferred: "dyk",
				}}
				refreshIntervalMs={45000}
			/>
		</div>
	{/key}

	{#if MP4_BACKDROP_URL}
		<!--
			Supabase-hosted MP4 backdrop. The video element lives at the
			document root so it draws once and persists across view
			switches — DOM-cheap, no decode restart on every navigation.
			z-index sits below the OverlayShell card (z 9000) and above
			the body bg so the grid pattern still reads through.
		-->
		<video
			class="dispatcher-backdrop"
			src={MP4_BACKDROP_URL}
			autoplay
			loop
			muted
			playsinline
			preload="auto"
			aria-hidden="true"
		></video>
	{/if}
{/if}

<style>
	.dispatcher-error {
		position: fixed;
		top: 1rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 9100;
		padding: 0.5rem 1rem;
		background: var(--surface-inset);
		border: 0.0625rem solid var(--accent-danger-main);
		border-radius: 0.375rem;
		color: var(--accent-danger-main);
		font-size: 0.8125rem;
	}

	.dispatcher-backdrop {
		position: fixed;
		inset: 0;
		z-index: 8999;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.35;
		pointer-events: none;
	}

	/* Per-phase knowledge chip. Pinned bottom-right above the
	   backdrop (z 8999) but below the dispatcher-error banner
	   (z 9100). The KnowledgeDeck inside has its own ColdLight
	   surface — this slot just owns positioning. */
	.dispatcher-knowledge-chip {
		position: fixed;
		bottom: clamp(0.75rem, 1.5vw, 1.25rem);
		right: clamp(0.75rem, 1.5vw, 1.25rem);
		z-index: 9050;
		max-width: clamp(18rem, 30vw, 26rem);
		pointer-events: auto;
	}

	@media (prefers-reduced-motion: reduce) {
		.dispatcher-backdrop {
			display: none;
		}
	}
</style>
