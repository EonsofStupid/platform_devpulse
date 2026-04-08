<!--
  @file ProjectSetupStep.svelte
  "About You" — name, experience, project folder.
  Uses pick_directory and create_dev_profile (now exist).
  ColdLight tokens. All optional.
-->
<script lang="ts">
import { ArrowLeft, ArrowRight, Code, FolderOpen, User } from "lucide-svelte";
import { wizardState } from "../wizard.runes.svelte.js";

interface Props {
	onContinue: () => void;
	onBack: () => void;
}
let { onContinue, onBack }: Props = $props();

let devName = $state("");
let experienceLevel = $state<"beginner" | "intermediate" | "advanced">("intermediate");
let projectPath = $state("");
let saving = $state(false);

async function handleBrowse(): Promise<void> {
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		const result = await invoke<string>("pick_directory", { title: "Select your project folder" });
		if (result) projectPath = result;
	} catch {
		// User cancelled — fine
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
		wizardState.devProfileExists = true;
	} catch (e) {
		// Non-fatal — profile creation failing shouldn't block wizard
		console.error("[ProjectSetupStep] Profile save failed:", e);
	}
	saving = false;
	onContinue();
}

const LEVELS = [
	{
		value: "beginner" as const,
		label: "Beginner",
		desc: "New to coding or AI tools",
		color: "var(--wiz-green)",
	},
	{
		value: "intermediate" as const,
		label: "Intermediate",
		desc: "Comfortable with code, exploring AI",
		color: "var(--wiz-blue)",
	},
	{
		value: "advanced" as const,
		label: "Advanced",
		desc: "Professional developer, power user",
		color: "var(--wiz-coral)",
	},
];
</script>

<div class="project-step">
	<h2 class="step-title">About You</h2>
	<p class="step-desc">Help Clyffy understand how to help you. All optional — skip if you want.</p>

	<!-- Name -->
	<div class="field">
		<label class="field-label"><User size={14} /> Your Name</label>
		<input
			class="field-input"
			type="text"
			placeholder="What should Clyffy call you?"
			bind:value={devName}
		/>
	</div>

	<!-- Experience -->
	<div class="field">
		<label class="field-label"><Code size={14} /> Experience Level</label>
		<div class="level-cards">
			{#each LEVELS as level (level.value)}
				<button
					class="level-card"
					class:selected={experienceLevel === level.value}
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
			<input
				class="field-input folder-input"
				type="text"
				placeholder="Optional — select your main project"
				value={projectPath}
				readonly
			/>
			<button class="btn-browse" onclick={handleBrowse}>Browse</button>
		</div>
		<span class="field-hint">Clyffy can index your code to give better help. You can add this later.</span>
	</div>

	<!-- Navigation -->
	<div class="nav">
		<button class="btn-back" onclick={onBack}><ArrowLeft size={14} /> Back</button>
		<button class="btn-continue" onclick={handleContinue} disabled={saving}>
			{devName ? `Let's go, ${devName}!` : "Continue"} <ArrowRight size={14} />
		</button>
	</div>
</div>

<style>
	.project-step {
		display: flex; flex-direction: column; gap: 1.25rem;
		width: 100%; max-width: 28rem;
	}
	.step-title { font-size: 1.25rem; font-weight: 800; color: var(--wiz-text); margin: 0; }
	.step-desc { font-size: var(--wiz-text-sm); color: var(--wiz-text-sub); margin: 0; }

	.field { display: flex; flex-direction: column; gap: 0.375rem; }
	.field-label {
		display: flex; align-items: center; gap: 0.375rem;
		font-size: var(--wiz-text-sm); font-weight: 600; color: var(--wiz-text-sub);
	}
	.field-input {
		padding: 0.5rem 0.75rem; border-radius: var(--wiz-radius-md);
		border: 1px solid var(--wiz-border); background: var(--wiz-inset);
		color: var(--wiz-text); font-size: var(--wiz-text-sm); outline: none;
	}
	.field-input:focus { border-color: var(--wiz-border-focus); }
	.field-input::placeholder { color: var(--wiz-text-muted); }
	.field-hint { font-size: var(--wiz-text-xs); color: var(--wiz-text-muted); }

	.folder-row { display: flex; gap: 0.5rem; }
	.folder-input { flex: 1; cursor: default; }
	.btn-browse {
		padding: 0.5rem 0.75rem; border-radius: var(--wiz-radius-md);
		border: 1px solid var(--wiz-border); background: transparent;
		color: var(--wiz-text-sub); font-size: var(--wiz-text-sm); cursor: pointer;
	}
	.btn-browse:hover { border-color: var(--wiz-cyan); color: var(--wiz-text); }

	.level-cards { display: flex; gap: 0.5rem; }
	.level-card {
		flex: 1; display: flex; flex-direction: column; gap: 0.125rem;
		padding: 0.625rem 0.75rem; border-radius: var(--wiz-radius-md);
		border: 1px solid var(--wiz-border); background: transparent;
		cursor: pointer; text-align: left; transition: all var(--wiz-duration-fast);
	}
	.level-card:hover { border-color: var(--wiz-void-500); }
	.level-card.selected {
		border-color: var(--level-color); background: var(--wiz-card);
	}
	.level-name { font-size: var(--wiz-text-sm); font-weight: 700; color: var(--wiz-text); }
	.level-desc { font-size: var(--wiz-text-xs); color: var(--wiz-text-muted); }

	.nav { display: flex; justify-content: space-between; align-items: center; padding-top: 0.5rem; }
	.btn-back {
		display: inline-flex; align-items: center; gap: 0.375rem;
		padding: 0.5rem 1rem; border-radius: var(--wiz-radius-md); border: none;
		background: transparent; color: var(--wiz-text-muted); font-size: var(--wiz-text-sm); cursor: pointer;
	}
	.btn-continue {
		display: inline-flex; align-items: center; gap: 0.375rem;
		padding: 0.5rem 1.5rem; border-radius: var(--wiz-radius-md); border: none;
		background: var(--wiz-cyan); color: var(--wiz-void-950);
		font-size: var(--wiz-text-sm); font-weight: 700; cursor: pointer;
	}
	.btn-continue:hover { filter: brightness(1.15); }
	.btn-continue:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
