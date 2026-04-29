<!--
	@file /devtools/runtimes — Runtimes aggregation devtool
	@route /devtools/runtimes

	Inverse view of the main /devtools dashboard: instead of grouping
	by display-axis tier (System / Clyffy / Model Loader), this page
	groups by runtime_id — every inference engine currently fulfilling
	a capability slot, with its live RuntimeFingerprint and a
	per-runtime "Check for updates" action.

	Reads `commands.listRuntimeFingerprints()` for the current
	(slot_id → RuntimeFingerprint) snapshot, then groups by
	`fingerprint.runtime_id` so a single tile represents the actual
	deployed engine even when it's bound to multiple capabilities
	(ort fulfills voice.stt + voice.tts + vision.embedder + …).

	Cross-references the DEVTOOL_REGISTRY to surface "open the
	per-runtime devtool" links — clicking a runtime tile takes the
	user to the devtool that documents that runtime in detail.
-->
<script lang="ts">
import { Cpu, ExternalLink, RefreshCw, ServerCog } from "lucide-svelte";
import { onMount } from "svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import {
	type CapturePayload,
	DEVTOOL_REGISTRY,
	type DevtoolMeta,
	type HealthBadge,
	ServiceDevtoolShell,
} from "$lib/domains/platform/_shared/index.js";
import type {
	RuntimeFingerprint,
	RuntimeUpdateInfo,
	ScopedLogEntry,
} from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { logInfo } from "$lib/sys/logger.js";

// ── State ──────────────────────────────────────────────────
let fingerprints = $state<Record<string, RuntimeFingerprint>>({});
let loading = $state(false);
let error = $state<string | null>(null);
let updateChecks = $state<Record<string, RuntimeUpdateInfo>>({});
let checkingRuntime = $state<string | null>(null);

let logs = $state<ScopedLogEntry[]>([]);
let logsLoading = $state(false);
let logsError = $state<string | null>(null);

// ── Lifecycle ──────────────────────────────────────────────
// `onMount`, not `$effect`: refresh() flips `loading` (read+write),
// which would loop `$effect`. (See ProjectSwitcher fix.)
onMount(() => {
	void refresh();
});

async function refresh(): Promise<void> {
	loading = true;
	error = null;
	logInfo("devtools.runtimes", "Loading runtime fingerprints");
	try {
		const r = await commands.listRuntimeFingerprints();
		if (r.status === "error") throw new Error(r.error);
		// `Partial<{ [key in string]: RuntimeFingerprint }>` from specta —
		// keep undefined keys out so the rest of the page can iterate
		// without optional-chaining everywhere.
		const cleaned: Record<string, RuntimeFingerprint> = {};
		for (const [slot, fp] of Object.entries(r.data)) {
			if (fp) cleaned[slot] = fp;
		}
		fingerprints = cleaned;
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		logInfo("devtools.runtimes", `Refresh failed: ${error}`);
	} finally {
		loading = false;
	}
}

async function checkUpdates(runtimeId: string): Promise<void> {
	checkingRuntime = runtimeId;
	try {
		const r = await commands.checkRuntimeUpdates(runtimeId);
		if (r.status === "error") throw new Error(r.error);
		updateChecks = { ...updateChecks, [runtimeId]: r.data };
		logInfo("devtools.runtimes", `Update check ${runtimeId}: ${r.data.status}`);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logInfo("devtools.runtimes", `Update check failed for ${runtimeId}: ${msg}`);
	} finally {
		checkingRuntime = null;
	}
}

async function loadLogs(): Promise<void> {
	logsLoading = true;
	logsError = null;
	try {
		const r = await commands.queryScopedLog("devtools.runtimes", 100);
		if (r.status === "error") throw new Error(r.error);
		logs = r.data;
	} catch (e) {
		logsError = e instanceof Error ? e.message : String(e);
	} finally {
		logsLoading = false;
	}
}

// ── Derived ────────────────────────────────────────────────
interface RuntimeGroup {
	runtime_id: string;
	fingerprint: RuntimeFingerprint;
	slots: string[];
	devtool: DevtoolMeta | undefined;
}

const runtimeGroups = $derived<RuntimeGroup[]>(
	(() => {
		const byRuntime = new Map<string, RuntimeGroup>();
		for (const [slot, fp] of Object.entries(fingerprints)) {
			const existing = byRuntime.get(fp.runtime_id);
			if (existing) {
				existing.slots.push(slot);
			} else {
				byRuntime.set(fp.runtime_id, {
					runtime_id: fp.runtime_id,
					fingerprint: fp,
					slots: [slot],
					devtool: DEVTOOL_REGISTRY.find((d) => d.runtime_id === fp.runtime_id),
				});
			}
		}
		// Stable: alphabetical by runtime_id.
		return Array.from(byRuntime.values()).sort((a, b) => a.runtime_id.localeCompare(b.runtime_id));
	})(),
);

const totalSlots = $derived(Object.keys(fingerprints).length);

const badge = $derived<HealthBadge>(
	loading
		? { state: "unknown", label: "Loading…" }
		: runtimeGroups.length === 0
			? { state: "stopped", label: "No runtimes loaded" }
			: { state: "up", label: `${runtimeGroups.length} runtimes · ${totalSlots} slots` },
);

function statusTone(
	info: RuntimeUpdateInfo | undefined,
): "positive" | "warning" | "neutral" | "negative" {
	if (!info) return "neutral";
	switch (info.status) {
		case "up_to_date":
			return "positive";
		case "update_available":
			return "warning";
		case "check_failed":
			return "negative";
		default:
			return "neutral";
	}
}

function statusLabel(info: RuntimeUpdateInfo | undefined): string {
	if (!info) return "Not checked";
	switch (info.status) {
		case "up_to_date":
			return "Up to date";
		case "update_available":
			return "Update available";
		case "no_check_configured":
			return "No upstream check";
		case "check_failed":
			return "Check failed";
	}
}

// ── Per-tab capture ────────────────────────────────────────
function capture(tabId: string): CapturePayload | undefined {
	if (tabId === "status") {
		return {
			filename: "runtimes-status.json",
			mime: "application/json",
			content: JSON.stringify(runtimeGroups, null, 2),
		};
	}
	if (tabId === "actions") {
		return {
			filename: "runtimes-update-checks.json",
			mime: "application/json",
			content: JSON.stringify(updateChecks, null, 2),
		};
	}
	if (tabId === "logs") {
		return logs.length > 0
			? {
					filename: "runtimes-logs.txt",
					mime: "text/plain",
					content: logs.map((l) => `[${l.timestamp}] ${l.level} ${l.message}`).join("\n"),
				}
			: undefined;
	}
	if (tabId === "debug") {
		return {
			filename: "runtimes-debug.json",
			mime: "application/json",
			content: JSON.stringify({ fingerprints, updateChecks }, null, 2),
		};
	}
	return undefined;
}
</script>

<ServiceDevtoolShell
	title="Runtimes Aggregation"
	description="Live state of every inference runtime currently fulfilling a slot"
	icon={Cpu}
	axis="capabilities"
	accent="ember"
	health={badge}
	{capture}
>
	{#snippet status()}
		<div class="flex flex-col gap-3">
			{#if error}
				<div
					class="rounded-lg p-3"
					style="background: var(--signal-error-subtle, #3b1a1a); border: 1px solid var(--signal-error);"
				>
					<Text size="xs">{error}</Text>
				</div>
			{/if}

			{#if runtimeGroups.length === 0 && !loading}
				<Text size="sm" color="muted">
					No runtimes are loaded. Open a per-capability devtool
					(e.g. <span class="font-mono">/devtools/clyffy/mouth/tts</span>) and load a slot to populate this
					view.
				</Text>
			{/if}

			{#each runtimeGroups as group (group.runtime_id)}
				{@const check = updateChecks[group.runtime_id]}
				<div
					class="flex flex-col gap-2 rounded-lg p-3"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
				>
					<div class="flex items-center justify-between gap-2">
						<div class="flex items-center gap-2">
							<ServerCog size={14} />
							<Text size="sm" weight="bold">
								<span class="font-mono">{group.runtime_id}</span>
							</Text>
						</div>
						<Badge tone={statusTone(check)} size="sm">{statusLabel(check)}</Badge>
					</div>

					<div class="grid grid-cols-2 gap-2 text-xs">
						<div>
							<Text size="xs" color="muted">Crate version</Text>
							<Text size="xs">
								<span class="font-mono">
									{group.fingerprint.crate_version ?? "—"}
								</span>
							</Text>
						</div>
						<div>
							<Text size="xs" color="muted">Upstream revision</Text>
							<Text size="xs">
								<span class="font-mono">
									{group.fingerprint.upstream_revision ?? "—"}
								</span>
							</Text>
						</div>
					</div>

					<div>
						<Text size="xs" color="muted">
							Bound to {group.slots.length} slot{group.slots.length === 1 ? "" : "s"}
						</Text>
						<Text size="xs">
							{#each group.slots as s, i (s)}
								<span class="font-mono">{s}</span>{i < group.slots.length - 1 ? ", " : ""}
							{/each}
						</Text>
					</div>

					{#if check && check.message}
						<div
							class="rounded-md p-2 text-xs"
							style="background: var(--surface-raised); border: 1px solid var(--border-subtle);"
						>
							<Text size="xs">{check.message}</Text>
							{#if check.source_url}
								<a
									href={check.source_url}
									target="_blank"
									rel="noreferrer"
									class="mt-1 inline-flex items-center gap-1"
									style="color: var(--accent-teal-main);"
								>
									<ExternalLink size={10} />
									<span class="text-[10px]">Open upstream</span>
								</a>
							{/if}
						</div>
					{/if}

					{#if group.devtool}
						<a
							href={group.devtool.route}
							class="inline-flex items-center gap-1 self-start"
							style="color: var(--accent-teal-main); font-size: var(--font-size-xs);"
						>
							Open {group.devtool.label} devtool →
						</a>
					{/if}
				</div>
			{/each}
		</div>
	{/snippet}

	{#snippet config()}
		<div class="flex flex-col gap-3">
			<Text size="sm" weight="bold">Runtime aggregation has no config</Text>
			<Text size="xs" color="muted">
				This devtool is a pure read-only view. Per-runtime config lives in the
				individual runtime devtool — open
				<span class="font-mono">/devtools/runtimes/inference/candle</span>,
				<span class="font-mono">/devtools/runtimes/inference/llama-cpp</span>, or
				<span class="font-mono">/devtools/runtimes/inference/ollama</span> to mutate behaviour.
			</Text>
		</div>
	{/snippet}

	{#snippet logs()}
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<Text size="sm" weight="semibold">
					Scoped log — <span class="font-mono text-xs">devtools.runtimes</span>
				</Text>
				<Button preset="ghost" size="sm" onclick={loadLogs} disabled={logsLoading}>
					{#if logsLoading}
						<Spinner size="xs" tone="accent" />
					{:else}
						Refresh
					{/if}
				</Button>
			</div>

			{#if logsError}
				<div
					class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400"
				>
					{logsError}
				</div>
			{/if}

			{#if logs.length > 0}
				<div
					class="rounded-lg border border-[var(--border-subtle)] overflow-hidden max-h-80 overflow-y-auto"
				>
					<table class="w-full text-xs">
						<thead class="sticky top-0 bg-[var(--surface-raised)]">
							<tr class="border-b border-[var(--border-subtle)]">
								<th class="text-left px-2 py-1 font-medium text-[var(--text-secondary)]">Time</th>
								<th class="text-left px-2 py-1 font-medium text-[var(--text-secondary)]">Level</th>
								<th class="text-left px-2 py-1 font-medium text-[var(--text-secondary)]">Message</th>
							</tr>
						</thead>
						<tbody>
							{#each logs as line (line.timestamp + line.message)}
								<tr class="border-b border-[var(--border-subtle)]">
									<td class="px-2 py-1 font-mono text-[10px] text-[var(--text-secondary)]">
										{line.timestamp.slice(11, 19)}
									</td>
									<td class="px-2 py-1 font-mono text-[10px]">{line.level}</td>
									<td class="px-2 py-1 break-all">{line.message}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else if logsLoading}
				<Text size="sm" color="muted">Loading…</Text>
			{:else}
				<Text size="sm" color="muted">
					No log entries yet — click Refresh to tail the current session log.
				</Text>
			{/if}
		</div>
	{/snippet}

	{#snippet actions()}
		<div class="flex flex-col gap-4">
			<div class="flex items-center gap-2">
				<Button preset="button-primary" size="sm" onclick={refresh} disabled={loading}>
					{#if loading}
						<Spinner size="xs" />
						Refreshing…
					{:else}
						<RefreshCw size={12} />
						Refresh runtimes
					{/if}
				</Button>
				<Text size="xs" color="muted">
					Re-fetch the current fingerprint snapshot from the engine.
				</Text>
			</div>

			{#if runtimeGroups.length === 0}
				<Text size="sm" color="muted">
					Load a slot to enable per-runtime update checks.
				</Text>
			{/if}

			{#each runtimeGroups as group (group.runtime_id)}
				{@const check = updateChecks[group.runtime_id]}
				<div
					class="flex items-center justify-between gap-2 rounded-lg p-2"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
				>
					<div class="flex flex-col">
						<Text size="xs" weight="bold">
							<span class="font-mono">{group.runtime_id}</span>
						</Text>
						<Text size="xs" color="muted">{statusLabel(check)}</Text>
					</div>
					<Button
						preset="button-ghost"
						size="sm"
						onclick={() => checkUpdates(group.runtime_id)}
						disabled={checkingRuntime === group.runtime_id}
					>
						{#if checkingRuntime === group.runtime_id}
							<Spinner size="xs" />
							Checking…
						{:else}
							Check for updates
						{/if}
					</Button>
				</div>
			{/each}
		</div>
	{/snippet}

	{#snippet debug()}
		<div class="flex flex-col gap-4">
			<div
				class="rounded-lg p-3"
				style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
			>
				<Text size="sm" weight="bold">Live fingerprints (raw)</Text>
				<pre
					class="mt-2 max-h-64 overflow-auto rounded p-2 text-[10px] font-mono"
					style="background: var(--surface-raised); border: 1px solid var(--border-subtle);">{JSON.stringify(fingerprints, null, 2)}</pre>
			</div>

			<div
				class="rounded-lg p-3"
				style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
			>
				<Text size="sm" weight="bold">Last update checks</Text>
				<pre
					class="mt-2 max-h-64 overflow-auto rounded p-2 text-[10px] font-mono"
					style="background: var(--surface-raised); border: 1px solid var(--border-subtle);">{JSON.stringify(updateChecks, null, 2)}</pre>
			</div>

			<Text size="xs" color="muted">
				Fingerprints come from
				<span class="font-mono">commands.list_runtime_fingerprints</span> on
				mount + every Refresh. Update checks are user-triggered via the
				Actions tab. Phase 5 follow-up wires actual upstream queries —
				today every runtime returns
				<span class="font-mono">no_check_configured</span>.
			</Text>
		</div>
	{/snippet}
</ServiceDevtoolShell>
