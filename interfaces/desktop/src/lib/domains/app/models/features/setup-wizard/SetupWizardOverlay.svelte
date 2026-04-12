<!--
  @file SetupWizardOverlay — first-run wizard mounted inside the app shell.
  @domain models

  This component REPLACES the old (setup)/model-loader/+page.svelte route
  that used to live at its own route group with its own opaque shell. The
  wizard is now a component mounted in `layouts/app/Frame.svelte` as a
  sibling of `SwapOverlay` — same app chrome, same data-layout="app", no
  parallel route tree, no opaque background hiding the circuit backdrop.

  Lifecycle:
  - `wizardState.isOpen` controls visibility. `platformState.init()` sets
    it to `true` when first-run is detected, or the user invokes it
    manually.
  - `wizardState.close()` dismisses the overlay without navigating.
  - The underlying (app) view stays rendered the whole time — closing the
    overlay returns the user to exactly where they were.

  Rust SSOT for ALL copy. Frontend renders ColdLight components.
  WizardCopy fetched from get_wizard_copy command.
  Hardware tier detected via startHardwareScan + fetchRecommendations.
  Preset picker populated by list_presets command so the owner can
  override the auto-detected default.

  Defensive rendering: every error path lands on a visible state.
  Never a blank screen.
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { Cpu, HardDrive, KeyRound, Lock, Monitor, Sparkles, X, Zap } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import {
	fetchRecommendations,
	listAllPresets,
	selectPreset,
	startHardwareScan,
	TIER_TOKENS,
	type TierDisplay,
	type WizardCopy,
} from "$lib/domains/app/models/features/setup-wizard/index.js";
import { wizardState } from "$lib/domains/app/models/features/setup-wizard/wizard.runes.svelte.js";
import {
	type AutoConfig,
	formatMb,
	type HardwareTier,
	hardwareState,
} from "$lib/domains/app/models/index.js";
import type { SlotId } from "$lib/domains/app/models/types/models.types.js";
import { commands } from "$lib/sys/generated/bindings.js";
import ClyffyTooltip from "./components/ClyffyTooltip.svelte";
import HfTokenModal from "./components/HfTokenModal.svelte";
import type { RoleId } from "./components/RoleCard.svelte";
import RoleCardGrid from "./components/RoleCardGrid.svelte";
import type { DownloadTracker } from "./wizard.types.js";

type Phase = "welcome" | "scanning" | "detected" | "error";

let phase = $state<Phase>("welcome");
let scanError = $state<string | null>(null);
let copy = $state<WizardCopy | null>(null);
let copyError = $state<string | null>(null);
let tier = $state<TierDisplay | null>(null);
let presets = $state<AutoConfig[]>([]);
let presetsError = $state<string | null>(null);
let switchingTier = $state<string | null>(null);

// ── HF Token state (local to this overlay instance) ────────────
// The plaintext token is never stored in rune state or passed around the
// frontend — we only cache the has-token boolean so the header pill
// can reflect whether one is stored without an extra round-trip.
let hfTokenModalOpen = $state(false);
let hasHfTokenCached = $state(false);

async function refreshHasHfToken(): Promise<void> {
	try {
		const result = await commands.hasHfToken();
		if (result.status === "ok") {
			hasHfTokenCached = result.data;
		}
	} catch (e) {
		console.warn("hasHfToken check failed", e);
	}
}

function openHfTokenModal(): void {
	hfTokenModalOpen = true;
}
function closeHfTokenModal(): void {
	hfTokenModalOpen = false;
}
function handleHfTokenSaved(hasToken: boolean): void {
	hasHfTokenCached = hasToken;
}

const selectedPresetName = $derived(wizardState.selectedPresetName);
const tierToken = $derived(tier ? TIER_TOKENS[tier.role] : null);
const nextStepLine = $derived(
	tier && copy ? copy.hardware.next_step_template.replace("{tier}", tier.name) : "",
);
const isOpen = $derived(wizardState.isOpen);

// Fetch wizard copy from Rust the first time the overlay opens. Never
// fetch again unless copy failed — Rust is the source of truth and the
// file does not change at runtime.
$effect(() => {
	if (!isOpen || copy) return;
	(async () => {
		try {
			copy = await invoke<WizardCopy>("get_wizard_copy");
		} catch (e) {
			copyError = e instanceof Error ? e.message : String(e);
		}
	})();
});

// Refresh the HF token pill state every time the overlay opens — the
// kernel is the source of truth, not the frontend. A token could have
// been set via command-line or a previous session.
$effect(() => {
	if (!isOpen) return;
	refreshHasHfToken();
});

// Lock the background scroll while the overlay is open so the underlying
// (app) view doesn't scroll under the dim scrim.
$effect(() => {
	if (typeof document === "undefined") return;
	if (isOpen) {
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}
});

// Map a rust HardwareTier enum variant to the snake_case argument expected
// by the config_for_tier command.
function tierToArg(t: HardwareTier): string {
	switch (t) {
		case "Ultra":
			return "ultra";
		case "High":
			return "high";
		case "JessePrimary":
			return "jesse_primary";
		case "Mid":
			return "mid";
		case "Floor":
			return "floor";
		case "Minimal":
			return "minimal";
		case "CpuOnly":
			return "cpu_only";
	}
}

// Display-formatted brain policy line for a preset card.
function describeBrainPolicy(cfg: AutoConfig): string {
	const policy = cfg.brain_policy;
	if (policy === "Static") return "Static brain — single model always loaded";
	if (policy === "ApiEnhanced") return "API-enhanced — cloud brain + local helpers";
	if (typeof policy === "object" && "ActiveIdle" in policy) {
		const { active_model, idle_model } = policy.ActiveIdle;
		return `Active: ${active_model} · Idle: ${idle_model}`;
	}
	return "";
}

async function handleStart(): Promise<void> {
	phase = "scanning";
	scanError = null;
	tier = null;
	presets = [];
	presetsError = null;

	// Step 1: Hardware scan. If this fails entirely we still advance to
	// the detected phase with an error — never leave the user on a blank
	// scanning state.
	await startHardwareScan();

	// Step 2: Auto-configure recommendations. Error becomes scanError but
	// we keep going so we can still show the preset picker.
	const autoConfig = await fetchRecommendations();
	if (!autoConfig) {
		scanError = wizardState.error ?? "Auto-configuration failed";
	}

	// Step 3: Tier display metadata. Null tier is handled in the template
	// with a fallback — the overlay NEVER goes blank.
	try {
		tier = await invoke<TierDisplay>("get_tier_display");
	} catch (e) {
		scanError = scanError ?? (e instanceof Error ? e.message : String(e));
	}

	// Step 4: Load every known preset for the picker. These are the 6
	// hardware tiers so the owner can override the auto-detection.
	presets = await listAllPresets();
	if (presets.length === 0) {
		presetsError = "No presets available — rust list_presets returned empty";
	}

	phase = "detected";
}

async function handlePickPreset(cfg: AutoConfig): Promise<void> {
	if (switchingTier !== null) return;
	const arg = tierToArg(cfg.tier);
	switchingTier = arg;
	try {
		await selectPreset(arg);
	} finally {
		switchingTier = null;
	}
}

function isSelected(cfg: AutoConfig): boolean {
	return selectedPresetName === cfg.preset_name;
}

function handleDismiss(): void {
	wizardState.close();
}

function handleRecommendedContinue(): void {
	// TODO(cut 2): wire into the downloading / activation phases in-overlay.
	// For now, closing dismisses — the wizard resumes from welcome on reopen.
	wizardState.close();
}

function handleAdvancedContinue(): void {
	wizardState.close();
}

// ── Role card handlers (Phase 5 drift fix) ─────────────────
// The RoleCardGrid below renders four cards — brain / minion /
// encoder / voice — and forwards these callbacks when the user
// clicks Change or when a download row needs to cancel/retry.
// Phase 6 wires the full ModelChangePopup; for now the Change
// button dispatches a placeholder intent that Phase 6 will
// consume.

function handleRoleChange(role: RoleId, slotId: SlotId): void {
	console.info("[overlay] role change requested", { role, slotId });
	// TODO(phase-6): open ModelChangePopup for `slotId` with the
	// correct tab defaults (Recommended for the owner's tier,
	// HF Search if an HF token is stored, Local Browse otherwise).
}

async function handleCancelDownload(downloadId: string): Promise<void> {
	try {
		const result = await commands.cancelDownload(downloadId);
		if (result.status === "error") {
			console.warn("[overlay] cancel_download failed", result.error);
			wizardState.failDownload(downloadId, result.error);
		}
	} catch (e) {
		console.warn("[overlay] cancel_download threw", e);
		wizardState.failDownload(downloadId, e instanceof Error ? e.message : String(e));
	}
}

async function handleRetryDownload(tracker: DownloadTracker): Promise<void> {
	// Clear the failed tracker first so the UI doesn't double-render
	wizardState.dismissDownload(tracker.downloadId);
	// TODO(phase-6): the DownloadTracker needs to carry `repoId`
	// so we can re-dispatch `commands.downloadModel(repoId, filename)`
	// deterministically. For now the Change button re-enters the
	// pick flow.
	console.info("[overlay] retry download requested", tracker);
}

function handleRetryLoad(slotId: string): void {
	wizardState.clearLoad(slotId as SlotId);
	// TODO(phase-6): actual `commands.loadSlot(slotId)` re-dispatch.
	console.info("[overlay] retry load requested", { slotId });
}
</script>

{#if isOpen}
	<div
		class="wizard-scrim"
		role="presentation"
		onclick={(e) => {
			// Click on the scrim backdrop (not the panel) closes the overlay.
			if (e.target === e.currentTarget) handleDismiss();
		}}
		onkeydown={(e) => {
			if (e.key === "Escape") handleDismiss();
		}}
	>
		<div
			class="wizard-panel"
			role="dialog"
			aria-modal="true"
			aria-label="Clyffy Setup Wizard"
			tabindex="-1"
		>
			<div class="wizard-header-actions">
				{#if copy}
					<ClyffyTooltip
						copy={copy.clyffy_tooltips}
						copyKey="hf_token_info"
						label="What is a HuggingFace token?"
					/>
					<button
						type="button"
						class="wizard-token-pill"
						class:wizard-token-pill-set={hasHfTokenCached}
						onclick={openHfTokenModal}
						aria-label={copy.hf_token.lock_icon_aria}
						title={hasHfTokenCached ? copy.hf_token.saved_badge : copy.hf_token.unsaved_badge}
					>
						{#if hasHfTokenCached}
							<Lock size={12} aria-hidden="true" />
							<span>{copy.hf_token.saved_badge}</span>
						{:else}
							<KeyRound size={12} aria-hidden="true" />
							<span>{copy.hf_token.unsaved_badge}</span>
						{/if}
					</button>
				{/if}
				<button
					type="button"
					class="wizard-close"
					onclick={handleDismiss}
					aria-label="Close setup wizard"
				>
					<X size={16} aria-hidden="true" />
				</button>
			</div>

			{#if copy}
				<HfTokenModal
					open={hfTokenModalOpen}
					copy={copy.hf_token}
					initiallyHasToken={hasHfTokenCached}
					onClose={closeHfTokenModal}
					onSaved={handleHfTokenSaved}
				/>
			{/if}

			<div class="wizard-body">
				{#if copyError}
					<Card preset="danger">
						<div class="err-card">
							<Heading level={3} size="md">Couldn't load setup wizard</Heading>
							<Text size="sm" color="danger">Rust returned: {copyError}</Text>
							<Text size="xs" color="muted">
								Make sure the engine booted successfully — check the app log for
								<code>get_wizard_copy</code> errors.
							</Text>
						</div>
					</Card>
				{:else if !copy}
					<div class="loading-block">
						<Spinner size="md" />
						<Text size="sm" color="muted">Loading wizard…</Text>
					</div>
				{:else if phase === "welcome"}
					<img
						src="/imgs/mascot/clyffy-anim-wobble.png"
						alt={copy.greeting.mascot_alt}
						class="mascot"
					/>

					<Heading level={2} size="xl">{copy.greeting.title}</Heading>
					<Text size="base" color="secondary">{copy.greeting.subtitle}</Text>

					{#if hardwareState.gpuName || hardwareState.cpuName}
						<Card preset="glass">
							<div class="hw-list" role="list" aria-label="Detected hardware">
								{#if hardwareState.gpuName}
									<div class="hw-row" role="listitem">
										<Monitor size={16} aria-hidden="true" />
										<Text size="xs" weight="bold" color="muted" class="hw-label">
											{copy.hardware.gpu_label}
										</Text>
										<Text size="sm">{hardwareState.gpuName}</Text>
										{#if hardwareState.vramTotalMb}
											<Badge preset="glass">
												{formatMb(hardwareState.vramTotalMb)} {copy.hardware.vram_label}
											</Badge>
											<ClyffyTooltip
												copy={copy.clyffy_tooltips}
												copyKey="vram_info"
												label="What is VRAM?"
											/>
										{/if}
									</div>
								{/if}
								{#if hardwareState.cpuName}
									<div class="hw-row" role="listitem" title={copy.hardware.cpu_tooltip}>
										<Cpu size={16} aria-hidden="true" />
										<Text size="xs" weight="bold" color="muted" class="hw-label">
											{copy.hardware.cpu_label}
										</Text>
										<Text size="sm">{hardwareState.cpuName}</Text>
									</div>
								{/if}
								{#if hardwareState.ramTotalMb}
									<div class="hw-row" role="listitem" title={copy.hardware.ram_tooltip}>
										<Zap size={16} aria-hidden="true" />
										<Text size="xs" weight="bold" color="muted" class="hw-label">
											{copy.hardware.ram_label}
										</Text>
										<Text size="sm">{formatMb(hardwareState.ramTotalMb)}</Text>
									</div>
								{/if}
								{#if hardwareState.diskFreeMb}
									<div class="hw-row" role="listitem" title={copy.hardware.disk_tooltip}>
										<HardDrive size={16} aria-hidden="true" />
										<Text size="xs" weight="bold" color="muted" class="hw-label">
											{copy.hardware.disk_label}
										</Text>
										<Text size="sm">{formatMb(hardwareState.diskFreeMb)} free</Text>
									</div>
								{/if}
							</div>
						</Card>
					{/if}

					<Text size="sm" color="muted">{copy.greeting.hint}</Text>

					<Button
						preset="primary"
						size="lg"
						onclick={handleStart}
						aria-label={copy.greeting.cta_aria}
					>
						<Sparkles size={18} aria-hidden="true" />
						{copy.greeting.cta_label}
					</Button>
				{:else if phase === "scanning"}
					<img
						src="/imgs/mascot/clyffyloading.gif"
						alt={copy.scanning.mascot_alt}
						class="mascot-loading"
					/>
					<Heading level={2} size="lg">{copy.scanning.title}</Heading>
					<Text size="sm" color="muted">{copy.scanning.subtitle}</Text>
					<Spinner size="md" />
				{:else}
					<!-- phase === "detected" — render EVERY branch so we never go blank -->
					<img src="/imgs/mascot/clyffy-anim-blinking.png" alt="Clyffy ready" class="mascot" />

					<Heading level={2} size="lg">{copy.hardware.title}</Heading>

					{#if tier && tierToken}
						<div
							class="tier-badge"
							style="border-color: {tierToken.color}; color: {tierToken.color};"
							role="status"
							aria-label="Hardware tier: {tier.name}"
							title={tier.tooltip}
						>
							<span class="tier-name">{tier.name}</span>
							<Text size="sm" color="secondary">{tier.description}</Text>
						</div>
					{:else}
						<div class="tier-badge tier-badge-fallback" role="status">
							<span class="tier-name">Hardware tier unknown</span>
							<Text size="sm" color="secondary">
								Auto-detection didn't return a tier. Pick a preset below to continue.
							</Text>
						</div>
					{/if}

					{#if scanError}
						<Card preset="danger">
							<div class="error-content" role="alert">
								<Text size="sm" color="danger">{scanError}</Text>
								<Button preset="secondary" size="md" onclick={handleStart}>
									{copy.models.error_retry_label}
								</Button>
							</div>
						</Card>
					{/if}

					{#if !hardwareState.hasGpu}
						<Card preset="warning">
							<div class="warn-content">
								<Text size="sm" weight="bold" color="warning">
									{copy.hardware.no_gpu_warning_title}
								</Text>
								<Text size="sm" color="muted">{copy.hardware.no_gpu_warning_detail}</Text>
							</div>
						</Card>
					{/if}

					{#if tier && tierToken}
						<Text size="sm" color="secondary">{nextStepLine}</Text>
					{/if}

					<!-- Preset picker — SHOW EVERY PRESET so the owner can override auto-detect -->
					<div class="picker-header">
						<div class="picker-heading-row">
							<Heading level={3} size="md">Pick a hardware preset</Heading>
							<ClyffyTooltip
								copy={copy.clyffy_tooltips}
								copyKey="preset_picker_info"
								label="What is a preset?"
								size="md"
							/>
						</div>
						<Text size="xs" color="muted">
							{selectedPresetName ? `Selected: ${selectedPresetName}` : "No preset selected"}
						</Text>
					</div>

					{#if presetsError}
						<Card preset="danger">
							<Text size="sm" color="danger">{presetsError}</Text>
						</Card>
					{:else if presets.length === 0}
						<div class="loading-block">
							<Spinner size="sm" />
							<Text size="xs" color="muted">Loading presets…</Text>
						</div>
					{:else}
						<div class="preset-grid" role="radiogroup" aria-label="Hardware preset picker">
							{#each presets as cfg (cfg.preset_name)}
								{@const selected = isSelected(cfg)}
								{@const busy = switchingTier === tierToArg(cfg.tier)}
								<button
									type="button"
									class="preset-card"
									class:selected
									role="radio"
									aria-checked={selected}
									aria-busy={busy}
									disabled={busy}
									onclick={() => handlePickPreset(cfg)}
								>
									<div class="preset-head">
										<Text size="base" weight="bold">{cfg.preset_name}</Text>
										{#if selected}
											<span class="selected-dot" aria-hidden="true"></span>
										{/if}
									</div>
									<Text size="xs" color="muted">{describeBrainPolicy(cfg)}</Text>
									<div class="preset-stats">
										<Badge preset="glass">
											VRAM {formatMb(cfg.total_vram_needed_mb)}
										</Badge>
										<Badge preset="glass">
											{cfg.recommendations.length} slots
										</Badge>
										{#if cfg.total_download_size_mb > 0}
											<Badge preset="glass">
												DL {formatMb(cfg.total_download_size_mb)}
											</Badge>
										{:else}
											<Badge preset="matte">Ready</Badge>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					{/if}

					{#if selectedPresetName}
						<RoleCardGrid
							copy={copy.role_cards}
							tooltips={copy.clyffy_tooltips}
							downloadsCopy={copy.downloads}
							loadingCopy={copy.loading}
							onRoleChange={handleRoleChange}
							onCancelDownload={handleCancelDownload}
							onRetryDownload={handleRetryDownload}
							onRetryLoad={handleRetryLoad}
						/>
					{/if}

					<div class="choice-row" role="group" aria-label="Setup mode selection">
						<Button
							preset="primary"
							size="lg"
							onclick={handleRecommendedContinue}
							disabled={!selectedPresetName}
							aria-label="Recommended setup — auto-configure all models"
						>
							Recommended Setup
						</Button>
						<Button
							preset="secondary"
							size="lg"
							onclick={handleAdvancedContinue}
							aria-label="Advanced setup — browse and pick models manually"
						>
							Advanced Setup
						</Button>
					</div>

					<Text size="xs" color="muted">
						Both options set up voice, vision, search, and brain models. You can change
						anything later.
					</Text>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.wizard-scrim {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: clamp(1rem, 3vw, 2.5rem);
		background: color-mix(in oklch, var(--color-void-base) 80%, transparent);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		overflow-y: auto;
	}

	.wizard-panel {
		position: relative;
		width: 100%;
		max-width: min(72rem, 100vw);
		display: flex;
		flex-direction: column;
		align-items: stretch;
		background: var(--surface-raised);
		border: var(--border-width-medium) solid var(--border-subtle);
		border-radius: var(--radius-lg);
		box-shadow: var(--wizard-shadow-glow-lg);
	}

	.wizard-header-actions {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		z-index: 2;
	}

	.wizard-token-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		border-radius: 999px;
		border: 0.0625rem solid var(--border-subtle);
		background: var(--surface-overlay);
		color: var(--text-secondary);
		font-size: 0.6875rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			background var(--motion-duration-fast),
			border-color var(--motion-duration-fast),
			color var(--motion-duration-fast);
	}
	.wizard-token-pill:hover {
		background: var(--surface-raised);
		color: var(--text-primary);
		border-color: var(--accent-cyan-main);
	}
	.wizard-token-pill-set {
		border-color: var(--accent-teal-main);
		color: var(--accent-teal-main);
	}
	.wizard-token-pill-set:hover {
		border-color: var(--accent-teal-main);
	}

	.wizard-close {
		width: 2rem;
		height: 2rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		border-radius: var(--radius-md);
		transition: background var(--motion-duration-fast), color var(--motion-duration-fast);
	}
	.wizard-close:hover {
		background: var(--surface-overlay);
		color: var(--text-primary);
	}

	.wizard-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		gap: clamp(0.75rem, 2vw, 1.5rem);
		padding: clamp(1.25rem, 3vw, 2.5rem);
		text-align: center;
		box-sizing: border-box;
	}

	.loading-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: clamp(1rem, 3vw, 2rem);
	}

	.err-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: clamp(0.75rem, 2vw, 1.25rem);
		text-align: left;
	}

	.mascot {
		width: clamp(4rem, 8vw, 6rem);
		height: clamp(4rem, 8vw, 6rem);
		object-fit: contain;
		filter: drop-shadow(var(--wizard-shadow-glow-lg));
		animation: float 3s ease-in-out infinite;
	}
	.mascot-loading {
		width: clamp(3rem, 6vw, 5rem);
		height: clamp(3rem, 6vw, 5rem);
		object-fit: contain;
	}
	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-0.5rem);
		}
	}

	.hw-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		max-width: 22rem;
		padding: clamp(0.5rem, 1.5vw, 0.875rem);
	}
	.hw-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-secondary);
		cursor: help;
	}

	.tier-badge {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: clamp(0.5rem, 1.5vw, 0.75rem) clamp(1rem, 3vw, 1.5rem);
		border-radius: var(--radius-lg);
		border: var(--border-width-medium) solid;
		background: var(--surface-overlay);
		cursor: help;
	}
	.tier-badge-fallback {
		border-color: var(--border-subtle);
		color: var(--text-secondary);
	}
	.tier-name {
		font-size: clamp(0.875rem, 2vw, 1.125rem);
		font-weight: 800;
	}

	.error-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: clamp(0.5rem, 1.5vw, 0.875rem);
	}
	.warn-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: clamp(0.5rem, 1.5vw, 0.875rem);
	}

	.picker-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		margin-top: clamp(0.5rem, 1.5vw, 1rem);
	}

	.picker-heading-row {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.preset-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(clamp(14rem, 22vw, 18rem), 1fr));
		gap: clamp(0.5rem, 1.5vw, 1rem);
		width: 100%;
	}

	.preset-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: clamp(0.75rem, 2vw, 1.125rem);
		border-radius: var(--radius-lg);
		border: var(--border-width-medium) solid var(--border-subtle);
		background: var(--surface-raised);
		cursor: pointer;
		text-align: left;
		transition:
			border-color var(--motion-duration-fast),
			box-shadow var(--motion-duration-fast),
			transform var(--motion-duration-fast);
		font: inherit;
		color: inherit;
	}
	.preset-card:hover:not(:disabled) {
		border-color: var(--accent-cyan-main);
		box-shadow: var(--wizard-shadow-glow-sm);
		transform: translateY(-2px);
	}
	.preset-card:disabled {
		opacity: 0.6;
		cursor: wait;
	}
	.preset-card.selected {
		border-color: var(--accent-teal-main);
		background: var(--accent-teal-fill);
		box-shadow: var(--wizard-shadow-glow-md);
	}

	.preset-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.selected-dot {
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 50%;
		background: var(--accent-teal-main);
		box-shadow: 0 0 0.5rem var(--accent-teal-main);
	}

	.preset-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-top: 0.25rem;
	}

	.choice-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: clamp(0.5rem, 2vw, 1rem);
		width: 100%;
		max-width: 32rem;
		margin-top: clamp(0.5rem, 1.5vw, 1rem);
	}
</style>
