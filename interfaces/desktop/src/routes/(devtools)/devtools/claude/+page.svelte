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
	PlugOff,
	PlugZap,
	Terminal,
	Wrench,
	XCircle,
} from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { LoadingBlock } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import {
	DevtoolDescription,
	DevtoolEmptyState,
	DevtoolErrorPanel,
	DevtoolLogsTab,
	DevtoolRefreshButton,
	DevtoolStatBox,
	type HealthBadge,
	type LogTargetPreset,
	ServiceDevtoolShell,
} from "$lib/domains/platform/_shared/index.js";
import { type ClaudeInstall, type ClaudeTarget, commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";
import { okQuery, PolledQuery } from "$lib/sys/runes/index.js";

// ── Polling — MCP status (5s interval, visibility-aware) ─
const mcpPoll = new PolledQuery(
	okQuery(() => commands.getMcpStatus()),
	5000,
);

// ── One-shot mutations — register / unregister ──────────
let lastError = $state<string | null>(null);
let pendingTarget = $state<ClaudeTarget | null>(null);

// Auto-register-on-boot toggles — Actions tab
let autoRegisterCode = $state(false);
let autoRegisterDesktop = $state(false);
let autoRegisterSaving = $state(false);
let autoRegisterError = $state<string | null>(null);
const PREF_KEY_CODE = "claude.autoregister.code";
const PREF_KEY_DESKTOP = "claude.autoregister.desktop";

// Scoped log tail — Logs tab; selector + fetch live inside DevtoolLogsTab
const LOG_TARGETS: LogTargetPreset[] = [
	{ value: "devtools.claude", label: "Devtool UI" },
	{ value: "claude", label: "Engine — Claude" },
	{ value: "mcp_stdio_server", label: "MCP subprocess" },
	{ value: "", label: "All targets" },
];

// ── Derived ────────────────────────────────────────────
const available = $derived(mcpPoll.data?.available === true);
const toolCount = $derived(mcpPoll.data?.toolCount ?? 0);
const toolNames = $derived<string[]>(mcpPoll.data?.toolNames ?? []);
const protocolVersion = $derived(mcpPoll.data?.protocolVersion ?? "—");
const code = $derived<ClaudeInstall | null>(mcpPoll.data?.installs?.code ?? null);
const desktop = $derived<ClaudeInstall | null>(mcpPoll.data?.installs?.desktop ?? null);
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

// ── Mutations — register / unregister ──────────────────
async function handleRegister(target: ClaudeTarget): Promise<void> {
	pendingTarget = target;
	lastError = null;
	logInfo("devtools.claude", `Register ${target}`);
	try {
		const result = await commands.registerDevpulseMcp(target);
		if (result.status === "ok") {
			logInfo("devtools.claude", `Register ${target} OK`);
			void mcpPoll.refresh();
		} else {
			lastError = result.error.message;
			logError("devtools.claude", `Register ${target} failed: ${result.error.message}`);
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
			logInfo("devtools.claude", `Unregister ${target} OK`);
			void mcpPoll.refresh();
		} else {
			lastError = result.error.message;
			logError("devtools.claude", `Unregister ${target} failed: ${result.error.message}`);
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

$effect(() => {
	void loadAutoRegisterPrefs();
});
</script>

<ServiceDevtoolShell
	title="Claude Integration"
	description="Subprocess MCP · subscription + API lanes"
	icon={Plug}
	axis="integrations"
	accent="coral"
	health={badge}
>
	{#snippet status()}
		<div class="flex flex-col gap-3">
			<DevtoolDescription
				text="Subprocess MCP — DevPulse registers itself as an MCP server in Claude Code and Claude Desktop config files. Nothing long-running here; the clients spawn DevPulse on demand."
			/>

			<!-- ── Stat tiles: tool surface + protocol + counts ── -->
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<DevtoolStatBox
					label="MCP availability"
					value={available ? "Available" : "Unavailable"}
					tone={available ? "success" : "muted"}
				/>
				<DevtoolStatBox label="Tools served" value={toolCount} tone="accent" />
				<DevtoolStatBox label="Protocol" value={protocolVersion} />
				<DevtoolStatBox
					label="Registered clients"
					value={`${registeredCount} of ${detectedCount || "0"}`}
					tone={registeredCount > 0 ? "success" : detectedCount > 0 ? "warning" : "muted"}
				/>
			</div>

			<!-- ── Install grid: Code + Desktop ───────────────── -->
			{#if !code?.configExists && !desktop?.configExists && !code?.processRunning && !desktop?.processRunning}
				<DevtoolEmptyState
					icon={PlugOff}
					title="No Claude client detected"
					description="Install Claude Code (CLI) or Claude Desktop, then return here to register DevPulse as an MCP server."
				/>
			{/if}
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

			<DevtoolErrorPanel error={lastError} onDismiss={() => (lastError = null)} />
			<DevtoolErrorPanel error={mcpPoll.error} />

			<div class="flex items-center justify-between">
				<Text size="xs" color="muted">
					{mcpPoll.lastFetchedAt
						? `Last refresh ${Math.floor((Date.now() - mcpPoll.lastFetchedAt) / 1000)}s ago`
						: "Polling…"}
				</Text>
				<DevtoolRefreshButton query={mcpPoll} label="Refresh now" />
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
			<DevtoolLogsTab targetPresets={LOG_TARGETS} />
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
