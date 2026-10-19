<!--
  @file src/lib/layouts/app/SubsystemBadge.svelte
  @module @devpulse/layouts/app/SubsystemBadge
  @layer lib

  Single subsystem chip rendered inside StatusBar. Wraps a ColdLight
  Badge in a ColdLight Tooltip. The tooltip surfaces:
    - Friendly (prod) label + category from the terminology SSOT.
    - Technical (dev) label — e.g. "Turso", "SurrealDB", vector store.
    - State + latency.
    - Live Clyffy narration line when Clyffy is active.

  Runes-only. No $state; all derived. Tooltip open state is owned by
  the tooltip hook (ref-counted, ARIA-correct).
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Text } from "@devpulse/coldlight/components/text";
import { Tooltip, TooltipContent, TooltipTrigger } from "@devpulse/coldlight/components/tooltip";
import { hstack, stack } from "@devpulse/coldlight/utils";
import { clyffyStatus } from "$lib/domains/clyffy/index.js";
import { DEV_MODE, devLabel, TERMS } from "$lib/sys/generated/terminology.js";
import { getIcon } from "$lib/sys/generated/terminology-icons.js";
import type { SubsystemInfo } from "$lib/sys/runes/platformState.svelte.js";

interface Props {
	subsystem: SubsystemInfo;
	/** Group the subsystem belongs to — drives Clyffy relevance heuristics. */
	groupKind?: "stores" | "graph" | "ai" | "system";
}

let { subsystem, groupKind = "system" }: Props = $props();

const term = $derived(TERMS[subsystem.name]);
const Icon = $derived(getIcon(subsystem.name));

const variant = $derived(
	subsystem.state === "ready" ? "positive" : subsystem.state === "failed" ? "negative" : "neutral",
);

const triggerLabel = $derived(DEV_MODE ? devLabel(subsystem.name) : (term?.prod ?? subsystem.name));

const latencyText = $derived(
	subsystem.latencyMs === null
		? null
		: subsystem.latencyMs >= 1000
			? `${Math.round(subsystem.latencyMs / 1000)}ms`
			: `${subsystem.latencyMs}ms`,
);

/**
 * Clyffy narration is shown when:
 *   - AI group: anytime Clyffy has an activity (loading/swapping/thinking).
 *   - Any group: when Clyffy is `alert` (something failed — context helps).
 *   - System group during `booting` phases (future — currently no mood).
 */
const clyffyLine = $derived.by<string | null>(() => {
	if (!clyffyStatus.activity.text) return null;
	if (clyffyStatus.mood === "alert") return clyffyStatus.activity.text;
	if (groupKind === "ai" && clyffyStatus.mood !== "idle" && clyffyStatus.mood !== "unknown") {
		return clyffyStatus.activity.text;
	}
	return null;
});
</script>

<Tooltip openDelay={300} closeDelay={150}>
	<TooltipTrigger>
		<Badge {variant} size="sm" class="gap-1">
			<span
				class="status-dot h-1.5 w-1.5 rounded-full"
				data-subsystem-state={subsystem.state}
				aria-hidden="true"
			></span>
			{#if Icon}
				{@const IconComponent = Icon}
				<IconComponent size={12} class="shrink-0" />
			{/if}
			<Text size="xs" preset="default">{triggerLabel}</Text>
			{#if latencyText}
				<Text size="xs" preset="default">{latencyText}</Text>
			{/if}
		</Badge>
	</TooltipTrigger>

	<TooltipContent preset="glass" class="max-w-xs">
		<div class={stack({ gap: "2" })}>
			<div class={hstack({ gap: "2", align: "baseline", justify: "between" })}>
				<Text size="sm" weight="semibold" preset="default">
					{term?.prod ?? subsystem.name}
				</Text>
				{#if term}
					<Text
						size="xs"
						preset="default"
						class="uppercase tracking-wider opacity-60 font-mono"
					>
						{term.category}
					</Text>
				{/if}
			</div>

			{#if term && term.dev !== term.prod}
				<Text size="xs" preset="default" class="font-mono opacity-75">
					{term.dev}
				</Text>
			{/if}

			<div class={hstack({ gap: "2", align: "center" })}>
				<span
					class="status-dot h-1.5 w-1.5 rounded-full"
					data-subsystem-state={subsystem.state}
					aria-hidden="true"
				></span>
				<Text size="xs" preset="default">State: {subsystem.state}</Text>
				{#if latencyText}
					<Text size="xs" preset="default" class="opacity-70">· {latencyText}</Text>
				{/if}
			</div>

			{#if clyffyLine}
				<div class="clyffy-line">
					<Text size="xs" preset="default" class="opacity-90">
						Clyffy: {clyffyLine}
					</Text>
				</div>
			{/if}
		</div>
	</TooltipContent>
</Tooltip>

<style>
	.status-dot {
		box-shadow: var(--glow-dot-sm);
	}
	.status-dot[data-subsystem-state="loading"] {
		background-color: var(--color-purple-400);
		animation: pulse 1s ease-in-out infinite;
	}
	.status-dot[data-subsystem-state="ready"] {
		background-color: var(--color-teal-400);
	}
	.status-dot[data-subsystem-state="failed"] {
		background-color: var(--signal-error);
	}
	.status-dot[data-subsystem-state="pending"] {
		background-color: var(--text-muted);
	}
	.clyffy-line {
		border-top: 0.0625rem solid var(--border-soft);
		padding-top: 0.375rem;
		margin-top: 0.125rem;
	}
	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.4; }
	}
</style>
