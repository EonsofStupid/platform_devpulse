<!--
	@file SetupWizardOverlay.svelte
	@module @devpulse/domains/app/models/feature/setup-wizard

	Layman-facing onboarding overlay. Renders five views in sequence:

	  1. welcome     — greeting + name capture
	  2. hardware    — show detected GPU/VRAM + tier reading
	  3. preset      — pick a preset (auto-recommended for tier)
	  4. installing  — live download / install progress per slot
	  5. complete    — handoff to the dashboard, mark setup complete

	Reads kernel-shaped copy via `getWizardCopy` (in
	`kernel/model-loader/src/wizard/copy.rs`) so wording stays in one
	place. Reads `getTierDisplay` for the hardware-tier label rendered
	on the hardware view. View transitions go through `wizardState`.

	NOT auto-mounted — the layout decides when to show. `BootOverlay`
	opens this overlay (`wizardState.open()`) once the platform reaches
	ready AND `wizardState.firstRun === true`.
-->
<script lang="ts">
import { Brain, ChevronLeft, ChevronRight, Cpu, MonitorCog, Sparkles } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { installState } from "$lib/sys/activity-hud/install.state.svelte.js";
import {
	autoConfigure,
	getTierDisplay,
	getWizardCopy,
	installToSlot,
} from "$lib/sys/bindings/models/index.js";
import type { TierDisplay, WizardCopy } from "$lib/sys/generated/bindings.js";
import { hardwareState } from "../../data-access/hardware.state.svelte.js";
import { formatMb } from "../../util/format.js";
import { getSlotLabel } from "../../util/slots.js";
import { type WizardView, wizardState } from "./wizard.state.svelte.js";

/**
 * One row of the kernel's `AutoConfig.recommendations` JSON. Mirrors
 * `SlotRecommendation` in `kernel/model-loader/src/hardware/auto_config.rs`.
 * `already_downloaded` lets us short-circuit the "Installing 0 of 0"
 * confusion — when every recommended file is on disk already, the
 * install chain still runs (it just goes download→scan→assign→load
 * with the download a no-op via HF cache) but the UI shows the right
 * count instead of pretending nothing's queued.
 */
interface SlotRecommendation {
	slot_id: string;
	model_repo_id: string;
	model_filename: string;
	model_size_mb: number;
	vram_estimate_mb: number;
	already_downloaded: boolean;
	device: string;
}

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

/**
 * Recommendations the kernel returned for this tier. Populated by
 * `applyAutoConfig` and used to drive the installing view's totals
 * (so it never says "0 of 0" when a tier returns 4 models).
 */
let recommendations = $state<SlotRecommendation[]>([]);
/** Install IDs returned by `installToSlot`, in dispatch order. */
let dispatchedInstallIds = $state<string[]>([]);
/** Errors per-slot from kicking off the install (network blip, slot mismatch, etc). */
let dispatchErrors = $state<Record<string, string>>({});

$effect(() => {
	if (!wizardState.isOpen) return;
	void loadCopy();
});

// Hardware view: subscribe to live metrics so VRAM bar reflects reality.
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
 * Kick off the auto-config flow:
 *
 *   1. Ask the kernel for hardware-tier-aware recommendations
 *      (`autoConfigure` returns a JSON `AutoConfig`).
 *   2. Parse + cache the recommendations so the installing view can
 *      render proper totals (one row per recommended slot).
 *   3. For each recommendation, fire `installToSlot` — the kernel's
 *      atomic chain handles HF cache, download (incl. shards via the
 *      hub's sibling-files API), scan, assign, and load. Already-on-disk
 *      models still go through the chain but the download step is a
 *      cache hit (no network).
 *   4. Navigate to the installing view; live progress comes from
 *      `installState` (Tauri events `model:install-{started,complete,failed}`).
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

		// Dispatch every install in parallel — the kernel serializes
		// internally via its config write-lock, so we can fire-and-forget.
		// Errors here are dispatch-level (slot doesn't exist, etc.) — the
		// chain's own runtime errors flow through `installState` via
		// `model:install-failed`.
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

/**
 * Install state derived against the dispatched IDs ONLY — so a stale
 * install from a prior wizard run can't pollute the totals.
 */
const dispatchedInstalls = $derived(
	installState.list.filter((i) => dispatchedInstallIds.includes(i.installId)),
);
const installsRunning = $derived(dispatchedInstalls.filter((i) => i.status === "running").length);
const installsComplete = $derived(dispatchedInstalls.filter((i) => i.status === "complete").length);
const installsFailed = $derived(dispatchedInstalls.filter((i) => i.status === "failed").length);
const installsTotal = $derived(recommendations.length);
const installsCachedSkippedDownload = $derived(
	recommendations.filter((r) => r.already_downloaded).length,
);

// Auto-advance from `installing` to `complete` once every dispatched
// install has terminated (either complete or failed). We wait until
// EVERY recommendation has dispatched (so the user sees the totals)
// AND every install is no longer running.
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

function viewIndex(v: WizardView): number {
	return ["welcome", "hardware", "preset", "installing", "complete"].indexOf(v);
}

const stepNumber = $derived(viewIndex(wizardState.view) + 1);
</script>

{#if wizardState.isOpen}
	<div class="wizard-root" role="dialog" aria-modal="true" aria-label="DevPulse setup">
		<div class="card">
			<header class="head">
				<Heading level={2} size="lg">
					{copy?.greeting?.title ?? "Welcome to DevPulse"}
				</Heading>
				<Text size="xs" color="muted">Step {stepNumber} of 5</Text>
			</header>

			{#if copyError}
				<Text size="sm" color="error">Couldn't load wizard copy: {copyError}</Text>
			{/if}

			<section class="body">
				{#if wizardState.view === "welcome"}
					<div class="row icon-row"><Sparkles size={32} /></div>
					<Text size="sm">
						{copy?.greeting?.subtitle ??
							"Let's pick the right local AI models for your hardware."}
					</Text>
				{:else if wizardState.view === "hardware"}
					<div class="row icon-row"><MonitorCog size={32} /></div>
					{#if tierDisplay}
						<Heading level={3} size="md">{tierDisplay.label}</Heading>
						<Text size="sm" color="secondary">{tierDisplay.description}</Text>
					{:else}
						<Spinner size="sm" />
					{/if}
					<div class="hw-card">
						<div class="hw-row">
							<Text size="xs" color="muted">GPU</Text>
							<Text size="xs">
								{hardwareState.gpuName ?? (hardwareState.hasGpu ? "Detecting…" : "None")}
							</Text>
						</div>
						{#if hardwareState.hasGpu}
							<div class="hw-row">
								<Text size="xs" color="muted">VRAM</Text>
								<Text size="xs">
									{hardwareState.vramTotalMb !== null ? formatMb(hardwareState.vramTotalMb) : "—"}
								</Text>
							</div>
						{/if}
					</div>
				{:else if wizardState.view === "preset"}
					<div class="row icon-row"><Brain size={32} /></div>
					<Heading level={3} size="md">
						{copy?.profile?.title ?? "Pick your preset"}
					</Heading>
					<Text size="sm" color="secondary">
						{copy?.profile?.subtitle ??
							"DevPulse will recommend models that fit your hardware tier. " +
								"Already-downloaded files are reused without re-downloading."}
					</Text>
					<!-- Local-browse escape hatch — owner already has files? Skip the
					     download, jump to the slot orchestrator's import flow. -->
					<div class="local-browse">
						<Text size="xs" color="muted">
							Already have models on disk? Skip the wizard and assign per slot
							in the Slot Orchestrator devtool.
						</Text>
					</div>
				{:else if wizardState.view === "installing"}
					<div class="row icon-row"><Cpu size={32} /></div>
					<Heading level={3} size="md">
						{copy?.downloads?.title ?? "Installing your models"}
					</Heading>
					<Text size="sm" color="secondary">
						{installsComplete + installsFailed} of {installsTotal}
						{#if installsCachedSkippedDownload > 0}
							· {installsCachedSkippedDownload} already on disk
							(no re-download)
						{/if}
						{#if installsFailed > 0}
							· {installsFailed} failed
						{/if}
					</Text>

					<!-- Per-slot progress list: one row per recommendation, live status pulled
					     from installState (which the kernel pumps via model:install-* events). -->
					<div class="install-list">
						{#each recommendations as rec (rec.slot_id)}
							{@const label = getSlotLabel(rec.slot_id)}
							{@const live = dispatchedInstalls.find((i) => i.slotId === rec.slot_id)}
							{@const dispatchErr = dispatchErrors[rec.slot_id]}
							<div class="install-row">
								<div class="install-info">
									<Text size="xs" weight="bold">
										{label?.name ?? rec.slot_id}
									</Text>
									<Text size="xs" color="muted">
										{rec.model_filename} · {formatMb(rec.model_size_mb)}
									</Text>
								</div>
								<div class="install-status">
									{#if dispatchErr}
										<Text size="xs" class="status-failed">
											couldn't dispatch: {dispatchErr}
										</Text>
									{:else if !live}
										<Spinner size="xs" />
										<Text size="xs" color="muted">queued…</Text>
									{:else if live.status === "running"}
										<Spinner size="xs" />
										<Text size="xs" color="muted">
											{rec.already_downloaded ? "loading…" : "downloading…"}
										</Text>
									{:else if live.status === "complete"}
										<Text size="xs" class="status-ok">ready</Text>
									{:else if live.status === "failed"}
										<Text size="xs" class="status-failed">
											{live.error ?? "failed"}
										</Text>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{:else if wizardState.view === "complete"}
					<div class="row icon-row success"><Sparkles size={32} /></div>
					<Heading level={3} size="md">
						{copy?.completion?.title ?? "You're all set"}
					</Heading>
					<Text size="sm" color="secondary">
						{copy?.completion?.subtitle ??
							"DevPulse is ready. Open the dashboard to start a project."}
					</Text>
				{/if}
			</section>

			<footer class="foot">
				{#if wizardState.view !== "welcome" && wizardState.view !== "complete"}
					<Button preset="button-ghost" size="sm" onclick={() => wizardState.back()}>
						<ChevronLeft size={14} /> Back
					</Button>
				{/if}
				<div class="flex-1"></div>
				{#if wizardState.view === "welcome"}
					<Button preset="button-primary" size="sm" onclick={() => wizardState.next()}>
						Get started <ChevronRight size={14} />
					</Button>
				{:else if wizardState.view === "hardware"}
					<Button preset="button-primary" size="sm" onclick={() => wizardState.next()}>
						Continue <ChevronRight size={14} />
					</Button>
				{:else if wizardState.view === "preset"}
					<Button
						preset="button-primary"
						size="sm"
						onclick={applyAutoConfig}
						disabled={busy}
					>
						{#if busy}<Spinner size="xs" />{/if}
						Install recommended models <ChevronRight size={14} />
					</Button>
				{:else if wizardState.view === "complete"}
					<Button preset="button-primary" size="sm" onclick={finish} disabled={busy}>
						{#if busy}<Spinner size="xs" />{/if}
						Finish
					</Button>
				{/if}
			</footer>
		</div>
	</div>
{/if}

<style>
	.wizard-root {
		position: fixed;
		inset: 0;
		z-index: 9000;
		display: flex;
		align-items: center;
		justify-content: center;
		background: oklch(0 0 0 / 0.55);
		backdrop-filter: blur(0.25rem);
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		min-width: 28rem;
		max-width: 36rem;
		background: var(--surface-raised);
		border: 0.0625rem solid var(--border-subtle);
		border-radius: 0.75rem;
		box-shadow: 0 1rem 3rem oklch(0 0 0 / 0.4);
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-height: 8rem;
	}
	.row.icon-row {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0.5rem 0;
		color: var(--accent-teal-main);
	}
	.row.icon-row.success {
		color: var(--signal-success);
	}
	.foot {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.flex-1 { flex: 1; }
	.hw-card {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.5rem 0.75rem;
		background: var(--surface-base, var(--surface-raised));
		border: 0.0625rem solid var(--border-subtle);
		border-radius: 0.375rem;
	}
	.hw-row {
		display: flex;
		justify-content: space-between;
	}
	.local-browse {
		padding: 0.625rem 0.75rem;
		background: var(--surface-base, var(--surface-raised));
		border: 0.0625rem dashed var(--border-subtle);
		border-radius: 0.375rem;
	}
	.install-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		max-height: 18rem;
		overflow-y: auto;
		margin-top: 0.5rem;
	}
	.install-row {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.625rem;
		background: var(--surface-base, var(--surface-raised));
		border: 0.0625rem solid var(--border-subtle);
		border-radius: 0.375rem;
	}
	.install-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}
	.install-status {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	:global(.status-ok)     { color: var(--signal-success); }
	:global(.status-failed) { color: var(--signal-error);   }
</style>
