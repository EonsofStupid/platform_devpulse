<!--
  @file DevPulse Projects
  @route /devpulse/projects
  @domain devpulse
-->
<script lang="ts">
import { Widget } from "$lib/design/blocks/widgets/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { Grid } from "$lib/design/components/grid/index.js";
import { Stack } from "$lib/design/components/stack/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { devpulseState } from "$lib/domains/app/devpulse/index.js";
</script>

<Stack gap="4" class="box-lg" data-page="devpulse-projects">
	<Widget
		title="All Projects"
		tabs={[
			{ id: "all", label: "All" },
			{ id: "active", label: "Active" },
			{ id: "archived", label: "Archived" },
		]}
		activeTab="all"
	>
		<Grid columns="3" gap="3">
			{#each devpulseState.recentProjects as project (project.id)}
				<Card variant="outlined" size="sm">
					<Stack gap="2" class="box-md">
						<Text weight="semibold">{project.name}</Text>
						<Text size="xs" color="muted">{project.language} · {project.branch}</Text>
						<Text size="xs" color="muted">{project.lastModified}</Text>
					</Stack>
				</Card>
			{/each}
		</Grid>
	</Widget>
</Stack>
