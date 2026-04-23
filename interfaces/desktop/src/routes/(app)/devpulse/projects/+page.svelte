<!--
  @file DevPulse Projects
  @route /devpulse/projects
  @domain devpulse

  Projects route — one active project at a time, with reference
  directories linked to it. Reads from `projectsState` (libSQL SSOT
  via tauri-specta bindings), not the legacy mock `devpulseState`.
-->
<script lang="ts">
import { Widget } from "$lib/design/blocks/widgets/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { gridLayout } from "$lib/design/utils/grid-layout/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import {
	ProjectReferences,
	ProjectSwitcher,
	projectsState,
} from "$lib/domains/app/projects/index.js";

$effect(() => {
	void projectsState.refresh("projects-route-mount");
});
</script>

<div class={stack({ gap: "4" })} data-page="devpulse-projects">
	<Widget title="Active Project">
		<div class={stack({ gap: "3" })}>
			<ProjectSwitcher />
			{#if projectsState.activeProject}
				<div>
					<Text weight="semibold">{projectsState.activeProject.name}</Text>
					<Text size="xs">{projectsState.activeProject.rootPath}</Text>
					{#if projectsState.activeProject.description}
						<Text size="sm">{projectsState.activeProject.description}</Text>
					{/if}
				</div>
			{:else}
				<Text size="sm">
					No active project yet. Pick one above or create a new one from the
					switcher.
				</Text>
			{/if}
		</div>
	</Widget>

	<Widget title="Reference Directories">
		<ProjectReferences />
	</Widget>

	{#if projectsState.projects.length > 0}
		<Widget title="All Projects">
			<div class={gridLayout({ columns: "3", gap: "3" })}>
				{#each projectsState.projects as project (project.id)}
					<Card preset="default">
						<div class={stack({ gap: "2" })}>
							<Text weight="semibold">{project.name}</Text>
							<Text size="xs">{project.rootPath}</Text>
							<Text size="xs">{project.projectType}</Text>
						</div>
					</Card>
				{/each}
			</div>
		</Widget>
	{/if}
</div>
