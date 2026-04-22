<!--
	@component RepoDownloadButton
	@domain platform/_shared

	One-click download of a HuggingFace (or JanAI — same infra) repo.
	Click → list siblings → resolve primary file → show bundle
	confirmation modal → on confirm, kick off the kernel's bundle
	downloader via the existing `download_model` Tauri command.

	The kernel's `execute_download` already does the actual bundle work
	(pulls the primary + every companion shard / config / tokenizer
	referenced by the model's index). This button's job is to make the
	resolution automatic and show the user what they're about to pull.

	# Usage

	```svelte
	<RepoDownloadButton
		repoId="microsoft/phi-4-mini-instruct"
		label="Install Phi-4 Mini"
	/>
	```

	# Smoke test harness

	A temporary `<RepoDownloadButton repoId="microsoft/phi-4-mini-instruct">`
	lives on the /devtools landing page in Phase 4 (SPRINT-DEVTOOLS-
	FOUNDATIONAL). Delete it in Phase 8.
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { Download, FileArchive, X } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { logInfo } from "$lib/sys/logger.js";
import {
	formatBytes,
	type PrimaryResolution,
	type RepoFile,
	resolvePrimaryFile,
	totalBundleSizeBytes,
} from "./resolve-primary-file.js";

interface Props {
	/** HuggingFace repo id (e.g. `"microsoft/phi-4-mini-instruct"`). */
	repoId: string;
	/** Suggested slot id — informational only, passed through to logs. */
	suggestedSlot?: string;
	/** Button label shown before click. */
	label?: string;
	/** Size forwarded to the inner Button. */
	size?: "sm" | "md" | "lg";
	/** Preset forwarded to the inner Button. */
	preset?: string;
	/** Disable the button (e.g. while a parent download is active). */
	disabled?: boolean;
	/**
	 * Fired after `download_model` returns. `ok=true` → download started
	 * (tracked by `DownloadProgressRow`). `ok=false` → cancelled or
	 * errored. `error` is populated on failure.
	 */
	onComplete?: (ok: boolean, downloadId?: string, error?: string) => void;
}

let {
	repoId,
	suggestedSlot,
	label = "Install",
	size = "sm",
	preset = "button-primary",
	disabled = false,
	onComplete,
}: Props = $props();

type Stage = "idle" | "listing" | "confirming" | "starting" | "done" | "error";

let stage = $state<Stage>("idle");
let siblings = $state<RepoFile[]>([]);
let resolution = $state<PrimaryResolution | null>(null);
let selectedPrimary = $state<string>("");
let errorMessage = $state<string | null>(null);

async function handleClick(): Promise<void> {
	if (stage !== "idle" || disabled) return;

	stage = "listing";
	errorMessage = null;
	logInfo("repo.download", `list_repo_files begin repo=${repoId}`);

	try {
		const result = await invoke<RepoFile[]>("list_repo_files", { repoId });
		siblings = result;
		resolution = resolvePrimaryFile(result);
		selectedPrimary = resolution.primary ?? "";
		logInfo(
			"repo.download",
			`list_repo_files ok repo=${repoId} files=${result.length} primary=${resolution.primary ?? "<none>"}`,
		);
		stage = "confirming";
	} catch (e) {
		const text = e instanceof Error ? e.message : String(e);
		errorMessage = text;
		stage = "error";
		logInfo("repo.download", `list_repo_files failed repo=${repoId} error=${text}`);
		onComplete?.(false, undefined, text);
	}
}

function cancel(): void {
	logInfo("repo.download", `user cancelled modal repo=${repoId}`);
	stage = "idle";
	siblings = [];
	resolution = null;
	selectedPrimary = "";
	errorMessage = null;
	onComplete?.(false);
}

async function confirm(): Promise<void> {
	if (!selectedPrimary) return;
	stage = "starting";
	logInfo(
		"repo.download",
		`download_model begin repo=${repoId} primary=${selectedPrimary} suggestedSlot=${suggestedSlot ?? "<unassigned>"}`,
	);

	try {
		const downloadId = await invoke<string>("download_model", {
			repoId,
			filename: selectedPrimary,
		});
		logInfo("repo.download", `download_model ok repo=${repoId} download_id=${downloadId}`);
		try {
			const { toast } = await import("svelte-sonner");
			toast.success(`Downloading ${selectedPrimary}`);
		} catch {
			// toast failure is non-fatal
		}
		stage = "done";
		onComplete?.(true, downloadId);
		// Close the modal after a short confirmation window — the
		// actual download progress is shown by `DownloadProgressRow`.
		setTimeout(() => {
			stage = "idle";
			siblings = [];
			resolution = null;
			selectedPrimary = "";
		}, 1200);
	} catch (e) {
		const text = e instanceof Error ? e.message : String(e);
		errorMessage = text;
		stage = "error";
		logInfo(
			"repo.download",
			`download_model failed repo=${repoId} primary=${selectedPrimary} error=${text}`,
		);
		try {
			const { toast } = await import("svelte-sonner");
			toast.error(`Download failed: ${text}`);
		} catch {
			// toast failure is non-fatal
		}
		onComplete?.(false, undefined, text);
	}
}

const bundleBytes = $derived(totalBundleSizeBytes(siblings));
const hasKnownSize = $derived(siblings.some((s) => typeof s.size === "number"));
</script>

<!-- Trigger button -->
<Button
	{preset}
	{size}
	onclick={handleClick}
	disabled={disabled || stage === "listing" || stage === "starting"}
>
	{#if stage === "listing"}
		<Spinner size="xs" />
		Listing repo…
	{:else if stage === "starting"}
		<Spinner size="xs" />
		Starting…
	{:else}
		<Download size={14} />
		{label}
	{/if}
</Button>

<!-- Confirmation modal (portal-style fixed overlay) -->
{#if stage === "confirming" || stage === "starting" || stage === "done" || stage === "error"}
	<div
		class="fixed inset-0 z-[90] flex items-center justify-center p-4"
		style="background: color-mix(in oklch, var(--surface-base) 75%, transparent); backdrop-filter: blur(var(--blur-md));"
		role="dialog"
		aria-modal="true"
		aria-label="Confirm repo download"
	>
		<div
			class="w-full max-w-lg flex flex-col gap-3 rounded-lg p-4 border"
			style="background: var(--surface-raised); border-color: var(--border-subtle); box-shadow: 0 0.5rem 2rem color-mix(in oklch, var(--surface-base) 60%, transparent);"
		>
			<!-- Header -->
			<div class="flex items-center gap-2">
				<FileArchive size={18} style="color: var(--accent-teal-main);" />
				<Text size="sm" weight="bold">Download repo</Text>
				<button
					type="button"
					class="ml-auto p-1 rounded hover:bg-[var(--surface-base)]"
					onclick={cancel}
					aria-label="Cancel download"
				>
					<X size={14} />
				</button>
			</div>

			<Text size="xs" color="muted">
				Repo: <span class="font-mono">{repoId}</span>
			</Text>

			{#if resolution?.rationale}
				<Text size="xs" color="muted">{resolution.rationale}</Text>
			{/if}

			<!-- Primary selector -->
			{#if siblings.length > 0}
				<div class="flex flex-col gap-1">
					<Text size="xs" weight="bold">Primary file</Text>
					<select
						bind:value={selectedPrimary}
						class="rounded px-2 py-1 text-xs outline-none border"
						style="background: var(--surface-base); border-color: var(--border-subtle); color: var(--text-primary);"
						disabled={stage !== "confirming"}
					>
						<option value="" disabled>— pick a file —</option>
						{#each siblings as file (file.name)}
							<option value={file.name}>
								{file.name}{file.size ? ` (${formatBytes(file.size)})` : ""}
							</option>
						{/each}
					</select>
					<Text size="xs" color="muted">
						The kernel's bundle downloader auto-fetches every shard,
						config, and tokenizer file alongside the primary. You only
						pick the primary.
					</Text>
				</div>
			{/if}

			<!-- Bundle summary -->
			<div class="rounded p-2 border" style="background: var(--surface-base); border-color: var(--border-subtle);">
				<Text size="xs" weight="bold">Bundle</Text>
				<Text size="xs" color="muted">
					{siblings.length} {siblings.length === 1 ? "file" : "files"}{hasKnownSize ? ` · total ${formatBytes(bundleBytes)}` : ""}
				</Text>
				<details class="mt-1">
					<summary class="cursor-pointer">
						<Text size="xs" color="muted">Show file list</Text>
					</summary>
					<div class="mt-2 max-h-48 overflow-y-auto text-xs font-mono">
						{#each siblings as file (file.name)}
							<div class="flex justify-between gap-2 py-0.5">
								<span class:opacity-70={file.name !== selectedPrimary}>
									{file.name}
								</span>
								<span class="opacity-60">
									{file.size ? formatBytes(file.size) : "—"}
								</span>
							</div>
						{/each}
					</div>
				</details>
			</div>

			{#if errorMessage}
				<div class="rounded p-2 border" style="background: color-mix(in oklch, var(--signal-error) 18%, transparent); border-color: var(--signal-error);">
					<Text size="xs">{errorMessage}</Text>
				</div>
			{/if}

			{#if stage === "done"}
				<div class="rounded p-2 border" style="background: color-mix(in oklch, var(--accent-teal-fill) 40%, transparent); border-color: var(--accent-teal-main);">
					<Text size="xs">
						Download started. Watch <code>DownloadProgressRow</code>
						for real-time bytes / ETA.
					</Text>
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex justify-end gap-2">
				<Button preset="button-ghost" size="sm" onclick={cancel}>
					{stage === "done" ? "Close" : "Cancel"}
				</Button>
				{#if stage === "confirming"}
					<Button
						preset="button-primary"
						size="sm"
						onclick={confirm}
						disabled={!selectedPrimary}
					>
						<Download size={14} />
						Download
					</Button>
				{:else if stage === "starting"}
					<Button preset="button-primary" size="sm" disabled>
						<Spinner size="xs" />
						Starting…
					</Button>
				{/if}
			</div>
		</div>
	</div>
{/if}
