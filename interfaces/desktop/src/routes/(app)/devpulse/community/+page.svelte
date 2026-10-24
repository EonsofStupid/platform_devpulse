<!--
	@file DevPulse Community
	@route /devpulse/community
	@domain devpulse

	Standalone view for the community feed. Composes:

	- header with status (synced N min ago · enabled toggle · refresh)
	- main `CommunityFeedList` (full layout)
	- side widgets for friends / groups (placeholder counts until the
	  corresponding tables ship — kept so the surface area is visible)

	The friends/groups counts come from `devpulseState.data.community`
	(static zeros today). They WILL be wired to Turso `friends` /
	`groups` tables when those land alongside the auth/contribution flow.
-->
<script lang="ts">
import { Widget } from "@devpulse/coldlight/blocks/widgets";
import { Button } from "@devpulse/coldlight/components/button";
import { Text } from "@devpulse/coldlight/components/text";
import { gridLayout, stack } from "@devpulse/coldlight/utils";
import { RefreshCcw } from "lucide-svelte";
import { onMount } from "svelte";
import { CommunityFeedList, communityState } from "$lib/domains/app/community/index.js";
import { devpulseState } from "$lib/domains/app/devpulse/index.js";
import { routeCopy, routeHere } from "$lib/sys/routing/index.js";

const here = $derived(routeHere());
const heading = $derived(here ? routeCopy(here) : undefined);

onMount(() => {
	void communityState.refresh();
});

const lastSyncLabel = $derived.by(() => {
	const ts = communityState.status.lastSyncAt;
	if (!ts) return "never";
	const secs = Math.max(0, Math.round(Date.now() / 1000 - ts));
	if (secs < 60) return `${secs}s ago`;
	if (secs < 3600) return `${Math.round(secs / 60)}m ago`;
	if (secs < 86400) return `${Math.round(secs / 3600)}h ago`;
	return `${Math.round(secs / 86400)}d ago`;
});

async function onRefresh(): Promise<void> {
	await communityState.forceSync();
}
</script>

<div class={stack({ gap: "4" })} data-page="devpulse-community">
	<header class="flex flex-wrap items-end justify-between gap-3">
		<div class={stack({ gap: "1" })}>
			<h1 class="text-2xl font-bold">{heading?.label}</h1>
			<Text size="sm" color="muted">
				{#if communityState.status.enabled}
					Last synced {lastSyncLabel}
					{#if communityState.status.cacheStale} · cache stale, refresh recommended{/if}
				{:else}
					Community sync is disabled. Re-enable in Settings.
				{/if}
			</Text>
		</div>
		<Button variant="ghost" size="sm" onclick={onRefresh}>
			<RefreshCcw size={14} class="mr-1" /> Refresh
		</Button>
	</header>

	<div class={gridLayout({ columns: "2", gap: "4" })}>
		<Widget title="Friends" size="md">
			<div class={stack({ gap: "2" })}>
				<Text size="xl" weight="bold">{devpulseState.data.community.friends}</Text>
				<Text size="xs" color="muted">connected developers</Text>
			</div>
		</Widget>

		<Widget title="Groups" size="md">
			<div class={stack({ gap: "2" })}>
				<Text size="xl" weight="bold">{devpulseState.data.community.groups}</Text>
				<Text size="xs" color="muted">active groups</Text>
			</div>
		</Widget>

		<div class="grid-col-span-full">
			<Widget title="Activity Feed" size="lg">
				<CommunityFeedList
					items={communityState.items}
					loading={communityState.loading}
				/>
			</Widget>
		</div>
	</div>
</div>
