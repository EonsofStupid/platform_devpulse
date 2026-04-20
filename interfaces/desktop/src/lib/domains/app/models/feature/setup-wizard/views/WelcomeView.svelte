<!--
  @file WelcomeView.svelte
  @domain models/setup-wizard

  View 1 of the 5-view setup wizard. Absorbs ProjectSetupStep + Step0Welcome.

  Capabilities preserved from the prior step-based flow:
  - First-Run kicker pill + mascot with drop-shadow glow
  - Name / email / experience level + project folder picker
  - Level cards with per-level color accent (green/blue/coral)
  - WizardHelpTip per field (name, email, level, folder)
  - WizardInfoPopup "What happens next" + "Why this matters"
  - Live hardware snapshot grid with per-row tooltips
  - "Let's Go" → system-check, "Jesse Config" → config (auto-preset)
  - Skip link for "I'll configure later"

  All styling uses ColdLight DTCG tokens (wizard.* + accent.*).
  Zero IPC on mount — reads push state only. Commands fire on user click.
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import {
	Code,
	Cpu,
	FolderOpen,
	HardDrive,
	Monitor,
	Settings,
	Sparkles,
	User,
	Zap,
} from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { logError, logInfo } from "$lib/sys/logger.js";
import { hardwareState } from "../../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import { setupWizardOverlayState } from "../../../data-access/setup-wizard-overlay.state.svelte.js";
import { formatMb } from "../../../util/models.types.js";
import WizardHelpTip from "../components/WizardHelpTip.svelte";
import WizardInfoPopup from "../components/WizardInfoPopup.svelte";
import { wizardState } from "../wizard.state.svelte.js";

const overlayState = setupWizardOverlayState;

interface LevelOption {
	value: 1 | 2 | 3;
	label: string;
	desc: string;
	accent: string;
	glow: string;
}

const LEVELS: LevelOption[] = [
	{
		value: 1,
		label: "Beginner",
		desc: "New to coding or AI tools",
		accent: "var(--wizard-role-minion-main)",
		glow: "var(--wizard-role-minion-glow)",
	},
	{
		value: 2,
		label: "Intermediate",
		desc: "Comfortable with code, exploring AI",
		accent: "var(--wizard-role-encoder-main)",
		glow: "var(--wizard-role-encoder-glow)",
	},
	{
		value: 3,
		label: "Advanced",
		desc: "Professional developer, power user",
		accent: "var(--wizard-role-voice-main)",
		glow: "var(--wizard-role-voice-glow)",
	},
];

// ── Project folder (optional) ────────────────────────────
let projectPath = $state("");
let pickingFolder = $state(false);
let showInfoPopup = $state(false);

async function handleBrowseFolder(): Promise<void> {
	if (pickingFolder) return;
	pickingFolder = true;
	logInfo("wizard.welcome", "Browse folder clicked");
	try {
		const path = await invoke<string>("pick_directory", { title: "Select your project folder" });
		if (path) {
			projectPath = path;
			logInfo("wizard.welcome", `Folder picked: ${path}`);
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		if (msg !== "No folder selected" && !msg.includes("cancelled")) {
			logError("wizard.welcome", `pick_directory FAILED: ${msg}`);
		}
	} finally {
		pickingFolder = false;
	}
}

// ── Jesse Config preset ──────────────────────────────────
async function handleJesseConfig(): Promise<void> {
	logInfo("wizard.welcome", "Jesse Config clicked");
	const config = await overlayState.applyJesseConfig();
	if (config) {
		wizardState.setRecommendations(config);
	}
}

function handleLetsGo(): void {
	logInfo("wizard.welcome", "Let's Go clicked (welcome → system-check)");
	// Persist project path as part of pending profile if provided. Saved
	// at apply time via saveProfileDraft (name/email/level) — project path
	// is stored via the separate create_dev_profile command on finalize.
	overlayState.showSystemCheck();
}

function handleSkip(): void {
	logInfo("wizard.welcome", "Skip clicked");
	wizardState.close();
}

// ── Live hardware snapshot ───────────────────────────────
const hasHardware = $derived(hardwareState.hasSnapshot);
const gpuName = $derived(hardwareState.gpuName);
const gpuError = $derived(hardwareState.gpuError);
const cpuName = $derived(hardwareState.cpuName);
const vramTotalMb = $derived(hardwareState.metrics?.gpu_vram_total_mb ?? 0);
const ramTotalMb = $derived(hardwareState.metrics?.ram_total_mb ?? 0);
const diskFreeMb = $derived(hardwareState.metrics?.disk_free_mb ?? 0);
const modelCount = $derived(modelsState.models.length);
</script>

<div class="welcome-view">
	<!-- Stage: mascot + kicker + heading + helper row -->
	<div class="wv-stage">
		<img src="/imgs/mascot/clyffy-anim-wobble.png" alt="Clyffy welcomes you" class="wv-mascot" />
		<span class="wv-kicker">First Run Setup</span>
		<Heading level={2} size="xl">Welcome to DevPulse</Heading>
		<Text size="sm" color="secondary" class="wv-subtitle">
			Let's get your AI models configured. Pick a preset or customize each slot.
		</Text>
		<div class="wv-help-row">
			<WizardHelpTip
				tip="DevPulse scans your hardware, recommends a local-first model plan, verifies chat, and only then hands you the full app."
				label="What is first-run setup?"
			/>
			<Button preset="button-ghost" size="sm" onclick={() => (showInfoPopup = true)}>
				What happens next
			</Button>
		</div>
	</div>

	<!-- Profile form: name, email, level, folder -->
	<div class="wv-form">
		<div class="wv-field">
			<label class="wv-label" for="wv-name">
				<User size={14} />
				<Text size="xs" weight="bold">Your Name</Text>
				<WizardHelpTip
					tip="Clyffy will address you by this name in responses. You can change it later in Settings."
					label="Why does Clyffy need my name?"
				/>
			</label>
			<input
				id="wv-name"
				type="text"
				placeholder="What should Clyffy call you?"
				bind:value={overlayState.profileName}
				class="wv-input"
			/>
		</div>

		<div class="wv-field">
			<label class="wv-label" for="wv-email">
				<Text size="xs" weight="bold">Email (optional)</Text>
				<WizardHelpTip
					tip="Optional. Used only for local-only profile grouping. Never transmitted unless you explicitly enable cloud sync."
					label="Why email?"
				/>
			</label>
			<input
				id="wv-email"
				type="email"
				placeholder="you@example.com"
				bind:value={overlayState.profileEmail}
				class="wv-input"
			/>
		</div>

		<div class="wv-field">
			<label class="wv-label">
				<Code size={14} />
				<Text size="xs" weight="bold">Experience Level</Text>
				<WizardHelpTip
					tip="Controls how deeply Clyffy explains concepts. Beginner gets more hand-holding; Advanced gets terse answers."
					label="What does experience level change?"
				/>
			</label>
			<div class="wv-levels">
				{#each LEVELS as level (level.value)}
					<button
						type="button"
						class="wv-level"
						class:wv-level-active={overlayState.profileLevel === level.value}
						style:--level-accent={level.accent}
						style:--level-glow={level.glow}
						onclick={() => overlayState.setProfileLevel(level.value)}
					>
						<span class="wv-level-name">{level.label}</span>
						<span class="wv-level-desc">{level.desc}</span>
					</button>
				{/each}
			</div>
		</div>

		<div class="wv-field">
			<label class="wv-label" for="wv-folder">
				<FolderOpen size={14} />
				<Text size="xs" weight="bold">Project Folder (optional)</Text>
				<WizardHelpTip
					tip="Pointing Clyffy at a project folder enables code-aware answers. Indexing happens in the background, stays local, and can be added later in Settings."
					label="What does indexing my project do?"
				/>
			</label>
			<div class="wv-folder-row">
				<input
					id="wv-folder"
					type="text"
					placeholder="Optional — set later in Settings"
					value={projectPath}
					readonly
					class="wv-input wv-input-readonly"
				/>
				<Button preset="button-secondary" size="sm" onclick={handleBrowseFolder} disabled={pickingFolder}>
					{#if pickingFolder}
						<Spinner size="xs" />
					{:else}
						Browse
					{/if}
				</Button>
			</div>
		</div>
	</div>

	<!-- Live hardware snapshot grid -->
	{#if hasHardware}
		<section class="wv-snapshot" aria-label="Hardware snapshot">
			<div class="wv-snapshot-head">
				<Text size="xs" weight="bold" class="wv-snapshot-kicker">Hardware Snapshot</Text>
				<WizardHelpTip
					tip="Auto-detected at boot. Drives the first recommended model plan. Override anytime in Config."
					label="Where does this come from?"
				/>
			</div>

			<div class="wv-snapshot-grid">
				<div class="wv-snapshot-row">
					<Monitor size={14} />
					<Text size="xs" weight="bold" class="wv-snapshot-label">GPU</Text>
					<Text size="xs" class="wv-snapshot-value">{gpuName ?? "No GPU detected"}</Text>
					{#if vramTotalMb > 0}
						<span class="wv-snapshot-tag">{formatMb(vramTotalMb)} VRAM</span>
					{/if}
					<WizardHelpTip
						tip="Graphics card memory. More VRAM = larger models can run on GPU for fast inference."
						label="What is VRAM?"
					/>
				</div>

				<div class="wv-snapshot-row">
					<Cpu size={14} />
					<Text size="xs" weight="bold" class="wv-snapshot-label">CPU</Text>
					<Text size="xs" class="wv-snapshot-value">{cpuName ?? "Unknown CPU"}</Text>
					<WizardHelpTip
						tip="Fallback when no GPU is available. Smaller models still run well on modern CPUs."
						label="What does the CPU do?"
					/>
				</div>

				{#if ramTotalMb > 0}
					<div class="wv-snapshot-row">
						<Zap size={14} />
						<Text size="xs" weight="bold" class="wv-snapshot-label">RAM</Text>
						<Text size="xs" class="wv-snapshot-value">{formatMb(ramTotalMb)}</Text>
						<WizardHelpTip
							tip="System memory. Used for model weights before GPU upload and for CPU-only models."
							label="Why RAM matters"
						/>
					</div>
				{/if}

				{#if diskFreeMb > 0}
					<div class="wv-snapshot-row">
						<HardDrive size={14} />
						<Text size="xs" weight="bold" class="wv-snapshot-label">Disk</Text>
						<Text size="xs" class="wv-snapshot-value">{formatMb(diskFreeMb)} free</Text>
						<span class="wv-snapshot-tag">{modelCount} models</span>
					</div>
				{/if}
			</div>

			{#if gpuError && !gpuName}
				<Text size="xs" color="muted" class="wv-snapshot-note">{gpuError}</Text>
			{/if}
		</section>
	{:else}
		<div class="wv-snapshot wv-snapshot-loading">
			<Spinner size="sm" tone="accent" />
			<Text size="xs" color="muted">Scanning your hardware…</Text>
		</div>
	{/if}

	<!-- Action bar -->
	<div class="wv-actions">
		<Button preset="button-primary" size="lg" onclick={handleLetsGo} disabled={!overlayState.canContinue}>
			<Sparkles size={16} />
			Let's Go
		</Button>
		<Button preset="button-secondary" size="lg" onclick={handleJesseConfig} disabled={overlayState.loadingPreset}>
			{#if overlayState.loadingPreset}
				<Spinner size="xs" />
			{:else}
				<Settings size={16} />
			{/if}
			Jesse Config
		</Button>
	</div>

	<button class="wv-skip" onclick={handleSkip}>
		Skip setup — I'll configure later
	</button>
</div>

<WizardInfoPopup
	open={showInfoPopup}
	title="How first-run setup works"
	summary="This flow builds a local-first AI stack that fits your machine, then verifies chat before handing you the full app."
	points={[
		"Hardware snapshot: detect your GPU, CPU, memory, and available disk space.",
		"Model plan: pick the best default brain, memory, vision, and voice for this machine.",
		"Per-slot install: download or point at local files, activate when ready.",
		"Validation: test chat before the wizard lets you finish.",
		"Everything stays editable later in Settings — this just gets you to a working baseline fast.",
	]}
	imageSrc="/imgs/mascot/clyffy-df-icon-interaction1.png"
	onClose={() => (showInfoPopup = false)}
/>

<style>
	.welcome-view {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(1rem, 0.75rem + 1vw, 1.75rem);
		width: 100%;
		max-width: 42rem;
		padding: clamp(1rem, 0.75rem + 1vw, 1.5rem) 0;
		text-align: center;
	}

	/* ── Stage ─────────────────────────────────── */

	.wv-stage {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.625rem;
	}

	.wv-mascot {
		width: clamp(4.5rem, 4rem + 2vw, 6rem);
		height: clamp(4.5rem, 4rem + 2vw, 6rem);
		object-fit: contain;
		filter: drop-shadow(0 0 1.5rem color-mix(in oklch, var(--wizard-role-brain-main) 45%, transparent));
		animation: wv-float 4s ease-in-out infinite;
	}

	@keyframes wv-float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-0.375rem); }
	}

	.wv-kicker {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem 0.625rem;
		border-radius: 999px;
		background: color-mix(in oklch, var(--accent-teal-fill) 92%, transparent);
		border: 1px solid color-mix(in oklch, var(--accent-teal-main) 35%, transparent);
		color: var(--accent-teal-main);
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	:global(.wv-subtitle) {
		max-width: 28rem;
	}

	.wv-help-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	/* ── Form ──────────────────────────────────── */

	.wv-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		max-width: 26rem;
		text-align: left;
	}

	.wv-field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.wv-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		color: var(--text-secondary);
	}

	.wv-input {
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid var(--border-subtle);
		background: var(--glass-deep);
		color: var(--text-primary);
		font-size: 0.875rem;
		outline: none;
		transition: border-color 150ms ease-out;
	}
	.wv-input:focus {
		border-color: var(--accent-teal-main);
	}
	.wv-input::placeholder {
		color: var(--text-muted);
	}
	.wv-input-readonly {
		cursor: default;
		flex: 1;
		min-width: 0;
	}

	.wv-folder-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.wv-levels {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.wv-level {
		flex: 1;
		min-width: 6rem;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.625rem 0.75rem;
		border-radius: 0.625rem;
		border: 1px solid var(--border-subtle);
		background: transparent;
		cursor: pointer;
		text-align: left;
		transition: border-color 180ms ease-out, background 180ms ease-out, box-shadow 180ms ease-out;
	}
	.wv-level:hover {
		border-color: color-mix(in oklch, var(--level-accent) 45%, var(--border-subtle));
	}
	.wv-level-active {
		border-color: var(--level-accent);
		background: color-mix(in oklch, var(--level-accent) 12%, transparent);
		box-shadow: 0 0 0.75rem color-mix(in oklch, var(--level-glow) 55%, transparent);
	}
	.wv-level-name {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	.wv-level-active .wv-level-name {
		color: var(--level-accent);
	}
	.wv-level-desc {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	/* ── Hardware snapshot ─────────────────────── */

	.wv-snapshot {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		width: 100%;
		padding: clamp(0.75rem, 0.5rem + 0.75vw, 1rem);
		border-radius: 0.875rem;
		background:
			linear-gradient(135deg, color-mix(in oklch, var(--accent-purple-fill) 60%, transparent), transparent 60%),
			var(--glass-deep);
		border: 1px solid var(--border-subtle);
		text-align: left;
	}

	.wv-snapshot-loading {
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.wv-snapshot-head {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	:global(.wv-snapshot-kicker) {
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.wv-snapshot-grid {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.wv-snapshot-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.625rem;
		border-radius: 0.625rem;
		background: color-mix(in oklch, var(--surface-raised) 88%, transparent);
		border: 1px solid var(--border-soft);
		color: var(--text-secondary);
	}

	:global(.wv-snapshot-label) {
		min-width: 2rem;
		color: var(--text-muted);
	}

	:global(.wv-snapshot-value) {
		flex: 1;
		color: var(--text-primary);
	}

	.wv-snapshot-tag {
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		background: color-mix(in oklch, var(--accent-teal-fill) 88%, transparent);
		color: var(--accent-teal-main);
		font-size: 0.7rem;
		font-weight: 700;
		white-space: nowrap;
	}

	:global(.wv-snapshot-note) {
		color: var(--text-muted);
	}

	/* ── Actions ───────────────────────────────── */

	.wv-actions {
		display: flex;
		gap: clamp(0.5rem, 1.5vw, 1rem);
		flex-wrap: wrap;
		justify-content: center;
	}

	.wv-skip {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 0.75rem;
		cursor: pointer;
		transition: color 200ms ease-out;
	}
	.wv-skip:hover {
		color: var(--accent-teal-main);
	}
</style>
