<!--
  @file DevPulse Stats
  @route /devpulse/stats
  @domain devpulse
-->
<script lang="ts">
import { Widget } from "$lib/design/blocks/widgets/index.js";
import { Grid } from "$lib/design/components/grid/index.js";
import { HStack } from "$lib/design/components/hstack/index.js";
import { Stack } from "$lib/design/components/stack/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { devpulseState } from "$lib/domains/app/devpulse/index.js";
</script>

<Grid columns="2" gap="4" class="box-lg" data-page="devpulse-stats">
	<Widget title="Coding Stats" tabs={[{id: "week", label: "Week"}, {id: "month", label: "Month"}, {id: "year", label: "Year"}]} activeTab="week">
		<Stack gap="3">
			<HStack justify="between">
				<Text color="secondary">Commits</Text>
				<Text weight="semibold">{devpulseState.data.user.totalCommits}</Text>
			</HStack>
			<HStack justify="between">
				<Text color="secondary">Streak</Text>
				<Text weight="semibold">{devpulseState.data.user.streak} days</Text>
			</HStack>
			<HStack justify="between">
				<Text color="secondary">Branches</Text>
				<Text weight="semibold">{devpulseState.data.user.activeBranches}</Text>
			</HStack>
		</Stack>
	</Widget>

	<Widget title="Language Breakdown">
		<Stack gap="2">
			<HStack justify="between">
				<Text color="secondary">TypeScript</Text>
				<Text>48%</Text>
			</HStack>
			<HStack justify="between">
				<Text color="secondary">Rust</Text>
				<Text>32%</Text>
			</HStack>
			<HStack justify="between">
				<Text color="secondary">CSS</Text>
				<Text>12%</Text>
			</HStack>
			<HStack justify="between">
				<Text color="secondary">Other</Text>
				<Text>8%</Text>
			</HStack>
		</Stack>
	</Widget>
</Grid>
