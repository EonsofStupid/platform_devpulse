<!--
  @file WiredFront Dashboard
  @route /wiredfront
  @domain wiredfront
-->
<script lang="ts">
	import { Grid, Stack, HStack, Text } from "$lib/design/components/index.js";
	import { Widget } from "$lib/design/blocks/widgets/index.js";
</script>

<Grid columns="2" gap="4" class="box-lg" data-page="wiredfront-dashboard">
	<Widget title="Media Library" tabs={[{id: "images", label: "Images"}, {id: "videos", label: "Videos"}, {id: "audio", label: "Audio"}]} activeTab="images">
		<Text as="p" size="sm" color="muted">Media assets will be displayed here.</Text>
	</Widget>

	<Widget title="Uploads">
		<Stack gap="2">
			<HStack justify="between">
				<Text color="secondary">Total Files</Text>
				<Text>0</Text>
			</HStack>
			<HStack justify="between">
				<Text color="secondary">Storage Used</Text>
				<Text>0 MB</Text>
			</HStack>
		</Stack>
	</Widget>
</Grid>
