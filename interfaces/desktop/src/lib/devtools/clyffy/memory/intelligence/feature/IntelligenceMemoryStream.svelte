<!--
	@file IntelligenceMemoryStream.svelte
	@module @devpulse/devtools/clyffy/memory/intelligence/memory-stream

	Live mirror of the cortex intelligence pipeline. Subscribes to the
	`intel:*` event channel (bridged from
	the engine's `LoaderEvent::Intelligence*` variants) and renders
	one card per chat-turn pipeline pass, with each hop lighting up
	as the event arrives:

	```text
	[classify]  ─→ [embed]  ─→ [memory saved]
	  (start)      (Nms, dim)    (memory_id)
	```

	## Why this lives outside the read-only Status tab

	The Status tab (`IntelStatus`) shows DISK STATE — counts that are
	cheap to query and stable across calls. The memory stream shows
	IN-FLIGHT STATE — pipeline events as they happen. Different
	cadence, different rendering pattern (chronological feed vs.
	row-keyed inventory), so it gets its own panel.

	## Card lifecycle

	- A new card is created on the first event seen for a
	  `(project_slug, content_len)` pair — the cortex pipeline emits
	  classify-start first, so that's the typical entry.
	- `embed-complete` updates the same card with the embed timing
	  and produced dim.
	- `memory-saved` flips the card to "saved" state with the
	  connector-returned memory id.

	## Capacity + drop policy

	Keeps the most recent 50 cards. New events past that cap evict
	the oldest in FIFO order — the devtool is a tail-watcher, not an
	audit log. The boot.log + file event sink hold the durable
	record.
-->
<script lang="ts">
import { Activity, CheckCircle2, Cpu, Sparkles } from "@lucide/svelte";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { onDestroy, onMount } from "svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Text } from "$lib/design/components/text/index.js";

/** Lifecycle position of a single chat-turn pipeline pass. */
type CardState = "classify" | "embed" | "saved";

interface MemoryCard {
	/** Stable id per card — generated client-side at first event. */
	id: string;
	projectSlug: string;
	state: CardState;
	contentLen: number;
	embedDim?: number;
	embedDurationMs?: number;
	memoryId?: string;
	/** Time the card was first created (Date.now()). */
	createdAt: number;
}

interface ClassifyStartedPayload {
	project_slug: string;
	content_len: number;
}
interface EmbedCompletePayload {
	project_slug: string;
	dim: number;
	duration_ms: number;
}
interface MemorySavedPayload {
	project_slug: string;
	memory_id: string;
}

const MAX_CARDS = 50;

let cards = $state<MemoryCard[]>([]);
const unlisteners: UnlistenFn[] = [];

/**
 * Push a card to the front; evict the oldest when at capacity.
 * `cards = ...` (rather than `cards.unshift(...)`) so Svelte's
 * reactivity picks up the change.
 */
function pushCard(card: MemoryCard): void {
	const next = [card, ...cards];
	cards = next.length > MAX_CARDS ? next.slice(0, MAX_CARDS) : next;
}

/**
 * Find the most recent in-flight card matching a project slug and
 * NOT yet at the target state. Returns null when no match — the
 * pipeline event will be dropped (a stray `embed-complete` without
 * a preceding `classify-started` shouldn't happen, but if it does
 * we don't fabricate a card to absorb it).
 */
function findInFlight(projectSlug: string, notYetState: CardState): MemoryCard | null {
	return (
		cards.find(
			(c) => c.projectSlug === projectSlug && c.state !== notYetState && c.state !== "saved",
		) ?? null
	);
}

function updateCard(id: string, patch: Partial<MemoryCard>): void {
	cards = cards.map((c) => (c.id === id ? { ...c, ...patch } : c));
}

onMount(async () => {
	unlisteners.push(
		await listen<ClassifyStartedPayload>("intel:classify-started", (ev) => {
			pushCard({
				id: `card-${ev.payload.project_slug}-${Date.now()}-${Math.random()
					.toString(36)
					.slice(2, 8)}`,
				projectSlug: ev.payload.project_slug,
				state: "classify",
				contentLen: ev.payload.content_len,
				createdAt: Date.now(),
			});
		}),
	);
	unlisteners.push(
		await listen<EmbedCompletePayload>("intel:embed-complete", (ev) => {
			const card = findInFlight(ev.payload.project_slug, "embed");
			if (!card) return;
			updateCard(card.id, {
				state: "embed",
				embedDim: ev.payload.dim,
				embedDurationMs: ev.payload.duration_ms,
			});
		}),
	);
	unlisteners.push(
		await listen<MemorySavedPayload>("intel:memory-saved", (ev) => {
			const card = findInFlight(ev.payload.project_slug, "saved");
			if (!card) return;
			updateCard(card.id, {
				state: "saved",
				memoryId: ev.payload.memory_id,
			});
		}),
	);
});

onDestroy(() => {
	for (const u of unlisteners) u();
});

function clearStream(): void {
	cards = [];
}

const STATE_META: Record<
	CardState,
	{ label: string; tone: "informative" | "positive" | "neutral"; icon: typeof Activity }
> = {
	classify: { label: "Classifying", tone: "informative", icon: Activity },
	embed: { label: "Embedded", tone: "informative", icon: Cpu },
	saved: { label: "Saved", tone: "positive", icon: CheckCircle2 },
};

function formatAge(createdAt: number): string {
	const seconds = Math.max(0, Math.floor((Date.now() - createdAt) / 1000));
	if (seconds < 60) return `${seconds}s ago`;
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
	return `${Math.floor(seconds / 3600)}h ago`;
}
</script>

<div class="memory-stream">
	<header class="stream-head">
		<div class="head-text">
			<div class="title-row">
				<Sparkles size={18} class="head-icon" />
				<Heading level={3} size="md">Memory Stream</Heading>
				<Badge variant="neutral" size="sm">{cards.length} / {MAX_CARDS}</Badge>
			</div>
			<Text size="sm" color="muted">
				Live feed of cortex pipeline passes. Each card lights up as
				the chat turn moves through classify → embed → save.
			</Text>
		</div>
		{#if cards.length > 0}
			<Button preset="ghost" size="sm" onclick={clearStream}>Clear</Button>
		{/if}
	</header>

	{#if cards.length === 0}
		<div class="empty-state">
			<Text size="sm" color="muted">
				No pipeline events yet. Type a chat message (once the chat
				hook lands) or call <code class="inline-code">intel_save_memory</code>
				from the Debug tab to populate this stream.
			</Text>
		</div>
	{:else}
		<ul class="card-list">
			{#each cards as card (card.id)}
				{@const meta = STATE_META[card.state]}
				{@const IconComp = meta.icon}
				<li class="card" data-state={card.state}>
					<div class="card-strip"></div>
					<div class="card-body">
						<div class="card-row">
							<IconComp size={16} class="card-icon" />
							<Text size="sm" weight="bold">{card.projectSlug}</Text>
							<Badge variant={meta.tone} size="sm">{meta.label}</Badge>
							<div class="row-spacer"></div>
							<Text size="xs" color="muted">{formatAge(card.createdAt)}</Text>
						</div>
						<div class="card-meta">
							<Text size="xs" color="muted">
								{card.contentLen} bytes
							</Text>
							{#if card.embedDim !== undefined}
								<Text size="xs" color="muted">
									· dim {card.embedDim} ({card.embedDurationMs}ms)
								</Text>
							{/if}
							{#if card.memoryId}
								<Text size="xs" color="muted">· {card.memoryId}</Text>
							{/if}
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.memory-stream {
		display: flex;
		flex-direction: column;
		gap: clamp(0.75rem, 1.4vw, 1rem);
	}

	.stream-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.75rem;
	}
	.head-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}
	.title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.memory-stream :global(.head-icon) {
		color: var(--accent-teal-main);
	}

	.empty-state {
		padding: clamp(1rem, 2vw, 1.5rem);
		border-radius: 0.5rem;
		background: var(--surface-inset);
		border: 0.0625rem dashed var(--border-subtle);
		text-align: center;
	}
	.inline-code {
		padding: 0.0625rem 0.3125rem;
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.8125rem;
		color: var(--text-default);
		background: var(--surface-raised);
		border-radius: 0.25rem;
	}

	.card-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.card {
		position: relative;
		display: flex;
		min-width: 0;
		border-radius: 0.5rem;
		overflow: hidden;
		background: var(--surface-raised);
		border: 0.0625rem solid var(--border-subtle);
		transition: border-color 120ms ease;
	}
	.card[data-state="classify"] {
		border-color: color-mix(in oklch, var(--accent-cyan-main) 35%, var(--border-subtle));
	}
	.card[data-state="embed"] {
		border-color: color-mix(in oklch, var(--accent-teal-main) 40%, var(--border-subtle));
	}
	.card[data-state="saved"] {
		border-color: color-mix(in oklch, var(--accent-positive-main, var(--accent-teal-main)) 50%, var(--border-subtle));
	}

	.card-strip {
		width: 0.25rem;
		flex-shrink: 0;
	}
	.card[data-state="classify"] .card-strip {
		background: var(--accent-cyan-main);
	}
	.card[data-state="embed"] .card-strip {
		background: var(--accent-teal-main);
	}
	.card[data-state="saved"] .card-strip {
		background: var(--accent-positive-main, var(--accent-teal-main));
	}

	.card-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: clamp(0.5rem, 1vw, 0.75rem);
		min-width: 0;
	}
	.card-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}
	.memory-stream :global(.card-icon) {
		flex-shrink: 0;
		color: var(--text-muted);
	}
	.row-spacer {
		flex: 1;
	}
	.card-meta {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
		min-width: 0;
	}
</style>
