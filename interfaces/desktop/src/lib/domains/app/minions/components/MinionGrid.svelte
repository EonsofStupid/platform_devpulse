<!--
  @file MinionGrid — 8 minion cards in grid layout with model context.
  Shows which model each minion is using + escalation state.
-->
<script lang="ts">
import ClyffyNarration from "$lib/domains/app/models/components/ClyffyNarration.svelte";
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
	{ name: "GUARDIAN", icon: "🛡️", status: "active", modelLabel: "0.6B", device: "CPU" },
	{ name: "ENFORCER", icon: "⚖️", status: "active", modelLabel: "0.6B", device: "CPU" },
	{ name: "DIARY", icon: "📔", status: "idle", modelLabel: "0.6B", device: "CPU" },
	{
		name: "PSYCH",
		icon: "🧠",
		status: "escalated",
		modelLabel: "→ Brain",
		device: "GPU",
		escalated: true,
	},
	{ name: "TEACHER", icon: "📚", status: "idle", modelLabel: "0.6B", device: "CPU" },
	{ name: "SCRIBE", icon: "✍️", status: "active", modelLabel: "0.6B", device: "CPU" },
	{ name: "VISION", icon: "👁️", status: "signal", modelLabel: "SigLIP2", device: "on-demand" },
	{ name: "RESEARCHER", icon: "🔍", status: "idle", modelLabel: "0.6B", device: "CPU" },
];

const hasEscalated = $derived(minions.some((m) => m.escalated));

const clyffyMessage = $derived.by(() => {
	if (hasEscalated) {
		return "PSYCH needed deeper analysis — I escalated it to the main brain. The others are handling their tasks on the fast model.";
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
	<ClyffyNarration
		message={clyffyMessage}
		type={hasEscalated ? "warning" : "info"}
	/>
</div>
