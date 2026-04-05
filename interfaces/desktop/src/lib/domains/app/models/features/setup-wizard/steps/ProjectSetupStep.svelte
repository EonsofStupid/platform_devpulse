<!--
  @file ProjectSetupStep.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/ProjectSetupStep

  Phase 5. Dogfood profile check. Offer to index DevPulse codebase.
  Indexing WILL fail (RAG not wired) — error displayed raw. Skip always available.
-->
<script lang="ts">
import { ArrowLeft, Database, FolderOpen } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { wizardState } from "../wizard.runes.svelte.js";

interface Props {
	onContinue: () => void;
	onBack: () => void;
}

let { onContinue, onBack }: Props = $props();

let selectedOption = $state<"devpulse" | "browse" | "skip">("devpulse");
let creatingProfile = $state(false);
let error = $state<string | null>(null);

async function handleFinish(): Promise<void> {
	if (!wizardState.devProfileExists) {
		await createDevProfile();
	}
	onContinue();
}

async function createDevProfile(): Promise<void> {
	creatingProfile = true;
	error = null;
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		const profile = {
			type: "dev",
			created: new Date().toISOString(),
			selectedOption,
			indexedProjects: [],
		};
		await invoke("set_preference", {
			key: "dev_profile",
			value: JSON.stringify(profile),
		});
		wizardState.devProfileExists = true;
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	} finally {
		creatingProfile = false;
	}
}
</script>

<div class={`${stack({ gap: "6" })} w-full flex-1`}>
	<Text size="lg" weight="bold" color="primary">Project Setup</Text>

	<!-- Clyffy narration -->
	<div
		class={cn(box({ paddingX: "12", paddingY: "8" }), "rounded-lg border")}
		style="background: var(--surface-elevated); border-color: var(--border-subtle);"
	>
		<Text size="sm" color="secondary">
			Last step. Let's give me something to work with.
		</Text>
	</div>

	<!-- Options -->
	<div class={stack({ gap: "4" })}>
		<label
			class={cn("flex gap-3 rounded-lg p-4 cursor-pointer border transition-colors")}
			style="background: var(--surface-base); border-color: {selectedOption === 'devpulse' ? 'var(--accent-teal-main)' : 'var(--border-subtle)'};"
		>
			<input
				type="radio"
				name="project-option"
				value="devpulse"
				checked={selectedOption === "devpulse"}
				onchange={() => (selectedOption = "devpulse")}
				class="sr-only"
			/>
			<Database size={16} class="shrink-0 mt-0.5" style="color: var(--text-secondary);" />
			<div class={stack({ gap: "1" })}>
				<Text size="sm" weight="bold" color="primary">
					Index DevPulse source (recommended)
				</Text>
				<Text size="xs" color="muted">
					Path: D:\localdev\platform_devpulse\
				</Text>
			</div>
		</label>

		<label
			class={cn("flex gap-3 rounded-lg p-4 cursor-pointer border transition-colors")}
			style="background: var(--surface-base); border-color: {selectedOption === 'browse' ? 'var(--accent-teal-main)' : 'var(--border-subtle)'};"
		>
			<input
				type="radio"
				name="project-option"
				value="browse"
				checked={selectedOption === "browse"}
				onchange={() => (selectedOption = "browse")}
				class="sr-only"
			/>
			<FolderOpen size={16} class="shrink-0 mt-0.5" style="color: var(--text-secondary);" />
			<div class={stack({ gap: "1" })}>
				<Text size="sm" weight="bold" color="primary">Add a different project</Text>
				<Text size="xs" color="muted">Browse for a project folder</Text>
			</div>
		</label>

		<label
			class={cn("flex gap-3 rounded-lg p-4 cursor-pointer border transition-colors")}
			style="background: var(--surface-base); border-color: {selectedOption === 'skip' ? 'var(--accent-teal-main)' : 'var(--border-subtle)'};"
		>
			<input
				type="radio"
				name="project-option"
				value="skip"
				checked={selectedOption === "skip"}
				onchange={() => (selectedOption = "skip")}
				class="sr-only"
			/>
			<div class={stack({ gap: "1" })}>
				<Text size="sm" weight="bold" color="primary">Skip for now</Text>
				<Text size="xs" color="muted">Can add projects later from settings</Text>
			</div>
		</label>
	</div>

	<!-- Indexing best practices -->
	<div class={stack({ gap: "2" })}>
		<Text size="xs" weight="bold" color="secondary">Indexing Best Practices</Text>
		<Text size="xs" color="muted">
			.git, node_modules, dist, target/ excluded by default. Files &gt;500KB skipped.
			Chunking: semantic (code-aware). Re-index detects changed files only.
		</Text>
	</div>

	<!-- Warning about RAG -->
	<div
		class={cn(box({ paddingX: "8", paddingY: "4" }), "rounded border")}
		style="background: var(--signal-warning); border-color: var(--border-subtle);"
	>
		<Text size="xs" color="primary">
			Project indexing requires the search pipeline (not yet wired). Attempting to index will show a real error. You can skip for now.
		</Text>
	</div>

	<!-- Error -->
	{#if error}
		<div
			class={cn(box({ paddingX: "12", paddingY: "8" }), "rounded-md")}
			style="background: var(--signal-error); color: var(--text-primary);"
		>
			<Text size="xs" color="primary">{error}</Text>
		</div>
	{/if}

	<!-- Navigation -->
	<div class={hstack({ gap: "4", align: "center", justify: "between" })}>
		<button
			class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
			style="color: var(--text-muted);"
			onclick={onBack}
			aria-label="Back to Clyffy activation"
		>
			<ArrowLeft size={14} />
			Back
		</button>
		<button
			class="flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold transition-all disabled:opacity-40"
			style="background: var(--accent-teal-main); color: var(--surface-base);"
			onclick={handleFinish}
			disabled={creatingProfile}
			aria-label="Finish setup"
		>
			{creatingProfile ? "Setting up..." : "Finish"}
		</button>
	</div>
</div>
