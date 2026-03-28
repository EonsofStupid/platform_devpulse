<!--
  @file DevPulse Community
  @route /devpulse/community
  @domain devpulse
-->
<script lang="ts">
import { Widget } from "$lib/design/blocks/widgets/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { gridLayout } from "$lib/design/utils/grid-layout/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { devpulseState } from "$lib/domains/app/devpulse/index.js";
</script>

<div class={gridLayout({ columns: "2", gap: "4" })} data-page="devpulse-community">
	<Widget title="Friends" size="md">
		<div class={stack({ gap: "2" })}>
			<Text size="xl" weight="bold">{devpulseState.data.community.friends}</Text>
			<Text size="xs" color="muted">connected developers</Text>
		</div>
	</Widget>

	<Widget title="Groups" size="md">
		<div class={stack({ gap: "2" })}>
			<Text size="xl" weight="bold">{devpulseState.data.community.groups}</Text>
			<Text size="xs" color="muted">active groups</Text>
		</div>
	</Widget>

	<div class="grid-col-span-full">
		<Widget title="Activity Feed" tabs={[{id: "all", label: "All"}, {id: "mentions", label: "Mentions"}]} activeTab="all">
			<Text as="p" size="sm" color="muted">Community activity will appear here when connected.</Text>
		</Widget>
	</div>
</div>
