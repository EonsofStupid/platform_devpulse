<!--
	@file /devtools/system/ide/devforge — DevForge devtool
	@route /devtools/system/ide/devforge

	DevForge REH server management on `ServiceDevtoolShell`. Status holds
	the server-state card; Actions exposes the Open / Close window buttons;
	extras: "Projects" (recent projects list with remove).
-->
<script lang="ts">
import { Code, ExternalLink, FolderOpen, Power, RefreshCw, Trash2 } from "lucide-svelte";
import { onMount } from "svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import {
	type ExtraTab,
	type HealthBadge,
	ScopedLogPanel,
	ServiceDevtoolShell,
} from "$lib/devtools/index.js";
import { devforgeState } from "$lib/domains/app/devforge/index.js";

const extraTabs: ExtraTab[] = [{ id: "projects", label: "Projects", Icon: FolderOpen }];

// Mount-load — bailout reads `statusLoading`, which loadStatus() flips.
// `$effect` would loop. (See ProjectSwitcher fix.)
onMount(() => {
	if (!devforgeState.status && !devforgeState.statusLoading) {
		devforgeState.loadStatus();
		devforgeState.loadRecentProjects();
	}
});

const badge = $derived<HealthBadge>(
	devforgeState.statusLoading
		? { state: "starting", label: "Checking…" }
		: devforgeState.statusError
			? { state: "down", label: "Error" }
			: !devforgeState.installed
				? { state: "down", label: "Not installed" }
				: devforgeState.running
					? { state: "up", label: "Running" }
					: { state: "stopped", label: "Stopped" },
);
</script>

<ServiceDevtoolShell
	title="DevForge"
	description="Code Editor · REH Server"
	icon={Code}
	axis="runtimes"
	accent="magenta"
	health={badge}
	{extraTabs}
>
	{#snippet status()}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<Text size="sm" weight="semibold">Server Status</Text>
				<Button
					preset="ghost"
					size="sm"
					onclick={() => devforgeState.loadStatus()}
					disabled={devforgeState.statusLoading}
				>
					{#if devforgeState.statusLoading}
						<Spinner size="xs" tone="accent" />
					{:else}
						<RefreshCw size={14} />
					{/if}
					Refresh
				</Button>
			</div>

			{#if devforgeState.statusError}
				<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
					{devforgeState.statusError}
				</div>
			{/if}

			<div
				class="p-4 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]"
			>
				{#if devforgeState.status}
					<div class="space-y-2 text-xs">
						<div class="flex justify-between">
							<span class="text-[var(--text-secondary)]">Installed</span>
							<span
								style="color: {devforgeState.installed
									? 'var(--signal-success)'
									: 'var(--signal-error)'}"
							>
								{devforgeState.installed ? "Yes" : "Not found"}
							</span>
						</div>
						<div class="flex justify-between">
							<span class="text-[var(--text-secondary)]">Running</span>
							<span
								style="color: {devforgeState.running
									? 'var(--signal-success)'
									: 'var(--signal-error)'}"
							>
								{devforgeState.running ? "Active" : "Stopped"}
							</span>
						</div>
						{#if devforgeState.port}
							<div class="flex justify-between">
								<span class="text-[var(--text-secondary)]">Port</span>
								<span class="font-mono">{devforgeState.port}</span>
							</div>
						{/if}
						{#if devforgeState.status.reh_version}
							<div class="flex justify-between">
								<span class="text-[var(--text-secondary)]">Version</span>
								<span class="font-mono text-[10px]">{devforgeState.status.reh_version}</span>
							</div>
						{/if}
					</div>
				{:else if devforgeState.statusLoading}
					<Text size="xs" color="muted">Checking status…</Text>
				{/if}
			</div>
		</div>
	{/snippet}

	{#snippet config()}
		<div
			class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]"
		>
			<Text size="xs" color="secondary">
				DevForge opens with the DevPulse dark teal theme by default. Theme is
				controlled via REH user-data at
				<span class="font-mono text-[10px]">.userdata/devforge/user-data/</span>.
				Additional config (update channel, extensions dir, port binding) wires
				up with <code>devforge_save_config</code>.
			</Text>
		</div>
	{/snippet}

	{#snippet logs()}
		<!--
			Subscribes to the unified `sidecar.lifecycle` tracing target —
			the same stream `emit_lifecycle!` / `emit_lifecycle_dual!` emit
			on. Includes preflight, spawning, ready, frozen (hot-update
			reserved), shutdown, failed phase events. Filtered to DevForge
			rows only by the `service = ?ServiceRole::DevForge` field on
			every event.
		-->
		<ScopedLogPanel target="sidecar.lifecycle" />
	{/snippet}

	{#snippet actions()}
		<div class="space-y-3">
			<div class="flex gap-3">
				<Button
					preset="default"
					size="md"
					onclick={() => devforgeState.openWindow()}
					disabled={!devforgeState.installed}
				>
					<ExternalLink size={14} />
					Open DevForge
				</Button>

				{#if devforgeState.running}
					<Button preset="ghost" size="md" onclick={() => devforgeState.closeWindow()}>
						<Power size={14} />
						Close Window
					</Button>
				{/if}
			</div>

			<Text size="xs" color="muted">
				Start / stop / restart of the REH server process itself (separate from
				its window) wires up with <code>devforge_start</code> /
				<code>devforge_stop</code> / <code>devforge_restart</code>.
			</Text>
		</div>
	{/snippet}

	{#snippet extra(tabId: string)}
		{#if tabId === "projects"}
			{@render projectsBody()}
		{/if}
	{/snippet}
</ServiceDevtoolShell>

{#snippet projectsBody()}
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<Text size="sm" weight="semibold">Recent Projects</Text>
			<Text size="xs" color="secondary">
				{devforgeState.recentProjects.length} projects
			</Text>
		</div>

		{#if devforgeState.recentProjects.length > 0}
			<div class="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
				{#each devforgeState.recentProjects as project}
					<div
						class="flex items-center justify-between px-3 py-2 border-b border-[var(--border-subtle)] hover:bg-[var(--surface-raised)] group"
					>
						<div class="flex items-center gap-2 min-w-0">
							<FolderOpen size={14} class="text-[var(--color-teal-400)] shrink-0" />
							<span class="text-xs font-mono truncate">{project}</span>
						</div>
						<button
							type="button"
							class="opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-red-400 transition-opacity"
							onclick={() => devforgeState.removeRecentProject(project)}
							aria-label="Remove project"
						>
							<Trash2 size={12} />
						</button>
					</div>
				{/each}
			</div>
		{:else}
			<Text size="xs" color="muted">
				No recent projects. Open DevForge and open a folder to populate this
				list.
			</Text>
		{/if}
	</div>
{/snippet}
