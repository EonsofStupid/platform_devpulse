<!-- @component HistoryRow — one artifact, never inferred live from file activity. -->
<script lang="ts">
import { Card } from "@devpulse/coldlight/components/card";
import { Text } from "@devpulse/coldlight/components/text";
import type { HistoryRowProps } from "./history-row.types.js";

let { session, providerName, selected, onSelect }: HistoryRowProps = $props();
const kind = $derived(
	session.kind === "subAgent"
		? "Sub-agent"
		: session.kind === "userStarted"
			? "Session"
			: "Unclassified session",
);
const activity = $derived(
	session.modifiedAt > 0 ? new Date(session.modifiedAt).toLocaleString() : "Unknown",
);
</script>

<Card as="button" variant="minimal" data-ui="agenthub-history-row"
	data-selected={selected || undefined} aria-current={selected ? "true" : undefined}
	class="w-full gap-1 p-3 text-left" onclick={onSelect}>
	<Text size="xs" data-ui="agenthub-history-row" data-slot="metadata">{providerName} · {kind}</Text>
	<Text size="sm" weight="semibold" class="line-clamp-2 break-words">{session.title}</Text>
	<Text size="xs" class="truncate" title={session.workspace}>{session.workspace || "Workspace not recorded"}</Text>
	<Text size="xs" data-ui="agenthub-history-row" data-slot="metadata">Last file activity: {activity}</Text>
	{#if session.kind === "subAgent" && session.parentResolution !== "resolved"}
		<Text size="xs">Parent {session.parentResolution === "missing" ? "not found" : session.parentResolution}</Text>
	{/if}
</Card>
