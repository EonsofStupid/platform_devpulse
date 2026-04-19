<!--
	@file /devtools/devforge - DevForge Devtool
	@route /devtools/devforge
	@window DevTools (Ctrl+Shift+Z)

	DevForge REH server management.
	Start/stop the code-oss subprocess, open window, recent projects.
-->
<script lang="ts">
import {
	ArrowLeft,
	Code,
	ExternalLink,
	FolderOpen,
	HeartPulse,
	Power,
	RefreshCw,
	Trash2,
} from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { devforgeState } from "$lib/domains/app/devforge/index.js";

$effect(() => {
	if (!devforgeState.status && !devforgeState.statusLoading) {
		devforgeState.loadStatus();
		devforgeState.loadRecentProjects();
	}
});
</script>

<div class="flex flex-col h-full bg-[var(--surface-base)] text-[var(--text-primary)]">
	<!-- Header -->
	<header class="flex items-center gap-3 h-10 px-4 border-b border-[var(--border-subtle)]">
		<a href="/devtools" class="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
			<ArrowLeft size={14} />
		</a>
		<Code size={16} class="text-[var(--color-teal-400)]" />
		<Text size="sm" weight="semibold">DevForge</Text>
		<span class="text-xs text-[var(--text-secondary)]">Code Editor &middot; REH Server</span>

		<div class="ml-auto flex items-center gap-2">
			<Button
				preset="ghost"
				size="sm"
				onclick={() => devforgeState.loadStatus()}
				disabled={devforgeState.statusLoading}
			>
				{#if devforgeState.statusLoading}<Spinner size="xs" tone="accent" />{:else}<RefreshCw size={14} />{/if}
				Refresh
			</Button>
		</div>
	</header>

	<main class="flex-1 overflow-y-auto p-4 space-y-6">

		<!-- ── Status Card ──────────────────────────────────── -->
		{#if devforgeState.statusError}
			<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
				{devforgeState.statusError}
			</div>
		{/if}

		<div class="p-4 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
			<div class="flex items-center justify-between mb-3">
				<div class="flex items-center gap-2">
					<HeartPulse size={16} class="text-[var(--color-teal-400)]" />
					<Text size="sm" weight="semibold">Server Status</Text>
				</div>
				<span
					class="inline-block w-2.5 h-2.5 rounded-full"
					style="background: {devforgeState.running ? 'var(--signal-success)' : 'var(--signal-error)'}"
				></span>
			</div>

			{#if devforgeState.status}
				<div class="space-y-2 text-xs">
					<div class="flex justify-between">
						<span class="text-[var(--text-secondary)]">Installed</span>
						<span style="color: {devforgeState.installed ? 'var(--signal-success)' : 'var(--signal-error)'}">
							{devforgeState.installed ? "Yes" : "Not found"}
						</span>
					</div>
					<div class="flex justify-between">
						<span class="text-[var(--text-secondary)]">Running</span>
						<span style="color: {devforgeState.running ? 'var(--signal-success)' : 'var(--signal-error)'}">
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
				<Text size="xs" color="muted">Checking status...</Text>
			{/if}
		</div>

		<!-- ── Control Buttons ──────────────────────────────── -->
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
				<Button
					preset="ghost"
					size="md"
					onclick={() => devforgeState.closeWindow()}
				>
					<Power size={14} />
					Close Window
				</Button>
			{/if}
		</div>

		<!-- ── Recent Projects ──────────────────────────────── -->
		<div>
			<div class="flex items-center justify-between mb-2">
				<Text size="sm" weight="semibold">Recent Projects</Text>
				<Text size="xs" color="secondary">{devforgeState.recentProjects.length} projects</Text>
			</div>

			{#if devforgeState.recentProjects.length > 0}
				<div class="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
					{#each devforgeState.recentProjects as project}
						<div class="flex items-center justify-between px-3 py-2 border-b border-[var(--border-subtle)] hover:bg-[var(--surface-raised)] group">
							<div class="flex items-center gap-2 min-w-0">
								<FolderOpen size={14} class="text-[var(--color-teal-400)] shrink-0" />
								<span class="text-xs font-mono truncate">{project}</span>
							</div>
							<button
								class="opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-red-400 transition-opacity"
								onclick={() => devforgeState.removeRecentProject(project)}
							>
								<Trash2 size={12} />
							</button>
						</div>
					{/each}
				</div>
			{:else}
				<Text size="xs" color="muted">No recent projects. Open DevForge and open a folder to populate this list.</Text>
			{/if}
		</div>

		<!-- ── Theme Note ──────────────────────────────────── -->
		<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
			<Text size="xs" color="secondary">
				DevForge opens with the DevPulse dark teal theme by default.
				Theme is controlled via REH user-data at <span class="font-mono text-[10px]">.userdata/devforge/user-data/</span>.
			</Text>
		</div>
	</main>
</div>
