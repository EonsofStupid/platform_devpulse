<!--
	@file ServiceDevtoolShell
	@domain platform/_shared

	Uniform 5-tab shell that wraps every per-service devtool page. Every
	service's devtool uses this component so users see identical chrome
	(header, tabs, active-tab area, copy/export) and only the per-service
	body changes.

	# Charter § 7 — devtool artifact

	The Module Charter mandates a tabbed shell: Status / Config / Logs /
	Actions / Debug. This component is the single implementation; services
	compose it with Svelte `{#snippet}` blocks for each tab body.

	# Usage

	```svelte
	<script lang="ts">
import { Database } from "lucide-svelte";
import { ServiceDevtoolShell } from "$lib/devtools/_shared/index.js";
</script>

	<ServiceDevtoolShell
		title="Turso"
		description="System + User relational store"
		icon={Database}
		axis="stores"
		health={{ state: "up", label: "Running" }}
		capture={(tabId) => tabId === "logs"
			? { filename: "turso-logs.txt", mime: "text/plain", content: logTail }
			: undefined}
	>
		{#snippet status()}<p>Latency: 2ms. Last check: just now.</p>{/snippet}
		{#snippet config()}<label>Max connections: <input value="10" /></label>{/snippet}
		{#snippet logs()}<pre>... log lines ...</pre>{/snippet}
		{#snippet actions()}<button>Start</button> <button>Stop</button>{/snippet}
		{#snippet debug()}<button>Run probe</button>{/snippet}
	</ServiceDevtoolShell>
	```

	# Extra tabs

	A service with domain-specific tooling (e.g. Turso's SQL console,
	SurrealDB's query browser) can pass `extraTabs` plus matching
	snippet slots. The shell renders them after the five standard tabs.

	# Capture (copy / export)

	`capture(tabId)` returns the active tab's text content for the
	header Copy / Export buttons. Returning `undefined` for a tab id
	hides both buttons for that tab. Above 256 KiB Copy is disabled
	(clipboard pain) but Export remains.

	# Keyboard

	- `Ctrl+1..5` — jump to Status / Config / Logs / Actions / Debug
	- `Esc` in the back-link returns to `/devtools`
-->
<script lang="ts">
	import { type Snippet, untrack } from "svelte";
	import { ArrowLeft, Check, Copy, Download } from "lucide-svelte";
	import { KnowledgeTerm } from "$lib/design/blocks/knowledge/index.js";
	import { BackgroundScene } from "$lib/design/components/background-scene/index.js";
	import { Text } from "$lib/design/components/text/index.js";
	import {
		accentToBackdropPalette,
		type BrandAccent,
		DEFAULT_SERVICE_ACCENT,
		serviceAccentStyle,
		serviceBackdrop,
		type ServiceBackdrop,
	} from "./serviceAccents.js";
	import type { CapturePayload, ExtraTab, HealthBadge, ServiceAxis } from "./types.js";

	interface Props {
		/** Display name in the header (e.g. "Turso"). */
		title: string;
		/** One-line description under the title. */
		description?: string;
		/**
		 * Optional lucide icon component rendered next to the title.
		 * Typed `any` because lucide-svelte v0.564 exports class-based
		 * icons (`SvelteComponentTyped<…>`), which structurally don't
		 * satisfy Svelte 5's function-form `Component<P, E, S>`.
		 */
		// biome-ignore lint/suspicious/noExplicitAny: lucide-svelte class-based exports don't match Svelte 5 `Component<P>` function-form structurally.
		icon?: any;
		/** Axis placement — used as the breadcrumb badge label. */
		axis: ServiceAxis;
		/**
		 * ColdLight brand-accent that paints this devtool's icon, badge,
		 * and active-tab underline. See [`SERVICE_ACCENTS`] for the
		 * project-wide registry; fallback is [`DEFAULT_SERVICE_ACCENT`].
		 */
		accent?: BrandAccent;
		/** Current health — renders as a colored dot + label in the header. */
		health?: HealthBadge;
		/** Where the back-link returns to. Defaults to `/devtools`. */
		backHref?: string;

		/**
		 * Per-devtool ambient backdrop. Pass either a slug (looked up via
		 * [`SERVICE_BACKDROPS`]) or an explicit [`ServiceBackdrop`] config.
		 * Omit to render no scoped backdrop (the shell-wide cosmic mount
		 * in Frame.svelte still paints behind everything).
		 *
		 * The backdrop's palette derives automatically from `accent` via
		 * [`accentToBackdropPalette`] so colour stays family-coherent.
		 */
		backdrop?: ServiceBackdrop | string;

		/** Extra per-service tabs rendered after the five standard tabs. */
		extraTabs?: ExtraTab[];

		/**
		 * Glossary term shown as a hover chip in the header. When set,
		 * the shell renders a `KnowledgeTerm` chip after the title that
		 * surfaces the matching glossary entry on hover/focus. Use it
		 * to give an operator the "what is this subsystem" definition
		 * without forcing them to read the docs.
		 *
		 * Pass the exact `term` field of a `gloss`-type entry (e.g.
		 * `"SurrealDB"`, `"RRO"`, `"DuckDB"`). Case-insensitive.
		 */
		infoTerm?: string;

		// ── Standard tab snippets ────────────────────────────────
		status?: Snippet;
		config?: Snippet;
		logs?: Snippet;
		actions?: Snippet;
		/** Power-user probes: sample requests, raw endpoint calls, test invocations. */
		debug?: Snippet;

		/**
		 * Per-tab capture provider for the shell's Copy / Export buttons.
		 * The shell calls `capture(activeTab)` and renders the buttons
		 * when a payload comes back. Returning `undefined` for a tab
		 * hides both buttons for that tab. Above 256 KiB Copy is disabled
		 * (clipboard pain) but Export remains.
		 */
		capture?: (tabId: string) => CapturePayload | undefined;

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
		accent = DEFAULT_SERVICE_ACCENT,
		health,
		backHref = "/devtools",
		backdrop,
		extraTabs = [],
		infoTerm,
		status,
		config,
		logs,
		actions,
		debug,
		capture,
		extra,
	}: Props = $props();

	// Resolve backdrop config — slug → registry lookup, or use object directly.
	const resolvedBackdrop = $derived<ServiceBackdrop | null>(
		backdrop === undefined
			? null
			: typeof backdrop === "string"
				? serviceBackdrop(backdrop)
				: backdrop,
	);

	// Backdrop palette derives from the accent so the family stays coherent.
	const backdropPalette = $derived(accentToBackdropPalette(accent));

	type StandardTabId = "status" | "config" | "logs" | "actions" | "debug";
	type TabId = StandardTabId | string;

	// Only render tabs whose snippet the consumer actually passed. A
	// service that has no Actions verb (library backends, embedded
	// stores) just omits the `actions` prop and the tab disappears —
	// way better than a tab that shows "Not yet implemented" or a
	// disabled button. `$derived.by` so snippet prop reads retrack on
	// each derivation (Svelte 5 `state_referenced_locally` correctness).
	const standardTabs = $derived.by(() =>
		[
			{ id: "status" as const, label: "Status", snippet: status },
			{ id: "config" as const, label: "Config", snippet: config },
			{ id: "logs" as const, label: "Logs", snippet: logs },
			{ id: "actions" as const, label: "Actions", snippet: actions },
			{ id: "debug" as const, label: "Debug", snippet: debug },
		].filter((t) => t.snippet !== undefined),
	);

	// Active tab defaults to the first visible standard tab. Reading
	// the snippet props here is intentional first-mount behaviour —
	// `untrack` makes that explicit so Svelte 5 doesn't warn that we
	// "only captured the initial value" (we want exactly that; the
	// user clicks to change tabs after mount).
	let activeTab = $state<TabId>(
		untrack(() =>
			status ? "status" : config ? "config" : logs ? "logs" : actions ? "actions" : "debug",
		),
	);

	function handleKeydown(event: KeyboardEvent): void {
		if (!event.ctrlKey && !event.metaKey) return;
		// Ctrl/Cmd + 1..N → jump to the N-th visible standard tab.
		const index = Number.parseInt(event.key, 10);
		if (Number.isNaN(index) || index < 1 || index > standardTabs.length) return;
		event.preventDefault();
		activeTab = standardTabs[index - 1].id;
	}

	// ── Capture / Copy / Export ──────────────────────────────
	/** 256 KiB ceiling — above this Copy is disabled, Export remains. */
	const SIZE_GUARD_BYTES = 256 * 1024;
	const currentCapture = $derived(capture?.(activeTab));
	const captureBytes = $derived(currentCapture ? currentCapture.content.length : 0);
	const captureTooLarge = $derived(captureBytes > SIZE_GUARD_BYTES);
	let copiedAt = $state<number | null>(null);
	const copiedRecently = $derived(copiedAt !== null && Date.now() - copiedAt < 1500);

	function formatBytes(n: number): string {
		if (n < 1024) return `${n} B`;
		if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KiB`;
		return `${(n / (1024 * 1024)).toFixed(1)} MiB`;
	}

	async function handleCopy(): Promise<void> {
		if (!currentCapture || captureTooLarge) return;
		try {
			await navigator.clipboard.writeText(currentCapture.content);
			copiedAt = Date.now();
			setTimeout(() => {
				if (copiedAt !== null && Date.now() - copiedAt >= 1500) copiedAt = null;
			}, 1600);
		} catch (err) {
			// Clipboard write can fail in non-secure contexts or under permission policy —
			// surface to the console; UI just won't flash "Copied".
			console.error("ServiceDevtoolShell: clipboard write failed", err);
		}
	}

	function handleExport(): void {
		if (!currentCapture) return;
		const blob = new Blob([currentCapture.content], { type: currentCapture.mime });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = currentCapture.filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	// Scope `--accent-service-{main,glow,fill}` to the chosen brand
	// accent. Descendants consume `var(--accent-service-main)` so they
	// don't need to know the brand name.
	const accentStyle = $derived(serviceAccentStyle(accent));

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

<div
	class="relative flex flex-col h-full bg-[var(--surface-base)] text-[var(--text-primary)] overflow-hidden"
	style={accentStyle}
>
	<!-- ── Per-devtool ambient backdrop (opt-in via `backdrop` prop) ── -->
	{#if resolvedBackdrop}
		<BackgroundScene
			variation={resolvedBackdrop.variation}
			palette={backdropPalette}
			intensity={resolvedBackdrop.intensity}
			speed={resolvedBackdrop.speed}
			motion="on"
		/>
	{/if}

	<!-- ── Header ───────────────────────────────────────────────── -->
	<header class="relative z-10 flex items-center gap-3 h-10 px-4 border-b border-[var(--border-subtle)]">
		<a
			href={backHref}
			class="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
			aria-label="Back to devtools"
		>
			<ArrowLeft size={14} />
		</a>

		{#if Icon}
			<Icon size={16} style="color: var(--accent-service-main)" />
		{/if}

		<Text size="sm" weight="semibold">{title}</Text>

		{#if description}
			<span class="text-xs text-[var(--text-secondary)]">&middot; {description}</span>
		{/if}

		{#if infoTerm}
			<KnowledgeTerm term={infoTerm} tool="devtools" plain>
				<span class="ml-1 px-1.5 py-0.5 text-[10px] uppercase tracking-wider rounded border border-[var(--accent-purple-main)] text-[var(--accent-purple-main)] cursor-help">
					?
				</span>
			</KnowledgeTerm>
		{/if}

		<span
			class="ml-1 px-1.5 py-0.5 text-xs uppercase tracking-wider rounded border"
			style="color: var(--accent-service-main); border-color: var(--accent-service-main); opacity: 0.7;"
		>
			{axis}
		</span>

		<div class="ml-auto flex items-center gap-3">
			{#if health}
				<div class="flex items-center gap-2">
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

			{#if currentCapture}
				<div class="flex items-center gap-1">
					<button
						type="button"
						class="shell-cap-btn"
						aria-label={captureTooLarge
							? `Copy disabled — payload is ${formatBytes(captureBytes)}, above the 256 KiB clipboard guard. Use Export.`
							: copiedRecently
								? "Copied"
								: `Copy ${formatBytes(captureBytes)} to clipboard`}
						title={captureTooLarge
							? `Payload is ${formatBytes(captureBytes)} — above 256 KiB. Use Export instead.`
							: copiedRecently
								? "Copied!"
								: `Copy (${formatBytes(captureBytes)})`}
						disabled={captureTooLarge}
						onclick={handleCopy}
					>
						{#if copiedRecently}
							<Check size={12} />
							<span>Copied</span>
						{:else}
							<Copy size={12} />
							<span>Copy</span>
						{/if}
					</button>
					<button
						type="button"
						class="shell-cap-btn"
						aria-label={`Export ${currentCapture.filename} (${formatBytes(captureBytes)})`}
						title={`Export ${currentCapture.filename}`}
						onclick={handleExport}
					>
						<Download size={12} />
						<span>Export</span>
					</button>
				</div>
			{/if}
		</div>
	</header>

	<!-- ── Tab bar ──────────────────────────────────────────────── -->
	<nav
		class="relative z-10 flex items-center border-b border-[var(--border-subtle)] overflow-x-auto"
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
					? "color: var(--accent-service-main); border-color: var(--accent-service-main);"
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
						? "color: var(--accent-service-main); border-color: var(--accent-service-main);"
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
	<main class="relative z-10 flex-1 overflow-y-auto p-4">
		{#if activeTab === "status" && status}
			{@render status()}
		{:else if activeTab === "config" && config}
			{@render config()}
		{:else if activeTab === "logs" && logs}
			{@render logs()}
		{:else if activeTab === "actions" && actions}
			{@render actions()}
		{:else if activeTab === "debug" && debug}
			{@render debug()}
		{:else if extra}
			{@render extra(activeTab)}
		{/if}
	</main>
</div>

<style>
	.shell-cap-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.1875rem 0.5rem;
		font-size: var(--font-size-xs);
		border-radius: 0.25rem;
		background: transparent;
		border: var(--border-width-hairline) solid var(--border-subtle);
		color: var(--text-secondary);
		cursor: pointer;
		transition:
			color 150ms ease-out,
			border-color 150ms ease-out,
			background 150ms ease-out;
	}

	.shell-cap-btn:hover:not(:disabled) {
		color: var(--accent-service-main);
		border-color: var(--accent-service-main);
		background: var(--accent-service-fill);
	}

	.shell-cap-btn:focus-visible {
		outline: var(--border-width-thin) solid var(--accent-service-main);
		outline-offset: var(--outline-offset-md);
	}

	.shell-cap-btn:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
</style>
