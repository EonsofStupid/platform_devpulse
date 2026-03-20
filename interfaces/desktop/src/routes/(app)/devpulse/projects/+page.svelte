<!--
  @file DevPulse Projects
  @route /devpulse/projects
  @domain devpulse
-->
<script lang="ts">
import { Widget } from "$lib/design/blocks/widgets/index.js";
import * as Card from "$lib/design/components/card/index.js";
import { gridLayout } from "$lib/design/utils/grid-layout/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { devpulseState } from "$lib/domains/app/devpulse/index.js";
</script>

<div class={stack({ gap: "4" })} data-page="devpulse-projects">
	<Widget
		title="All Projects"
		tabs={[
			{ id: "all", label: "All" },
			{ id: "active", label: "Active" },
			{ id: "archived", label: "Archived" },
		]}
		activeTab="all"
	>
		<div class={gridLayout({ columns: "3", gap: "3" })}>
			{#each devpulseState.recentProjects as project (project.id)}
				<Card.Root variant="outlined">
					<Card.Content>
						<div class={stack({ gap: "2" })}>
							<Text weight="semibold">{project.name}</Text>
							<Text size="xs" color="muted">{project.language} · {project.branch}</Text>
							<Text size="xs" color="muted">{project.lastModified}</Text>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</Widget>
</div>
