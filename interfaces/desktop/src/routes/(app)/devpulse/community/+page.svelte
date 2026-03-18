<!--
  @file DevPulse Community
  @route /devpulse/community
  @domain devpulse
-->
<script lang="ts">
import { Widget } from "$lib/design/blocks/widgets/index.js";
import { Grid } from "$lib/design/components/grid/index.js";
import { Stack } from "$lib/design/components/stack/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { devpulseState } from "$lib/domains/app/devpulse/index.js";
</script>

<Grid columns="2" gap="4" class="box-lg" data-page="devpulse-community">
	<Widget title="Friends" size="md">
		<Stack gap="2">
			<Text size="xl" weight="bold">{devpulseState.data.community.friends}</Text>
			<Text size="xs" color="muted">connected developers</Text>
		</Stack>
	</Widget>

	<Widget title="Groups" size="md">
		<Stack gap="2">
			<Text size="xl" weight="bold">{devpulseState.data.community.groups}</Text>
			<Text size="xs" color="muted">active groups</Text>
		</Stack>
	</Widget>

	<div class="grid-col-span-full">
		<Widget title="Activity Feed" tabs={[{id: "all", label: "All"}, {id: "mentions", label: "Mentions"}]} activeTab="all">
			<Text as="p" size="sm" color="muted">Community activity will appear here when connected.</Text>
		</Widget>
	</div>
</Grid>
