<!--
	@file Latest tab — what's new across the platform
	@route /latest
	@domain app

	Composition surface. Three independent panels mount alongside each
	other; any one failing to load does NOT cascade — knowledge keeps
	rotating if the update check died, the update card still works if
	community is offline, etc.

	Sections:

	1. **This build** — `LatestUpdateCard`: version + check + install +
	   progress + channel
	2. **What's new in your tools** — `KnowledgeDeck` with a "latest"
	   scope so it pulls fresh entries the user hasn't seen yet
	3. **From the community** — placeholder until `commands/community/`
	   ships its feed surface. The text honestly says what is coming.
-->
<script lang="ts">
import { onMount } from "svelte";
import { CommunityFeedList } from "$lib/design/blocks/community/index.js";
import { KnowledgeDeck } from "$lib/design/blocks/knowledge/index.js";
import { LatestUpdateCard } from "$lib/design/blocks/latest/index.js";
import { Widget } from "$lib/design/blocks/widgets/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { communityState } from "$lib/domains/app/community/index.js";
import { syncKnowledgeFromRemote } from "$lib/domains/app/knowledge/index.js";
import { updatesState } from "$lib/domains/app/updates/index.js";

// Fire non-blocking probes when the tab mounts so the user sees current
// truth rather than the at-bootstrap "never checked" state. Network
// failures fall into the respective rune's `error` lane — none of the
// three blocks the rest of the surface from rendering.
//
// `syncKnowledgeFromRemote` returns its outcome via a `KnowledgeSyncResult`
// enum and never throws; the awaited value is discarded because the page
// rotates a fresh deck on the next interval regardless.
onMount(() => {
	void updatesState.checkNow();
	void communityState.refresh(undefined, 5);
	void syncKnowledgeFromRemote();
});
</script>

<div class={stack({ gap: "6" })} data-page="latest">
	<header class={stack({ gap: "1" })}>
		<h1 class="text-2xl font-bold">Latest</h1>
		<Text size="sm" color="muted">
			What's new in your build, your tools, and the community.
		</Text>
	</header>

	<!-- Section 1: Update status -->
	<LatestUpdateCard />

	<!-- Section 2: What's new in your tools — knowledge deck. -->
	<Widget title="What's new in your tools" size="lg">
		<div class="min-h-[12rem]">
			<KnowledgeDeck
				context={{ id: "latest:knowledge", tool: "platform", scope: "latest:knowledge" }}
				preferred="dyk"
				refreshIntervalMs={45_000}
			/>
		</div>
	</Widget>

	<!-- Section 3: Community highlights — live feed via communityState. -->
	<Widget title="From the community" size="lg">
		<div class={stack({ gap: "2" })}>
			<CommunityFeedList
				items={communityState.items.slice(0, 5)}
				loading={communityState.loading}
				compact
				emptyMessage="Nothing from the community yet — head to /devpulse/community to refresh, or check back later."
			/>
			<Text size="xs" color="muted">
				Full surface: <a class="underline" href="/devpulse/community">/devpulse/community</a>
			</Text>
		</div>
	</Widget>
</div>
