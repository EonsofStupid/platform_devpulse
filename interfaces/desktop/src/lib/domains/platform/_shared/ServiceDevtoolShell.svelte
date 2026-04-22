<!--
	@file ServiceDevtoolShell
	@domain platform/_shared

	Uniform 4-tab shell that wraps every per-service devtool page. Every
	service's devtool uses this component so users see identical chrome
	(header, tabs, active-tab area) and only the per-service body changes.

	# Charter § 7 — devtool artifact

	The Module Charter mandates a 4-tab shell: Status / Config / Logs /
	Actions. This component is the single implementation; services
	compose it with Svelte `{#snippet}` blocks for each tab body.

	# Usage

	```svelte
	<script lang="ts">
import { Database } from "lucide-svelte";
import { ServiceDevtoolShell } from "$lib/domains/platform/_shared/index.js";
</script>

	<ServiceDevtoolShell
		title="LibSQL"
		description="System + User relational store"
		icon={Database}
		axis="stores"
		health={{ state: "up", label: "Running" }}
	>
		{#snippet status()}
			<p>Latency: 2ms. Last check: just now.</p>
		{/snippet}
		{#snippet config()}
			<label>Max connections: <input type="number" value="10" /></label>
		{/snippet}
		{#snippet logs()}
			<pre>... log lines ...</pre>
		{/snippet}
		{#snippet actions()}
			<button>Start</button> <button>Stop</button> <button>Restart</button>
		{/snippet}
	</ServiceDevtoolShell>
	```

	# Extra tabs

	A service with domain-specific tooling (e.g. LibSQL's SQL console,
	SurrealDB's query browser) can pass `extraTabs` plus matching
	snippet slots. The shell renders them after the four standard tabs.

	# Keyboard

	- `Ctrl+1..4` — jump to Status / Config / Logs / Actions
	- `Esc` in the back-link returns to `/devtools`
-->
<script lang="ts">
	import type { Component, Snippet } from "svelte";
	import { ArrowLeft } from "lucide-svelte";
	import { Text } from "$lib/design/components/text/index.js";
	import type { ExtraTab, HealthBadge, ServiceAxis } from "./types.js";

	interface Props {
		/** Display name in the header (e.g. "LibSQL"). */
		title: string;
		/** One-line description under the title. */
		description?: string;
		/** Optional lucide icon component rendered next to the title. */
		// biome-ignore lint/suspicious/noExplicitAny: lucide icons share a well-known props shape.
		icon?: Component<any>;
		/** Axis placement — used for breadcrumb + colored accent. */
		axis: ServiceAxis;
		/** Current health — renders as a colored dot + label in the header. */
		health?: HealthBadge;
		/** Where the back-link returns to. Defaults to `/devtools`. */
		backHref?: string;

		/** Extra per-service tabs rendered after the four standard tabs. */
		extraTabs?: ExtraTab[];

		// ── Standard tab snippets ────────────────────────────────
		status?: Snippet;
		config?: Snippet;
		logs?: Snippet;
		actions?: Snippet;

		/**
		 * Single snippet that dispatches extra-tab content by id. The
		 * shell calls `extra(activeExtraTabId)`; the caller renders the
		 * matching body via `{#if tabId === "..."}`.
		 *
		 * Shape:
		 * ```svelte
		 * {#snippet extra(tabId: string)}
		 *   {#if tabId === "tables"}<TablesView />
		 *   {:else if tabId === "console"}<ConsoleView />
		 *   {/if}
		 * {/snippet}
		 * ```
		 *
		 * Using a single dispatched snippet rather than a `Record<id, Snippet>`
		 * because Svelte templates cannot produce a map of snippets —
		 * each `{#snippet ...}` block is a named prop on the component.
		 */
		extra?: Snippet<[tabId: string]>;
	}

	let {
		title,
		description,
		icon: Icon,
		axis,
		health,
		backHref = "/devtools",
		extraTabs = [],
		status,
		config,
		logs,
		actions,
		extra,
	}: Props = $props();

	type StandardTabId = "status" | "config" | "logs" | "actions";
	type TabId = StandardTabId | string;

	const standardTabs: { id: StandardTabId; label: string }[] = [
		{ id: "status", label: "Status" },
		{ id: "config", label: "Config" },
		{ id: "logs", label: "Logs" },
		{ id: "actions", label: "Actions" },
	];

	let activeTab = $state<TabId>("status");

	function handleKeydown(event: KeyboardEvent): void {
		if (!event.ctrlKey && !event.metaKey) return;
		// Ctrl/Cmd + 1..4 → jump to a standard tab.
		const index = Number.parseInt(event.key, 10);
		if (Number.isNaN(index) || index < 1 || index > 4) return;
		event.preventDefault();
		activeTab = standardTabs[index - 1].id;
	}

	// Colored accent by axis — stores lean teal, runtimes purple, etc.
	// All colors come from ColdLight tokens — no raw oklch/hex.
	const axisAccent: Record<ServiceAxis, string> = {
		runtime: "var(--color-teal-400)",
		stores: "var(--color-teal-400)",
		runtimes: "var(--color-purple-400)",
		capabilities: "var(--color-teal-400)",
		integrations: "var(--color-purple-400)",
	};
	// `$derived` so the accent tracks prop changes when the parent route
	// passes a different `axis` (e.g. tab-switching inside a generic host).
	const accent = $derived(axisAccent[axis]);

	const healthDotColor = {
		starting: "var(--signal-warning)",
		up: "var(--signal-success)",
		degraded: "var(--signal-warning)",
		down: "var(--signal-error)",
		stopped: "var(--text-secondary)",
		unknown: "var(--text-secondary)",
	} as const;
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex flex-col h-full bg-[var(--surface-base)] text-[var(--text-primary)]">
	<!-- ── Header ───────────────────────────────────────────────── -->
	<header class="flex items-center gap-3 h-10 px-4 border-b border-[var(--border-subtle)]">
		<a
			href={backHref}
			class="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
			aria-label="Back to devtools"
		>
			<ArrowLeft size={14} />
		</a>

		{#if Icon}
			<Icon size={16} style={`color: ${accent}`} />
		{/if}

		<Text size="sm" weight="semibold">{title}</Text>

		{#if description}
			<span class="text-xs text-[var(--text-secondary)]">&middot; {description}</span>
		{/if}

		<span
			class="ml-1 px-1.5 py-0.5 text-xs uppercase tracking-wider rounded border"
			style={`color: ${accent}; border-color: ${accent}; opacity: 0.7;`}
		>
			{axis}
		</span>

		{#if health}
			<div class="ml-auto flex items-center gap-2">
				<span
					class="inline-block w-2 h-2 rounded-full"
					style={`background: ${healthDotColor[health.state]}`}
					aria-hidden="true"
				></span>
				<span
					class="text-xs"
					style={`color: ${healthDotColor[health.state]}`}
				>
					{health.label}
				</span>
			</div>
		{/if}
	</header>

	<!-- ── Tab bar ──────────────────────────────────────────────── -->
	<nav
		class="flex items-center border-b border-[var(--border-subtle)] overflow-x-auto"
		aria-label="Service devtool tabs"
	>
		{#each standardTabs as tab}
			<button
				type="button"
				class="flex items-center gap-1.5 px-3 py-2 text-xs transition-colors whitespace-nowrap
					{activeTab === tab.id
						? 'border-b-2'
						: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}"
				style={activeTab === tab.id
					? `color: ${accent}; border-color: ${accent};`
					: ""}
				onclick={() => (activeTab = tab.id)}
				aria-selected={activeTab === tab.id}
				role="tab"
			>
				{tab.label}
			</button>
		{/each}

		{#if extraTabs.length > 0}
			<span
				class="mx-2 h-4 w-px bg-[var(--border-subtle)]"
				aria-hidden="true"
			></span>
			{#each extraTabs as tab}
				<button
					type="button"
					class="flex items-center gap-1.5 px-3 py-2 text-xs transition-colors whitespace-nowrap
						{activeTab === tab.id
							? 'border-b-2'
							: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}"
					style={activeTab === tab.id
						? `color: ${accent}; border-color: ${accent};`
						: ""}
					onclick={() => (activeTab = tab.id)}
					aria-selected={activeTab === tab.id}
					role="tab"
				>
					{#if tab.Icon}
						<tab.Icon size={14} />
					{/if}
					{tab.label}
				</button>
			{/each}
		{/if}
	</nav>

	<!-- ── Active tab body ──────────────────────────────────────── -->
	<main class="flex-1 overflow-y-auto p-4">
		{#if activeTab === "status"}
			{#if status}
				{@render status()}
			{:else}
				<Text size="sm" color="muted">Status panel not wired for this service yet.</Text>
			{/if}
		{:else if activeTab === "config"}
			{#if config}
				{@render config()}
			{:else}
				<Text size="sm" color="muted">Config panel not wired for this service yet.</Text>
			{/if}
		{:else if activeTab === "logs"}
			{#if logs}
				{@render logs()}
			{:else}
				<Text size="sm" color="muted">Log viewer not wired for this service yet.</Text>
			{/if}
		{:else if activeTab === "actions"}
			{#if actions}
				{@render actions()}
			{:else}
				<Text size="sm" color="muted">Action controls not wired for this service yet.</Text>
			{/if}
		{:else if extra}
			{@render extra(activeTab)}
		{:else}
			<Text size="sm" color="muted">This tab has no content.</Text>
		{/if}
	</main>
</div>
