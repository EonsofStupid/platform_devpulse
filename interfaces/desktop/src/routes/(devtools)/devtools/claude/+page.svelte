<!--
  @file Claude Integration DevTool
  @route /devtools/claude
  @window DevTools

  Real MCP server status + control. Layman-friendly, ColdLight-composed.
  Runes-based polling — $state, $derived, $effect with cleanup.
-->
<script lang="ts">
import {
	Activity,
	AlertTriangle,
	ArrowLeftRight,
	Bot,
	CheckCircle,
	Key,
	RefreshCw,
	Shield,
	Zap,
} from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { commands, type McpStatus } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";

// ── Reactive state (runes only) ────────────────────────
let mcpStatus = $state<McpStatus | null>(null);
let lastError = $state<string | null>(null);
let restarting = $state(false);
let lastPolledAt = $state<number>(0);

// ── Derived indicators ─────────────────────────────────
const isHealthy = $derived(mcpStatus?.running === true);
const healthLabel = $derived(isHealthy ? "Running" : "Offline");
const healthColor = $derived(isHealthy ? "var(--signal-success)" : "var(--signal-error)");
const toolCount = $derived(mcpStatus?.toolCount ?? 0);
const transport = $derived(mcpStatus?.transport ?? "—");
const protocolVersion = $derived(mcpStatus?.protocolVersion ?? "—");
const uptimeSecs = $derived.by(() => {
	if (!mcpStatus?.startedAt) return 0;
	return Math.max(0, Math.floor(Date.now() / 1000 - mcpStatus.startedAt));
});
const uptimeLabel = $derived.by(() => {
	const s = uptimeSecs;
	if (s < 60) return `${s}s`;
	if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
	return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
});

// ── Card composition (renderForge) ─────────────────────
const cardMacro = $derived(renderForge({ kind: "card", preset: "glass" }));

// ── Polling effect (runes with cleanup) ────────────────
async function fetchStatus(): Promise<void> {
	try {
		const result = await commands.getMcpStatus();
		if (result.status === "ok") {
			mcpStatus = result.data;
			lastError = null;
			lastPolledAt = Date.now();
		} else {
			lastError = result.error;
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("devtools.claude", `getMcpStatus failed: ${msg}`);
		lastError = msg;
	}
}

$effect(() => {
	fetchStatus();
	const interval = setInterval(fetchStatus, 2000);
	return () => clearInterval(interval);
});

// ── Restart action ─────────────────────────────────────
async function handleRestart(): Promise<void> {
	restarting = true;
	logInfo("devtools.claude", "Restart requested");
	try {
		const result = await commands.restartMcpServer();
		if (result.status === "ok") {
			mcpStatus = result.data;
			lastError = null;
			logInfo("devtools.claude", "MCP restart complete");
		} else {
			lastError = result.error;
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("devtools.claude", `Restart failed: ${msg}`);
		lastError = msg;
	} finally {
		restarting = false;
	}
}
</script>

<div
	class="flex flex-col gap-6 p-6 h-full overflow-y-auto"
	style="background: var(--surface-base); color: var(--text-primary);"
	data-cl-surface
	data-cl-text
>
	<!-- ── HEADER WITH HEALTH INDICATOR ─────────────────────── -->
	<div
		{...cardMacro.dataAttrs}
		style={cssVarString(cardMacro.cssVars)}
		class="rounded-lg p-5 flex items-center gap-4"
	>
		<div
			class="flex items-center justify-center w-14 h-14 rounded-full"
			style="background: {isHealthy
				? 'var(--claude-role-mcp-fill)'
				: 'oklch(0.55 0.15 25 / 0.12)'};"
		>
			{#if isHealthy}
				<CheckCircle size={28} style="color: {healthColor};" />
			{:else}
				<AlertTriangle size={28} style="color: {healthColor};" />
			{/if}
		</div>

		<div class="flex flex-col gap-1 flex-1">
			<div class="flex items-center gap-3">
				<Text size="lg" weight="bold" color="primary">Claude MCP Server</Text>
				<Badge variant={isHealthy ? "positive" : "negative"} size="sm">
					{healthLabel}
				</Badge>
			</div>
			<Text size="sm" color="muted">
				{#if isHealthy}
					Serving {toolCount} tools to Claude Code via {transport} · uptime {uptimeLabel}
				{:else if lastError}
					{lastError}
				{:else}
					Connecting to platform...
				{/if}
			</Text>
		</div>

		<button
			class="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition-colors disabled:opacity-50"
			style="background: var(--claude-role-mcp-fill); color: var(--claude-role-mcp-main); border: 1px solid var(--claude-role-mcp-main);"
			onclick={handleRestart}
			disabled={restarting}
			aria-label="Restart MCP server"
		>
			{#if restarting}
				<Spinner size="sm" />
			{:else}
				<RefreshCw size={16} />
			{/if}
			{restarting ? "Restarting..." : "Restart"}
		</button>
	</div>

	<!-- ── TOOL LIST ────────────────────────────────────────── -->
	<div
		{...cardMacro.dataAttrs}
		style={cssVarString(cardMacro.cssVars)}
		class="rounded-lg p-5"
	>
		<div class="flex items-center gap-2 mb-4">
			<Zap size={18} style="color: var(--claude-role-mcp-main);" />
			<Text size="base" weight="bold" color="primary">Registered Tools</Text>
			<Badge variant="informative" size="sm">{toolCount}</Badge>
		</div>
		{#if mcpStatus?.toolNames && mcpStatus.toolNames.length > 0}
			<div class="grid grid-cols-2 gap-2">
				{#each mcpStatus.toolNames as toolName (toolName)}
					<div
						class="flex items-center gap-2 rounded-md px-3 py-2"
						style="background: var(--claude-role-mcp-fill); border: 1px solid var(--claude-role-mcp-main);"
					>
						<CheckCircle size={14} style="color: var(--signal-success);" />
						<Text size="sm" color="primary">{toolName}</Text>
					</div>
				{/each}
			</div>
		{:else}
			<Text size="sm" color="muted">Waiting for MCP server to register tools...</Text>
		{/if}
	</div>

	<!-- ── CONNECTION INFO ──────────────────────────────────── -->
	<div class="grid grid-cols-2 gap-4">
		<!-- Subscription Lane -->
		<div
			{...cardMacro.dataAttrs}
			style={cssVarString(cardMacro.cssVars)}
			class="rounded-lg p-5"
		>
			<div class="flex items-center gap-2 mb-3">
				<Bot size={18} style="color: var(--claude-role-subscription-main);" />
				<Text size="base" weight="bold" color="primary">Subscription Lane</Text>
				<Badge variant="informative" size="sm">Dev Only</Badge>
			</div>
			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<Text size="sm" color="muted">Transport</Text>
					<Text size="sm" color="primary">stdio (Claude Code)</Text>
				</div>
				<div class="flex items-center justify-between">
					<Text size="sm" color="muted">Cost cap</Text>
					<Text size="sm" color="primary">None</Text>
				</div>
				<div class="flex items-center justify-between">
					<Text size="sm" color="muted">Rate limit</Text>
					<Text size="sm" color="primary">60 req/min · 1M tokens/day</Text>
				</div>
			</div>
		</div>

		<!-- API Lane -->
		<div
			{...cardMacro.dataAttrs}
			style={cssVarString(cardMacro.cssVars)}
			class="rounded-lg p-5"
		>
			<div class="flex items-center gap-2 mb-3">
				<Key size={18} style="color: var(--claude-role-api-main);" />
				<Text size="base" weight="bold" color="primary">API Lane</Text>
				<Badge variant="neutral" size="sm">Always</Badge>
			</div>
			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<Text size="sm" color="muted">Provider</Text>
					<Text size="sm" color="primary">Claude (Anthropic)</Text>
				</div>
				<div class="flex items-center justify-between">
					<Text size="sm" color="muted">Cost cap</Text>
					<Text size="sm" color="primary">$50/day</Text>
				</div>
				<div class="flex items-center justify-between">
					<Text size="sm" color="muted">Rate limit</Text>
					<Text size="sm" color="primary">20 req/min · 500K tokens/day</Text>
				</div>
			</div>
		</div>
	</div>

	<!-- ── COUNCIL ROUTING ──────────────────────────────────── -->
	<div
		{...cardMacro.dataAttrs}
		style={cssVarString(cardMacro.cssVars)}
		class="rounded-lg p-5"
	>
		<div class="flex items-center gap-2 mb-4">
			<Shield size={18} style="color: var(--claude-role-council-main);" />
			<Text size="base" weight="bold" color="primary">Council Routing</Text>
		</div>
		<Text size="sm" color="muted" class="mb-3">
			When Clyffy needs Claude help, the council picks a lane in this order:
		</Text>
		<div class="flex flex-col gap-2">
			<div class="flex items-center gap-3">
				<div
					class="flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold"
					style="background: var(--claude-role-subscription-main); color: var(--surface-base);"
				>
					1
				</div>
				<div class="flex-1">
					<Text size="sm" weight="bold" color="primary">Subscription Lane</Text>
					<Text size="sm" color="muted">Free via Claude Code/Desktop MCP</Text>
				</div>
				<Badge variant="positive" size="sm">Preferred</Badge>
			</div>
			<div class="flex items-center gap-3">
				<div
					class="flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold"
					style="background: var(--claude-role-api-main); color: var(--surface-base);"
				>
					2
				</div>
				<div class="flex-1">
					<Text size="sm" weight="bold" color="primary">API Lane</Text>
					<Text size="sm" color="muted">Falls back here if subscription is rate-limited</Text>
				</div>
				<Badge variant="neutral" size="sm">Fallback</Badge>
			</div>
			<div class="flex items-center gap-3">
				<div
					class="flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold"
					style="background: var(--border-subtle); color: var(--text-primary);"
				>
					3
				</div>
				<div class="flex-1">
					<Text size="sm" weight="bold" color="primary">Local Brain Only</Text>
					<Text size="sm" color="muted">Clyffy uses local models, no cloud help</Text>
				</div>
				<Badge variant="neutral" size="sm">Last Resort</Badge>
			</div>
		</div>
	</div>

	<!-- ── DIAGNOSTIC ───────────────────────────────────────── -->
	<div class="flex items-center gap-2 justify-end">
		<Activity size={12} style="color: var(--text-muted);" />
		<Text size="sm" color="muted">
			Protocol {protocolVersion}
			{#if lastPolledAt > 0}
				· Last polled {Math.floor((Date.now() - lastPolledAt) / 1000)}s ago
			{/if}
		</Text>
	</div>
</div>
