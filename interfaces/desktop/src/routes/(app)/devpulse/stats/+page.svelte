<!--
  @file DevPulse Stats
  @route /devpulse/stats
  @domain devpulse
-->
<script lang="ts">
	import { Grid, Stack, HStack, Text } from "$lib/design/index.js";
	import { Widget } from "$lib/design/blocks/widgets/index.js";
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
