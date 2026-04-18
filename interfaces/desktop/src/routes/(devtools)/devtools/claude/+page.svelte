<!--
  @file Claude Integration DevTool
  @route /devtools/claude
  @window DevTools

  Two-tab devtool: Subscription (internal MCP) + API (user key).
  Shows connection status, lane usage, council config, provider health.
  ColdLight glass cards, renderForge composition.
-->
<script lang="ts">
import {
	Activity,
	ArrowLeftRight,
	Bot,
	Check,
	Key,
	Link2,
	Radio,
	Settings,
	Shield,
	Unplug,
	Zap,
} from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { Progress } from "$lib/design/components/progress/index.js";
import { Separator } from "$lib/design/components/separator/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { commands, type PlatformConfig } from "$lib/sys/generated/bindings.js";

// ── Tab state ────────────────────────────────────────
type TabId = "subscription" | "api" | "council";
let activeTab = $state<TabId>("subscription");

const tabs = [
	{ id: "subscription" as const, label: "Subscription", Icon: Radio },
	{ id: "api" as const, label: "API Providers", Icon: Key },
	{ id: "council" as const, label: "Council", Icon: Shield },
] as const;

// ── Config state ─────────────────────────────────────
let platformConfig = $state<PlatformConfig | null>(null);
let configLoading = $state(true);
let configError = $state<string | null>(null);

// ── Connection status (polled) ───────────────────────
let mcpConnected = $state(false);
let sidecarRunning = $state(false);
let claudeCodeConnected = $state(false);

// ── Lane usage tracking ──────────────────────────────
let internalRequests = $state(0);
let internalTokens = $state(0);
let apiRequests = $state(0);
let apiTokens = $state(0);
let apiCostToday = $state(0.0);

// ── Load config on mount ─────────────────────────────
$effect(() => {
	loadConfig();
});

async function loadConfig(): Promise<void> {
	configLoading = true;
	configError = null;
	try {
		const result = await commands.getSettings();
		if (result.status === "ok") {
			platformConfig = result.data;
		} else {
			configError = result.error;
		}
	} catch (e) {
		configError = e instanceof Error ? e.message : String(e);
	} finally {
		configLoading = false;
	}
}

// ── Card macro ───────────────────────────────────────
const cardM = $derived(renderForge({ kind: "card", preset: "glass" }));

// ── Lane usage percentages ───────────────────────────
const internalRpmPct = $derived(Math.min((internalRequests / 60) * 100, 100));
const internalTpdPct = $derived(Math.min((internalTokens / 1_000_000) * 100, 100));
const apiRpmPct = $derived(Math.min((apiRequests / 20) * 100, 100));
const apiTpdPct = $derived(Math.min((apiTokens / 500_000) * 100, 100));
const apiCostPct = $derived(Math.min((apiCostToday / 50.0) * 100, 100));
</script>

<div class="flex flex-col gap-6 p-6 h-full overflow-y-auto"
	style="background: var(--surface-base); color: var(--text-primary);"
>
	<!-- Header -->
	<div class="flex items-center gap-3">
		<Bot size={24} style="color: var(--accent-teal-main);" />
		<Text size="lg" weight="bold" color="primary">Claude Integration</Text>
		<Badge
			variant={mcpConnected ? "positive" : "neutral"}
			size="sm"
		>
			{mcpConnected ? "MCP Connected" : "MCP Offline"}
		</Badge>
	</div>

	<!-- Tab bar -->
	<nav class="flex gap-1 border-b" style="border-color: var(--border-subtle);">
		{#each tabs as tab (tab.id)}
			<button
				class="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors border-b-2"
				style="
					color: {activeTab === tab.id ? 'var(--accent-teal-main)' : 'var(--text-secondary)'};
					border-color: {activeTab === tab.id ? 'var(--accent-teal-main)' : 'transparent'};
				"
				onclick={() => (activeTab = tab.id)}
			>
				<tab.Icon size={16} />
				{tab.label}
			</button>
		{/each}
	</nav>

	<!-- Loading / Error -->
	{#if configLoading}
		<Text size="sm" color="muted">Loading Claude configuration...</Text>
	{:else if configError}
		<div class="rounded-lg p-4" style="background: oklch(0.2 0.06 25 / 0.3); border: 1px solid var(--signal-error);">
			<Text size="sm" color="primary">{configError}</Text>
		</div>
	{:else}

		<!-- ═══════════════════════════════════════════════ -->
		<!-- SUBSCRIPTION TAB (dev internal only)           -->
		<!-- ═══════════════════════════════════════════════ -->
		{#if activeTab === "subscription"}
			<div class="grid grid-cols-2 gap-4">

				<!-- MCP Server Status -->
				<div
					{...cardM.dataAttrs}
					style={cssVarString(cardM.cssVars)}
					class="rounded-lg p-4 col-span-2"
				>
					<div class="flex items-center gap-3 mb-3">
						<Link2 size={18} style="color: var(--accent-teal-main);" />
						<Text size="base" weight="bold" color="primary">MCP Server</Text>
						<Badge variant={mcpConnected ? "positive" : "neutral"} size="sm">
							{mcpConnected ? "Listening :9315" : "Not Started"}
						</Badge>
					</div>
					<div class="grid grid-cols-3 gap-4">
						<!-- SSE Transport -->
						<div class="flex items-center gap-2">
							<div class="w-2 h-2 rounded-full" style="background: {mcpConnected ? 'var(--signal-success)' : 'var(--border-subtle)'};"></div>
							<Text size="sm" color="muted">SSE (localhost:9315)</Text>
						</div>
						<!-- Stdio Transport -->
						<div class="flex items-center gap-2">
							<div class="w-2 h-2 rounded-full" style="background: {claudeCodeConnected ? 'var(--signal-success)' : 'var(--border-subtle)'};"></div>
							<Text size="sm" color="muted">Stdio (Claude Code)</Text>
						</div>
						<!-- Tool Surface -->
						<div class="flex items-center gap-2">
							<Zap size={14} style="color: var(--accent-teal-main);" />
							<Text size="sm" color="muted">32 tools (full surface)</Text>
						</div>
					</div>
				</div>

				<!-- Sidecar (Claude Desktop) -->
				<div
					{...cardM.dataAttrs}
					style={cssVarString(cardM.cssVars)}
					class="rounded-lg p-4"
				>
					<div class="flex items-center gap-2 mb-3">
						<Bot size={16} style="color: var(--accent-teal-main);" />
						<Text size="sm" weight="bold" color="primary">Claude Desktop Sidecar</Text>
					</div>
					<div class="flex flex-col gap-2">
						<div class="flex items-center justify-between">
							<Text size="sm" color="muted">Status</Text>
							<Badge variant={sidecarRunning ? "positive" : "neutral"} size="sm">
								{sidecarRunning ? "Running" : "Stopped"}
							</Badge>
						</div>
						<div class="flex items-center justify-between">
							<Text size="sm" color="muted">Auto-launch</Text>
							<Text size="sm" color="muted">Off</Text>
						</div>
						<div class="flex items-center justify-between">
							<Text size="sm" color="muted">Max restarts</Text>
							<Text size="sm" color="muted">3</Text>
						</div>
					</div>
				</div>

				<!-- Claude Code CLI -->
				<div
					{...cardM.dataAttrs}
					style={cssVarString(cardM.cssVars)}
					class="rounded-lg p-4"
				>
					<div class="flex items-center gap-2 mb-3">
						<Activity size={16} style="color: var(--accent-teal-main);" />
						<Text size="sm" weight="bold" color="primary">Claude Code CLI</Text>
					</div>
					<div class="flex flex-col gap-2">
						<div class="flex items-center justify-between">
							<Text size="sm" color="muted">Status</Text>
							<Badge variant={claudeCodeConnected ? "positive" : "neutral"} size="sm">
								{claudeCodeConnected ? "Connected" : "Not Connected"}
							</Badge>
						</div>
						<div class="flex items-center justify-between">
							<Text size="sm" color="muted">Auto-configure</Text>
							<Text size="sm" color="muted">Enabled</Text>
						</div>
						<div class="flex items-center justify-between">
							<Text size="sm" color="muted">Binary</Text>
							<Text size="sm" color="muted">auto-detect</Text>
						</div>
					</div>
				</div>

				<!-- Internal Lane Usage -->
				<div
					{...cardM.dataAttrs}
					style={cssVarString(cardM.cssVars)}
					class="rounded-lg p-4 col-span-2"
				>
					<div class="flex items-center gap-2 mb-4">
						<Activity size={16} style="color: var(--accent-teal-main);" />
						<Text size="sm" weight="bold" color="primary">Internal Lane (Subscription)</Text>
						<Badge variant="informative" size="sm">No cost cap</Badge>
					</div>
					<div class="flex flex-col gap-3">
						<div>
							<div class="flex items-center justify-between mb-1">
								<Text size="sm" color="muted">Requests/min</Text>
								<Text size="sm" color="muted">{internalRequests} / 60</Text>
							</div>
							<Progress value={internalRpmPct} max={100} size="sm" />
						</div>
						<div>
							<div class="flex items-center justify-between mb-1">
								<Text size="sm" color="muted">Tokens today</Text>
								<Text size="sm" color="muted">{internalTokens.toLocaleString()} / 1,000,000</Text>
							</div>
							<Progress value={internalTpdPct} max={100} size="sm" />
						</div>
					</div>
				</div>
			</div>

		<!-- ═══════════════════════════════════════════════ -->
		<!-- API PROVIDERS TAB                              -->
		<!-- ═══════════════════════════════════════════════ -->
		{:else if activeTab === "api"}
			<div class="flex flex-col gap-4">

				<!-- API Lane Usage -->
				<div
					{...cardM.dataAttrs}
					style={cssVarString(cardM.cssVars)}
					class="rounded-lg p-4"
				>
					<div class="flex items-center gap-2 mb-4">
						<Activity size={16} style="color: var(--accent-teal-main);" />
						<Text size="sm" weight="bold" color="primary">API Lane Usage</Text>
						<Badge variant="neutral" size="sm">$50/day cap</Badge>
					</div>
					<div class="flex flex-col gap-3">
						<div>
							<div class="flex items-center justify-between mb-1">
								<Text size="sm" color="muted">Requests/min</Text>
								<Text size="sm" color="muted">{apiRequests} / 20</Text>
							</div>
							<Progress value={apiRpmPct} max={100} size="sm" />
						</div>
						<div>
							<div class="flex items-center justify-between mb-1">
								<Text size="sm" color="muted">Tokens today</Text>
								<Text size="sm" color="muted">{apiTokens.toLocaleString()} / 500,000</Text>
							</div>
							<Progress value={apiTpdPct} max={100} size="sm" />
						</div>
						<div>
							<div class="flex items-center justify-between mb-1">
								<Text size="sm" color="muted">Cost today</Text>
								<Text size="sm" color="muted">${apiCostToday.toFixed(2)} / $50.00</Text>
							</div>
							<Progress value={apiCostPct} max={100} size="sm" />
						</div>
					</div>
				</div>

				<Separator />

				<!-- Provider cards -->
				<Text size="base" weight="bold" color="primary">Configured Providers</Text>

				<!-- Claude (Anthropic) -->
				<div
					{...cardM.dataAttrs}
					style={cssVarString(cardM.cssVars)}
					class="rounded-lg p-4"
				>
					<div class="flex items-center gap-3 mb-3">
						<Bot size={18} style="color: var(--accent-teal-main);" />
						<div class="flex-1">
							<Text size="sm" weight="bold" color="primary">Claude (Anthropic)</Text>
							<Text size="sm" color="muted">claude-sonnet-4-20250514</Text>
						</div>
						<Badge variant="positive" size="sm">Default</Badge>
					</div>
					<div class="flex flex-col gap-1">
						<div class="flex items-center justify-between">
							<Text size="sm" color="muted">Endpoint</Text>
							<Text size="sm" color="muted">api.anthropic.com/v1/messages</Text>
						</div>
						<div class="flex items-center justify-between">
							<Text size="sm" color="muted">Max tokens</Text>
							<Text size="sm" color="muted">4,096</Text>
						</div>
						<div class="flex items-center justify-between">
							<Text size="sm" color="muted">API Key</Text>
							<div class="flex items-center gap-2">
								<Key size={12} style="color: var(--text-muted);" />
								<Text size="sm" color="muted">Not configured — set via keyring</Text>
							</div>
						</div>
					</div>
				</div>

				<!-- GPT (OpenAI) -->
				<div
					{...cardM.dataAttrs}
					style={cssVarString(cardM.cssVars)}
					class="rounded-lg p-4"
				>
					<div class="flex items-center gap-3 mb-3">
						<Bot size={18} style="color: var(--text-secondary);" />
						<div class="flex-1">
							<Text size="sm" weight="bold" color="primary">GPT (OpenAI)</Text>
							<Text size="sm" color="muted">gpt-4o</Text>
						</div>
						<Badge variant="neutral" size="sm">Available</Badge>
					</div>
					<div class="flex flex-col gap-1">
						<div class="flex items-center justify-between">
							<Text size="sm" color="muted">Endpoint</Text>
							<Text size="sm" color="muted">api.openai.com/v1/chat/completions</Text>
						</div>
						<div class="flex items-center justify-between">
							<Text size="sm" color="muted">API Key</Text>
							<div class="flex items-center gap-2">
								<Key size={12} style="color: var(--text-muted);" />
								<Text size="sm" color="muted">Not configured</Text>
							</div>
						</div>
					</div>
				</div>

				<!-- Gemini (Google) -->
				<div
					{...cardM.dataAttrs}
					style={cssVarString(cardM.cssVars)}
					class="rounded-lg p-4"
				>
					<div class="flex items-center gap-3 mb-3">
						<Bot size={18} style="color: var(--text-secondary);" />
						<div class="flex-1">
							<Text size="sm" weight="bold" color="primary">Gemini (Google)</Text>
							<Text size="sm" color="muted">gemini-2.5-flash</Text>
						</div>
						<Badge variant="neutral" size="sm">Available</Badge>
					</div>
					<div class="flex flex-col gap-1">
						<div class="flex items-center justify-between">
							<Text size="sm" color="muted">Endpoint</Text>
							<Text size="sm" color="muted">generativelanguage.googleapis.com</Text>
						</div>
						<div class="flex items-center justify-between">
							<Text size="sm" color="muted">API Key</Text>
							<div class="flex items-center gap-2">
								<Key size={12} style="color: var(--text-muted);" />
								<Text size="sm" color="muted">Not configured</Text>
							</div>
						</div>
					</div>
				</div>
			</div>

		<!-- ═══════════════════════════════════════════════ -->
		<!-- COUNCIL TAB                                    -->
		<!-- ═══════════════════════════════════════════════ -->
		{:else if activeTab === "council"}
			<div class="flex flex-col gap-4">

				<!-- Council Mode -->
				<div
					{...cardM.dataAttrs}
					style={cssVarString(cardM.cssVars)}
					class="rounded-lg p-4"
				>
					<div class="flex items-center gap-2 mb-4">
						<Shield size={18} style="color: var(--accent-teal-main);" />
						<Text size="base" weight="bold" color="primary">Council Arbitration</Text>
					</div>
					<div class="flex flex-col gap-3">
						<div class="flex items-center justify-between">
							<Text size="sm" color="muted">Mode</Text>
							<Badge variant="informative" size="sm">Rule-Based</Badge>
						</div>
						<div class="flex items-center justify-between">
							<Text size="sm" color="muted">Prefer internal lane</Text>
							<Badge variant="positive" size="sm">
								<Check size={10} class="mr-1" />Yes
							</Badge>
						</div>
						<div class="flex items-center justify-between">
							<Text size="sm" color="muted">Escalate on rate limit</Text>
							<Badge variant="positive" size="sm">
								<Check size={10} class="mr-1" />Yes
							</Badge>
						</div>
					</div>
				</div>

				<!-- Routing Flow -->
				<div
					{...cardM.dataAttrs}
					style={cssVarString(cardM.cssVars)}
					class="rounded-lg p-4"
				>
					<div class="flex items-center gap-2 mb-4">
						<ArrowLeftRight size={18} style="color: var(--accent-teal-main);" />
						<Text size="base" weight="bold" color="primary">Routing Flow</Text>
					</div>
					<Text size="sm" color="muted" class="mb-3">
						When Clyffy needs Claude-level reasoning, the council routes through this chain:
					</Text>
					<div class="flex flex-col gap-2">
						<div class="flex items-center gap-3">
							<div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
								style="background: var(--accent-teal-main); color: var(--surface-base);">1</div>
							<div class="flex-1">
								<Text size="sm" weight="bold" color="primary">Internal Lane (Subscription)</Text>
								<Text size="sm" color="muted">Your Claude subscription via MCP sidecar — no API cost</Text>
							</div>
							<Badge variant="positive" size="sm">Preferred</Badge>
						</div>
						<div class="w-px h-4 ml-3" style="background: var(--border-subtle);"></div>
						<div class="flex items-center gap-3">
							<div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
								style="background: var(--border-subtle); color: var(--text-primary);">2</div>
							<div class="flex-1">
								<Text size="sm" weight="bold" color="primary">API Lane (Anthropic Key)</Text>
								<Text size="sm" color="muted">Falls back here if internal lane is rate-limited</Text>
							</div>
							<Badge variant="neutral" size="sm">Fallback</Badge>
						</div>
						<div class="w-px h-4 ml-3" style="background: var(--border-subtle);"></div>
						<div class="flex items-center gap-3">
							<div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
								style="background: var(--border-subtle); color: var(--text-primary);">3</div>
							<div class="flex-1">
								<Text size="sm" weight="bold" color="primary">Local Brain Only</Text>
								<Text size="sm" color="muted">No external API — Clyffy uses local models exclusively</Text>
							</div>
							<Badge variant="neutral" size="sm">Last Resort</Badge>
						</div>
					</div>
				</div>

				<!-- Lane Limits Summary -->
				<div
					{...cardM.dataAttrs}
					style={cssVarString(cardM.cssVars)}
					class="rounded-lg p-4"
				>
					<div class="flex items-center gap-2 mb-4">
						<Settings size={18} style="color: var(--accent-teal-main);" />
						<Text size="base" weight="bold" color="primary">Lane Limits</Text>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<Text size="sm" weight="bold" color="secondary" class="mb-2">Internal (Subscription)</Text>
							<div class="flex flex-col gap-1">
								<div class="flex justify-between">
									<Text size="sm" color="muted">RPM</Text>
									<Text size="sm" color="primary">60</Text>
								</div>
								<div class="flex justify-between">
									<Text size="sm" color="muted">Tokens/day</Text>
									<Text size="sm" color="primary">1,000,000</Text>
								</div>
								<div class="flex justify-between">
									<Text size="sm" color="muted">429 cooldown</Text>
									<Text size="sm" color="primary">5s</Text>
								</div>
								<div class="flex justify-between">
									<Text size="sm" color="muted">Cost cap</Text>
									<Text size="sm" color="primary">None</Text>
								</div>
							</div>
						</div>
						<div>
							<Text size="sm" weight="bold" color="secondary" class="mb-2">API (User Key)</Text>
							<div class="flex flex-col gap-1">
								<div class="flex justify-between">
									<Text size="sm" color="muted">RPM</Text>
									<Text size="sm" color="primary">20</Text>
								</div>
								<div class="flex justify-between">
									<Text size="sm" color="muted">Tokens/day</Text>
									<Text size="sm" color="primary">500,000</Text>
								</div>
								<div class="flex justify-between">
									<Text size="sm" color="muted">429 cooldown</Text>
									<Text size="sm" color="primary">10s</Text>
								</div>
								<div class="flex justify-between">
									<Text size="sm" color="muted">Cost cap</Text>
									<Text size="sm" color="primary">$50/day</Text>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>
