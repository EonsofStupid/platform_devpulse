<!--
	@feature EmbedderPicker
	@module @devpulse/domains/profile/feature

	Clyffy's encoder/embedder picker — post-login. Renders two cards
	with distinct surface tokens (per the user's "different styled
	components with different surface colors" intent):

	  1. The PRIMARY card — embedder repo input + Apply button + live
	     status (currently using / recommended / applied / failed). Uses
	     `--surface-overlay` for prominence.
	  2. The MINION card — read-only "auto-managed" section showing
	     which small variant the helper processes use. Uses
	     `--surface-base` with `--border-subtle` so it reads as
	     secondary information, not actionable.

	All strings flow from `wizardCopy.runtime_picker` via `getWizardCopy()`.

	ARIA: each card is a `<section>` with `aria-labelledby`. The picker
	form uses an `<output role="status">` `aria-live="polite"` region
	for the apply phase status, switching to `role="alert"` on the
	failed phase so AT users hear the error immediately.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { commands, type RuntimePickerCopy } from "$lib/sys/generated/bindings.js";
import { profileState } from "../index.js";

interface Props {
	class?: string;
}

let { class: className }: Props = $props();

let copy = $state<RuntimePickerCopy>(emptyCopy());

$effect(() => {
	commands.getWizardCopy().then((res) => {
		if (res.status === "ok" && res.data.runtime_picker) {
			copy = res.data.runtime_picker;
		}
	});
});

$effect(() => {
	profileState.init();
});

const statusText = $derived.by(() => {
	switch (profileState.phase) {
		case "idle":
			if (profileState.currentRepoId) {
				return copy.status_currently_using_template.replace("{repo}", profileState.currentRepoId);
			}
			return copy.status_recommended_template.replace("{repo}", profileState.recommendedRepoId);
		case "resolving":
		case "downloading":
		case "loading":
			return copy.apply_busy_label;
		case "applied":
			return copy.status_applied_template
				.replace("{repo}", profileState.currentRepoId ?? "")
				.replace("{size_mb}", "—");
		case "failed":
			return copy.status_failed_template.replace("{error}", profileState.applyError ?? "");
	}
});

const busy = $derived(
	profileState.phase === "resolving" ||
		profileState.phase === "downloading" ||
		profileState.phase === "loading",
);

const applyLabel = $derived(busy ? copy.apply_busy_label : copy.apply_label);
const statusRole = $derived(profileState.phase === "failed" ? "alert" : "status");

const minionSubtitle = $derived(
	copy.minion_section_subtitle_template.replace("{repo}", profileState.minionRepoId),
);

async function handleSubmit(event: SubmitEvent): Promise<void> {
	event.preventDefault();
	if (busy) return;
	if (profileState.phase === "failed") profileState.reset();
	await profileState.apply();
}

function emptyCopy(): RuntimePickerCopy {
	return {
		heading: "",
		subtitle: "",
		repo_field_label: "",
		repo_field_placeholder: "",
		repo_field_aria: "",
		apply_label: "",
		apply_aria: "",
		apply_busy_label: "",
		status_currently_using_template: "",
		status_recommended_template: "",
		status_applied_template: "",
		status_failed_template: "",
		minion_section_heading: "",
		minion_section_subtitle_template: "",
	};
}
</script>

<div class={cn("embedder-picker", className)}>
	<section class="embedder-picker__primary" aria-labelledby="embedder-heading">
		<header class="embedder-picker__header">
			<h2 id="embedder-heading" class="embedder-picker__heading">{copy.heading}</h2>
			<p class="embedder-picker__subtitle">{copy.subtitle}</p>
		</header>

		<form class="embedder-picker__form" onsubmit={handleSubmit} novalidate>
			<label for="embedder-repo" class="embedder-picker__label">{copy.repo_field_label}</label>
			<div class="embedder-picker__input-row">
				<input
					id="embedder-repo"
					type="text"
					class="embedder-picker__input"
					placeholder={copy.repo_field_placeholder}
					aria-label={copy.repo_field_aria}
					autocomplete="off"
					spellcheck="false"
					bind:value={profileState.pendingRepoId}
				/>
				<button
					type="submit"
					class="embedder-picker__apply"
					aria-label={copy.apply_aria}
					disabled={busy}
				>
					{applyLabel}
				</button>
			</div>

			<output class="embedder-picker__status" role={statusRole} aria-live="polite">
				{statusText}
			</output>
		</form>
	</section>

	<section class="embedder-picker__minion" aria-labelledby="minion-heading">
		<header class="embedder-picker__header">
			<h2 id="minion-heading" class="embedder-picker__heading embedder-picker__heading--minor">
				{copy.minion_section_heading}
			</h2>
			<p class="embedder-picker__subtitle">{minionSubtitle}</p>
		</header>
	</section>
</div>

<style>
	.embedder-picker {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
		width: 100%;
		max-width: 36rem;
		margin: 0 auto;
	}

	.embedder-picker__primary {
		display: flex;
		flex-direction: column;
		gap: var(--space-12);
		padding: var(--space-18);
		border-radius: var(--radius-lg);
		background: var(--surface-overlay);
		border: 0.0625rem solid var(--border-subtle);
		box-shadow: 0 0.25rem 1rem var(--overlay-scrim, transparent);
	}

	.embedder-picker__minion {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		padding: var(--space-14) var(--space-18);
		border-radius: var(--radius-md);
		background: var(--surface-base);
		border: 0.0625rem solid var(--border-subtle);
	}

	.embedder-picker__header {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.embedder-picker__heading {
		margin: 0;
		font-size: var(--space-16);
		font-weight: 600;
		color: var(--text-primary);
	}

	.embedder-picker__heading--minor {
		font-size: var(--space-14);
		color: var(--text-secondary);
	}

	.embedder-picker__subtitle {
		margin: 0;
		font-size: var(--space-12);
		color: var(--text-muted);
	}

	.embedder-picker__form {
		display: flex;
		flex-direction: column;
		gap: var(--space-10);
	}

	.embedder-picker__label {
		font-size: var(--space-12);
		font-weight: 500;
		color: var(--text-secondary);
	}

	.embedder-picker__input-row {
		display: flex;
		gap: var(--space-8);
	}

	.embedder-picker__input {
		flex: 1;
		min-width: 0;
		padding: var(--space-8) var(--space-12);
		border-radius: var(--radius-md);
		background: var(--surface-inset);
		border: 0.0625rem solid var(--border-subtle);
		color: var(--text-primary);
		font-size: var(--space-12);
		font-family: var(--font-family-mono, monospace);
		outline: none;
	}

	.embedder-picker__input:focus-visible {
		border-color: var(--border-focus);
	}

	.embedder-picker__apply {
		padding: var(--space-8) var(--space-16);
		border-radius: var(--radius-md);
		background: var(--accent-purple-main);
		color: var(--text-on-accent, var(--text-primary));
		border: none;
		font-size: var(--space-12);
		font-weight: 600;
		cursor: pointer;
	}

	.embedder-picker__apply:hover:not(:disabled) {
		opacity: 0.9;
	}

	.embedder-picker__apply:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.embedder-picker__apply:focus-visible {
		outline: 0.125rem solid var(--border-focus);
		outline-offset: 0.125rem;
	}

	.embedder-picker__status {
		display: block;
		padding: var(--space-8) var(--space-12);
		border-radius: var(--radius-sm);
		background: var(--surface-inset);
		font-size: var(--space-12);
		color: var(--text-secondary);
		font-variant-numeric: tabular-nums;
	}
</style>
