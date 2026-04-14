<!--
  @file OverMind Dashboard
  @route /overmind
  @domain overmind
  Experimental hub: Playground, Experiments. Model control is dev-gated under /devtools.
-->
<script lang="ts">
import { Activity, FlaskConical, FlaskRound } from "lucide-svelte";
import { Widget } from "$lib/design/blocks/widgets/index.js";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
</script>

<div class="grid grid-cols-12 gap-4" data-page="overmind-dashboard">
	<!-- Row 1: Prompt Playground (experimental primary) -->
	<div class="col-span-8">
		<Widget
			title="Prompt Playground"
			icon={FlaskConical}
			surface="glass-deep"
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
				surface="glass-deep"
				depth="z2"
				bevel="subtle"
				glow="teal"
				frame="accent-teal"
				radius="lg"
			>
				<div class={stack({ gap: "2" })}>
					<div class={hstack({ justify: "between" })}>
						<Text color="secondary">Engine</Text>
						<Badge variant="positive" size="sm">Online</Badge>
					</div>
					<div class={hstack({ justify: "between" })}>
						<Text color="secondary">Signal Router</Text>
						<Badge variant="positive" size="sm">Active</Badge>
					</div>
					<div class={hstack({ justify: "between" })}>
						<Text color="secondary">Model Loader</Text>
						<Badge variant="positive" size="sm">Ready</Badge>
					</div>
				</div>
			</Widget>

			<Widget
				title="Playground"
				icon={FlaskConical}
				surface="glass-deep"
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
			surface="glass-deep"
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
