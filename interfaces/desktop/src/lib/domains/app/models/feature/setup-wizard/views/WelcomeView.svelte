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
import { toast } from "svelte-sonner";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { projectsState } from "$lib/domains/app/projects/index.js";
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
		accent: "var(--accent-electric-main)",
		glow: "var(--accent-electric-glow)",
	},
	{
		value: 2,
		label: "Intermediate",
		desc: "Comfortable with code, exploring AI",
		accent: "var(--accent-azure-main)",
		glow: "var(--accent-azure-glow)",
	},
	{
		value: 3,
		label: "Advanced",
		desc: "Professional developer, power user",
		accent: "var(--accent-violet-main)",
		glow: "var(--accent-violet-glow)",
	},
];

// ── Project folder + name + save state ──────────────────
let projectPath = $state("");
let projectName = $state("");
let pickingFolder = $state(false);
let savingProject = $state(false);
let projectSaved = $state(false);
// Layman-visible save failure surface. `projectError` is the headline
// (plain English); `projectErrorDetail` is the underlying message
// for power users via a `<details>` disclosure. Cleared on retry,
// folder change, or successful save.
let projectError = $state<string | null>(null);
let projectErrorDetail = $state<string | null>(null);
let showInfoPopup = $state(false);

// Profile save state (Let's Go persists identity BEFORE advancing — boot
// flow wants username + email locked in before slot assignment begins).
let savingProfile = $state(false);
let profileError = $state<string | null>(null);

async function handleBrowseFolder(): Promise<void> {
	if (pickingFolder) return;
	pickingFolder = true;
	logInfo("wizard.welcome", "Browse folder clicked");
	try {
		const path = await invoke<string>("pick_directory", { title: "Select your project folder" });
		if (path) {
			projectPath = path;
			// Seed the name field with the folder basename so the user has
			// a sane default they can override. Only seed when empty —
			// never clobber what the user already typed.
			if (!projectName.trim()) {
				const basename = path.split(/[/\\]/).filter(Boolean).pop() ?? "";
				projectName = basename;
			}
			// Picking a new folder invalidates the "saved" badge — the
			// user is expected to re-save if they change their mind.
			// Also clear any previous error: a fresh folder is a fresh
			// attempt.
			projectSaved = false;
			projectError = null;
			projectErrorDetail = null;
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

async function handleSaveProject(): Promise<void> {
	if (savingProject) return;
	const name = projectName.trim();
	if (!name || !projectPath) {
		logError("wizard.welcome", "handleSaveProject refused — name or path empty");
		return;
	}
	savingProject = true;
	projectSaved = false;
	projectError = null;
	projectErrorDetail = null;
	logInfo("wizard.welcome", `handleSaveProject — name="${name}" path="${projectPath}"`);
	try {
		const created = await projectsState.createProject({
			name,
			rootPath: projectPath,
			setActive: true,
		});
		// projectsState.createProject calls refresh() after the libSQL INSERT
		// returns — so by the time `created` is non-null AND activeProject.id
		// matches it, we've already round-tripped through the DB. Anything
		// else means the write didn't stick and we MUST NOT show success.
		const verified = !!created && projectsState.activeProject?.id === created.id;
		if (verified && created) {
			projectSaved = true;
			toast.success(`Saved "${created.name}"`, {
				description: `Active project · written to libSQL · ${created.id.slice(0, 8)}`,
				duration: 5000,
			});
			logInfo(
				"wizard.welcome",
				`project saved + activated — ${created.name} (${created.id}) — indexing pending`,
			);
		} else {
			const detail = projectsState.error ?? "(no adapter error captured)";
			projectError =
				"Couldn't save the project. The folder may not be accessible, or a project with that path already exists.";
			projectErrorDetail = detail;
			toast.error("Save failed", { description: detail });
			logError(
				"wizard.welcome",
				`createProject did not verify — created=${created?.id ?? "null"} active=${
					projectsState.activeProject?.id ?? "null"
				} — ${detail}`,
			);
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		projectError = "Couldn't save the project.";
		projectErrorDetail = msg;
		toast.error("Save failed", { description: msg });
		logError("wizard.welcome", `createProject threw — ${msg}`);
	} finally {
		savingProject = false;
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

async function handleLetsGo(): Promise<void> {
	// Boot-flow contract: identity (username + email + expertise + project
	// folder if picked) is persisted BEFORE the wizard advances to the
	// slot-assignment phase. Profile is required (gated by canContinue);
	// project is optional but if a folder is picked we auto-save it here
	// so the user can't fall through to slot assignment with an unsaved
	// project sitting in the form.
	if (savingProfile) return;
	savingProfile = true;
	profileError = null;
	logInfo("wizard.welcome", "Let's Go clicked — saving identity then welcome → system-check");
	try {
		await overlayState.saveProfileDraft();
		logInfo("wizard.welcome", "Profile persisted");

		if (projectPath && projectName.trim() && !projectSaved) {
			logInfo("wizard.welcome", "Project path set but not saved — saving as part of Let's Go");
			await handleSaveProject();
			if (!projectSaved) {
				// handleSaveProject sets projectError/projectErrorDetail on failure;
				// fall through without advancing so the user can retry.
				logError("wizard.welcome", "Project auto-save failed — staying on welcome");
				return;
			}
		}

		logInfo("wizard.welcome", "Identity locked — advancing to system-check");
		overlayState.showSystemCheck();
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		profileError =
			"Couldn't save your profile. Try again, or check that the platform finished booting.";
		logError("wizard.welcome", `saveProfileDraft FAILED — ${msg}`);
	} finally {
		savingProfile = false;
	}
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
		<span class="wv-kicker">First-Run Setup</span>
		<Heading level={1} size="3xl">Hey — let's get you set up</Heading>
		<Text size="lg" color="secondary" class="wv-subtitle">
			A few quick questions, then Clyffy picks the right AI brains for your computer.
			You can change anything later.
		</Text>
		<div class="wv-help-row">
			<WizardHelpTip
				tip="DevPulse scans your hardware, recommends a local-first model plan, verifies chat, and only then hands you the full app."
				label="What is first-run setup?"
			/>
			<Button preset="button-ghost" size="md" onclick={() => (showInfoPopup = true)}>
				See what happens next
			</Button>
		</div>
	</div>

	<!-- Profile form: name, email, level, folder -->
	<div class="wv-form">
		<div class="wv-field">
			<label class="wv-label" for="wv-name">
				<User size={16} />
				<Text size="sm" weight="bold">What should we call you?</Text>
				<WizardHelpTip
					tip="Clyffy will address you by this name in responses. You can change it later in Settings."
					label="Why does Clyffy need my name?"
				/>
			</label>
			<input
				id="wv-name"
				type="text"
				placeholder="Your name (or a nickname)"
				bind:value={overlayState.profileName}
				class="wv-input"
			/>
		</div>

		<div class="wv-field">
			<label class="wv-label" for="wv-email">
				<Text size="sm" weight="bold">Your email</Text>
				<WizardHelpTip
					tip="Required. Anchors your profile for slot assignments, Claude-subscription pairing, and future cloud sync. Stays local unless you explicitly enable sync."
					label="Why email?"
				/>
			</label>
			<input
				id="wv-email"
				type="email"
				placeholder="you@example.com"
				bind:value={overlayState.profileEmail}
				class="wv-input"
				class:wv-input-invalid={overlayState.profileEmail.length > 0 && !overlayState.emailIsValid}
			/>
		</div>

		<div class="wv-field">
			<label class="wv-label">
				<Code size={16} />
				<Text size="sm" weight="bold">How comfortable are you with code?</Text>
				<WizardHelpTip
					tip="Controls how deeply Clyffy explains concepts. Beginner gets more hand-holding; Advanced gets terse answers."
					label="What does this change?"
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

		<!-- ── Project create (folder + name + explicit save) ────────────── -->
		<div class="wv-field">
			<label class="wv-label" for="wv-folder">
				<FolderOpen size={16} />
				<Text size="sm" weight="bold">Where's your project?</Text>
				<WizardHelpTip
					tip="Pick the folder Clyffy should know about. The name doesn't have to match the folder — call it whatever makes sense to you. We'll index it once an embedding model is loaded."
					label="What's a project in DevPulse?"
				/>
			</label>
			<div class="wv-folder-row">
				<input
					id="wv-folder"
					type="text"
					placeholder="Click Browse to pick a folder on your computer"
					value={projectPath}
					readonly
					class="wv-input wv-input-readonly"
				/>
				<Button preset="button-secondary" size="md" onclick={handleBrowseFolder} disabled={pickingFolder}>
					{#if pickingFolder}
						<Spinner size="xs" />
					{:else}
						Browse
					{/if}
				</Button>
			</div>
		</div>

		{#if projectPath}
			<div class="wv-field">
				<label class="wv-label" for="wv-project-name">
					<Sparkles size={16} />
					<Text size="sm" weight="bold">Give your project a name</Text>
					<WizardHelpTip
						tip="This is what the active-project pill will show. Doesn't have to match the folder — pick the name you think about this project by."
						label="Can I rename it later?"
					/>
				</label>
				<div class="wv-folder-row">
					<input
						id="wv-project-name"
						type="text"
						placeholder="e.g. My SaaS MVP"
						bind:value={projectName}
						class="wv-input"
					/>
					<Button
						preset="button-primary"
						size="md"
						onclick={handleSaveProject}
						disabled={savingProject || projectName.trim().length === 0 || projectSaved}
					>
						{#if savingProject}
							<Spinner size="xs" />
						{:else if projectSaved}
							Saved ✓
						{:else}
							Save Project
						{/if}
					</Button>
				</div>
			</div>
		{/if}

		{#if projectError}
			<div class="wv-error-notice" role="alert">
				<div class="wv-error-head">
					<Text size="xs" weight="bold" class="wv-error-kicker">Save failed</Text>
					<button
						type="button"
						class="wv-error-dismiss"
						onclick={() => {
							projectError = null;
							projectErrorDetail = null;
						}}
						aria-label="Dismiss notice"
					>
						×
					</button>
				</div>
				<Text size="sm" class="wv-error-body">{projectError}</Text>
				{#if projectErrorDetail}
					<details class="wv-error-detail">
						<summary>What happened</summary>
						<code>{projectErrorDetail}</code>
					</details>
				{/if}
			</div>
		{/if}

		{#if projectSaved}
			<div class="wv-saved-notice" role="status">
				<div class="wv-saved-head">
					<Text size="xs" weight="bold" class="wv-saved-kicker">Project saved</Text>
					<button
						type="button"
						class="wv-saved-dismiss"
						onclick={() => {
							projectSaved = false;
						}}
						aria-label="Dismiss notice"
					>
						×
					</button>
				</div>
				<Text size="sm" class="wv-saved-body">
					<strong>{projectsState.activeProject?.name ?? projectName}</strong> is the
					active project. Indexing is pending — it will run automatically once an
					embedding model is loaded. You can continue with setup; the project will
					keep its state across restarts.
				</Text>
			</div>
		{/if}
	</div>

	<!-- Live hardware snapshot grid -->
	{#if hasHardware}
		<section class="wv-snapshot" aria-label="Hardware snapshot">
			<div class="wv-snapshot-head">
				<Text size="sm" weight="bold" class="wv-snapshot-kicker">What we found on your computer</Text>
				<WizardHelpTip
					tip="Auto-detected at boot. Drives the first recommended model plan. Override anytime in Config."
					label="Where does this come from?"
				/>
			</div>

			<div class="wv-snapshot-grid">
				<div class="wv-snapshot-row">
					<Monitor size={18} />
					<Text size="sm" weight="bold" class="wv-snapshot-label">Graphics</Text>
					<Text size="sm" class="wv-snapshot-value">{gpuName ?? "No GPU detected"}</Text>
					{#if vramTotalMb > 0}
						<span class="wv-snapshot-tag">{formatMb(vramTotalMb)} VRAM</span>
					{/if}
					<WizardHelpTip
						tip="Graphics card memory. More VRAM = larger models can run on GPU for fast inference."
						label="What is VRAM?"
					/>
				</div>

				<div class="wv-snapshot-row">
					<Cpu size={18} />
					<Text size="sm" weight="bold" class="wv-snapshot-label">Processor</Text>
					<Text size="sm" class="wv-snapshot-value">{cpuName ?? "Unknown CPU"}</Text>
					<WizardHelpTip
						tip="Fallback when no GPU is available. Smaller models still run well on modern CPUs."
						label="What does the CPU do?"
					/>
				</div>

				{#if ramTotalMb > 0}
					<div class="wv-snapshot-row">
						<Zap size={18} />
						<Text size="sm" weight="bold" class="wv-snapshot-label">Memory</Text>
						<Text size="sm" class="wv-snapshot-value">{formatMb(ramTotalMb)}</Text>
						<WizardHelpTip
							tip="System memory. Used for model weights before GPU upload and for CPU-only models."
							label="Why RAM matters"
						/>
					</div>
				{/if}

				{#if diskFreeMb > 0}
					<div class="wv-snapshot-row">
						<HardDrive size={18} />
						<Text size="sm" weight="bold" class="wv-snapshot-label">Disk free</Text>
						<Text size="sm" class="wv-snapshot-value">{formatMb(diskFreeMb)}</Text>
						<span class="wv-snapshot-tag">{modelCount} models</span>
					</div>
				{/if}
			</div>

			{#if gpuError && !gpuName}
				<Text size="sm" color="muted" class="wv-snapshot-note">{gpuError}</Text>
			{/if}
		</section>
	{:else}
		<div class="wv-snapshot wv-snapshot-loading">
			<Spinner size="md" tone="accent" />
			<Text size="sm" color="muted">Scanning your computer…</Text>
		</div>
	{/if}

	<!-- Action bar -->
	<div class="wv-actions">
		<Button preset="button-primary" size="lg" onclick={handleLetsGo} disabled={!overlayState.canContinue || savingProfile}>
			{#if savingProfile}
				<Spinner size="xs" />
				Saving…
			{:else}
				<Sparkles size={18} />
				Let's Go
			{/if}
		</Button>
		<Button preset="button-secondary" size="lg" onclick={handleJesseConfig} disabled={overlayState.loadingPreset}>
			{#if overlayState.loadingPreset}
				<Spinner size="xs" />
			{:else}
				<Settings size={18} />
			{/if}
			Jesse Config
		</Button>
	</div>

	{#if profileError}
		<Text size="sm" color="negative" class="wv-profile-error">{profileError}</Text>
	{/if}

	<button class="wv-skip" onclick={handleSkip}>
		Skip for now — I'll set this up later
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
		gap: clamp(1.5rem, 1rem + 2vw, 2.5rem);
		width: 100%;
		max-width: 56rem;
		padding: clamp(1.5rem, 1rem + 2vw, 2.5rem) 0;
		text-align: center;
	}

	/* ── Stage ─────────────────────────────────── */

	.wv-stage {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.875rem;
	}

	.wv-mascot {
		width: clamp(6rem, 5rem + 4vw, 9rem);
		height: clamp(6rem, 5rem + 4vw, 9rem);
		object-fit: contain;
		filter: drop-shadow(0 0 1.75rem color-mix(in oklch, var(--accent-teal-glow) 55%, transparent));
		animation: wv-float 4s ease-in-out infinite;
	}

	@keyframes wv-float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-0.5rem); }
	}

	.wv-kicker {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.375rem 0.875rem;
		border-radius: 999px;
		background: color-mix(in oklch, var(--accent-teal-fill) 92%, transparent);
		border: var(--border-width-hairline) solid color-mix(in oklch, var(--accent-teal-main) 40%, transparent);
		color: var(--accent-teal-main);
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	:global(.wv-subtitle) {
		max-width: 36rem;
		line-height: 1.55;
	}

	.wv-help-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-top: 0.25rem;
	}

	/* ── Form (surface-elevated card) ─────────── */

	.wv-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		width: 100%;
		max-width: 38rem;
		padding: clamp(1.25rem, 1rem + 1vw, 2rem);
		border-radius: 1rem;
		background: var(--surface-raised);
		border: var(--border-width-hairline) solid var(--border-subtle);
		box-shadow: 0 0.5rem 1.5rem color-mix(in oklch, var(--surface-base) 60%, transparent);
		text-align: left;
	}

	.wv-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.wv-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-secondary);
	}

	.wv-input {
		padding: 0.875rem 1rem;
		border-radius: 0.625rem;
		border: var(--border-width-hairline) solid var(--border-subtle);
		background: var(--surface-base);
		color: var(--text-primary);
		font-size: 1rem;
		line-height: 1.4;
		outline: none;
		transition:
			border-color 150ms ease-out,
			box-shadow 150ms ease-out;
	}
	.wv-input:focus {
		border-color: var(--accent-teal-main);
		box-shadow: 0 0 0 0.1875rem color-mix(in oklch, var(--accent-teal-main) 25%, transparent);
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
		gap: 0.625rem;
	}

	.wv-levels {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.wv-level {
		flex: 1;
		min-width: 8rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 1rem 1.125rem;
		border-radius: 0.75rem;
		border: 0.0625rem solid color-mix(in oklch, var(--level-accent) 55%, transparent);
		background:
			linear-gradient(
				135deg,
				color-mix(in oklch, var(--level-accent) 38%, transparent),
				color-mix(in oklch, var(--level-accent) 14%, transparent)
			);
		cursor: pointer;
		text-align: left;
		transition: border-color 180ms ease-out, background 180ms ease-out, box-shadow 180ms ease-out, transform 180ms ease-out;
		box-shadow:
			0 0 0.75rem color-mix(in oklch, var(--level-glow) 35%, transparent),
			inset 0 0 1rem color-mix(in oklch, var(--level-accent) 18%, transparent);
	}
	.wv-level:hover {
		border-color: color-mix(in oklch, var(--level-accent) 80%, transparent);
		background:
			linear-gradient(
				135deg,
				color-mix(in oklch, var(--level-accent) 55%, transparent),
				color-mix(in oklch, var(--level-accent) 24%, transparent)
			);
		box-shadow:
			0 0 1.25rem color-mix(in oklch, var(--level-glow) 60%, transparent),
			inset 0 0 1.25rem color-mix(in oklch, var(--level-accent) 28%, transparent);
		transform: translateY(-0.0625rem);
	}
	.wv-level-active {
		border: 0.125rem solid var(--level-accent);
		background:
			linear-gradient(
				135deg,
				color-mix(in oklch, var(--level-accent) 75%, transparent),
				color-mix(in oklch, var(--level-accent) 38%, transparent)
			);
		box-shadow:
			0 0 0 0.0625rem var(--level-accent),
			0 0 2rem color-mix(in oklch, var(--level-glow) 90%, transparent),
			inset 0 0 1.5rem color-mix(in oklch, var(--level-accent) 30%, transparent);
	}
	.wv-level-name {
		font-size: 1.0625rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	.wv-level-active .wv-level-name {
		color: var(--level-accent);
	}
	.wv-level-desc {
		font-size: 0.875rem;
		color: var(--text-muted);
		line-height: 1.4;
	}

	/* ── Hardware snapshot ─────────────────────── */

	.wv-snapshot {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		width: 100%;
		max-width: 38rem;
		padding: clamp(1rem, 0.75rem + 1vw, 1.5rem);
		border-radius: 1rem;
		background: var(--surface-raised);
		border: var(--border-width-hairline) solid var(--border-subtle);
		box-shadow: 0 0.5rem 1.5rem color-mix(in oklch, var(--surface-base) 60%, transparent);
		text-align: left;
	}

	.wv-snapshot-loading {
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 0.625rem;
	}

	.wv-snapshot-head {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	:global(.wv-snapshot-kicker) {
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-secondary);
	}

	.wv-snapshot-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.wv-snapshot-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		border-radius: 0.75rem;
		background: var(--surface-base);
		border: var(--border-width-hairline) solid var(--border-soft);
		color: var(--text-secondary);
	}

	:global(.wv-snapshot-label) {
		min-width: 5rem;
		color: var(--text-muted);
	}

	:global(.wv-snapshot-value) {
		flex: 1;
		color: var(--text-primary);
	}

	.wv-snapshot-tag {
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		background: color-mix(in oklch, var(--accent-teal-fill) 88%, transparent);
		color: var(--accent-teal-main);
		font-size: 0.8125rem;
		font-weight: 700;
		white-space: nowrap;
	}

	:global(.wv-snapshot-note) {
		color: var(--text-muted);
	}

	/* ── Actions ───────────────────────────────── */

	.wv-actions {
		display: flex;
		gap: clamp(0.75rem, 2vw, 1.25rem);
		flex-wrap: wrap;
		justify-content: center;
		margin-top: 0.25rem;
	}

	:global(.wv-profile-error) {
		display: block;
		margin-top: 0.5rem;
		text-align: center;
		color: var(--danger-main, var(--signal-error));
	}

	.wv-skip {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		transition:
			color 200ms ease-out,
			background 200ms ease-out;
	}
	.wv-skip:hover {
		color: var(--accent-teal-main);
		background: color-mix(in oklch, var(--accent-teal-fill) 60%, transparent);
	}

	/* ── Invalid input (email required) ──────────────────────────── */
	.wv-input-invalid {
		border-color: var(--signal-error, #e74c3c);
		box-shadow: 0 0 0 0.1875rem color-mix(in oklch, var(--signal-error, #e74c3c) 30%, transparent);
	}

	/* ── Pending-indexing notice after "Save Project" ────────────── */
	.wv-saved-notice {
		margin-top: 0.25rem;
		padding: 0.75rem 1rem;
		border: 1px solid color-mix(in oklch, var(--accent-purple-main, #8b5cf6) 35%, var(--border-soft));
		border-radius: 0.5rem;
		background: var(
			--gradient-glow-purple,
			linear-gradient(135deg, color-mix(in oklch, var(--accent-purple-main, #8b5cf6) 18%, transparent), transparent 70%)
		);
		box-shadow: 0 0.5rem 1.5rem color-mix(in oklch, var(--accent-purple-main, #8b5cf6) 15%, transparent);
	}
	.wv-saved-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.375rem;
	}
	:global(.wv-saved-kicker) {
		color: var(--accent-purple-main, var(--accent-teal-main));
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.wv-saved-dismiss {
		width: 1.25rem;
		height: 1.25rem;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 1.125rem;
		line-height: 1;
		border-radius: 0.25rem;
	}
	.wv-saved-dismiss:hover {
		color: var(--text-primary);
		background: color-mix(in oklch, var(--text-primary) 12%, transparent);
	}
	:global(.wv-saved-body) {
		color: var(--text-secondary);
		line-height: 1.4;
	}
	:global(.wv-saved-body) strong {
		color: var(--accent-purple-main, var(--accent-teal-main));
	}

	/* ── Save-failed notice (mirrors saved-notice shape, error tone) ── */
	.wv-error-notice {
		margin-top: 0.25rem;
		padding: 0.75rem 1rem;
		border: 1px solid color-mix(in oklch, var(--signal-error, #e74c3c) 45%, var(--border-soft));
		border-radius: 0.5rem;
		background: linear-gradient(
			135deg,
			color-mix(in oklch, var(--signal-error, #e74c3c) 16%, transparent),
			transparent 70%
		);
		box-shadow: 0 0.5rem 1.5rem color-mix(in oklch, var(--signal-error, #e74c3c) 15%, transparent);
	}
	.wv-error-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.375rem;
	}
	:global(.wv-error-kicker) {
		color: var(--signal-error, #e74c3c);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.wv-error-dismiss {
		width: 1.25rem;
		height: 1.25rem;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 1.125rem;
		line-height: 1;
		border-radius: 0.25rem;
	}
	.wv-error-dismiss:hover {
		color: var(--text-primary);
		background: color-mix(in oklch, var(--text-primary) 12%, transparent);
	}
	:global(.wv-error-body) {
		color: var(--text-secondary);
		line-height: 1.4;
	}
	.wv-error-detail {
		margin-top: 0.5rem;
		font-size: 0.75rem;
		color: var(--text-muted);
	}
	.wv-error-detail summary {
		cursor: pointer;
		user-select: none;
		color: var(--text-muted);
	}
	.wv-error-detail summary:hover {
		color: var(--text-secondary);
	}
	.wv-error-detail code {
		display: block;
		margin-top: 0.375rem;
		padding: 0.5rem 0.625rem;
		border-radius: 0.375rem;
		background: color-mix(in oklch, var(--surface-raised) 92%, transparent);
		border: 1px solid var(--border-soft);
		color: var(--text-primary);
		font-family: var(--font-mono, ui-monospace, SFMono-Regular, monospace);
		font-size: 0.7rem;
		white-space: pre-wrap;
		word-break: break-word;
	}
</style>
