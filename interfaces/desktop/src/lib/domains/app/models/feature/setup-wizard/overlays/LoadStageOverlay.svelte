<!--
  @file LoadStageOverlay.svelte
  @domain models/setup-wizard

  Stage narration overlay that appears whenever ANY slot is in a
  Loading status. Reads live state from `modelsState.statuses` — no
  scan triggers, no write commands. Pure display.

  Absorbs ClyffyLoadSpinner's visual pattern (mascot + stage text +
  role-tinted progress). Non-modal — sits in the corner so the user
  can still interact with the rest of the wizard.
-->
<script lang="ts">
import { Text } from "@devpulse/coldlight/components/text";
import { logInfo } from "$lib/sys/logger.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import type { LoadingStage, ModelStatus } from "../../../util/models.types.js";

interface LoadingEntry {
	slotId: string;
	label: string;
	roleAccent: "brain" | "encoder" | "voice";
	stage: string;
	progressPct: number;
}

const ROLE_MAP: Record<string, "brain" | "encoder" | "voice"> = {
	"chat.brain": "brain",
	"minion.shared": "brain",
	"rag.embedder": "encoder",
	"rag.reranker": "encoder",
	"vision.encoder": "encoder",
	"voice.tts": "voice",
	"voice.stt": "voice",
};

const LABEL_MAP: Record<string, string> = {
	"chat.brain": "Clyffy's Brain",
	"minion.shared": "Helper",
	"rag.embedder": "Memory Indexer",
	"rag.reranker": "Memory Filter",
	"vision.encoder": "Vision",
	"voice.tts": "Voice Output",
	"voice.stt": "Voice Input",
};

/** Maps the real `LoadingStage` union to layman text. */
function stageText(stage: LoadingStage): string {
	switch (stage) {
		case "verifying":
			return "Verifying model file";
		case "allocating":
			return "Reserving memory";
		case "loading_weights":
			return "Reading model file";
		case "loading_tokenizer":
			return "Loading tokenizer";
		case "warming_up":
			return "Warming up";
		case "ready":
			return "Ready";
	}
}

function isLoading(
	status: ModelStatus | undefined,
): status is Extract<ModelStatus, { type: "loading" }> {
	return status?.type === "loading";
}

const loading = $derived<LoadingEntry[]>(
	Object.entries(modelsState.statuses)
		.filter(([, status]) => isLoading(status))
		.map(([slotId, status]) => {
			const s = status as Extract<ModelStatus, { type: "loading" }>;
			return {
				slotId,
				label: LABEL_MAP[slotId] ?? slotId,
				roleAccent: ROLE_MAP[slotId] ?? "brain",
				stage: stageText(s.stage),
				progressPct: s.progressPct,
			};
		}),
);

$effect(() => {
	if (loading.length === 0) {
		return;
	}
	logInfo(
		"wizard.loadstage",
		`active loads: ${loading.map((l) => `${l.slotId}@${l.progressPct}%${l.stage}`).join(" | ")}`,
	);
});
</script>

{#if loading.length > 0}
	<div class="ls-container" role="status" aria-live="polite">
		{#each loading as entry (entry.slotId)}
			<div
				class="ls-card ls-{entry.roleAccent}"
				aria-label="{entry.label} loading: {entry.stage}"
			>
				<img
					src="/imgs/mascot/clyffyloading.gif"
					alt=""
					aria-hidden="true"
					class="ls-mascot"
				/>
				<div class="ls-body">
					<Text size="sm" weight="bold">{entry.label}</Text>
					<Text size="xs" color="muted">{entry.stage}</Text>
					<div class="ls-bar-track">
						<div class="ls-bar-fill" style:width="{Math.max(5, entry.progressPct)}%"></div>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	.ls-container {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 60;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 22rem;
		pointer-events: none;
	}

	.ls-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 0.875rem;
		border-radius: 0.75rem;
		border: 1px solid var(--border-subtle);
		background: color-mix(in oklch, var(--surface-inset) 85%, transparent);
		backdrop-filter: blur(0.5rem);
		box-shadow: 0 0.25rem 1rem oklch(0.08 0 0 / 0.5);
		pointer-events: auto;
	}

	.ls-brain {
		border-color: color-mix(in oklch, var(--wizard-role-brain-main) 45%, transparent);
		background: color-mix(in oklch, var(--wizard-role-brain-fill) 40%, var(--surface-inset));
	}
	.ls-encoder {
		border-color: color-mix(in oklch, var(--wizard-role-encoder-main) 45%, transparent);
		background: color-mix(in oklch, var(--wizard-role-encoder-fill) 40%, var(--surface-inset));
	}
	.ls-voice {
		border-color: color-mix(in oklch, var(--wizard-role-voice-main) 45%, transparent);
		background: color-mix(in oklch, var(--wizard-role-voice-fill) 40%, var(--surface-inset));
	}

	.ls-mascot {
		width: 2.25rem;
		height: 2.25rem;
		object-fit: contain;
		flex-shrink: 0;
	}

	.ls-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.ls-bar-track {
		width: 100%;
		height: 0.25rem;
		border-radius: 999px;
		background: color-mix(in oklch, var(--border-subtle) 40%, transparent);
		overflow: hidden;
	}

	.ls-bar-fill {
		height: 100%;
		background: currentColor;
		transition: width 200ms ease-out;
	}

	.ls-brain .ls-bar-fill {
		background: var(--wizard-role-brain-main);
	}
	.ls-encoder .ls-bar-fill {
		background: var(--wizard-role-encoder-main);
	}
	.ls-voice .ls-bar-fill {
		background: var(--wizard-role-voice-main);
	}
</style>
