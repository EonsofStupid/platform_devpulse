<!--
  @file About You — Developer Profile
  @route /model-loader/profile
  @domain models

  Optional: name, experience level, project folder. All skippable.
  ColdLight components. SvelteKit goto() for navigation.
-->
<script lang="ts">
import { ArrowLeft, ArrowRight, Code, FolderOpen, User } from "lucide-svelte";
import { goto } from "$app/navigation";
import { Button } from "$lib/design/components/button/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import {
	WizardHelpTip,
	WizardInfoPopup,
} from "$lib/domains/app/models/features/setup-wizard/index.js";

let devName = $state("");
let experienceLevel = $state<"beginner" | "intermediate" | "advanced">("intermediate");
let projectPath = $state("");
let saving = $state(false);
let showPageHelp = $state(false);

async function handleBrowse(): Promise<void> {
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		const result = await invoke<string>("pick_directory", { title: "Select your project folder" });
		if (result) projectPath = result;
	} catch {
		/* cancelled */
	}
}

async function handleContinue(): Promise<void> {
	saving = true;
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		await invoke("create_dev_profile", {
			name: devName || "Developer",
			experience: experienceLevel,
			projectPath: projectPath || null,
		});
	} catch (e) {
		console.error("[profile] Save failed:", e);
	}
	saving = false;
	goto("/model-loader/complete");
}

const LEVELS = [
	{
		value: "beginner" as const,
		label: "Beginner",
		desc: "New to coding or AI tools",
		color: "var(--brand-green)",
	},
	{
		value: "intermediate" as const,
		label: "Intermediate",
		desc: "Comfortable with code, exploring AI",
		color: "var(--brand-blue)",
	},
	{
		value: "advanced" as const,
		label: "Advanced",
		desc: "Professional developer, power user",
		color: "var(--brand-coral)",
	},
];
</script>

<div class="profile-page">
	<Text size="xl" weight="bold">About You</Text>
	<Text size="sm" color="secondary">Help Clyffy understand how to help you. All optional — skip if you want.</Text>
	<div class="help-row">
		<WizardHelpTip tip="These settings personalize guidance. They do not block model loading." />
		<Button preset="ghost" size="sm" onclick={() => (showPageHelp = true)}>
			Why this matters
		</Button>
	</div>

	<!-- Name -->
	<div class="field">
		<label class="field-label"><User size={14} /> Your Name</label>
		<input class="field-input" type="text" placeholder="What should Clyffy call you?" bind:value={devName} />
	</div>

	<!-- Experience -->
	<div class="field">
		<label class="field-label"><Code size={14} /> Experience Level</label>
		<div class="level-cards">
			{#each LEVELS as level (level.value)}
				<button
					class="level-card" class:selected={experienceLevel === level.value}
					style="--level-color: {level.color};"
					onclick={() => (experienceLevel = level.value)}
				>
					<span class="level-name">{level.label}</span>
					<span class="level-desc">{level.desc}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Project folder -->
	<div class="field">
		<label class="field-label"><FolderOpen size={14} /> Project Folder</label>
		<div class="folder-row">
			<input class="field-input folder-input" type="text" placeholder="Optional — select your main project" value={projectPath} readonly />
			<Button preset="secondary" size="sm" onclick={handleBrowse}>Browse</Button>
		</div>
		<Text size="xs" color="muted">Clyffy can index your code to give better help. You can add this later.</Text>
	</div>

	<!-- Nav -->
	<div class="nav">
		<Button preset="ghost" size="sm" onclick={() => goto("/model-loader/activate")}>
			<ArrowLeft size={14} /> Back
		</Button>
		<Button preset="primary" size="md" onclick={handleContinue} disabled={saving}>
			{devName ? `Let's go, ${devName}!` : "Continue"} <ArrowRight size={14} />
		</Button>
	</div>
</div>

<WizardInfoPopup
	open={showPageHelp}
	title="Profile Personalization"
	summary="This step tunes how Clyffy explains things to you. It is optional."
	points={[
		"Name: makes responses more natural.",
		"Experience level: controls explanation depth.",
		"Project folder: improves code-aware answers later.",
		"You can change all of this anytime.",
	]}
	imageSrc="/imgs/mascot/clyffy-anim-blinking.png"
	onClose={() => (showPageHelp = false)}
/>

<style>
	.profile-page {
		display: flex; flex-direction: column; gap: 1.25rem;
		width: 100%; max-width: 28rem;
	}
	.help-row {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.375rem;
	}
	.field { display: flex; flex-direction: column; gap: 0.375rem; }
	.field-label {
		display: flex; align-items: center; gap: 0.375rem;
		font-size: 0.875rem; font-weight: 600; color: var(--text-secondary);
	}
	.field-input {
		padding: 0.5rem 0.75rem; border-radius: 0.5rem;
		border: var(--border-preset-default-width) solid var(--border-subtle);
		background: var(--matte-dark);
		color: var(--text-primary); font-size: 0.875rem; outline: none;
	}
	.field-input:focus { border-color: var(--brand-cyan); }
	.field-input::placeholder { color: var(--text-muted); }

	.folder-row { display: flex; gap: 0.5rem; }
	.folder-input { flex: 1; cursor: default; }

	.level-cards { display: flex; gap: 0.5rem; }
	.level-card {
		flex: 1; display: flex; flex-direction: column; gap: 0.125rem;
		padding: 0.625rem 0.75rem; border-radius: 0.5rem;
		border: var(--border-preset-default-width) solid var(--border-subtle); background: transparent;
		cursor: pointer; text-align: left; transition: var(--transition-all-fast);
	}
	.level-card:hover { border-color: var(--color-void-500); }
	.level-card.selected {
		border-color: var(--level-color);
		background: var(--glass-deep);
	}
	.level-name { font-size: 0.875rem; font-weight: 700; color: var(--text-primary); }
	.level-desc { font-size: 0.75rem; color: var(--text-muted); }

	.nav { display: flex; justify-content: space-between; padding-top: 0.5rem; }
</style>
