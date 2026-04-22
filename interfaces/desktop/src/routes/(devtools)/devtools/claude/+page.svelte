<!--
	@file /devtools/claude — Claude Integration devtool
	@route /devtools/claude

	Wrapped in ServiceDevtoolShell (Status/Config/Logs/Actions) — same chrome
	as every other per-service devtool. The MCP server is the long-running
	piece; restart presents the Clyffy LoadingBlock. Short queries (refresh)
	use inline spinner.

	Visual variety comes from the generic ColdLight accent tokens
	(--accent-{purple|cyan|ember|teal}-{main|fill|glow}). No custom
	claude-scoped vars — Card variants + Badge variants do the work.
-->
<script lang="ts">
import { Activity, Bot, Key, Plug, RefreshCw, Shield, Wrench } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { LoadingBlock, Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { type HealthBadge, ServiceDevtoolShell } from "$lib/domains/platform/_shared/index.js";
import { commands, type McpStatus } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";

// ── State ──────────────────────────────────────────────
let mcpStatus = $state<McpStatus | null>(null);
let lastError = $state<string | null>(null);
let restarting = $state(false);
let refreshing = $state(false);
let lastPolledAt = $state<number>(0);

// ── Derived ────────────────────────────────────────────
const running = $derived(mcpStatus?.running === true);
const toolCount = $derived(mcpStatus?.toolCount ?? 0);
const transport = $derived(mcpStatus?.transport ?? "—");
const protocolVersion = $derived(mcpStatus?.protocolVersion ?? "—");

const uptimeLabel = $derived.by(() => {
	if (!mcpStatus?.startedAt) return "—";
	const s = Math.max(0, Math.floor(Date.now() / 1000 - mcpStatus.startedAt));
	if (s < 60) return `${s}s`;
	if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
	return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
});

const badge = $derived<HealthBadge>(
	running
		? { state: "up", label: `MCP serving · ${toolCount} tools` }
		: lastError
			? { state: "down", label: "Unreachable — see logs" }
			: { state: "starting", label: "Connecting…" },
);

// ── Polling ────────────────────────────────────────────
async function fetchStatus(): Promise<void> {
	try {
		const result = await commands.getMcpStatus();
		if (result.status === "ok") {
			mcpStatus = result.data;
			lastError = null;
			lastPolledAt = Date.now();
		} else {
			lastError = result.error;
			logError("devtools.claude", `getMcpStatus failed: ${result.error}`);
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("devtools.claude", `getMcpStatus threw: ${msg}`);
		lastError = msg;
	}
}

async function handleRefresh(): Promise<void> {
	refreshing = true;
	logInfo("devtools.claude", "Manual refresh");
	try {
		await fetchStatus();
	} finally {
		refreshing = false;
	}
}

async function handleRestart(): Promise<void> {
	restarting = true;
	lastError = null;
	logInfo("devtools.claude", "Restart requested");
	try {
		const result = await commands.restartMcpServer();
		if (result.status === "ok") {
			mcpStatus = result.data;
			logInfo("devtools.claude", "MCP restart complete");
		} else {
			lastError = result.error;
			logError("devtools.claude", `Restart failed: ${result.error}`);
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("devtools.claude", `Restart threw: ${msg}`);
		lastError = msg;
	} finally {
		restarting = false;
	}
}

$effect(() => {
	void fetchStatus();
	const interval = setInterval(() => {
		void fetchStatus();
	}, 2000);
	return () => {
		clearInterval(interval);
	};
});
</script>

<ServiceDevtoolShell
	title="Claude Integration"
	description="MCP server · subscription + API lanes"
	icon={Plug}
	axis="integrations"
	health={badge}
>
	{#snippet status()}
		<div class="flex flex-col gap-3">
			<div class="flex items-center gap-3">
				<Text size="sm" weight="bold">claude.mcp</Text>
				{#if running}
					<Badge variant="positive" size="sm">Serving</Badge>
				{:else if lastError}
					<Badge variant="negative" size="sm">Down</Badge>
				{:else}
					<Badge variant="neutral" size="sm">Connecting</Badge>
				{/if}
				<Badge variant="informative" size="sm">{toolCount} tools</Badge>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div class="rounded-lg p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
					<Text size="xs" color="muted">Transport</Text>
					<Text size="sm" weight="bold">{transport}</Text>
				</div>
				<div class="rounded-lg p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
					<Text size="xs" color="muted">Uptime</Text>
					<Text size="sm" weight="bold">{uptimeLabel}</Text>
				</div>
				<div class="rounded-lg p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
					<Text size="xs" color="muted">Protocol</Text>
					<Text size="sm" weight="bold" class="font-mono">{protocolVersion}</Text>
				</div>
				<div class="rounded-lg p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
					<Text size="xs" color="muted">Last polled</Text>
					<Text size="sm" weight="bold">
						{lastPolledAt > 0 ? `${Math.floor((Date.now() - lastPolledAt) / 1000)}s ago` : "—"}
					</Text>
				</div>
			</div>

			{#if mcpStatus?.toolNames && mcpStatus.toolNames.length > 0}
				<div class="rounded-lg p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
					<div class="flex items-center gap-2 mb-2">
						<Wrench size={12} style="color: var(--accent-teal-main);" />
						<Text size="xs" weight="bold">Registered tools</Text>
					</div>
					<div class="flex flex-wrap gap-1.5">
						{#each mcpStatus.toolNames as toolName (toolName)}
							<span
								class="rounded-md px-2 py-0.5 text-xs font-mono"
								style="background: var(--accent-teal-fill); color: var(--accent-teal-main); border: 1px solid var(--accent-teal-main);"
							>
								{toolName}
							</span>
						{/each}
					</div>
				</div>
			{/if}

			{#if lastError}
				<div class="rounded-lg p-3" style="background: var(--signal-error-subtle, #3b1a1a); border: 1px solid var(--signal-error);">
					<Text size="xs">{lastError}</Text>
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet config()}
		<div class="flex flex-col gap-4">
			<Text size="sm" color="muted">
				Two delivery lanes — pick automatically based on what's available.
				Subscription lane is dev-only; API lane ships with releases.
			</Text>

			<!-- Subscription lane (purple accent — dev only) -->
			<Card variant="outlined">
				<div class="p-4 flex flex-col gap-3" style="border-left: 3px solid var(--accent-purple-main);">
					<div class="flex items-center gap-2">
						<Bot size={14} style="color: var(--accent-purple-main);" />
						<Text size="sm" weight="bold">Subscription lane</Text>
						<Badge variant="informative" size="sm">Dev only</Badge>
					</div>
					<Text size="xs" color="muted">
						Piggybacks on a running Claude Code or Claude Desktop install. No API key,
						no per-token cost. Detected automatically from <span class="font-mono">~/.claude/</span>
						and the Claude Desktop config dir.
					</Text>
					<div class="grid grid-cols-3 gap-2 text-xs">
						<div>
							<Text size="xs" color="muted">Transport</Text>
							<Text size="xs" weight="bold">stdio</Text>
						</div>
						<div>
							<Text size="xs" color="muted">Cost cap</Text>
							<Text size="xs" weight="bold">none</Text>
						</div>
						<div>
							<Text size="xs" color="muted">Rate</Text>
							<Text size="xs" weight="bold">60/min</Text>
						</div>
					</div>
				</div>
			</Card>

			<!-- API lane (cyan accent — always available) -->
			<Card variant="outlined">
				<div class="p-4 flex flex-col gap-3" style="border-left: 3px solid var(--accent-cyan-main);">
					<div class="flex items-center gap-2">
						<Key size={14} style="color: var(--accent-cyan-main);" />
						<Text size="sm" weight="bold">API lane</Text>
						<Badge variant="neutral" size="sm">Always</Badge>
					</div>
					<Text size="xs" color="muted">
						Anthropic API with a user-supplied key. Used in releases and as
						a fallback when the subscription lane is rate-limited.
					</Text>
					<div class="grid grid-cols-3 gap-2 text-xs">
						<div>
							<Text size="xs" color="muted">Provider</Text>
							<Text size="xs" weight="bold">Anthropic</Text>
						</div>
						<div>
							<Text size="xs" color="muted">Cost cap</Text>
							<Text size="xs" weight="bold">$50/day</Text>
						</div>
						<div>
							<Text size="xs" color="muted">Rate</Text>
							<Text size="xs" weight="bold">20/min</Text>
						</div>
					</div>
				</div>
			</Card>

			<!-- Council routing (ember accent — orchestration) -->
			<Card variant="outlined">
				<div class="p-4 flex flex-col gap-3" style="border-left: 3px solid var(--accent-ember-main);">
					<div class="flex items-center gap-2">
						<Shield size={14} style="color: var(--accent-ember-main);" />
						<Text size="sm" weight="bold">Lane order</Text>
					</div>
					<Text size="xs" color="muted">
						When Clyffy needs Claude help, lanes are tried in this order:
					</Text>
					<ol class="flex flex-col gap-2 text-xs">
						<li class="flex items-center gap-2">
							<span class="font-mono opacity-60">1.</span>
							<Text size="xs">Subscription</Text>
							<Badge variant="positive" size="sm">Preferred</Badge>
						</li>
						<li class="flex items-center gap-2">
							<span class="font-mono opacity-60">2.</span>
							<Text size="xs">API key</Text>
							<Badge variant="neutral" size="sm">Fallback</Badge>
						</li>
						<li class="flex items-center gap-2">
							<span class="font-mono opacity-60">3.</span>
							<Text size="xs">Local brain only</Text>
							<Badge variant="neutral" size="sm">Last resort</Badge>
						</li>
					</ol>
				</div>
			</Card>

			<Text size="xs" color="muted">
				TODO(reality-gap 2026-04-22): subscription auto-detection + API key vault
				not yet wired. Lane selection currently falls through to local brain.
			</Text>
		</div>
	{/snippet}

	{#snippet logs()}
		<Text size="sm" color="muted">
			TODO(reality-gap 2026-04-22): Claude-scoped log filter not yet wired.
			Session logs live at <span class="font-mono text-[10px]">.userdata/logs/session-*.jsonl</span> —
			filter by <code>component=devtools.claude</code> or <code>target=claude.mcp</code>.
		</Text>
	{/snippet}

	{#snippet actions()}
		{#if restarting}
			<LoadingBlock
				title="Restarting MCP server"
				subtitle="Aborting current task and respawning — sit tight."
				showContent
				contentKind="dyk"
			/>
		{:else}
			<div class="flex flex-col gap-4">
				<div class="flex flex-wrap items-center gap-2">
					<Button preset="button-primary" size="sm" onclick={handleRestart}>
						<RefreshCw size={12} />
						Restart MCP server
					</Button>
					<Button
						preset="button-ghost"
						size="sm"
						onclick={handleRefresh}
						disabled={refreshing}
					>
						{#if refreshing}
							<Spinner size="xs" />
							Refreshing…
						{:else}
							<Activity size={12} />
							Refresh status
						{/if}
					</Button>
				</div>

				<Text size="xs" color="muted">
					Restart aborts the current stdio task and spawns a fresh one.
					Refresh just re-queries status without touching the server.
				</Text>

				<!-- Future actions -->
				<div class="rounded-lg p-3 mt-2 opacity-60" style="border: 1px dashed var(--border-subtle);">
					<Text size="sm" weight="bold">Auto-detect Claude installs</Text>
					<Text size="xs" color="muted">
						Coming next: scan <span class="font-mono">~/.claude/settings.json</span>
						and the Claude Desktop config dir, register DevPulse MCP entry on
						first run, and surface a "Piggyback on subscription" toggle here.
					</Text>
				</div>
			</div>
		{/if}
	{/snippet}
</ServiceDevtoolShell>
