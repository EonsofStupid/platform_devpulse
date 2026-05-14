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
	5. Wires the optional Supabase MP4 backdrop snippet — set
	   `MP4_BACKDROP_URL` to a Supabase Storage public-bucket URL
	   (pre-encoded H.264 720p loop, `cacheControl: "public,
	   max-age=31536000, immutable"` on upload) and the
	   `OverlayShell.backdrop` slot renders it behind the card.
	6. Routes `Skip → assign manually` to the Slot Orchestrator
	   devtool (where Pick-local + Clear-assignment already work).

	The active overlay is provided BY THE VIEW FILE itself
	(each view wraps `OverlayShell` internally) — the dispatcher
	only switches which view file mounts.
-->
<script lang="ts">
import { goto } from "$app/navigation";
import { installState } from "$lib/sys/activity-hud/install.state.svelte.js";
import {
	autoConfigure,
	getTierDisplay,
	getWizardCopy,
	installToSlot,
} from "$lib/sys/bindings/models/index.js";
import type { TierDisplay, WizardCopy } from "$lib/sys/generated/bindings.js";
import { hardwareState } from "../../data-access/hardware.state.svelte.js";
import CompleteView from "./feature/views/CompleteView.svelte";
import HardwareView from "./feature/views/HardwareView.svelte";
import InstallingView from "./feature/views/InstallingView.svelte";
import PresetView from "./feature/views/PresetView.svelte";
import WelcomeView from "./feature/views/WelcomeView.svelte";
import type { SlotRecommendation, WizardCallbacks } from "./util/wizard.types.js";
import { wizardState } from "./wizard.state.svelte.js";

/**
 * Animated MP4 backdrop for the wizard. Currently points at the
 * bundled asset that ships with the desktop binary — Tauri serves
 * `static/` at the app root so this URL resolves locally without a
 * network round-trip.
 *
 * To move to Supabase later (offload binary size from the installer,
 * pick up CDN edge delivery + range-request streaming):
 *
 * 1. Pre-encode the MP4 once — H.264 (or VP9) 720p, 5–15 s seamless
 *    loop, target 2–5 MB so first paint isn't blocked.
 * 2. Upload to a public Supabase Storage bucket with
 *    `cacheControl: "public, max-age=31536000, immutable"` so the
 *    browser caches it forever after one fetch.
 * 3. Replace this constant with the Supabase public-bucket URL.
 *
 * Supabase video assets are served as-is — there's no on-the-fly
 * transform — so "optimization" means pre-encode + CDN cache, not
 * server transcode.
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

$effect(() => {
	if (!wizardState.isOpen) return;
	void loadCopy();
});

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
	{:else if wizardState.view === "complete"}
		<CompleteView copy={copy?.completion ?? null} {busy} {callbacks} />
	{/if}

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

	@media (prefers-reduced-motion: reduce) {
		.dispatcher-backdrop {
			display: none;
		}
	}
</style>
