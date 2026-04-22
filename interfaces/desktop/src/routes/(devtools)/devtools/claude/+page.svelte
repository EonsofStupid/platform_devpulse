<!--
	@file /devtools/claude — Claude Integration devtool
	@route /devtools/claude

	Wrapped in ServiceDevtoolShell (Status/Config/Logs/Actions). The MCP
	model is subprocess-based: Claude Code / Claude Desktop spawn DevPulse
	as a child via `--mcp-stdio`. This devtool controls REGISTRATION (the
	JSON entry in each client's config) — not a long-running server inside
	our process.

	Visual variety comes from the generic ColdLight accent tokens
	(--accent-{purple|cyan|ember|teal}-{main|fill|glow}). No custom
	claude-scoped vars.
-->
<script lang="ts">
import {
	Bot,
	CheckCircle2,
	Cpu,
	Key,
	Plug,
	PlugZap,
	RefreshCw,
	Terminal,
	Wrench,
	XCircle,
} from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { LoadingBlock, Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { type HealthBadge, ServiceDevtoolShell } from "$lib/domains/platform/_shared/index.js";
import {
	type ClaudeInstall,
	type ClaudeTarget,
	commands,
	type McpStatus,
	type ScopedLogEntry,
} from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";

// ── State ──────────────────────────────────────────────
let mcpStatus = $state<McpStatus | null>(null);
let lastError = $state<string | null>(null);
let refreshing = $state(false);
let pendingTarget = $state<ClaudeTarget | null>(null);
let lastPolledAt = $state<number>(0);

// Auto-register-on-boot toggles — Actions tab
let autoRegisterCode = $state(false);
let autoRegisterDesktop = $state(false);
let autoRegisterSaving = $state(false);
let autoRegisterError = $state<string | null>(null);
const PREF_KEY_CODE = "claude.autoregister.code";
const PREF_KEY_DESKTOP = "claude.autoregister.desktop";

// Scoped log tail state — Logs tab
let logEntries = $state<ScopedLogEntry[]>([]);
let logQueryError = $state<string | null>(null);
let logLoading = $state(false);
const LOG_TARGETS = [
	{ value: "devtools.claude", label: "Devtool UI" },
	{ value: "claude", label: "Engine — Claude" },
	{ value: "mcp_stdio_server", label: "MCP subprocess" },
	{ value: "", label: "All targets" },
] as const;
let selectedLogTarget = $state<string>("devtools.claude");

// ── Derived ────────────────────────────────────────────
const available = $derived(mcpStatus?.available === true);
const toolCount = $derived(mcpStatus?.toolCount ?? 0);
const toolNames = $derived<string[]>(mcpStatus?.toolNames ?? []);
const protocolVersion = $derived(mcpStatus?.protocolVersion ?? "—");
const code = $derived<ClaudeInstall | null>(mcpStatus?.installs?.code ?? null);
const desktop = $derived<ClaudeInstall | null>(mcpStatus?.installs?.desktop ?? null);
const registeredCount = $derived(
	(code?.devpulseRegistered ? 1 : 0) + (desktop?.devpulseRegistered ? 1 : 0),
);
const detectedCount = $derived(
	(code?.configExists || code?.processRunning ? 1 : 0) +
		(desktop?.configExists || desktop?.processRunning ? 1 : 0),
);

const badge = $derived<HealthBadge>(
	!available
		? { state: "stopped", label: "MCP mode unavailable" }
		: registeredCount > 0
			? {
					state: "up",
					label: `Registered with ${registeredCount} client · ${toolCount} tools`,
				}
			: detectedCount > 0
				? { state: "degraded", label: "Detected — not registered" }
				: { state: "unknown", label: "No Claude client detected" },
);

// ── Polling ────────────────────────────────────────────
async function fetchStatus(): Promise<void> {
	try {
		const result = await commands.getMcpStatus();
		mcpStatus = result;
		lastError = null;
		lastPolledAt = Date.now();
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

async function handleRegister(target: ClaudeTarget): Promise<void> {
	pendingTarget = target;
	lastError = null;
	logInfo("devtools.claude", `Register ${target}`);
	try {
		const result = await commands.registerDevpulseMcp(target);
		if (result.status === "ok") {
			if (mcpStatus) mcpStatus = { ...mcpStatus, installs: result.data };
			logInfo("devtools.claude", `Register ${target} OK`);
		} else {
			lastError = result.error;
			logError("devtools.claude", `Register ${target} failed: ${result.error}`);
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("devtools.claude", `Register ${target} threw: ${msg}`);
		lastError = msg;
	} finally {
		pendingTarget = null;
	}
}

async function handleUnregister(target: ClaudeTarget): Promise<void> {
	pendingTarget = target;
	lastError = null;
	logInfo("devtools.claude", `Unregister ${target}`);
	try {
		const result = await commands.unregisterDevpulseMcp(target);
		if (result.status === "ok") {
			if (mcpStatus) mcpStatus = { ...mcpStatus, installs: result.data };
			logInfo("devtools.claude", `Unregister ${target} OK`);
		} else {
			lastError = result.error;
			logError("devtools.claude", `Unregister ${target} failed: ${result.error}`);
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("devtools.claude", `Unregister ${target} threw: ${msg}`);
		lastError = msg;
	} finally {
		pendingTarget = null;
	}
}

async function loadAutoRegisterPrefs(): Promise<void> {
	try {
		const code = await commands.getPreference(PREF_KEY_CODE);
		if (code.status === "ok") autoRegisterCode = code.data === "true";
		const desktop = await commands.getPreference(PREF_KEY_DESKTOP);
		if (desktop.status === "ok") autoRegisterDesktop = desktop.data === "true";
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("devtools.claude", `loadAutoRegisterPrefs threw: ${msg}`);
	}
}

async function toggleAutoRegister(target: ClaudeTarget): Promise<void> {
	autoRegisterSaving = true;
	autoRegisterError = null;
	const key = target === "code" ? PREF_KEY_CODE : PREF_KEY_DESKTOP;
	const next = target === "code" ? !autoRegisterCode : !autoRegisterDesktop;
	logInfo("devtools.claude", `toggleAutoRegister ${target} = ${next}`);
	try {
		const result = await commands.setPreference(key, next ? "true" : "false");
		if (result.status === "ok") {
			if (target === "code") autoRegisterCode = next;
			else autoRegisterDesktop = next;
		} else {
			autoRegisterError = result.error;
			logError("devtools.claude", `setPreference failed: ${result.error}`);
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		autoRegisterError = msg;
		logError("devtools.claude", `setPreference threw: ${msg}`);
	} finally {
		autoRegisterSaving = false;
	}
}

function levelColor(level: string): string {
	switch (level) {
		case "ERROR":
			return "var(--signal-error)";
		case "WARN":
			return "var(--signal-warning)";
		case "INFO":
			return "var(--signal-success)";
		case "DEBUG":
			return "var(--accent-purple-main)";
		default:
			return "var(--text-muted)";
	}
}

async function fetchScopedLog(): Promise<void> {
	logLoading = true;
	logQueryError = null;
	try {
		const result = await commands.queryScopedLog(selectedLogTarget, 200);
		if (result.status === "ok") {
			logEntries = result.data;
		} else {
			logQueryError = result.error;
			logError("devtools.claude", `queryScopedLog failed: ${result.error}`);
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logQueryError = msg;
		logError("devtools.claude", `queryScopedLog threw: ${msg}`);
	} finally {
		logLoading = false;
	}
}

$effect(() => {
	void fetchStatus();
	void loadAutoRegisterPrefs();
	const interval = setInterval(() => {
		void fetchStatus();
	}, 5000);
	return () => {
		clearInterval(interval);
	};
});

// Re-fetch logs whenever the target changes; first run fires on mount.
$effect(() => {
	const _ = selectedLogTarget;
	void fetchScopedLog();
});
</script>

<ServiceDevtoolShell
	title="Claude Integration"
	description="Subprocess MCP · subscription + API lanes"
	icon={Plug}
	axis="integrations"
	health={badge}
>
	{#snippet status()}
		<div class="flex flex-col gap-3">
			<!-- ── Top row: tool surface ─────────────────────── -->
			<div class="flex items-center gap-3 flex-wrap">
				<Text size="sm" weight="bold">claude.mcp</Text>
				{#if available}
					<Badge variant="positive" size="sm">Available</Badge>
				{:else}
					<Badge variant="neutral" size="sm">Unavailable</Badge>
				{/if}
				<Badge variant="informative" size="sm">{toolCount} tools</Badge>
				<Badge variant="neutral" size="sm">Protocol {protocolVersion}</Badge>
			</div>

			<!-- ── Install grid: Code + Desktop ───────────────── -->
			<div class="grid grid-cols-2 gap-3">
				<!-- Claude Code (purple accent) -->
				<div
					class="rounded-lg p-3 flex flex-col gap-2"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle); border-left: 3px solid var(--accent-purple-main);"
				>
					<div class="flex items-center gap-2">
						<Terminal size={14} style="color: var(--accent-purple-main);" />
						<Text size="sm" weight="bold">Claude Code</Text>
						{#if code?.devpulseRegistered}
							<Badge variant="positive" size="sm">Registered</Badge>
						{:else if code?.configExists}
							<Badge variant="notice" size="sm">Not registered</Badge>
						{:else}
							<Badge variant="neutral" size="sm">Not installed</Badge>
						{/if}
					</div>
					<Text size="xs" color="muted" class="font-mono break-all">
						{code?.configPath || "—"}
					</Text>
					<div class="flex items-center gap-2">
						{#if code?.processRunning}
							<CheckCircle2 size={12} style="color: var(--signal-success);" />
							<Text size="xs">CLI process running</Text>
						{:else}
							<XCircle size={12} style="color: var(--text-muted);" />
							<Text size="xs" color="muted">CLI not running</Text>
						{/if}
					</div>
					{#if code?.readError}
						<Text size="xs" style="color: var(--signal-error);">{code.readError}</Text>
					{/if}
				</div>

				<!-- Claude Desktop (cyan accent) -->
				<div
					class="rounded-lg p-3 flex flex-col gap-2"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle); border-left: 3px solid var(--accent-cyan-main);"
				>
					<div class="flex items-center gap-2">
						<Cpu size={14} style="color: var(--accent-cyan-main);" />
						<Text size="sm" weight="bold">Claude Desktop</Text>
						{#if desktop?.devpulseRegistered}
							<Badge variant="positive" size="sm">Registered</Badge>
						{:else if desktop?.configExists}
							<Badge variant="notice" size="sm">Not registered</Badge>
						{:else}
							<Badge variant="neutral" size="sm">Not installed</Badge>
						{/if}
					</div>
					<Text size="xs" color="muted" class="font-mono break-all">
						{desktop?.configPath || "—"}
					</Text>
					<div class="flex items-center gap-2">
						{#if desktop?.processRunning}
							<CheckCircle2 size={12} style="color: var(--signal-success);" />
							<Text size="xs">Desktop app running</Text>
						{:else}
							<XCircle size={12} style="color: var(--text-muted);" />
							<Text size="xs" color="muted">Desktop app not running</Text>
						{/if}
					</div>
					{#if desktop?.readError}
						<Text size="xs" style="color: var(--signal-error);">{desktop.readError}</Text>
					{/if}
				</div>
			</div>

			<!-- ── Tool list (teal accent — what we serve) ────── -->
			{#if toolNames.length > 0}
				<div class="rounded-lg p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
					<div class="flex items-center gap-2 mb-2">
						<Wrench size={12} style="color: var(--accent-teal-main);" />
						<Text size="xs" weight="bold">Tools served on registration</Text>
					</div>
					<div class="flex flex-wrap gap-1.5">
						{#each toolNames as toolName (toolName)}
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

			<div class="flex items-center justify-between">
				<Text size="xs" color="muted">
					{lastPolledAt > 0
						? `Last refresh ${Math.floor((Date.now() - lastPolledAt) / 1000)}s ago`
						: "Polling…"}
				</Text>
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
						<PlugZap size={12} />
						Refresh now
					{/if}
				</Button>
			</div>
		</div>
	{/snippet}

	{#snippet config()}
		<div class="flex flex-col gap-4">
			<Text size="sm" color="muted">
				Two delivery lanes — picked automatically based on what's available.
				Subscription lane is dev-only; API lane ships with releases.
			</Text>

			<!-- Subscription lane (purple accent) -->
			<Card variant="outlined">
				<div class="p-4 flex flex-col gap-3" style="border-left: 3px solid var(--accent-purple-main);">
					<div class="flex items-center gap-2">
						<Bot size={14} style="color: var(--accent-purple-main);" />
						<Text size="sm" weight="bold">Subscription lane</Text>
						<Badge variant="informative" size="sm">Dev only</Badge>
					</div>
					<Text size="xs" color="muted">
						Piggybacks on a registered DevPulse MCP entry in Claude Code or
						Claude Desktop. No API key, no per-token cost. The Status tab
						shows whether each client is detected and registered.
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

			<!-- API lane (cyan accent) -->
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

			<Text size="xs" color="muted">
				TODO(reality-gap 2026-04-22): API key vault + lane router land
				with the council sprint. Until then, registration is the visible
				surface and Clyffy still falls through to the local brain.
			</Text>
		</div>
	{/snippet}

	{#snippet logs()}
		<div class="flex flex-col gap-3 h-full">
			<div class="flex items-center gap-2 flex-wrap">
				<Text size="xs" color="muted">Target:</Text>
				{#each LOG_TARGETS as opt (opt.value)}
					<button
						type="button"
						class="rounded-md px-2 py-1 text-xs transition-colors"
						style={selectedLogTarget === opt.value
							? "background: var(--accent-teal-fill); color: var(--accent-teal-main); border: 1px solid var(--accent-teal-main);"
							: "background: var(--surface-base); color: var(--text-muted); border: 1px solid var(--border-subtle);"}
						onclick={() => {
							selectedLogTarget = opt.value;
						}}
					>
						{opt.label}
					</button>
				{/each}
				<div class="ml-auto flex items-center gap-2">
					<Text size="xs" color="muted">{logEntries.length} entries</Text>
					<Button
						preset="button-ghost"
						size="sm"
						onclick={fetchScopedLog}
						disabled={logLoading}
					>
						{#if logLoading}
							<Spinner size="xs" />
							Loading…
						{:else}
							<RefreshCw size={12} />
							Refresh
						{/if}
					</Button>
				</div>
			</div>

			{#if logQueryError}
				<div class="rounded-lg p-3" style="background: var(--signal-error-subtle, #3b1a1a); border: 1px solid var(--signal-error);">
					<Text size="xs">{logQueryError}</Text>
				</div>
			{/if}

			{#if logEntries.length === 0 && !logLoading}
				<Text size="sm" color="muted">
					No log entries match the current filter. Activity in the
					Status / Actions tabs will appear here.
				</Text>
			{:else}
				<div
					class="flex-1 overflow-y-auto rounded-lg p-2 font-mono text-[11px] leading-relaxed"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
				>
					{#each logEntries as entry, i (i)}
						<div class="flex gap-2 py-0.5 border-b border-[var(--border-subtle)] last:border-b-0">
							<span style="color: var(--text-muted);">{entry.timestamp.slice(11, 19)}</span>
							<span style="color: {levelColor(entry.level)}; min-width: 3.5rem;">{entry.level}</span>
							<span style="color: var(--accent-teal-main); min-width: 12rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{entry.target}</span>
							<span style="color: var(--text-primary); flex: 1; word-break: break-word;">{entry.message}</span>
						</div>
					{/each}
				</div>
			{/if}

			<Text size="xs" color="muted">
				Reads the most recent <span class="font-mono">.userdata/logs/session-*.jsonl</span>
				— last 200 lines matching the selected target prefix.
			</Text>
		</div>
	{/snippet}

	{#snippet actions()}
		{#if pendingTarget}
			<LoadingBlock
				title={pendingTarget === "code" ? "Updating Claude Code config" : "Updating Claude Desktop config"}
				subtitle="Atomic rewrite — your other MCP entries are preserved."
				showContent
				contentKind="dyk"
			/>
		{:else}
			<div class="flex flex-col gap-4">
				<Text size="sm" color="muted">
					Registration writes <code>mcpServers.devpulse</code> into the
					target client's config (preserving every other entry). Restart
					the client after registering for it to discover DevPulse tools.
				</Text>

				<!-- Claude Code actions -->
				<Card variant="outlined">
					<div class="p-4 flex flex-col gap-3" style="border-left: 3px solid var(--accent-purple-main);">
						<div class="flex items-center gap-2">
							<Terminal size={14} style="color: var(--accent-purple-main);" />
							<Text size="sm" weight="bold">Claude Code</Text>
							{#if code?.devpulseRegistered}
								<Badge variant="positive" size="sm">Registered</Badge>
							{/if}
						</div>
						<Text size="xs" color="muted">
							Writes the MCP entry to <span class="font-mono">~/.claude/settings.json</span>.
							Claude Code re-reads on next CLI launch.
						</Text>
						<div class="flex flex-wrap gap-2">
							<Button
								preset="button-primary"
								size="sm"
								onclick={() => handleRegister("code")}
							>
								<PlugZap size={12} />
								{code?.devpulseRegistered ? "Re-register" : "Register with Claude Code"}
							</Button>
							{#if code?.devpulseRegistered}
								<Button
									preset="button-ghost"
									size="sm"
									onclick={() => handleUnregister("code")}
								>
									Unregister
								</Button>
							{/if}
						</div>
					</div>
				</Card>

				<!-- Claude Desktop actions -->
				<Card variant="outlined">
					<div class="p-4 flex flex-col gap-3" style="border-left: 3px solid var(--accent-cyan-main);">
						<div class="flex items-center gap-2">
							<Cpu size={14} style="color: var(--accent-cyan-main);" />
							<Text size="sm" weight="bold">Claude Desktop</Text>
							{#if desktop?.devpulseRegistered}
								<Badge variant="positive" size="sm">Registered</Badge>
							{/if}
						</div>
						<Text size="xs" color="muted">
							Writes the MCP entry to the Claude Desktop config dir.
							Quit and relaunch the desktop app for the entry to apply.
						</Text>
						<div class="flex flex-wrap gap-2">
							<Button
								preset="button-primary"
								size="sm"
								onclick={() => handleRegister("desktop")}
							>
								<PlugZap size={12} />
								{desktop?.devpulseRegistered ? "Re-register" : "Register with Claude Desktop"}
							</Button>
							{#if desktop?.devpulseRegistered}
								<Button
									preset="button-ghost"
									size="sm"
									onclick={() => handleUnregister("desktop")}
								>
									Unregister
								</Button>
							{/if}
						</div>
					</div>
				</Card>

				<Card variant="outlined">
					<div class="p-4 flex flex-col gap-3" style="border-left: 3px solid var(--accent-ember-main);">
						<Text size="sm" weight="bold">Auto-register on every boot</Text>
						<Text size="xs" color="muted">
							When enabled, DevPulse re-registers the MCP entry with the
							selected client(s) every time the app starts. Existing user
							MCP entries are preserved (atomic JSON merge). Toggles
							persist to <span class="font-mono">.userdata/preferences.json</span>
							and apply on the next boot.
						</Text>
						{#if autoRegisterError}
							<Text size="xs" style="color: var(--signal-error);">{autoRegisterError}</Text>
						{/if}
						<div class="flex flex-wrap gap-3">
							<button
								type="button"
								class="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
								style={autoRegisterCode
									? "background: var(--accent-purple-fill); color: var(--accent-purple-main); border: 1px solid var(--accent-purple-main);"
									: "background: var(--surface-base); color: var(--text-muted); border: 1px solid var(--border-subtle);"}
								onclick={() => toggleAutoRegister("code")}
								disabled={autoRegisterSaving}
							>
								<Terminal size={14} />
								Claude Code
								<span class="ml-1 font-bold">{autoRegisterCode ? "ON" : "off"}</span>
							</button>
							<button
								type="button"
								class="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
								style={autoRegisterDesktop
									? "background: var(--accent-cyan-fill); color: var(--accent-cyan-main); border: 1px solid var(--accent-cyan-main);"
									: "background: var(--surface-base); color: var(--text-muted); border: 1px solid var(--border-subtle);"}
								onclick={() => toggleAutoRegister("desktop")}
								disabled={autoRegisterSaving}
							>
								<Cpu size={14} />
								Claude Desktop
								<span class="ml-1 font-bold">{autoRegisterDesktop ? "ON" : "off"}</span>
							</button>
						</div>
					</div>
				</Card>
			</div>
		{/if}
	{/snippet}
</ServiceDevtoolShell>
