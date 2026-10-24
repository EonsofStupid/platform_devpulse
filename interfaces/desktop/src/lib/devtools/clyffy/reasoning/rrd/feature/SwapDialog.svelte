<!--
	@component SwapDialog
	@module @devpulse/devtools/clyffy/reasoning/rrd/feature

	Hot-swap an encoder weights file into the live RRD daemon.

	Composes the existing devtool overlay shape (HfSearchDialog
	pattern: self-contained, `open` + `onClose` props, color-mix
	backdrop + blur, ColdLight tokens throughout). The dialog is the
	UI seam over the kernel's `pause → drain → validate → swap →
	resume` protocol — every phase the daemon emits gets surfaced
	here in real time via the same `rrdState` rune the topology
	component reads.

	## Guardrails

	1. **Size guard** — files > 5 GiB are refused inline before any
	   IPC fires. Catches "user picked their disk image by accident"
	   without committing to a daemon pause window.
	2. **SHA-256 first 8 hex chars** — shown to the user before
	   confirm so they can sanity-check "is this the checkpoint I
	   meant" without copy-pasting the full digest.
	3. **Type filter** — accept `.safetensors` only. Multi-shard
	   safetensors split across N files needs a directory-pick path
	   which is a future affordance (single-file is the common case).
	4. **Disabled while in flight** — the file picker + confirm
	   button are both disabled the moment `inFlight` flips true, so
	   the user can't kick a second swap while the first is still in
	   the daemon's drain window.

	## Empty state

	On open with no file selected, the dialog body shows the
	"point-at-log-target" empty state — `model_loader` log line that
	tells a dev where to look if the swap fails silently.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Text } from "@devpulse/coldlight/components/text";
import { CheckCircle2, FileWarning, RotateCw, Upload, X } from "lucide-svelte";
import { laymanFor } from "$lib/sys/data-access/rrd/phase-labels.js";
import { rrdState } from "$lib/sys/data-access/rrd/rrd.state.svelte.js";
import { type SwapReport, swapEncoderWeights } from "../data-access/swap.svc.js";

interface Props {
	/** Open state — controlled by the parent. */
	open: boolean;
	/** Fires when the dialog wants to close (X, Escape, after successful swap). */
	onClose: () => void;
}

let { open, onClose }: Props = $props();

// ── 5 GiB size guard — bytes, not the human "5 GB" decimal. ────
const MAX_BYTES = 5 * 1024 * 1024 * 1024;

let pickedPath = $state<string | null>(null);
let pickedSize = $state<number | null>(null);
let pickedChecksum = $state<string | null>(null);
let pickError = $state<string | null>(null);

let inFlight = $state(false);
let swapResult = $state<SwapReport | null>(null);
let swapError = $state<string | null>(null);

// Track the transition index BEFORE we start the swap so we can render
// just the transitions that fired during this dialog session.
let baselineTransitionCount = $state(0);

const newTransitions = $derived(rrdState.transitions.slice(baselineTransitionCount));

function formatBytes(b: number): string {
	const mib = b / (1024 * 1024);
	if (mib >= 1024) return `${(mib / 1024).toFixed(2)} GiB`;
	if (mib >= 1) return `${mib.toFixed(1)} MiB`;
	return `${(b / 1024).toFixed(0)} KiB`;
}

function formatElapsed(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	const s = ms / 1000;
	if (s < 60) return `${s.toFixed(2)}s`;
	const m = Math.floor(s / 60);
	return `${m}m ${(s % 60).toFixed(1)}s`;
}

// SHA-256 first 8 hex chars — computed from the picked File's raw
// bytes via the browser's SubtleCrypto API. Async, runs once on pick,
// not on every render. Tauri 2 webview supports SubtleCrypto fully.
async function computeChecksum(file: File): Promise<string> {
	const buf = await file.arrayBuffer();
	const hash = await crypto.subtle.digest("SHA-256", buf);
	const hex = Array.from(new Uint8Array(hash))
		.slice(0, 4)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return hex;
}

async function handleFilePick(event: Event): Promise<void> {
	pickError = null;
	pickedChecksum = null;
	swapError = null;
	swapResult = null;

	const input = event.currentTarget as HTMLInputElement;
	const file = input.files?.[0];
	if (!file) {
		pickedPath = null;
		pickedSize = null;
		return;
	}

	if (file.size > MAX_BYTES) {
		pickError = `File is ${formatBytes(file.size)} — refuses anything over 5 GiB. Multi-shard checkpoints aren't supported in the single-file picker yet.`;
		pickedPath = null;
		pickedSize = null;
		return;
	}

	// Tauri 2 attaches a `path` property to File objects so the
	// backend can resolve the absolute path. In a plain browser
	// fallback (e.g. dev preview) we fall back to the file name.
	// biome-ignore lint/suspicious/noExplicitAny: Tauri 2 augments File with `path`
	pickedPath = (file as any).path ?? file.name;
	pickedSize = file.size;

	try {
		pickedChecksum = await computeChecksum(file);
	} catch (e) {
		pickError = `Checksum failed: ${e instanceof Error ? e.message : String(e)}`;
	}
}

async function handleConfirm(): Promise<void> {
	if (!pickedPath || inFlight) return;

	swapError = null;
	swapResult = null;
	baselineTransitionCount = rrdState.transitions.length;
	inFlight = true;

	try {
		swapResult = await swapEncoderWeights(pickedPath);
	} catch (e) {
		swapError = e instanceof Error ? e.message : String(e);
	} finally {
		inFlight = false;
	}
}

function handleClose(): void {
	if (inFlight) return; // refuse close mid-swap
	pickedPath = null;
	pickedSize = null;
	pickedChecksum = null;
	pickError = null;
	swapResult = null;
	swapError = null;
	onClose();
}

function handleKeydown(event: KeyboardEvent): void {
	if (event.key === "Escape" && !inFlight) {
		event.preventDefault();
		handleClose();
	}
}

// Phase ticker uses the shared `laymanFor` map so the dialog and the
// parent RrdDevtool render identical labels + tones for the same
// kernel phase. Drift between them was a recurring bug in the
// per-component-switch era.

function fmtTime(ms: number): string {
	const d = new Date(ms);
	const hh = String(d.getHours()).padStart(2, "0");
	const mm = String(d.getMinutes()).padStart(2, "0");
	const ss = String(d.getSeconds()).padStart(2, "0");
	const msMs = String(d.getMilliseconds()).padStart(3, "0");
	return `${hh}:${mm}:${ss}.${msMs}`;
}
</script>

{#if open}
	<div
		class="fixed inset-0 z-[90] flex items-center justify-center p-4"
		style="background: color-mix(in oklch, var(--surface-base) 75%, transparent); backdrop-filter: blur(var(--blur-md));"
		role="dialog"
		aria-modal="true"
		aria-label="Swap encoder weights"
		onkeydown={handleKeydown}
		tabindex="-1"
	>
		<div
			class="w-full max-w-xl flex flex-col gap-3 rounded-lg p-4 border"
			style="background: var(--surface-raised); border-color: var(--border-subtle); box-shadow: 0 0.5rem 2rem color-mix(in oklch, var(--surface-base) 60%, transparent); max-height: 85vh;"
		>
			<!-- Header — layman first, technical Badge second -->
			<div class="flex items-center gap-2">
				<RotateCw
					size={18}
					style="color: var(--accent-cyber, var(--accent-electric)); flex-shrink: 0;"
				/>
				<div class="flex flex-col">
					<Text size="sm" weight="bold">Swap encoder weights</Text>
					<Text size="xs" color="muted">
						Pause → drain → validate → swap → resume on the live RRD daemon
					</Text>
				</div>
				<button
					type="button"
					class="ml-auto p-1 rounded hover:bg-[var(--surface-base)] disabled:opacity-40 disabled:cursor-not-allowed"
					onclick={handleClose}
					disabled={inFlight}
					aria-label="Close swap dialog"
				>
					<X size={14} />
				</button>
			</div>

			<!-- File picker — disabled while in flight. -->
			<div class="flex flex-col gap-2">
				<label
					for="swap-file-input"
					class="flex items-center gap-2 px-3 py-2 rounded border cursor-pointer hover:border-[var(--accent-cyber,var(--accent-electric))]"
					style="border-color: var(--border-subtle); background: var(--surface-base);"
					class:opacity-40={inFlight}
					class:cursor-not-allowed={inFlight}
				>
					<Upload size={14} />
					<Text size="sm">
						{pickedPath
							? "Replace with a different file"
							: "Pick a .safetensors checkpoint"}
					</Text>
				</label>
				<input
					id="swap-file-input"
					type="file"
					accept=".safetensors"
					class="hidden"
					onchange={handleFilePick}
					disabled={inFlight}
				/>
			</div>

			<!-- Size-guard error — role=alert, color-mix red. -->
			{#if pickError}
				<div
					role="alert"
					aria-live="assertive"
					class="rounded-lg p-3 flex items-start gap-2"
					style="background: color-mix(in oklch, var(--signal-error) 12%, transparent); border: 1px solid color-mix(in oklch, var(--signal-error) 40%, transparent);"
				>
					<FileWarning
						size={14}
						style="color: var(--signal-error); flex-shrink: 0; margin-top: 2px;"
					/>
					<Text size="xs" color="negative">{pickError}</Text>
				</div>
			{/if}

			<!-- Picked file summary — path, size, checksum. -->
			{#if pickedPath && !pickError}
				<div
					class="rounded-lg p-3 flex flex-col gap-1.5"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
				>
					<div class="flex justify-between gap-2">
						<Text size="xs" color="muted">Path</Text>
						<Text size="xs" class="font-mono truncate" title={pickedPath}>
							{pickedPath}
						</Text>
					</div>
					{#if pickedSize !== null}
						<div class="flex justify-between gap-2">
							<Text size="xs" color="muted">Size</Text>
							<Text size="xs" class="font-mono">{formatBytes(pickedSize)}</Text>
						</div>
					{/if}
					{#if pickedChecksum}
						<div class="flex justify-between gap-2">
							<Text size="xs" color="muted">SHA-256</Text>
							<Text size="xs" class="font-mono" title="First 8 hex chars">
								{pickedChecksum}…
							</Text>
						</div>
					{:else}
						<div class="flex items-center gap-2">
							<Spinner size="xs" />
							<Text size="xs" color="muted">Computing checksum…</Text>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Live phase stream during the swap — only renders the
			     transitions that fired since we kicked it off. -->
			{#if inFlight || newTransitions.length > 0}
				<div
					class="rounded-lg p-3 flex flex-col gap-2"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle); max-height: 12rem; overflow-y: auto;"
				>
					<div class="flex items-center gap-2">
						{#if inFlight}
							<Spinner size="xs" />
							<Text size="xs" weight="semibold">Daemon working</Text>
						{:else if swapResult}
							<CheckCircle2
								size={14}
								style="color: var(--signal-success);"
							/>
							<Text size="xs" weight="semibold">Daemon ready</Text>
						{:else}
							<Text size="xs" weight="semibold">Last transitions</Text>
						{/if}
					</div>
					{#each newTransitions as t (t.receivedAtMs)}
						{@const lab = laymanFor(t.phase)}
						<div class="flex items-center gap-2">
							<Text size="xs" color="muted" class="font-mono">
								{fmtTime(t.receivedAtMs)}
							</Text>
							<Badge variant={lab.tone} size="sm">{lab.label}</Badge>
							{#if t.detail}
								<Text size="xs" color="muted" class="truncate">{t.detail}</Text>
							{/if}
						</div>
					{/each}
				</div>
			{/if}

			<!-- Outcome — success or failure. -->
			{#if swapResult}
				<div
					class="rounded-lg p-3 flex items-center gap-2"
					style="background: color-mix(in oklch, var(--signal-success) 10%, transparent); border: 1px solid color-mix(in oklch, var(--signal-success) 35%, transparent);"
				>
					<CheckCircle2
						size={16}
						style="color: var(--signal-success); flex-shrink: 0;"
					/>
					<div class="flex flex-col">
						<Text size="sm" weight="semibold">Swap complete</Text>
						<Text size="xs" color="muted">
							{swapResult.dim}-d encoder live in
							{formatElapsed(swapResult.elapsed_ms)}
							{#if swapResult.phases_observed.length > 0}
								·
								{swapResult.phases_observed.length} phase{swapResult
									.phases_observed.length === 1
									? ""
									: "s"} observed
							{/if}
						</Text>
					</div>
				</div>
			{/if}
			{#if swapError}
				<div
					role="alert"
					aria-live="assertive"
					class="rounded-lg p-3 flex items-start gap-2"
					style="background: color-mix(in oklch, var(--signal-error) 12%, transparent); border: 1px solid color-mix(in oklch, var(--signal-error) 40%, transparent);"
				>
					<FileWarning
						size={14}
						style="color: var(--signal-error); flex-shrink: 0; margin-top: 2px;"
					/>
					<Text size="xs" color="negative">{swapError}</Text>
				</div>
			{/if}

			<!-- Footer — confirm + close. -->
			<div class="flex items-center gap-2 mt-1">
				<Text size="xs" color="muted" class="flex-1">
					{#if !pickedPath}
						Pick a file to enable swap.
					{:else if inFlight}
						Mid-swap — close disabled until resume completes.
					{:else if swapResult}
						Swap landed. Close to return to the topology.
					{:else}
						Confirm starts the daemon's pause window.
					{/if}
				</Text>
				<Button
					variant="ghost"
					size="sm"
					onclick={handleClose}
					disabled={inFlight}
				>
					{swapResult ? "Done" : "Cancel"}
				</Button>
				{#if !swapResult}
					<Button
						variant="primary"
						size="sm"
						onclick={handleConfirm}
						disabled={!pickedPath || !pickedChecksum || inFlight}
					>
						{inFlight ? "Swapping…" : "Confirm swap"}
					</Button>
				{/if}
			</div>
		</div>
	</div>
{/if}
