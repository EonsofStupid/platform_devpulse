<!--
  @file OverMind Dashboard
  @route /overmind
  @domain overmind
-->
<script lang="ts">
	import { Grid, Stack, HStack, Text } from "$lib/design/index.js";
	import { Widget } from "$lib/design/blocks/widgets/index.js";
</script>

<Grid columns="3" gap="4" class="box-lg" data-page="overmind-dashboard">
	<Widget title="System Status">
		<Stack gap="2">
			<HStack justify="between">
				<Text color="secondary">Engine</Text>
				<Text>Online</Text>
			</HStack>
			<HStack justify="between">
				<Text color="secondary">Signal Router</Text>
				<Text>Active</Text>
			</HStack>
			<HStack justify="between">
				<Text color="secondary">Database</Text>
				<Text color="muted">Not Connected</Text>
			</HStack>
		</Stack>
	</Widget>

	<Widget title="Signal Activity" tabs={[{id: "live", label: "Live"}, {id: "history", label: "History"}]} activeTab="live">
		<Text as="p" size="sm" color="muted">Signal events will stream here when engine is running.</Text>
	</Widget>

	<Widget title="Resources">
		<Stack gap="2">
			<HStack justify="between">
				<Text color="secondary">CPU</Text>
				<Text>--</Text>
			</HStack>
			<HStack justify="between">
				<Text color="secondary">Memory</Text>
				<Text>--</Text>
			</HStack>
			<HStack justify="between">
				<Text color="secondary">Disk</Text>
				<Text>--</Text>
			</HStack>
		</Stack>
	</Widget>
</Grid>
