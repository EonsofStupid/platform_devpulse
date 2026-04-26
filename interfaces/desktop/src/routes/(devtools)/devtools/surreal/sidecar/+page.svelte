<!--
	@file /devtools/surreal/sidecar — Surreal child-process devtool
	@route /devtools/surreal/sidecar

	Surreal is boot-time (the graph stores depend on it), so this
	devtool does NOT have start/stop/restart buttons. Config changes
	write to `{data_dir}/user/surreal.toml` and take effect on the next
	app restart — a banner makes this explicit.

	The auto port-bump behavior is visible in real time: when the
	configured port is foreign-bound, the allocator bumps +1 up to 20
	attempts; Status shows `configured → actual` with a bump count.

	TODO(phase 7 follow-up): merge this content as a "Lifecycle" extra
	tab on `/devtools/surreal`. Preserved as a sub-route for now.
-->
<script lang="ts">
import { AlertCircle, Database, RefreshCw, RotateCcw, Save } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { surrealSidecarState as surrealdbSidecar } from "$lib/domains/infra/surreal/index.js";
import {
	type HealthBadge,
	ScopedLogPanel,
	ServiceDevtoolShell,
} from "$lib/domains/platform/index.js";

// ── Mount ─────────────────────────────────────────────────
$effect(() => {
	void surrealdbSidecar.loadStatus();
	void surrealdbSidecar.loadHealth();
	void surrealdbSidecar.loadConfig();
});

// ── Header health badge ───────────────────────────────────
const badge = $derived<HealthBadge>(
	surrealdbSidecar.healthLoading
		? { state: "starting", label: "Checking…" }
		: surrealdbSidecar.health
			? surrealdbSidecar.health.state === "up"
				? { state: "up", label: surrealdbSidecar.health.label }
				: surrealdbSidecar.health.state === "stopped"
					? { state: "stopped", label: surrealdbSidecar.health.label }
					: { state: "down", label: surrealdbSidecar.health.label }
			: { state: "unknown", label: "Not checked yet" },
);

// ── Form bindings — bound to surrealdbSidecar.draft ───────
// Inputs use value || null so empty strings become None on the
// Rust side (= "inherit from platform.default.toml").
function updatePort(raw: string) {
	const n = Number.parseInt(raw, 10);
	surrealdbSidecar.draft.port = Number.isFinite(n) && n >= 1024 ? n : null;
}
function updateMaxBumps(raw: string) {
	const n = Number.parseInt(raw, 10);
	surrealdbSidecar.draft.max_bumps = Number.isFinite(n) && n > 0 && n <= 100 ? n : null;
}
function updateBinary(raw: string) {
	surrealdbSidecar.draft.binary_path = raw.trim() === "" ? null : raw;
}
function updateLogLevel(raw: string) {
	surrealdbSidecar.draft.log_level = raw === "" ? null : raw;
}
function updateRootUser(raw: string) {
	surrealdbSidecar.draft.root_user = raw.trim() === "" ? null : raw;
}
function updateRootPassword(raw: string) {
	surrealdbSidecar.draft.root_password = raw === "" ? null : raw;
}
</script>

<ServiceDevtoolShell
	title="SurrealDB · child process"
	description="Managed surreal start · RocksDB · WS client"
	icon={Database}
	axis="stores"
	accent="violet"
	health={badge}
>
	<!-- ── STATUS ──────────────────────────────────────── -->
	{#snippet status()}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<Text size="sm" weight="semibold">Runtime Status</Text>
				<Button
					preset="ghost"
					size="sm"
					onclick={() => {
						void surrealdbSidecar.loadStatus();
						void surrealdbSidecar.loadHealth();
					}}
					disabled={surrealdbSidecar.healthLoading}
				>
					{#if surrealdbSidecar.healthLoading}
						<Spinner size="xs" tone="accent" />
					{:else}
						<RefreshCw size={14} />
					{/if}
					Refresh
				</Button>
			</div>

			{#if surrealdbSidecar.statusError}
				<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
					{surrealdbSidecar.statusError}
				</div>
			{/if}

			{#if surrealdbSidecar.status}
				<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
					<div class="flex items-center justify-between mb-2">
						<div class="flex items-center gap-2">
							<Database size={14} class="text-[var(--color-teal-400)]" />
							<Text size="sm" weight="semibold">surreal</Text>
							{#if surrealdbSidecar.status.running}
								{#if surrealdbSidecar.status.managed}
									<Badge tone="positive" size="sm">Managed</Badge>
								{:else}
									<Badge tone="neutral" size="sm">Attached</Badge>
								{/if}
								{#if surrealdbSidecar.bumped}
									<Badge tone="warning" size="sm">
										port +{surrealdbSidecar.status.portBumps}
									</Badge>
								{/if}
							{:else}
								<Badge tone="neutral" size="sm">Stopped</Badge>
							{/if}
						</div>
						<span
							class="inline-block w-2 h-2 rounded-full"
							style="background: {surrealdbSidecar.running
								? 'var(--signal-success)'
								: 'var(--signal-error)'}"
						></span>
					</div>

					<div class="space-y-1 text-xs">
						{#if surrealdbSidecar.status.running}
							<div class="flex justify-between">
								<span class="text-[var(--text-secondary)]">Port</span>
								<span class="font-mono">{surrealdbSidecar.portSummary}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-[var(--text-secondary)]">HTTP</span>
								<span class="font-mono">{surrealdbSidecar.status.httpUrl}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-[var(--text-secondary)]">WS</span>
								<span class="font-mono">{surrealdbSidecar.status.wsUrl}</span>
							</div>
							{#if surrealdbSidecar.status.binaryPath}
								<div class="flex justify-between">
									<span class="text-[var(--text-secondary)]">Binary</span>
									<span class="font-mono text-[10px]">{surrealdbSidecar.status.binaryPath}</span>
								</div>
							{/if}
						{:else}
							<Text size="xs" color="muted">
								Sidecar not booted — check boot log at <code>.userdata/logs/boot.log</code>.
							</Text>
						{/if}
					</div>
				</div>
			{/if}

			{#if surrealdbSidecar.bumped}
				<div class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex gap-2">
					<AlertCircle size={14} class="shrink-0 mt-0.5" />
					<div>
						<div class="font-semibold mb-1">Port auto-bumped</div>
						<div>
							The configured port
							<code>:{surrealdbSidecar.status?.configuredPort}</code>
							was held by another process; the allocator landed on
							<code>:{surrealdbSidecar.status?.actualPort}</code>
							instead. Edit the port in Config to pin a different one,
							or free <code>:{surrealdbSidecar.status?.configuredPort}</code>
							and restart.
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/snippet}

	<!-- ── CONFIG ──────────────────────────────────────── -->
	{#snippet config()}
		<div class="space-y-3">
			{#if surrealdbSidecar.configError}
				<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
					{surrealdbSidecar.configError}
				</div>
			{/if}

			{#if surrealdbSidecar.needsRestart}
				<div class="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300 flex gap-2">
					<AlertCircle size={14} class="shrink-0 mt-0.5" />
					<div>
						<div class="font-semibold mb-1">Restart to apply</div>
						<div>
							Config saved to <code>user/surreal.toml</code>. Restart the app for changes to take effect — the sidecar
							only reads this file at boot.
						</div>
					</div>
				</div>
			{/if}

			<Text size="xs" color="muted">
				Every field is an override. Leave blank to inherit from
				<code>platform.default.toml</code>. Persists to <code>user/surreal.toml</code>.
			</Text>

			<div class="grid grid-cols-2 gap-3">
				<label class="flex flex-col gap-1">
					<span class="text-xs text-[var(--text-secondary)]">Port</span>
					<input
						type="number"
						min="1024"
						max="65535"
						class="px-2 py-1 text-xs font-mono rounded border border-[var(--border-subtle)] bg-[var(--surface-base)]"
						value={surrealdbSidecar.draft.port ?? ""}
						placeholder="{surrealdbSidecar.status?.configuredPort ?? 'inherit'}"
						oninput={(e) => updatePort(e.currentTarget.value)}
					/>
				</label>

				<label class="flex flex-col gap-1">
					<span class="text-xs text-[var(--text-secondary)]">Max port bumps</span>
					<input
						type="number"
						min="0"
						max="100"
						class="px-2 py-1 text-xs font-mono rounded border border-[var(--border-subtle)] bg-[var(--surface-base)]"
						value={surrealdbSidecar.draft.max_bumps ?? ""}
						placeholder="20 (default)"
						oninput={(e) => updateMaxBumps(e.currentTarget.value)}
					/>
				</label>

				<label class="col-span-2 flex flex-col gap-1">
					<span class="text-xs text-[var(--text-secondary)]">Binary path</span>
					<input
						type="text"
						class="px-2 py-1 text-xs font-mono rounded border border-[var(--border-subtle)] bg-[var(--surface-base)]"
						value={surrealdbSidecar.draft.binary_path ?? ""}
						placeholder="(bundled / standard install / PATH)"
						oninput={(e) => updateBinary(e.currentTarget.value)}
					/>
				</label>

				<label class="flex flex-col gap-1">
					<span class="text-xs text-[var(--text-secondary)]">Log level</span>
					<select
						class="px-2 py-1 text-xs font-mono rounded border border-[var(--border-subtle)] bg-[var(--surface-base)]"
						value={surrealdbSidecar.draft.log_level ?? ""}
						onchange={(e) => updateLogLevel(e.currentTarget.value)}
					>
						<option value="">(inherit)</option>
						<option value="error">error</option>
						<option value="warn">warn</option>
						<option value="info">info</option>
						<option value="debug">debug</option>
						<option value="trace">trace</option>
					</select>
				</label>

				<label class="flex flex-col gap-1">
					<span class="text-xs text-[var(--text-secondary)]">Root user</span>
					<input
						type="text"
						class="px-2 py-1 text-xs font-mono rounded border border-[var(--border-subtle)] bg-[var(--surface-base)]"
						value={surrealdbSidecar.draft.root_user ?? ""}
						placeholder="root (default)"
						oninput={(e) => updateRootUser(e.currentTarget.value)}
					/>
				</label>

				<label class="col-span-2 flex flex-col gap-1">
					<span class="text-xs text-[var(--text-secondary)]">Root password</span>
					<input
						type="password"
						class="px-2 py-1 text-xs font-mono rounded border border-[var(--border-subtle)] bg-[var(--surface-base)]"
						value={surrealdbSidecar.draft.root_password ?? ""}
						placeholder="root (default)"
						oninput={(e) => updateRootPassword(e.currentTarget.value)}
					/>
				</label>
			</div>

			<div class="flex gap-2 justify-end pt-2">
				<Button
					preset="ghost"
					size="sm"
					onclick={() => surrealdbSidecar.reset()}
					disabled={!surrealdbSidecar.dirty || surrealdbSidecar.configSaving}
				>
					<RotateCcw size={14} />
					Reset
				</Button>
				<Button
					preset="primary"
					size="sm"
					onclick={() => void surrealdbSidecar.save()}
					disabled={!surrealdbSidecar.dirty || surrealdbSidecar.configSaving}
				>
					{#if surrealdbSidecar.configSaving}
						<Spinner size="xs" tone="accent" />
					{:else}
						<Save size={14} />
					{/if}
					Save
				</Button>
			</div>
		</div>
	{/snippet}

	<!-- ── LOGS ────────────────────────────────────────── -->
	{#snippet logs()}
		<ScopedLogPanel target="devtools.surreal" />
	{/snippet}
</ServiceDevtoolShell>
