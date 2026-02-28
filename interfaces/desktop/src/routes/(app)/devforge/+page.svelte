<!--
  @file DevForge Dashboard
  @route /devforge
  @domain devforge
-->
<script lang="ts">
	import { Grid, Stack, HStack, Text } from "$lib/design/components/index.js";
	import { Widget } from "$lib/design/blocks/widgets/index.js";
</script>

<Grid columns="2" gap="4" class="box-lg" data-page="devforge-dashboard">
	<Widget title="Build Pipeline" tabs={[{id: "active", label: "Active"}, {id: "history", label: "History"}]} activeTab="active">
		<Text as="p" size="sm" color="muted">Build jobs will appear here when CI/CD is configured.</Text>
	</Widget>

	<Widget title="Environments">
		<Stack gap="2">
			<HStack justify="between">
				<Text color="secondary">Development</Text>
				<Text>Local</Text>
			</HStack>
			<HStack justify="between">
				<Text color="secondary">Staging</Text>
				<Text color="muted">Not Configured</Text>
			</HStack>
			<HStack justify="between">
				<Text color="secondary">Production</Text>
				<Text color="muted">Not Configured</Text>
			</HStack>
		</Stack>
	</Widget>
</Grid>
