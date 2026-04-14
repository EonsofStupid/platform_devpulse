<!--
  @file ClyffyLoadSpinner.svelte
  @domain models/setup-wizard

  Load-stage indicator for a single slot. Replaces whatever content
  a RoleCard is showing while its `activeLoads[slotId]` tracker is
  non-null. Reads a `LoadingTracker` from parent state — the
  `download-bootstrap.ts` event bridge keeps it in sync with the
  kernel's real `LoadingStage` / `LoadingComplete` / `LoadingFailed`
  events.

  **Visual**
  - Animated Clyffy mascot GIF on the left (clyffyloading.gif — the
    pre-existing loading animation in `static/imgs/mascot/`).
  - Stage label + percent on the right, updating live as the kernel
    moves through mmap -> memory -> warmup -> ready.
  - Progress bar tinted with the role accent.
  - Error state: swaps to a warning glyph + Retry button that
    re-dispatches the load via the parent callback.

  **Accessibility**
  - Indeterminate progress bar when `progressPct` is null (wrapped
    in `role="progressbar"` by the ColdLight Progress primitive,
    with `aria-valuetext` carrying the human label).
  - Clyffy mascot carries `aria-hidden="true"` — the status line
    is the accessible text.

  **Parent contract**
    interface Props {
      tracker: LoadingTracker;
      copy: LoadingCopy;
      roleAccent: "brain" | "minion" | "encoder" | "voice";
      onRetry: (slotId: string) => void;
    }
-->
<script lang="ts">
import { RotateCcw } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Progress } from "$lib/design/components/progress/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import type { LoadingCopy, LoadingStageKind, LoadingTracker } from "../wizard.types.js";

interface Props {
	tracker: LoadingTracker;
	copy: LoadingCopy;
	roleAccent: "brain" | "minion" | "encoder" | "voice";
	onRetry: (slotId: string) => void;
}

let { tracker, copy, roleAccent, onRetry }: Props = $props();

function stageLabel(stage: LoadingStageKind): string {
	switch (stage) {
		case "reading":
			return copy.stage_reading_label;
		case "memory":
			return copy.stage_memory_label;
		case "warmup":
			return copy.stage_warmup_label;
		case "ready":
			return copy.stage_ready_label;
		case "failed":
			return copy.stage_failed_label;
	}
}

const title = $derived(copy.title_template.replace("{model_name}", tracker.friendlyName));
const subtitle = $derived(
	copy.subtitle_template
		.replace("{model_name}", tracker.friendlyName)
		.replace("{role}", roleAccent),
);
const label = $derived(stageLabel(tracker.stage));
const ariaText = $derived(
	copy.progress_aria_template
		.replace("{model_name}", tracker.friendlyName)
		.replace("{stage_label}", label),
);
const isFailed = $derived(tracker.stage === "failed");
const progressValue = $derived(() => {
	if (tracker.progressPct != null) return tracker.progressPct;
	// Indeterminate fallback — step through the 4 visible stages
	// so the bar still moves during a typical load.
	switch (tracker.stage) {
		case "reading":
			return 20;
		case "memory":
			return 45;
		case "warmup":
			return 75;
		case "ready":
			return 100;
		case "failed":
			return 100;
	}
});
</script>

<div
	class="cls"
	class:cls-brain={roleAccent === "brain"}
	class:cls-minion={roleAccent === "minion"}
	class:cls-encoder={roleAccent === "encoder"}
	class:cls-voice={roleAccent === "voice"}
	class:cls-failed={isFailed}
>
	<img
		src="/imgs/mascot/clyffyloading.gif"
		alt=""
		aria-hidden="true"
		class="cls-mascot"
	/>
	<div class="cls-body">
		<Text size="sm" weight="bold">{title}</Text>
		<Text size="xs" color="muted">{isFailed ? (tracker.error ?? subtitle) : subtitle}</Text>
		<Text size="xs" color="secondary">{label}</Text>
		<Progress
			value={progressValue()}
			min={0}
			max={100}
			size="sm"
			aria-label={title}
			aria-valuetext={ariaText}
		/>
	</div>
	{#if isFailed}
		<Button
			preset="secondary"
			size="sm"
			onclick={() => onRetry(tracker.slotId)}
			aria-label={copy.retry_aria}
		>
			<RotateCcw size={14} aria-hidden="true" />
			{copy.retry_label}
		</Button>
	{/if}
</div>

<style>
	.cls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 0.875rem;
		border-radius: var(--radius-md, 0.5rem);
		border: 0.0625rem solid var(--border-subtle, #1a2030);
		background: color-mix(in oklch, var(--surface-inset, #080d18) 65%, transparent);
	}
	.cls-brain {
		border-color: color-mix(in oklch, var(--wizard-role-brain-main) 45%, transparent);
		background: color-mix(in oklch, var(--wizard-role-brain-fill) 60%, var(--surface-inset));
	}
	.cls-minion {
		border-color: color-mix(in oklch, var(--wizard-role-minion-main) 45%, transparent);
		background: color-mix(in oklch, var(--wizard-role-minion-fill) 60%, var(--surface-inset));
	}
	.cls-encoder {
		border-color: color-mix(in oklch, var(--wizard-role-encoder-main) 45%, transparent);
		background: color-mix(in oklch, var(--wizard-role-encoder-fill) 60%, var(--surface-inset));
	}
	.cls-voice {
		border-color: color-mix(in oklch, var(--wizard-role-voice-main) 45%, transparent);
		background: color-mix(in oklch, var(--wizard-role-voice-fill) 60%, var(--surface-inset));
	}
	.cls-failed {
		border-color: color-mix(in oklch, var(--signal-error-main, #ef4444) 50%, transparent);
	}

	.cls-mascot {
		width: 2.5rem;
		height: 2.5rem;
		object-fit: contain;
		flex-shrink: 0;
	}

	.cls-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
</style>
