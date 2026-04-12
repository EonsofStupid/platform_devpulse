<!--
  @file RoleCardGrid.svelte
  @domain models/setup-wizard

  Four-card grid for the overlay's "detected" phase. Maps over the
  four roles (brain / minion / encoder / voice) and renders a
  `RoleCard` for each one, wiring up state from `wizardState` and
  callback props from the parent overlay.

  **Slot assignment map** — each role corresponds to a concrete
  kernel slot id:

    brain   -> "chat.brain"       (Qwen3-30B-A3B partial offload)
    minion  -> "minion.shared"    (shares 30B weights via pool)
    encoder -> "rag.embedder"     (Qwen3-Embedding-0.6B CPU)
    voice   -> "voice.brain"      (Moshi 7B full-duplex STS)

  **Responsive layout**: 2×2 on wide screens, 1×4 stack on narrow.
  Respects the existing fluid clamp() sizing used by the overlay.

  **Parent contract**
    interface Props {
      copy: RoleCardsCopy;
      tooltips: ClyffyTooltipsCopy;
      downloadsCopy: DownloadsCopy;
      loadingCopy: LoadingCopy;
      onRoleChange: (role: RoleId, slotId: SlotId) => void;
    }
-->
<script lang="ts">
import type { SlotId } from "../../../types/models.types.js";
import { wizardState } from "../wizard.runes.svelte.js";
import type {
	ClyffyTooltipsCopy,
	DownloadsCopy,
	DownloadTracker,
	LoadingCopy,
	LoadingTracker,
	RoleCardsCopy,
} from "../wizard.types.js";
import RoleCard, { type RoleCardStatus, type RoleId } from "./RoleCard.svelte";

interface Props {
	copy: RoleCardsCopy;
	tooltips: ClyffyTooltipsCopy;
	downloadsCopy: DownloadsCopy;
	loadingCopy: LoadingCopy;
	onRoleChange: (role: RoleId, slotId: SlotId) => void;
	/**
	 * Cancel an in-flight download. Parent owns the real
	 * `commands.cancelDownload` dispatch — the grid just forwards
	 * the tracker id.
	 */
	onCancelDownload?: (downloadId: string) => void;
	/**
	 * Retry a failed/cancelled download. Parent re-dispatches the
	 * `commands.downloadModel` call from the tracker context.
	 */
	onRetryDownload?: (tracker: DownloadTracker) => void;
	/**
	 * Retry a failed model load. Parent re-dispatches
	 * `commands.loadSlot(slotId)`.
	 */
	onRetryLoad?: (slotId: string) => void;
}

let {
	copy,
	tooltips,
	downloadsCopy,
	loadingCopy,
	onRoleChange,
	onCancelDownload,
	onRetryDownload,
	onRetryLoad,
}: Props = $props();

/**
 * Role → slot id mapping. Keeping this as a typed const lookup
 * (not a map) so the four entries stay explicit and the order is
 * deterministic across the `{#each}` loop below.
 */
const ROLES: ReadonlyArray<{ role: RoleId; slot: SlotId }> = [
	{ role: "brain", slot: "chat.brain" },
	{ role: "minion", slot: "minion.shared" },
	{ role: "encoder", slot: "rag.embedder" },
	{ role: "voice", slot: "voice.brain" },
];

/**
 * Resolve the layman-friendly model name for a slot from the active
 * recommendations in `wizardState.recommendations` (populated by the
 * preset selection). Falls back to `null` when no model is assigned.
 */
function friendlyNameFor(slotId: SlotId): string | null {
	const rec = wizardState.recommendations.find((r) => r.slot === slotId);
	return rec?.name ?? null;
}

function vramFor(slotId: SlotId): number {
	const rec = wizardState.recommendations.find((r) => r.slot === slotId);
	return rec?.vramMb ?? 0;
}

function downloadFor(slotId: SlotId): DownloadTracker | null {
	return wizardState.downloadForSlot(slotId);
}

function loadFor(slotId: SlotId): LoadingTracker | null {
	return wizardState.loadForSlot(slotId);
}

function statusFor(
	slotId: SlotId,
	download: DownloadTracker | null,
	load: LoadingTracker | null,
): RoleCardStatus {
	if (download) {
		if (download.status === "failed" || download.status === "cancelled") {
			return "error";
		}
		return "downloading";
	}
	if (load) {
		if (load.stage === "failed") return "error";
		if (load.stage === "ready") return "ready";
		return "warming";
	}
	if (friendlyNameFor(slotId)) return "ready";
	return "empty";
}

// Handler plumbing — the parent overlay owns the real Tauri
// command dispatches (cancel, retry, loadSlot) and passes them
// down via props. The grid just forwards. When a parent handler
// is absent, the grid falls back to a local rune update so the
// UI stays responsive in storybook / preview contexts that mount
// this component without the full overlay wiring.

function handleCancelDownload(downloadId: string): void {
	if (onCancelDownload) {
		onCancelDownload(downloadId);
	} else {
		wizardState.failDownload(downloadId, "Cancelled by user");
	}
}

function handleRetryDownload(tracker: DownloadTracker): void {
	if (onRetryDownload) {
		onRetryDownload(tracker);
	} else {
		wizardState.dismissDownload(tracker.downloadId);
	}
}

function handleDismissDownload(downloadId: string): void {
	wizardState.dismissDownload(downloadId);
}

function handleRetryLoad(slotId: string): void {
	if (onRetryLoad) {
		onRetryLoad(slotId);
	} else {
		wizardState.clearLoad(slotId as SlotId);
	}
}
</script>

<section class="rcg" aria-label={copy.group_title}>
	<header class="rcg-header">
		<h3 class="rcg-title">{copy.group_title}</h3>
		<p class="rcg-subtitle">{copy.group_subtitle}</p>
	</header>
	<div class="rcg-grid" role="list">
		{#each ROLES as { role, slot } (role)}
			{@const activeDownload = downloadFor(slot)}
			{@const activeLoad = loadFor(slot)}
			<div role="listitem" class="rcg-slot">
				<RoleCard
					{role}
					{copy}
					{tooltips}
					{downloadsCopy}
					{loadingCopy}
					modelFriendlyName={friendlyNameFor(slot)}
					vramEstimateMb={vramFor(slot)}
					status={statusFor(slot, activeDownload, activeLoad)}
					{activeDownload}
					{activeLoad}
					onChange={() => onRoleChange(role, slot)}
					onCancelDownload={handleCancelDownload}
					onRetryDownload={handleRetryDownload}
					onDismissDownload={handleDismissDownload}
					onRetryLoad={handleRetryLoad}
				/>
			</div>
		{/each}
	</div>
</section>

<style>
	.rcg {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}
	.rcg-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		text-align: center;
	}
	.rcg-title {
		margin: 0;
		font-size: clamp(1rem, 2vw, 1.25rem);
		font-weight: 700;
		color: var(--text-primary, #e6eaf3);
	}
	.rcg-subtitle {
		margin: 0;
		font-size: clamp(0.75rem, 1.5vw, 0.875rem);
		color: var(--text-secondary, #8b9bb8);
	}

	.rcg-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(clamp(18rem, 28vw, 24rem), 1fr));
		gap: clamp(0.75rem, 2vw, 1.25rem);
		width: 100%;
	}
</style>
