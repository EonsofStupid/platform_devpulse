<!--
	@feature EmbedderPicker
	@module @devpulse/domains/profile/feature

	Clyffy's encoder/embedder picker — post-login. Two cards composed
	from ColdLight primitives with distinct presets so the surface
	hierarchy reads at a glance:

	  1. Primary `<Card preset="glass">` — embedder repo input + Apply
	     button + live status (currently using / recommended / applied
	     / failed).
	  2. Minion `<Card preset="matte">` — read-only "auto-managed"
	     section showing the helper-process variant. Lower visual
	     weight, no actionable controls.

	Every visible string flows from `wizardCopy.runtime_picker` via
	`getWizardCopy()`. The TextField + Button primitives carry their
	own ARIA via `useTextField` / `useButton` behaviors — no manual
	`aria-label` plumbing here.

	The status `<Text>` flips between `role="status"` (idle / success /
	in-flight) and `role="alert"` (failed) so AT users hear errors
	immediately but aren't spammed by non-failure transitions.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import { TextField } from "@devpulse/coldlight/components/text-field";
import { commands, type RuntimePickerCopy } from "#lib/sys/generated/bindings.js";
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

<div class={className ? `embedder-picker ${className}` : "embedder-picker"}>
	<Card surface="glass" variant="deep" class="embedder-picker__primary" labelledBy="embedder-heading">
		<header class="embedder-picker__header">
			<Heading level={2} size="md">
				<span id="embedder-heading">{copy.heading}</span>
			</Heading>
			<Text size="sm" as="p" weight="normal">{copy.subtitle}</Text>
		</header>

		<form class="embedder-picker__form" onsubmit={handleSubmit} novalidate>
			<TextField
				label={copy.repo_field_label}
				placeholder={copy.repo_field_placeholder}
				description={copy.repo_field_aria}
				autocomplete="off"
				spellcheck={false}
				bind:value={profileState.pendingRepoId}
			/>

			<div class="embedder-picker__actions">
				<Button
					variant="primary"
					size="md"
					type="submit"
					aria-label={copy.apply_aria}
					disabled={busy}
				>
					{applyLabel}
				</Button>
			</div>

			<Text size="sm" as="p" weight="normal" role={statusRole}>
				{statusText}
			</Text>
		</form>
	</Card>

	<Card surface="neuro" variant="solid" class="embedder-picker__minion" labelledBy="minion-heading">
		<header class="embedder-picker__header embedder-picker__header--minor">
			<Heading level={2} size="sm">
				<span id="minion-heading">{copy.minion_section_heading}</span>
			</Heading>
			<Text size="xs" as="p" weight="normal">{minionSubtitle}</Text>
		</header>
	</Card>
</div>

<style>
	/* Layout-only. Visual chrome flows from each Card's preset. */
	.embedder-picker {
		display: flex;
		flex-direction: column;
		gap: var(--space-14);
		width: 100%;
		max-width: 36rem;
		margin: 0 auto;
	}

	/* Card layout overrides. `:global()` — class is passed to a child
	   `<Card>` component; Svelte's per-file scoper can't track classes
	   across the component boundary. */
	:global(.embedder-picker__primary) {
		gap: var(--space-12);
		padding: var(--space-18);
	}

	:global(.embedder-picker__minion) {
		gap: var(--space-7);
		padding: var(--space-14) var(--space-18);
	}

	.embedder-picker__header {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.embedder-picker__form {
		display: flex;
		flex-direction: column;
		gap: var(--space-10);
	}

	.embedder-picker__actions {
		display: flex;
		justify-content: flex-end;
	}
</style>
