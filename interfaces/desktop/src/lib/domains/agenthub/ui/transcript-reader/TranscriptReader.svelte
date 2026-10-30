<!-- @component TranscriptReader — safe read-only text, newest page loaded first. -->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import type { TranscriptReaderProps } from "./transcript-reader.types.js";

let {
	session,
	providerName,
	events,
	loading,
	error,
	hasOlder,
	truncatedBefore,
	onOlder,
	onReload,
}: TranscriptReaderProps = $props();
let showActivity = $state(false);
let reader = $state<HTMLDivElement>();
let opened: string | null = null;
const visible = $derived(
	events.filter((event) => showActivity || event.presentation === "conversation"),
);
$effect(() => {
	const key = session ? JSON.stringify([session.providerId, session.locator]) : null;
	if (!reader || loading || error || key === opened) return;
	opened = key;
	// Open at the newest message. Paging and diagnostics must not steal the reading position.
	reader.scrollTop = reader.scrollHeight;
});
</script>

<Card variant="deep" data-ui="agenthub-transcript-reader" class="flex min-h-0 min-w-0 flex-1 flex-col gap-4 p-4" aria-label="Past transcript" aria-busy={loading}>
	{#if session}
		<header class="flex shrink-0 flex-col gap-2">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<Text size="sm" weight="semibold">{providerName}</Text>
				<Badge variant="informative" size="sm">Read only</Badge>
			</div>
			<Heading level={2} size="md" class="break-words">{session.title}</Heading>
			<Text size="xs" class="break-words">{session.workspace || "Workspace not recorded"}</Text>
			<Text size="xs">Recent transcript page · messages stay in conversation order</Text>
			<div class="flex flex-wrap gap-2">
				<Button variant="ghost" size="sm" disabled={loading} onclick={onReload}>Reload transcript</Button>
				<Button variant="ghost" size="sm" aria-pressed={showActivity} onclick={() => { showActivity = !showActivity; }}>Tools and diagnostics</Button>
			</div>
		</header>
		{#if error}<div role="alert"><Text size="sm">{error}</Text></div>{/if}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (The bounded transcript region needs keyboard focus for native arrow/page scrolling.) -->
		<div bind:this={reader} class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto" tabindex="0" role="region" aria-label="Transcript messages">
			{#if hasOlder}<Button variant="secondary" size="sm" class="shrink-0" disabled={loading} onclick={onOlder}>{loading ? "Loading…" : "Show older messages"}</Button>
			{:else if truncatedBefore}<Text size="xs">Earlier content is unavailable in this page.</Text>{/if}
			{#if loading && events.length === 0}<Text size="sm" role="status">Loading transcript…</Text>
			{:else if !error && visible.length === 0}<Text size="sm">No conversation messages on this page. Show tools and diagnostics or load an older page.</Text>{/if}
			{#each visible as event, index (`${event.id}:${index}`)}
				{#if event.presentation === "conversation"}
					<div data-ui="agenthub-transcript-reader" data-slot="message" class="shrink-0">
					<Card variant="minimal" class="gap-2 p-3">
						<Text size="xs" weight="semibold">{event.kind === "user_message" ? "You" : event.kind === "assistant_message" ? providerName : event.kind.replaceAll("_", " ")}</Text>
						<Text as="div" size="sm" class="whitespace-pre-wrap break-words">{event.text}</Text>
					</Card>
					</div>
				{:else}
					<details class="shrink-0 p-2">
						<summary><Text size="xs">{event.kind.replaceAll("_", " ")}</Text></summary>
						<Text as="div" size="xs" class="whitespace-pre-wrap break-words">{event.text || "No additional detail recorded."}</Text>
					</details>
				{/if}
			{/each}
		</div>
	{:else}
		<div class="flex flex-1 flex-col items-center justify-center gap-3 p-6">
			<Heading level={2} size="md">Your sessions, together</Heading>
			<Text size="sm">Choose a session to read its recent messages. Sub-agents stay with their parent.</Text>
			<Text size="xs">Reading history does not start an agent or send a prompt.</Text>
		</div>
	{/if}
</Card>
