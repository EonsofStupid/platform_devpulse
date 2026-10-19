<!--
  @file DevPulse Stats
  @route /devpulse/stats
  @domain devpulse
-->
<script lang="ts">
import { Widget } from "@devpulse/coldlight/blocks/widgets";
import { Text } from "@devpulse/coldlight/components/text";
import { gridLayout, hstack, stack } from "@devpulse/coldlight/utils";
import { devpulseState } from "$lib/domains/app/devpulse/index.js";
</script>

<div class={gridLayout({ columns: "2", gap: "4" })} data-page="devpulse-stats">
	<Widget title="Coding Stats" tabs={[{id: "week", label: "Week"}, {id: "month", label: "Month"}, {id: "year", label: "Year"}]} activeTab="week">
		<div class={stack({ gap: "3" })}>
			<div class={hstack({ justify: "between" })}>
				<Text color="secondary">Projects</Text>
				<Text weight="semibold">{devpulseState.data.user.totalProjects}</Text>
			</div>
			<div class={hstack({ justify: "between" })}>
				<Text color="secondary">Messages</Text>
				<Text weight="semibold">{devpulseState.data.user.totalMessages}</Text>
			</div>
			<div class={hstack({ justify: "between" })}>
				<Text color="secondary">Sessions</Text>
				<Text weight="semibold">{devpulseState.data.user.totalSessions}</Text>
			</div>
		</div>
	</Widget>

	<Widget title="Language Breakdown">
		<div class={stack({ gap: "2" })}>
			<div class={hstack({ justify: "between" })}>
				<Text color="secondary">TypeScript</Text>
				<Text>48%</Text>
			</div>
			<div class={hstack({ justify: "between" })}>
				<Text color="secondary">Rust</Text>
				<Text>32%</Text>
			</div>
			<div class={hstack({ justify: "between" })}>
				<Text color="secondary">CSS</Text>
				<Text>12%</Text>
			</div>
			<div class={hstack({ justify: "between" })}>
				<Text color="secondary">Other</Text>
				<Text>8%</Text>
			</div>
		</div>
	</Widget>
</div>
