<!--
	@feature DownloaderConfirmPanel
	@module @devpulse/domains/app/models/feature/downloader/feature

	Confirm-phase panel — bundle preview, slot tag dropdown, and the
	second-acknowledgement CTA that promotes the downloader from
	`confirm` to `downloading`.

	Renders one `BundleFileRow` per file the kernel's `list_repo_files`
	returned. Marks the primary file (drives `plan_bundle` on the
	kernel side) with stronger emphasis so the user can verify which
	quant / shard set will be the loaded artefact.

	The slot dropdown lists every slot under every `RoleFrame`,
	prefixed with the role label so a layman sees "Brain · Main AI"
	rather than the kernel id `chat.brain`. Empty selection means
	"download without assigning" — surfaced as the kernel's
	`download_model` path instead of `install_to_slot`.

	ARIA:
	  - `<select>` carries the dropdown label as `aria-label`.
	  - Acknowledgement is a yes/no `<button>` pair with explicit
	    `aria-label` on each.
	  - Summary line + resume note are `<p>` content; reading order
	    follows top-to-bottom flow naturally.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { DownloaderCopy, RepoFile } from "$lib/sys/generated/bindings.js";
import { getSlotLabel, ROLE_FRAMES } from "../../../index.js";
import { formatBytes, formatMb } from "../../../util/format.js";
import { modelDownloaderState } from "../data-access/downloader.state.svelte.js";
import { BundleFileRow } from "../ui/index.js";
import type { BundleFileEntry } from "../util/downloader.types.js";

interface Props {
	copy: DownloaderCopy;
	class?: string;
}

let { copy, class: className }: Props = $props();

// Flat list of every slot we'd present in the role-tag dropdown.
// Ordered by ROLE_FRAMES (brain → encoder → voice → helpers) so the
// most-common picks land first.
interface SlotOption {
	slotId: string;
	roleLabel: string;
	slotLabel: string;
}

const slotOptions = $derived<SlotOption[]>(
	ROLE_FRAMES.flatMap((frame) =>
		frame.slots.map((slotId) => ({
			slotId,
			roleLabel: frame.label,
			slotLabel: getSlotLabel(slotId)?.name ?? slotId,
		})),
	),
);

const bundleEntries = $derived<BundleFileEntry[]>(
	(modelDownloaderState.bundle?.files ?? []).map((f: RepoFile) => ({
		name: f.name,
		sizeBytes: f.size,
		// Resume-detection happens on the kernel side; the confirm panel
		// shows every file as "not present yet" pre-download. After the
		// download lands, the activity-hud rune carries the per-file
		// state — but the confirm view doesn't render after the user
		// clicks Download, so the static `false` here matches the lived
		// truth at this stage.
		alreadyPresent: false,
	})),
);

const primaryFilename = $derived(modelDownloaderState.selection?.primaryFilename ?? "");

const bundleSummaryLabel = $derived.by(() => {
	const bundle = modelDownloaderState.bundle;
	if (!bundle) return "";
	const totalMb = bundle.totalBytes === null ? "—" : formatMb(bundle.totalBytes / 1_048_576);
	return copy.confirm_bundle_summary_template
		.replace("{file_count}", String(bundle.files.length))
		.replace("{total_mb}", totalMb);
});

function handleSlotChange(e: Event): void {
	const value = (e.currentTarget as HTMLSelectElement).value;
	modelDownloaderState.setSlot(value);
}

async function handleConfirm(): Promise<void> {
	await modelDownloaderState.confirm();
}

function handleBack(): void {
	modelDownloaderState.back();
}

// Suppress "unused" warning while keeping the helper imported — the
// resume template will be activated once the kernel surfaces per-file
// on-disk state via `pre_flight_disk_scan` results in `list_repo_files`.
void formatBytes;
</script>

<section class={cn("confirm-panel", className)} aria-labelledby="downloader-confirm-heading">
	<h3 id="downloader-confirm-heading" class="confirm-panel__heading">
		{copy.confirm_phase_heading}
	</h3>

	{#if modelDownloaderState.selection}
		<p class="confirm-panel__repo">{modelDownloaderState.selection.repoId}</p>
	{/if}

	<div class="confirm-panel__slot-row">
		<label for="downloader-slot-select" class="confirm-panel__slot-label">
			{copy.confirm_slot_label}
		</label>
		<select
			id="downloader-slot-select"
			class="confirm-panel__slot-select"
			aria-label={copy.confirm_slot_label}
			value={modelDownloaderState.selection?.slotId ?? ""}
			onchange={handleSlotChange}
		>
			<option value="">{copy.confirm_slot_unassigned_label}</option>
			{#each slotOptions as option (option.slotId)}
				<option value={option.slotId}>
					{option.roleLabel} · {option.slotLabel}
				</option>
			{/each}
		</select>
	</div>

	<p class="confirm-panel__bundle-help">{copy.confirm_bundle_help}</p>

	<p class="confirm-panel__bundle-summary" role="status">
		{bundleSummaryLabel}
	</p>

	{#if modelDownloaderState.bundleLoading}
		<p class="confirm-panel__status" role="status" aria-live="polite">
			…
		</p>
	{:else}
		<ul class="confirm-panel__file-list" aria-label={copy.confirm_phase_heading}>
			{#each bundleEntries as entry (entry.name)}
				<li class="confirm-panel__file-item">
					<BundleFileRow {entry} isPrimary={entry.name === primaryFilename} />
				</li>
			{/each}
		</ul>
	{/if}

	<p class="confirm-panel__ack-question">{copy.confirm_acknowledge_question}</p>

	<div class="confirm-panel__actions">
		<button
			type="button"
			class="confirm-panel__back"
			aria-label={copy.confirm_back_aria}
			onclick={handleBack}
		>
			{copy.confirm_back_label}
		</button>
		<button
			type="button"
			class="confirm-panel__confirm"
			aria-label={copy.confirm_download_aria}
			disabled={!modelDownloaderState.bundle || modelDownloaderState.bundleLoading}
			onclick={handleConfirm}
		>
			{copy.confirm_download_label}
		</button>
	</div>
</section>

<style>
	.confirm-panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-10);
		min-height: 0;
		flex: 1;
	}

	.confirm-panel__heading {
		margin: 0;
		font-size: var(--space-14);
		font-weight: 600;
		color: var(--text-primary);
	}

	.confirm-panel__repo {
		margin: 0;
		font-size: var(--space-12);
		font-family: var(--font-mono);
		color: var(--accent-teal-main);
	}

	.confirm-panel__slot-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.confirm-panel__slot-label {
		font-size: var(--space-11);
		font-weight: 600;
		color: var(--text-secondary);
	}

	.confirm-panel__slot-select {
		padding: var(--space-8) var(--space-10);
		border-radius: var(--radius-sm);
		background: var(--surface-inset);
		border: 0.0625rem solid var(--border-subtle);
		color: var(--text-primary);
		font-size: var(--space-12);
	}

	.confirm-panel__slot-select:focus-visible {
		outline: 0.125rem solid var(--border-focus);
		outline-offset: 0.125rem;
		border-color: var(--border-focus);
	}

	.confirm-panel__bundle-help {
		margin: 0;
		font-size: var(--space-11);
		color: var(--text-muted);
		line-height: 1.5;
	}

	.confirm-panel__bundle-summary {
		margin: 0;
		font-size: var(--space-12);
		font-weight: 600;
		color: var(--text-primary);
	}

	.confirm-panel__status {
		margin: 0;
		padding: var(--space-12);
		text-align: center;
		color: var(--text-muted);
	}

	.confirm-panel__file-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin: 0;
		padding: 0;
		list-style: none;
		overflow-y: auto;
		max-height: var(--space-128);
	}

	.confirm-panel__file-item {
		list-style: none;
	}

	.confirm-panel__ack-question {
		margin: 0;
		padding-top: var(--space-7);
		font-size: var(--space-14);
		font-weight: 600;
		color: var(--text-primary);
	}

	.confirm-panel__actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-8);
	}

	.confirm-panel__back {
		padding: var(--space-8) var(--space-14);
		border-radius: var(--radius-sm);
		background: transparent;
		border: 0.0625rem solid var(--border-subtle);
		color: var(--text-secondary);
		font-size: var(--space-12);
		cursor: pointer;
	}

	.confirm-panel__back:hover {
		border-color: var(--border-strong);
		color: var(--text-primary);
	}

	.confirm-panel__back:focus-visible {
		outline: 0.125rem solid var(--border-focus);
		outline-offset: 0.125rem;
	}

	.confirm-panel__confirm {
		padding: var(--space-8) var(--space-16);
		border-radius: var(--radius-sm);
		background: var(--accent-teal-fill);
		border: 0.0625rem solid var(--accent-teal-main);
		color: var(--accent-teal-main);
		font-size: var(--space-12);
		font-weight: 600;
		cursor: pointer;
	}

	.confirm-panel__confirm:hover:not(:disabled) {
		opacity: 0.85;
	}

	.confirm-panel__confirm:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.confirm-panel__confirm:focus-visible {
		outline: 0.125rem solid var(--border-focus);
		outline-offset: 0.125rem;
	}
</style>
