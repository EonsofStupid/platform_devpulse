<!--
  @file Maestro Dashboard
  @route /maestro
  @domain maestro
-->
<script lang="ts">
	import { Grid, Stack, HStack, Text } from "$lib/design/components/index.js";
	import { Widget } from "$lib/design/blocks/widgets/index.js";
</script>

<Grid columns="3" gap="4" class="box-lg" data-page="maestro-dashboard">
	<Widget title="AI Orchestrator">
		<Stack gap="2">
			<HStack justify="between">
				<Text color="secondary">Status</Text>
				<Text color="muted">Standby</Text>
			</HStack>
			<HStack justify="between">
				<Text color="secondary">Active Minions</Text>
				<Text>0</Text>
			</HStack>
			<HStack justify="between">
				<Text color="secondary">Queue Depth</Text>
				<Text>0</Text>
			</HStack>
		</Stack>
	</Widget>

	<Widget title="Knowledge Base" tabs={[{id: "rag", label: "RAG"}, {id: "cag", label: "CAG"}, {id: "hyde", label: "HyDE"}]} activeTab="rag">
		<Text as="p" size="sm" color="muted">Knowledge retrieval pipelines will be monitored here.</Text>
	</Widget>

	<Widget title="Inference Cache">
		<Stack gap="2">
			<HStack justify="between">
				<Text color="secondary">KV Cache</Text>
				<Text color="muted">Empty</Text>
			</HStack>
			<HStack justify="between">
				<Text color="secondary">Hit Rate</Text>
				<Text>--</Text>
			</HStack>
		</Stack>
	</Widget>
</Grid>
