<!--
  @file OvermindDashboard — Overmind domain dashboard.
  Rendered by (app)/overmind/+page.svelte.
  Experimental hub: Playground, Experiments. Model control is dev-gated under /devtools.
-->
<script lang="ts">
import { Widget } from "@devpulse/coldlight/blocks/widgets";
import { Badge } from "@devpulse/coldlight/components/badge";
import { Card } from "@devpulse/coldlight/components/card";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import { hstack, stack } from "@devpulse/coldlight/utils";
import { Activity, FlaskConical, FlaskRound, Network } from "lucide-svelte";
import { copyState } from "#lib/sys/copy/index.js";
import { hrefOf, routeAt, routeCopy } from "#lib/sys/routing/index.js";
import { platformState } from "#lib/sys/runes/platformState.svelte.js";

const agenthub = routeAt("/overmind/agenthub");
const text = $derived(copyState.catalog?.hubs.dashboard);
const engine = $derived(platformState.connectionStatus);
const modelLoader = $derived(platformState.subsystemStatus("Model Loader"));
</script>

<div class="grid grid-cols-12 gap-4" data-page="overmind-dashboard">
	{#if agenthub}
		<Card as="a" href={hrefOf(agenthub)} variant="deep" class="col-span-12 gap-2 p-5">
			<div class="flex items-center gap-3"><Network size={24} /><Heading level={2} size="lg">{routeCopy(agenthub)?.label ?? "AgentHub"}</Heading></div>
			<Text size="sm">Open your agents, live conversations and session history.</Text>
		</Card>
	{/if}
	<!-- Row 1: Prompt Playground (experimental primary) -->
	<div class="col-span-8">
		<Widget
			title="Prompt Playground"
			icon={FlaskConical}
			surface="glass" variant="deep"
			depth="z2"
			bevel="subtle"
			glow="purple"
			frame="accent-purple"
			radius="lg"
		>
			<Text as="p" size="sm" color="muted">
				Interactive prompt playground. Requires a loaded model.
			</Text>
		</Widget>
	</div>

	<!-- Row 1 sidebar: Quick status -->
	<div class="col-span-4">
		<div class={stack({ gap: "4" })}>
			<Widget
				title="System Status"
				icon={Activity}
				surface="glass" variant="deep"
				depth="z2"
				bevel="subtle"
				glow="teal"
				frame="accent-teal"
				radius="lg"
			>
				<div class={stack({ gap: "2" })}>
					<div class={hstack({ justify: "between" })}>
						<Text color="secondary">Engine</Text>
						<Badge variant={engine === "online" ? "positive" : engine === "offline" ? "negative" : "neutral"} size="sm">{engine}</Badge>
					</div>
					<div class={hstack({ justify: "between" })}>
						<Text color="secondary">Signal Router</Text>
						<Badge variant="neutral" size="sm">{text?.unavailable}</Badge>
					</div>
					<div class={hstack({ justify: "between" })}>
						<Text color="secondary">Model Loader</Text>
						<Badge variant={modelLoader?.state === "ready" ? "positive" : modelLoader?.state === "failed" ? "negative" : "neutral"} size="sm">{modelLoader?.state ?? text?.unavailable}</Badge>
					</div>
				</div>
			</Widget>

			<Widget
				title="Playground"
				icon={FlaskConical}
				surface="glass" variant="deep"
				depth="z1"
				bevel="soft"
				glow="purple"
				frame="soft"
				radius="lg"
			>
				<Text as="p" size="sm" color="muted">
					Interactive prompt playground. Requires a loaded model.
				</Text>
			</Widget>
		</div>
	</div>

	<!-- Row 2: Experiments -->
	<div class="col-span-12">
		<Widget
			title="Experiments"
			icon={FlaskRound}
			surface="glass" variant="deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
			tabs={[
				{ id: "active", label: "Active" },
				{ id: "completed", label: "Completed" },
			]}
			activeTab="active"
		>
			<Text as="p" size="sm" color="muted">
				Track A/B tests, prompt variations, and model comparisons.
			</Text>
		</Widget>
	</div>
</div>
