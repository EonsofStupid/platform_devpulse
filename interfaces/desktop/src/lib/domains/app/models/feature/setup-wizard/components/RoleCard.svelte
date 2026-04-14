<!--
  @file RoleCard.svelte
  @domain models/setup-wizard

  One of the four role cards in the setup overlay. Each card
  represents a major slot role:

    brain   — purple — Clyffy's primary reasoning brain
    minion  — green  — background helpers (routing, tags, summaries)
    encoder — blue   — search / embedding / RAG
    voice   — coral  — STS / STT / TTS / wake word

  The four cards are purely presentational — they forward state and
  callbacks from the parent `RoleCardGrid`. The owner's requirement
  was "four distinct role colors, minimally on the welcome page" —
  every role-color affordance here references the new DTCG
  `--wizard-role-*-{main,glow,fill}` tokens.

  **What it shows (steady state)**
  - Role title (from `copy.role_cards.{role}_title`)
  - Layman purpose line (from `copy.role_cards.{role}_layman`)
  - Current model friendly name OR empty label
  - Status badge (Empty / Downloading / Warming / Ready / Error)
  - VRAM estimate badge when non-zero
  - Big `Change` button

  **What it shows (transient state)**
  - During active download: an inline `DownloadProgressRow`
  - During active load:    an inline `ClyffyLoadSpinner`
  - On error:              retry button on the spinner

  **Parent contract**
    interface Props {
      role: "brain" | "minion" | "encoder" | "voice";
      copy: RoleCardsCopy;
      titlesCopy: ClyffyTooltipsCopy;
      downloadsCopy: DownloadsCopy;
      loadingCopy: LoadingCopy;
      modelFriendlyName: string | null;
      vramEstimateMb: number;
      status: RoleCardStatus;
      activeDownload: DownloadTracker | null;
      activeLoad: LoadingTracker | null;
      onChange: () => void;
      onCancelDownload: (downloadId: string) => void;
      onRetryDownload: (tracker: DownloadTracker) => void;
      onDismissDownload: (downloadId: string) => void;
      onRetryLoad: (slotId: string) => void;
    }
-->
<script lang="ts">
import { Brain, Headphones, Search, Sparkles } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import Text from "$lib/design/components/text/Text.svelte";

import type {
	ClyffyTooltipsCopy,
	DownloadsCopy,
	DownloadTracker,
	LoadingCopy,
	LoadingTracker,
	RoleCardsCopy,
} from "../wizard.types.js";
import ClyffyLoadSpinner from "./ClyffyLoadSpinner.svelte";
import ClyffyTooltip from "./ClyffyTooltip.svelte";
import DownloadProgressRow from "./DownloadProgressRow.svelte";

/**
 * The four role identifiers. Mirrors the DTCG `wizard.role.{id}`
 * token families and the `RoleCardsCopy.{id}_*` copy key groups.
 */
export type RoleId = "brain" | "minion" | "encoder" | "voice";

/**
 * Card status used to render the status badge. `empty` means no
 * model is assigned; `downloading` and `warming` are transient
 * states owned by the DownloadProgressRow / ClyffyLoadSpinner;
 * `ready` means the slot is loaded and inference-ready; `error`
 * means the last load or download failed.
 */
export type RoleCardStatus = "empty" | "downloading" | "warming" | "ready" | "error";

interface Props {
	role: RoleId;
	copy: RoleCardsCopy;
	tooltips: ClyffyTooltipsCopy;
	downloadsCopy: DownloadsCopy;
	loadingCopy: LoadingCopy;
	modelFriendlyName: string | null;
	vramEstimateMb: number;
	status: RoleCardStatus;
	activeDownload: DownloadTracker | null;
	activeLoad: LoadingTracker | null;
	onChange: () => void;
	onCancelDownload: (downloadId: string) => void;
	onRetryDownload: (tracker: DownloadTracker) => void;
	onDismissDownload: (downloadId: string) => void;
	onRetryLoad: (slotId: string) => void;
}

let {
	role,
	copy,
	tooltips,
	downloadsCopy,
	loadingCopy,
	modelFriendlyName,
	vramEstimateMb,
	status,
	activeDownload,
	activeLoad,
	onChange,
	onCancelDownload,
	onRetryDownload,
	onDismissDownload,
	onRetryLoad,
}: Props = $props();

const title = $derived(
	role === "brain"
		? copy.brain_title
		: role === "minion"
			? copy.minion_title
			: role === "encoder"
				? copy.encoder_title
				: copy.voice_title,
);
const layman = $derived(
	role === "brain"
		? copy.brain_layman
		: role === "minion"
			? copy.minion_layman
			: role === "encoder"
				? copy.encoder_layman
				: copy.voice_layman,
);
const emptyLabel = $derived(
	role === "brain"
		? copy.brain_empty_label
		: role === "minion"
			? copy.minion_empty_label
			: role === "encoder"
				? copy.encoder_empty_label
				: copy.voice_empty_label,
);
const changeLabel = $derived(
	role === "brain"
		? copy.brain_change_label
		: role === "minion"
			? copy.minion_change_label
			: role === "encoder"
				? copy.encoder_change_label
				: copy.voice_change_label,
);
const changeAria = $derived(
	role === "brain"
		? copy.brain_change_aria
		: role === "minion"
			? copy.minion_change_aria
			: role === "encoder"
				? copy.encoder_change_aria
				: copy.voice_change_aria,
);
const tooltipKey = $derived(
	role === "brain"
		? "role_brain_info"
		: role === "minion"
			? "role_minion_info"
			: role === "encoder"
				? "role_encoder_info"
				: "role_voice_info",
) as unknown as keyof ClyffyTooltipsCopy;

const statusLabel = $derived(
	status === "empty"
		? copy.status_empty
		: status === "downloading"
			? copy.status_downloading
			: status === "warming"
				? copy.status_warming
				: status === "ready"
					? copy.status_ready
					: copy.status_error,
);

const vramBadge = $derived(
	vramEstimateMb > 0 ? copy.vram_estimate_template.replace("{mb}", String(vramEstimateMb)) : null,
);

const showDownload = $derived(activeDownload != null);
const showLoading = $derived(activeLoad != null && !showDownload);
</script>

<article
	class="rc rc-{role}"
	class:rc-empty={status === "empty"}
	class:rc-ready={status === "ready"}
	class:rc-error={status === "error"}
	aria-labelledby="rc-title-{role}"
>
	<header class="rc-head">
		<div class="rc-icon" aria-hidden="true">
			{#if role === "brain"}
				<Brain size={22} />
			{:else if role === "minion"}
				<Sparkles size={22} />
			{:else if role === "encoder"}
				<Search size={22} />
			{:else}
				<Headphones size={22} />
			{/if}
		</div>
		<div class="rc-title">
			<div class="rc-title-row">
				<Text id="rc-title-{role}" size="base" weight="bold">{title}</Text>
				<ClyffyTooltip copy={tooltips} copyKey={tooltipKey} label={title} />
			</div>
			<Text size="xs" color="muted">{layman}</Text>
		</div>
		<Badge preset={status === "ready" ? "glass" : "matte"}>{statusLabel}</Badge>
	</header>

	<div class="rc-body">
		{#if showDownload && activeDownload}
			<DownloadProgressRow
				tracker={activeDownload}
				copy={downloadsCopy}
				roleAccent={role}
				onCancel={onCancelDownload}
				onRetry={onRetryDownload}
				onDismiss={onDismissDownload}
			/>
		{:else if showLoading && activeLoad}
			<ClyffyLoadSpinner
				tracker={activeLoad}
				copy={loadingCopy}
				roleAccent={role}
				onRetry={onRetryLoad}
			/>
		{:else if modelFriendlyName}
			<div class="rc-model">
				<Text size="sm">{modelFriendlyName}</Text>
				{#if vramBadge}
					<Badge preset="glass">{vramBadge}</Badge>
				{/if}
			</div>
		{:else}
			<Text size="sm" color="muted">{emptyLabel}</Text>
		{/if}
	</div>

	<footer class="rc-foot">
		<Button
			preset="primary"
			size="lg"
			onclick={onChange}
			aria-label={changeAria}
		>
			{changeLabel}
		</Button>
	</footer>
</article>

<style>
	.rc {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: clamp(1rem, 2vw, 1.25rem);
		border-radius: var(--radius-lg, 0.75rem);
		border: 0.125rem solid var(--border-subtle, #1a2030);
		background: var(--surface-raised, #0c1220);
		transition:
			border-color var(--motion-duration-fast, 150ms),
			box-shadow var(--motion-duration-fast, 150ms);
	}

	/* Role accent borders — purple / green / blue / coral. */
	.rc-brain {
		border-color: var(--wizard-role-brain-main);
		background: color-mix(in oklch, var(--wizard-role-brain-fill) 40%, var(--surface-raised));
	}
	.rc-minion {
		border-color: var(--wizard-role-minion-main);
		background: color-mix(in oklch, var(--wizard-role-minion-fill) 40%, var(--surface-raised));
	}
	.rc-encoder {
		border-color: var(--wizard-role-encoder-main);
		background: color-mix(in oklch, var(--wizard-role-encoder-fill) 40%, var(--surface-raised));
	}
	.rc-voice {
		border-color: var(--wizard-role-voice-main);
		background: color-mix(in oklch, var(--wizard-role-voice-fill) 40%, var(--surface-raised));
	}

	.rc-ready.rc-brain {
		box-shadow: 0 0 1.5rem -0.5rem var(--wizard-role-brain-glow);
	}
	.rc-ready.rc-minion {
		box-shadow: 0 0 1.5rem -0.5rem var(--wizard-role-minion-glow);
	}
	.rc-ready.rc-encoder {
		box-shadow: 0 0 1.5rem -0.5rem var(--wizard-role-encoder-glow);
	}
	.rc-ready.rc-voice {
		box-shadow: 0 0 1.5rem -0.5rem var(--wizard-role-voice-glow);
	}

	.rc-head {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: start;
		gap: 0.75rem;
	}

	.rc-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: var(--radius-md, 0.5rem);
		background: color-mix(in oklch, currentColor 15%, transparent);
	}
	.rc-brain .rc-icon {
		color: var(--wizard-role-brain-main);
	}
	.rc-minion .rc-icon {
		color: var(--wizard-role-minion-main);
	}
	.rc-encoder .rc-icon {
		color: var(--wizard-role-encoder-main);
	}
	.rc-voice .rc-icon {
		color: var(--wizard-role-voice-main);
	}

	.rc-title {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.rc-title-row {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.rc-body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-height: 3.25rem;
	}

	.rc-model {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.rc-foot {
		display: flex;
		justify-content: flex-end;
	}
</style>
