<!--
  @file DevForgeDashboard — customer-facing /devforge surface.
  Rendered by (app)/devforge/+page.svelte.

  Replaces the prior generic build-pipeline placeholders with real,
  layman-phrased DevForge status: launch button, runtime stats
  (process id, memory, uptime), connection details, recent projects,
  and a tail of the lifecycle event stream.

  Audience is the user, not the dev — copy is friendly and the
  hard-edge values (PID, RSS bytes, port) are formatted in human
  terms first with the raw figures shown alongside.
-->
<script lang="ts">
import { Activity, FolderOpen, Play, Power, RefreshCw, ServerCog, Terminal } from "lucide-svelte";
import { onMount } from "svelte";
import { Widget } from "$lib/design/blocks/widgets/index.js";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { devforgeState } from "$lib/domains/app/devforge/index.js";
import { commands } from "$lib/sys/generated/bindings.js";

interface LifecycleEvent {
	timestamp: string;
	target: string;
	level: string;
	message: string;
}

let opening = $state(false);
let openError = $state<string | null>(null);
let lifecycleEvents = $state<LifecycleEvent[]>([]);
let lifecycleLoading = $state(false);

// Mount-load — `onMount` because `$effect` would re-track the loading
// flags `loadStatus()` flips and re-fire on every mutation. (See the
// ProjectSwitcher fix.)
onMount(() => {
	void devforgeState.loadStatus();
	void devforgeState.loadRecentProjects();
	void loadLifecycle();
});

async function loadLifecycle(): Promise<void> {
	lifecycleLoading = true;
	try {
		const r = await commands.queryScopedLog("sidecar.lifecycle", 20);
		if (r.status !== "ok") {
			lifecycleEvents = [];
			return;
		}
		// Filter to DevForge rows only. `ScopedLogEntry` does not
		// carry a structured `fields` map (the engine flattens the
		// payload into `message` + `target`); match on the target /
		// message text instead, both of which carry the service label.
		const filtered = r.data.filter((entry) => {
			const haystack = `${entry.target} ${entry.message}`.toLowerCase();
			return haystack.includes("devforge");
		});
		lifecycleEvents = filtered.slice(0, 6).map((entry) => ({
			timestamp: entry.timestamp,
			target: entry.target,
			level: entry.level,
			message: entry.message ?? "",
		}));
	} catch {
		lifecycleEvents = [];
	} finally {
		lifecycleLoading = false;
	}
}

async function openDevForgeWindow(): Promise<void> {
	opening = true;
	openError = null;
	try {
		await devforgeState.openWindow();
		await loadLifecycle();
	} catch (e) {
		openError = e instanceof Error ? e.message : String(e);
	} finally {
		opening = false;
	}
}

async function refreshAll(): Promise<void> {
	await Promise.all([devforgeState.refresh(), loadLifecycle()]);
}

const friendlyStatus = $derived.by(() => {
	if (devforgeState.statusLoading) return { label: "Checking…", tone: "neutral" as const };
	if (devforgeState.statusError) return { label: "Status unavailable", tone: "negative" as const };
	if (!devforgeState.installed) return { label: "Not installed", tone: "negative" as const };
	if (devforgeState.running) return { label: "Running smoothly", tone: "positive" as const };
	return { label: "Stopped — click Open DevForge to start", tone: "neutral" as const };
});

function formatUptime(secs: number | null): string {
	if (secs === null || secs < 0) return "—";
	if (secs < 60) return `${secs}s`;
	const m = Math.floor(secs / 60);
	if (m < 60) return `${m}m ${secs % 60}s`;
	const h = Math.floor(m / 60);
	return `${h}h ${m % 60}m`;
}

function formatBytes(bytes: number | null): string {
	if (bytes === null) return "—";
	const mb = bytes / (1024 * 1024);
	if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
	if (mb >= 1) return `${mb.toFixed(1)} MB`;
	const kb = bytes / 1024;
	return `${kb.toFixed(0)} KB`;
}

function formatTime(iso: string): string {
	try {
		return new Date(iso).toLocaleTimeString();
	} catch {
		return iso;
	}
}
</script>

<div class="grid grid-cols-12 gap-4" data-page="devforge-dashboard">
	<!-- Row 0: Launch widget — always present, badge live-tied to status. -->
	<div class="col-span-12">
		<Widget
			title="DevForge IDE"
			icon={ServerCog}
			surface="glass-deep"
			depth="z2"
			bevel="soft"
			glow="teal"
			frame="accent-teal"
			radius="lg"
		>
			<div class={hstack({ justify: "between", align: "center", gap: "4" })}>
				<div class={stack({ gap: "1" })}>
					<div class={hstack({ gap: "2", align: "center" })}>
						<Text weight="semibold">Open the full code editor in its own window</Text>
						<Badge variant={friendlyStatus.tone} size="sm">{friendlyStatus.label}</Badge>
					</div>
					<Text size="sm" color="muted">
						Launches DevForge as a dedicated window — your extensions, settings, and project
						history live under <span class="font-mono">.userdata/devforge/</span>.
					</Text>
					{#if openError}
						<Text size="sm" color="negative">DevForge could not open: {openError}</Text>
					{:else if devforgeState.statusError}
						<Text size="sm" color="negative">{devforgeState.statusError}</Text>
					{/if}
				</div>
				<div class={hstack({ gap: "2" })}>
					<Button
						preset="ghost"
						size="md"
						onclick={refreshAll}
						disabled={devforgeState.statusLoading || lifecycleLoading}
					>
						{#if devforgeState.statusLoading || lifecycleLoading}
							<Spinner size="xs" tone="accent" />
						{:else}
							<RefreshCw size={14} />
						{/if}
						Refresh
					</Button>
					<Button
						preset="primary"
						size="md"
						onclick={openDevForgeWindow}
						disabled={opening || !devforgeState.installed}
					>
						<Play size={16} />
						{opening ? "Opening…" : devforgeState.running ? "Focus DevForge" : "Open DevForge"}
					</Button>
					{#if devforgeState.running}
						<Button preset="ghost" size="md" onclick={() => devforgeState.closeWindow()}>
							<Power size={14} />
							Close window
						</Button>
					{/if}
				</div>
			</div>
		</Widget>
	</div>

	<!-- Row 1: Runtime stats (PID, memory, uptime) + Connection details. -->
	<div class="col-span-6">
		<Widget
			title="Runtime"
			icon={Activity}
			surface="glass-deep"
			depth="z2"
			bevel="soft"
			frame="soft"
			radius="lg"
		>
			<div class={stack({ gap: "2" })}>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Status</Text>
					<Badge variant={friendlyStatus.tone} size="sm">{friendlyStatus.label}</Badge>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Uptime</Text>
					<Text size="sm" class="font-mono">{formatUptime(devforgeState.uptimeSecs)}</Text>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Memory in use</Text>
					<Text size="sm" class="font-mono">{formatBytes(devforgeState.memoryRssBytes)}</Text>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Process ID</Text>
					<Text size="sm" class="font-mono">{devforgeState.pid ?? "—"}</Text>
				</div>
			</div>
		</Widget>
	</div>

	<div class="col-span-6">
		<Widget
			title="Connection"
			icon={Terminal}
			surface="glass-deep"
			depth="z2"
			bevel="soft"
			frame="soft"
			radius="lg"
		>
			<div class={stack({ gap: "2" })}>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Port</Text>
					<Text size="sm" class="font-mono">{devforgeState.port ?? "—"}</Text>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Host</Text>
					<Text size="sm" class="font-mono">127.0.0.1</Text>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Auth token</Text>
					<Text size="sm" class="font-mono" color="muted">
						{devforgeState.connectionUrl ? "Active (rotated each launch)" : "—"}
					</Text>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">REH version</Text>
					<Text size="xs" class="font-mono">
						{devforgeState.status?.rehVersion ?? "—"}
					</Text>
				</div>
			</div>
		</Widget>
	</div>

	<!-- Row 2: Recent activity (lifecycle events) + Recent projects. -->
	<div class="col-span-7">
		<Widget
			title="Recent activity"
			icon={Activity}
			surface="glass-deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
		>
			{#if lifecycleEvents.length === 0}
				<Text size="sm" color="muted">
					No DevForge events yet. Open DevForge to see launch progress here.
				</Text>
			{:else}
				<div class={stack({ gap: "2" })}>
					{#each lifecycleEvents as event}
						<div class={cn(hstack({ justify: "between", align: "center", gap: "3" }), "rounded-lg border border-[var(--border-subtle)] px-3 py-2")}>
							<div class={stack({ gap: "1" })}>
								<div class={hstack({ gap: "2", align: "center" })}>
									<Badge size="sm" variant={event.level === "ERROR" ? "negative" : "neutral"}>
										{event.level}
									</Badge>
									<Text size="xs" color="muted">{formatTime(event.timestamp)}</Text>
								</div>
								<Text size="xs" class="font-mono">
									{event.message}
								</Text>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Widget>
	</div>

	<div class="col-span-5">
		<Widget
			title="Recent projects"
			icon={FolderOpen}
			surface="glass-deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
		>
			{#if devforgeState.recentProjects.length === 0}
				<Text size="sm" color="muted">
					Open a folder inside DevForge — it will appear here for one-click reopen.
				</Text>
			{:else}
				<div class={stack({ gap: "1" })}>
					{#each devforgeState.recentProjects.slice(0, 6) as path}
						<div class={cn(hstack({ justify: "between", align: "center", gap: "2" }), "rounded-lg px-3 py-2 hover:bg-[var(--surface-raised)]")}>
							<Text size="xs" class="font-mono truncate">{path}</Text>
						</div>
					{/each}
				</div>
			{/if}
		</Widget>
	</div>
</div>
