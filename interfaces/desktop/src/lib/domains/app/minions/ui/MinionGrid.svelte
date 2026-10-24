<!--
  @file MinionGrid — 8 minion cards in grid layout with model context.
  Shows which model each minion is using + escalation state.
-->
<script lang="ts">
import { Text } from "@devpulse/coldlight/components/text";
import MinionCard from "./MinionCard.svelte";

interface MinionState {
	name: string;
	icon: string;
	status: "active" | "idle" | "escalated" | "signal";
	modelLabel: string;
	device: "CPU" | "GPU" | "on-demand";
	escalated?: boolean;
}

// Minion states — wired to real data in Phase 10
const minions: MinionState[] = [
	{ name: "Sentinel", icon: "🛡️", status: "active", modelLabel: "0.6B", device: "CPU" },
	{ name: "Warden", icon: "⚖️", status: "active", modelLabel: "0.6B", device: "CPU" },
	{ name: "Archivist", icon: "📔", status: "idle", modelLabel: "0.6B", device: "CPU" },
	{
		name: "Analyst",
		icon: "🧠",
		status: "escalated",
		modelLabel: "→ Brain",
		device: "GPU",
		escalated: true,
	},
	{ name: "Herald", icon: "📚", status: "idle", modelLabel: "0.6B", device: "CPU" },
	{ name: "Scribe", icon: "✍️", status: "active", modelLabel: "0.6B", device: "CPU" },
	{ name: "Scout", icon: "👁️", status: "signal", modelLabel: "SigLIP2", device: "on-demand" },
	{ name: "Runner", icon: "🔍", status: "idle", modelLabel: "0.6B", device: "CPU" },
];

const hasEscalated = $derived(minions.some((m) => m.escalated));

const clyffyMessage = $derived.by(() => {
	if (hasEscalated) {
		return "Analyst needed deeper reasoning — I escalated it to the main brain. The others are handling their tasks on the fast model.";
	}
	const activeCount = minions.filter((m) => m.status === "active").length;
	if (activeCount > 0) {
		return `${activeCount} minion${activeCount > 1 ? "s" : ""} working. All running on the shared 0.6B model.`;
	}
	return "All minions on standby. They'll activate when there's work to do.";
});
</script>

<div class="flex flex-col gap-3">
	<!-- Grid of 8 minion cards: 4 columns × 2 rows -->
	<div class="grid grid-cols-4 gap-2">
		{#each minions as minion (minion.name)}
			<MinionCard
				name={minion.name}
				icon={minion.icon}
				status={minion.status}
				modelLabel={minion.modelLabel}
				device={minion.device}
				escalated={minion.escalated}
			/>
		{/each}
	</div>

	<!-- Clyffy narration about minion state -->
	<div
		class="narration rounded-lg p-3"
		data-tone={hasEscalated ? "warning" : "info"}
	>
		<Text size="xs" color="muted">{clyffyMessage}</Text>
	</div>
</div>

<style>
	.narration {
		background: var(--surface-raised);
		border: var(--border-width-hairline) solid var(--border-subtle);
	}
</style>
