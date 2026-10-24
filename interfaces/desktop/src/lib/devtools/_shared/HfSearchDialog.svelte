<!--
	@component HfSearchDialog
	@domain platform/_shared

	Slot-scoped HuggingFace search + install dialog. Opens for an empty
	slot, queries HF, and lets the user pick a repo whose primary file
	the kernel installs into the slot via `RepoDownloadButton` with
	`slotId` bound.

	## Why slot-scoped

	The kernel `recommend_primary_for_slot` already filters per the
	slot's required capability + the host's hardware tier — so a chat
	slot lands a GGUF, an embedder slot lands a safetensors shard,
	etc. The dialog itself stays format-agnostic. The user types a
	query and clicks Install; the kernel handles compatibility.

	## Lifecycle

	- Opens via the parent's `open=true` prop.
	- Closes via the X button, the Escape key, or after a successful
	  install start (so the user sees the install in the InstallPanel
	  on the parent surface).
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Text } from "@devpulse/coldlight/components/text";
import { Search, X } from "lucide-svelte";
import { type HfSearchResultInfo, searchHuggingface } from "$lib/sys/bindings/models/index.js";
import RepoDownloadButton from "./RepoDownloadButton.svelte";

interface Props {
	/** Slot the install will target. Forwarded to RepoDownloadButton. */
	slotId: string;
	/** Open state — controlled by the parent. */
	open: boolean;
	/** Fires when the dialog wants to close (X, Escape, after install start). */
	onClose: () => void;
}

let { slotId, open, onClose }: Props = $props();

let query = $state("");
let results = $state<HfSearchResultInfo[]>([]);
let searching = $state(false);
let searchError = $state<string | null>(null);

// Re-bound debounced search — trailing-edge so the user can pause
// typing without firing a request mid-keystroke.
let searchTimer: ReturnType<typeof setTimeout> | null = null;

async function runSearch(q: string): Promise<void> {
	const trimmed = q.trim();
	if (trimmed.length < 2) {
		results = [];
		searching = false;
		searchError = null;
		return;
	}
	searching = true;
	searchError = null;
	try {
		const r = await searchHuggingface(trimmed, 25);
		if (r.status === "ok") {
			results = r.data;
		} else {
			results = [];
			searchError = String(r.error);
		}
	} catch (e) {
		searchError = e instanceof Error ? e.message : String(e);
		results = [];
	} finally {
		searching = false;
	}
}

function handleInput(e: Event): void {
	query = (e.currentTarget as HTMLInputElement).value;
	if (searchTimer) clearTimeout(searchTimer);
	searchTimer = setTimeout(() => {
		void runSearch(query);
	}, 250);
}

function handleKeydown(e: KeyboardEvent): void {
	if (e.key === "Escape") {
		e.preventDefault();
		onClose();
	}
}

function onInstallStarted(ok: boolean): void {
	if (ok) {
		// Install kicked off — close so the user sees the InstallPanel
		// row instead of the dialog. Failed clicks keep the dialog
		// open so the user can pick a different repo.
		onClose();
	}
}
</script>

{#if open}
	<div
		class="fixed inset-0 z-[90] flex items-center justify-center p-4"
		style="background: color-mix(in oklch, var(--surface-base) 75%, transparent); backdrop-filter: blur(var(--blur-md));"
		role="dialog"
		aria-modal="true"
		aria-label="HuggingFace search"
		onkeydown={handleKeydown}
		tabindex="-1"
	>
		<div
			class="w-full max-w-2xl flex flex-col gap-3 rounded-lg p-4 border"
			style="background: var(--surface-raised); border-color: var(--border-subtle); box-shadow: 0 0.5rem 2rem color-mix(in oklch, var(--surface-base) 60%, transparent); max-height: 80vh;"
		>
			<!-- Header -->
			<div class="flex items-center gap-2">
				<Search size={18} style="color: var(--accent-teal-main);" />
				<Text size="sm" weight="bold">Find a model for {slotId}</Text>
				<button
					type="button"
					class="ml-auto p-1 rounded hover:bg-[var(--surface-base)]"
					onclick={onClose}
					aria-label="Close search"
				>
					<X size={14} />
				</button>
			</div>

			<!-- Search input -->
			<div class="flex items-center gap-2">
				<Search size={14} style="color: var(--text-muted); flex-shrink: 0;" />
				<input
					type="text"
					placeholder="Search HuggingFace…"
					value={query}
					oninput={handleInput}
					class="flex-1 rounded px-2 py-1.5 text-sm outline-none border"
					style="background: var(--surface-base); border-color: var(--border-subtle); color: var(--text-primary);"
				/>
				{#if searching}
					<Spinner size="xs" />
				{/if}
			</div>

			<Text size="xs" color="muted">
				The kernel auto-picks the right file (quant + format) for {slotId}
				based on its capability and your hardware tier — you don't pick
				per-shard manually.
			</Text>

			{#if searchError}
				<div
					class="rounded p-2 border"
					style="background: color-mix(in oklch, var(--signal-error) 18%, transparent); border-color: var(--signal-error);"
				>
					<Text size="xs">{searchError}</Text>
				</div>
			{/if}

			<!-- Results -->
			<div class="overflow-y-auto flex flex-col gap-2" style="min-height: 8rem;">
				{#if query.trim().length < 2}
					<Text size="xs" color="muted" class="px-2 py-4 text-center">
						Type at least two characters to search.
					</Text>
				{:else if results.length === 0 && !searching}
					<Text size="xs" color="muted" class="px-2 py-4 text-center">
						No results.
					</Text>
				{:else}
					{#each results as r (r.repo_id)}
						<div
							class="rounded p-2 border flex items-center gap-3"
							style="background: var(--surface-base); border-color: var(--border-soft);"
						>
							<div class="flex flex-col gap-0.5 min-w-0 flex-1">
								<Text size="xs" weight="bold" class="font-mono truncate">
									{r.repo_id}
								</Text>
								<div class="flex gap-2 items-center text-xs">
									<Text size="xs" color="muted">{r.author}</Text>
									{#if r.pipeline_tag}
										<Badge variant="neutral" size="sm">{r.pipeline_tag}</Badge>
									{/if}
									<Text size="xs" color="muted">↓ {r.downloads.toLocaleString()}</Text>
								</div>
							</div>
							<RepoDownloadButton
								repoId={r.repo_id}
								{slotId}
								label="Install"
								size="sm"
								onComplete={onInstallStarted}
							/>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}
