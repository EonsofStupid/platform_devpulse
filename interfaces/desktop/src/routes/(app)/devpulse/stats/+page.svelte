<!--
  @file DevPulse Stats
  @route /devpulse/stats
  @domain devpulse
-->
<script lang="ts">
import { Widget } from "$lib/design/blocks/widgets/index.js";
import { gridLayout } from "$lib/design/utils/grid-layout/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { devpulseState } from "$lib/domains/app/devpulse/index.js";
</script>

<div class={gridLayout({ columns: "2", gap: "4" })} data-page="devpulse-stats">
	<Widget title="Coding Stats" tabs={[{id: "week", label: "Week"}, {id: "month", label: "Month"}, {id: "year", label: "Year"}]} activeTab="week">
		<div class={stack({ gap: "3" })}>
			<div class={hstack({ justify: "between" })}>
				<Text color="secondary">Commits</Text>
				<Text weight="semibold">{devpulseState.data.user.totalCommits}</Text>
			</div>
			<div class={hstack({ justify: "between" })}>
				<Text color="secondary">Streak</Text>
				<Text weight="semibold">{devpulseState.data.user.streak} days</Text>
			</div>
			<div class={hstack({ justify: "between" })}>
				<Text color="secondary">Branches</Text>
				<Text weight="semibold">{devpulseState.data.user.activeBranches}</Text>
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
