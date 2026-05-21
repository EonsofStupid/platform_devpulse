<!--
	@block CommunityFeedList
	@module @devpulse/design/blocks/community

	Renders the in-memory `FeedItem[]` from `communityState`. Pure
	presentation — the page or panel that mounts this block decides
	when to call `communityState.refresh()` / `forceSync()`.

	# Variants

	`compact = true` collapses each item to a single line for the Latest
	tab's "From the community" panel. The standalone Community page
	leaves it at `false` for full title + body + actor display.

	# Accessibility

	Each item is a `<li>` inside a `role="list"` ul, with the title
	wrapped in the appropriate heading level for the surrounding region.
-->
<script lang="ts">
import { Megaphone, MessageSquare, Sparkles } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { stack } from "$lib/design/utils/stack/index.js";
import type { FeedItem, FeedKind } from "$lib/domains/app/community/index.js";

interface Props {
	items: FeedItem[];
	compact?: boolean;
	loading?: boolean;
	emptyMessage?: string;
}

let {
	items,
	compact = false,
	loading = false,
	emptyMessage = "No community items yet — try Refresh.",
}: Props = $props();

function iconFor(kind: FeedKind) {
	switch (kind) {
		case "announcement":
			return Megaphone;
		case "knowledge_contribution":
			return Sparkles;
		default:
			return MessageSquare;
	}
}

function accentFor(kind: FeedKind): string {
	switch (kind) {
		case "announcement":
			return "var(--accent-hotpink-main, oklch(0.7 0.2 0))";
		case "knowledge_contribution":
			return "var(--accent-teal-main, oklch(0.7 0.15 180))";
		default:
			return "var(--accent-blue-main, oklch(0.65 0.18 240))";
	}
}

function timeAgo(epoch: number): string {
	const secs = Math.max(0, Math.round(Date.now() / 1000 - epoch));
	if (secs < 60) return `${secs}s ago`;
	if (secs < 3600) return `${Math.round(secs / 60)}m ago`;
	if (secs < 86400) return `${Math.round(secs / 3600)}h ago`;
	return `${Math.round(secs / 86400)}d ago`;
}
</script>

{#if loading && items.length === 0}
	<div class={stack({ gap: "2" })} aria-busy="true">
		<div class="h-6 w-3/4 animate-pulse rounded bg-[var(--surface-2,oklch(0.16_0.03_224_/_0.6))]"></div>
		<div class="h-6 w-1/2 animate-pulse rounded bg-[var(--surface-2,oklch(0.16_0.03_224_/_0.6))]"></div>
		<div class="h-6 w-2/3 animate-pulse rounded bg-[var(--surface-2,oklch(0.16_0.03_224_/_0.6))]"></div>
	</div>
{:else if items.length === 0}
	<Text size="sm" color="muted">{emptyMessage}</Text>
{:else}
	<ul role="list" class={stack({ gap: compact ? "2" : "3" })}>
		{#each items as item (item.id)}
			{@const Icon = iconFor(item.kind)}
			<li
				class={cn(
					"relative rounded-md border border-[var(--border-soft,oklch(0.4234_0.081_173.37_/_0.22))]",
					compact ? "p-2" : "p-3",
				)}
				data-kind={item.kind}
			>
				<span
					aria-hidden="true"
					class="absolute left-0 top-0 h-full w-0.5 rounded-l-md"
					style="background: {accentFor(item.kind)}"
				></span>
				<div class={cn("flex items-start gap-2 pl-2")}>
					<Icon size={compact ? 14 : 16} aria-hidden="true" />
					<div class={cn(stack({ gap: "1" }), "min-w-0 flex-1")}>
						{#if compact}
							<Text size="sm" class="truncate">
								{item.title ?? item.body ?? "(untitled)"}
							</Text>
							<Text size="xs" color="muted">
								{item.actor ?? "—"} · {timeAgo(item.createdAt)}
							</Text>
						{:else}
							{#if item.title}
								<Text size="base" weight="bold">{item.title}</Text>
							{/if}
							{#if item.body}
								<Text size="sm" class="whitespace-pre-wrap">{item.body}</Text>
							{/if}
							<Text size="xs" color="muted">
								{item.actor ?? "anonymous"} · {timeAgo(item.createdAt)}
								{#if item.url}
									· <a
										href={item.url}
										target="_blank"
										rel="noopener noreferrer"
										class="underline hover:no-underline"
									>open</a>
								{/if}
							</Text>
						{/if}
					</div>
				</div>
			</li>
		{/each}
	</ul>
{/if}
