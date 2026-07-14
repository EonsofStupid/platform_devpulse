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
import { BackgroundScene } from "$lib/design/components/background-scene/index.js";
import { clyffyConnection } from "$lib/domains/clyffy/index.js";
import { installState } from "$lib/sys/activity-hud/install.state.svelte.js";
import {
	autoConfigure,
	getTierDisplay,
	getWizardCopy,
	installToSlot,
} from "$lib/sys/bindings/models/index.js";
import type { SlotStatus, TierDisplay, WizardCopy } from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { hardwareState } from "../../data-access/hardware.state.svelte.js";
import CapabilityView from "./feature/views/CapabilityView.svelte";
import ClyffyCollabView from "./feature/views/ClyffyCollabView.svelte";
import CompleteView from "./feature/views/CompleteView.svelte";
import EndpointView from "./feature/views/EndpointView.svelte";
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
 * Translation table — engine `slot_id` → layman card copy. Foundation
 * baseline today (SigLIP HD / Harrier 0.6B / Nemotron 7.6B); extends
 * naturally as the engine adds slots. Anything missing from this map
 * falls through with the engine slot_id rendered as the title, which
 * is visible enough to surface the gap during dev review.
 */
/**
 * Anatomy-only translation table — engine `slot_id` → wizard tile's
 * **anatomy** identity (icon, accent color, role copy). Strictly
 * frontend-owned because anatomy ↔ slot mapping is a UI-side design
 * decision; the engine doesn't know what an "Eye" is.
 *
 * The model NAME + model TAGLINE are NOT in this table — they live
 * on each [`SlotRecommendation`] (`display_name`, `display_tagline`)
 * so the preset author owns them in
 * the engine's `config/presets.default.toml`. Tier-swapping a
 * model in the preset immediately reflects in the wizard tile, no
 * frontend edit. This matches the agnostic / format-driven recommender
 * pattern the engine already uses for HF file picks.
 *
 * Slot ids MUST match the engine's `config/slots.default.toml`
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
		/**
		 * How this tile finds itself in the connected endpoint's
		 * capability (`clyffyConnection.slots`). `slotId` matches the
		 * wire contract's own slot vocabulary verbatim (clyffy / minion /
		 * voice / rag_embed); `role` matches the advertised role when the
		 * concept is a capability rather than a slot (vision). Both tiles
		 * of a shared slot (ears + mouth → voice) light from the same
		 * advertised entry — one voice slot serves both, honestly.
		 */
		wire: { slotId?: string; role?: string };
	}
> = {
	"vision.embedder": {
		purpose: "Eyes · what Clyffy sees",
		tagline: "Encodes screenshots and uploads so Clyffy can reason about images.",
		iconName: "Eye",
		accentVar: "--accent-cyan-main",
		wire: { role: "vision" },
	},
	"voice.stt": {
		purpose: "Ears · what Clyffy hears",
		tagline: "Listens to your microphone and turns speech into text.",
		iconName: "Ear",
		accentVar: "--accent-purple-main",
		wire: { slotId: "voice" },
	},
	"voice.tts": {
		purpose: "Mouth · how Clyffy speaks",
		tagline: "Turns Clyffy's replies into natural-sounding speech.",
		iconName: "Mic",
		accentVar: "--accent-hotpink-main",
		wire: { slotId: "voice" },
	},
	"rag.embedder": {
		purpose: "Sparkles · Clyffy's indexing brain",
		tagline:
			"Encodes + embeds every project file so retrieval finds the right chunks before the long-think wakes.",
		iconName: "Sparkles",
		accentVar: "--accent-teal-main",
		wire: { slotId: "rag_embed" },
	},
	"chat.brain": {
		purpose: "Brain · the long-think reasoner",
		tagline: "Handles the heavy reasoning once the indexing brain has set the table.",
		iconName: "BrainCircuit",
		accentVar: "--accent-blue-main",
		wire: { slotId: "clyffy" },
	},
};

/**
 * Derive a customer-facing model name from an engine recommendation.
 * Preset author's `display_name` wins; absent, falls back to a clean
 * derivation of the HF repo id last segment (drops `-GGUF`,
 * `-Instruct`, version-and-quant suffixes). Never throws — worst case
 * returns the raw `model_repo_id` which is still recognizable.
 */
function deriveModelName(rec: SlotRecommendation): string {
	if (rec.display_name && rec.display_name.length > 0) return rec.display_name;
	return deriveNameFromRepoId(rec.model_repo_id);
}

/**
 * Clean a customer-facing label out of an HF-style `org/repo` id.
 * Shared by the legacy recommendation path and the wire capability
 * path (`LoadedSlotSummary.model_id` is the same id shape).
 */
function deriveNameFromRepoId(repoId: string): string {
	const lastSeg = repoId.split("/").pop() ?? repoId;
	return lastSeg
		.replace(/-GGUF$/i, "")
		.replace(/-Instruct(-\d+)?$/i, "")
		.replace(/-v\d+(\.\d+)*$/i, "")
		.replace(/-Base$/i, "")
		.replace(/-/g, " ");
}

/**
 * Map the wire's advertised `SlotStatus` onto the tile lifecycle the
 * AnatomyTile already renders (Connect / Connecting… / Live / Retry).
 * Pure translation — the wire computed the truth, the tile shows it.
 */
function tileStateFromWire(status: SlotStatus): "ready" | "saving" | "saved" | "error" {
	if (status === "ready") return "saved";
	if (status === "loading") return "saving";
	if (status === "empty") return "ready";
	return "error"; // { failed: string }
}

function wireFailureText(status: SlotStatus): string | undefined {
	return typeof status === "object" && "failed" in status ? status.failed : undefined;
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

/**
 * Preconfigured anatomy entries — the wizard ALWAYS shows the five
 * tiles (Brain / Sparkles / Eyes / Ears / Mouth) regardless of
 * whether a backend is reachable. Model name, tagline, and size are
 * intentionally absent here — they populate only when the configured
 * endpoint (local or networked GB10 at `clyffy.local`) reports its
 * loaded models via the capability response. Per
 * [[devpulse-preconfigured-capabilities]]: the wizard does NOT
 * install models; it shows what the backend is serving.
 *
 * Recommendations from `autoConfigure()` are kept as fallback model
 * metadata only — if the local-inference-legacy path is enabled and
 * has a recommendation for a slot, the tile populates with it. Under
 * the GB10-first architecture this array is normally empty.
 */
const slotSaveEntries = $derived<SlotSaveEntryProps[]>(
	(Object.keys(SLOT_LAYMAN) as Array<keyof typeof SLOT_LAYMAN>).map((slotId) => {
		const layman = SLOT_LAYMAN[slotId];
		// PRIMARY source: the connected endpoint's capability. The tile
		// matches itself via the wire vocabulary (`layman.wire`) and
		// renders exactly what Clyffy advertised — model, status, error.
		const wireSlot = clyffyConnection.slots.find(
			(s) =>
				(layman.wire.slotId === undefined || s.slot_id === layman.wire.slotId) &&
				(layman.wire.role === undefined || s.role === layman.wire.role),
		);
		if (wireSlot) {
			const state = tileStateFromWire(wireSlot.status);
			return {
				kernelSlotId: slotId,
				purpose: layman.purpose,
				tagline: layman.tagline,
				modelName: deriveNameFromRepoId(wireSlot.model_id),
				// Wire capability carries no tagline/size — the tile's own
				// purpose line already explains the role in layman terms.
				modelTagline: undefined,
				sizeHint: undefined,
				tierLabel: state === "saved" ? "Loaded" : undefined,
				iconName: layman.iconName,
				accentVar: layman.accentVar,
				aboutHref: layman.aboutHref,
				state,
				errorText: wireFailureText(wireSlot.status),
			};
		}
		// FALLBACK: legacy local recommendation metadata (display only).
		// modelName / modelTagline / sizeHint / tierLabel intentionally
		// undefined unless a recommendation exists. AnatomyTile renders
		// the "awaiting-backend" framing when these are absent.
		const rec = recommendations.find((r) => r.slot_id === slotId);
		return {
			kernelSlotId: slotId,
			purpose: layman.purpose,
			tagline: layman.tagline,
			modelName: rec ? deriveModelName(rec) : undefined,
			modelTagline: rec ? deriveModelTagline(rec) : undefined,
			sizeHint: rec ? formatSizeHint(rec.model_size_mb) : undefined,
			tierLabel: rec
				? rec.already_downloaded
					? "Loaded"
					: "Recommended for this machine"
				: undefined,
			iconName: layman.iconName,
			accentVar: layman.accentVar,
			aboutHref: layman.aboutHref,
			state: "ready",
			errorText: undefined,
		};
	}),
);

/**
 * Capability tile action — the tile CTA reads "Connect / Connecting… /
 * Live / Retry", and its honest target is the endpoint step: the
 * tiles LIGHT UP from the connected endpoint's capability, they don't
 * install anything (the old `saveOneSlot` → `installToSlot` chain is
 * gone from this path; local model *management* lives in the Model
 * Downloader overlay + Slot Orchestrator devtool). Ready/Retry tiles
 * route to the address entry; Live tiles have nothing to do.
 */
function goToEndpoint(): void {
	wizardState.goTo("endpoint");
}

$effect(() => {
	if (!wizardState.isOpen) return;
	void loadCopy();
});

// Live wire capability — the PRIMARY source for the capability tiles.
$effect(() => {
	if (!wizardState.isOpen) return;
	return clyffyConnection.subscribe();
});

/**
 * The step-2 view used to call `autoConfigure()` here to pre-fill local
 * hardware-based recommendations. Under the preconfigured-capabilities
 * lock ([[devpulse-preconfigured-capabilities]]) the tiles render
 * anatomy-only by default and populate from the configured backend's
 * capability response — NOT from local hardware introspection. The
 * `loadRecommendations` helper is gone; recommendations stay empty
 * until a future GB10 client populates them from `/v1/capability`.
 */

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
 * Kick off the engine-side auto-config + install chain. Per slot:
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
				const ir = await installToSlot(rec.model_repo_id, rec.model_filename, rec.slot_id, null);
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

/**
 * Endpoint-step Skip — "not now" is a real decision: persist it
 * (`skip_clyffy_setup`, so the wizard never force-opens again) and load
 * the app standalone. Distinct from `skipToSlotOrchestrator`, which is
 * the models-flow skip. Re-entry stays available from the status
 * surfaces (the standalone chip in the top bar).
 */
async function skipConnect(): Promise<void> {
	busy = true;
	try {
		const r = await commands.skipClyffySetup();
		if (r.status === "error") {
			copyError = `Couldn't save your choice: ${r.error}`;
			return;
		}
		wizardState.close();
	} finally {
		busy = false;
	}
}

/**
 * Capability "Continue" — the connect flow is TWO steps (endpoint →
 * capability, the shells label them "step 1 of 2 / 2 of 2"). With no
 * local installs dispatched (installsTotal === 0, the connect-first
 * path), advancing into `installing` strands the user on an empty view
 * with no footer — the auto-advance effect early-returns at zero
 * installs (04 plan, B1). Finish the flow at `complete` instead; the
 * legacy preset→install path (installsTotal > 0) keeps its original
 * walk through `installing`.
 */
function capabilityContinue(): void {
	if (installsTotal === 0) {
		wizardState.goTo("complete");
		return;
	}
	wizardState.next();
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
	{:else if wizardState.view === "endpoint"}
		<EndpointView
			copy={copy?.connect ?? null}
			{busy}
			callbacks={{ ...callbacks, onSkip: skipConnect }}
		/>
	{:else if wizardState.view === "capability"}
		<CapabilityView
			copy={copy?.capability ?? null}
			connected={clyffyConnection.state.state === "connected"}
			slotSaves={slotSaveEntries}
			{busy}
			onApplySlot={goToEndpoint}
			callbacks={{ ...callbacks, onNext: capabilityContinue }}
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
		"wizard:<phase>" — the engine's selector then biases toward
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

	<!--
		Animated backdrop — the design library's VARIATION system
		(design/components/background-scene), operator requirement #1.
		Layer 1: the bundled MP4 loop (loop-video — same asset as before,
		now owned by the library component). Layer 2: the frost
		void-breathe variation breathing blue over it. Both layers are
		reduced-motion aware inside BackgroundScene (WCAG 2.3.3). W2
		later lands multi-source AV1/WebM inside the component — this
		file won't change. Draws once at the document root, below the
		shell (z 9000), above the body bg.
	-->
	<!-- ONE scene layer. The void-breathe overlay died 2026-07-14: its
	     animated hue-rotate filter over a full-viewport video forced a
	     repaint every frame in WebView2 — the freeze the operator hit.
	     The MP4 loop carries the motion; color variation returns via
	     W2's optimized re-encode, not via runtime filters. -->
	<div class="dispatcher-backdrop" aria-hidden="true">
		<BackgroundScene variation="loop-video" intensity="strong" motion="on" />
	</div>
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
		pointer-events: none;
		/* Opaque void floor — the scene layers above are translucent
		   (0.6 / 0.4); without this floor the app UI underneath the
		   wizard ghosts through the animation. Found on full re-read
		   2026-07-14 (check-your-work pass). */
		background: var(--color-void-base);
	}

	/* End-of-cascade PRESENCE overwrites (operator law 2026-07-14:
	   scoped final overwrites binding/tuning universal pieces are
	   sanctioned). BackgroundScene's intensity scale tops out at 0.18
	   opacity — ambient-dashboard values that render the wizard's MP4
	   invisible over the ~L0.08 void (the black-wizard value bug,
	   backdrop edition). The wizard backdrop is ATMOSPHERE, not
	   ambience: the loop must clearly read. */
	.dispatcher-backdrop :global(.bg-scene.bg-loop-video) {
		opacity: 0.6;
	}
	/* The library's bg-video fades its bottom 40% out — right for a
	   page header, wrong for a full-viewport wizard backdrop. */
	.dispatcher-backdrop :global(.bg-video) {
		mask-image: none;
		-webkit-mask-image: none;
	}

	/* Per-phase knowledge chip. Pinned bottom-right above the
	   backdrop (z 8999) but BELOW the wizard shell (z 9000): the
	   shell's footer CTAs live in the same corner, and the chip must
	   never paint over or intercept a Connect/Continue button. Where
	   the two overlap the card wins; the chip stays visible outside
	   the card's footprint. The KnowledgeDeck inside has its own
	   ColdLight surface — this slot just owns positioning. */
	.dispatcher-knowledge-chip {
		position: fixed;
		bottom: clamp(0.75rem, 1.5vw, 1.25rem);
		right: clamp(0.75rem, 1.5vw, 1.25rem);
		z-index: 8990;
		max-width: clamp(18rem, 30vw, 26rem);
		pointer-events: auto;
	}

	@media (prefers-reduced-motion: reduce) {
		.dispatcher-backdrop {
			display: none;
		}
	}
</style>
