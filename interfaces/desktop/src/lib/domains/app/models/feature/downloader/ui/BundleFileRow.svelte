<!--
	@ui BundleFileRow
	@module @devpulse/domains/app/models/feature/downloader/ui

	Single row in the bundle preview shown in the confirm panel. One
	primary file + every companion the kernel's `plan_bundle` resolved.

	Visual layout:
	  [icon] [filename ............................]  [size]  [✓ already present]

	The "already present" badge is the layman cue that the user is
	resuming a partial download, not starting fresh — important when a
	30 GB shard set is half on disk.

	Pure presentational — no state, no callbacks.
-->
<script lang="ts">
import { cn } from "@devpulse/coldlight/utils";
import { Check, FileText } from "lucide-svelte";
import { formatBytes } from "../../../util/format.js";
import type { BundleFileEntry } from "../util/downloader.types.js";

interface Props {
	entry: BundleFileEntry;
	/** Marks this row as the primary file in the bundle — drawn with
	 * stronger emphasis so the user can scan which is the load target. */
	isPrimary?: boolean;
	class?: string;
}

let { entry, isPrimary = false, class: className }: Props = $props();
</script>

<div
	class={cn("bundle-row", className)}
	data-primary={isPrimary ? "true" : undefined}
	data-present={entry.alreadyPresent ? "true" : undefined}
>
	<FileText class="bundle-row__icon" aria-hidden="true" />
	<span class="bundle-row__name" title={entry.name}>{entry.name}</span>
	<span class="bundle-row__size">
		{entry.sizeBytes !== null ? formatBytes(entry.sizeBytes) : "—"}
	</span>
	{#if entry.alreadyPresent}
		<span class="bundle-row__present" aria-label="Already downloaded">
			<Check class="bundle-row__present-icon" aria-hidden="true" />
			On disk
		</span>
	{/if}
</div>

<style>
	.bundle-row {
		display: grid;
		grid-template-columns: auto 1fr auto auto;
		align-items: center;
		gap: var(--space-10);
		padding: var(--space-8) var(--space-12);
		border-radius: var(--radius-md);
		background: var(--surface-inset);
		color: var(--text-secondary);
		font-size: var(--space-12);
	}

	.bundle-row[data-primary="true"] {
		background: var(--surface-raised);
		color: var(--text-primary);
		font-weight: 600;
	}

	.bundle-row[data-present="true"] {
		opacity: 0.7;
	}

	/* `:global()` because the class is on the `<FileText>` lucide-svelte
	   child component — Svelte's per-file scoper can't track classes
	   passed through component boundaries. */
	:global(.bundle-row__icon) {
		width: var(--space-14);
		height: var(--space-14);
		color: var(--text-muted);
	}

	.bundle-row[data-primary="true"] :global(.bundle-row__icon) {
		color: var(--accent-main);
	}

	.bundle-row__name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-family: var(--font-family-mono, monospace);
	}

	.bundle-row__size {
		font-variant-numeric: tabular-nums;
		color: var(--text-muted);
	}

	.bundle-row__present {
		display: inline-flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-7);
		border-radius: var(--radius-sm);
		background: var(--accent-teal-fill);
		color: var(--accent-teal-main);
		font-size: var(--space-10);
	}

	.bundle-row__present-icon {
		width: var(--space-10);
		height: var(--space-10);
	}
</style>
