<!--
  @file DevPulse Dashboard
  @route /devpulse
  @domain devpulse

  Real dashboard using ColdLight components exclusively.
  ZERO inline styles — all layout via Grid/Stack/HStack, all text via Text.
-->
<script lang="ts">
	import { Grid, Stack, HStack, Text, Card } from "$lib/design/components/index.js";
	import { Widget } from "$lib/design/blocks/widgets/index.js";
	import { devpulseState } from "$lib/domains/app/devpulse/index.js";
</script>

<Grid columns="3" gap="4" class="box-lg" data-page="devpulse-dashboard">
	<Widget title="Projects">
		<Stack gap="3">
			<HStack justify="between" align="baseline">
				<Text size="xl" weight="bold">{devpulseState.data.user.totalProjects}</Text>
				<Text size="xs" color="muted">projects</Text>
			</HStack>
			<HStack justify="between" align="baseline">
				<Text size="lg" weight="semibold">{devpulseState.data.user.totalCommits}</Text>
				<Text size="xs" color="muted">commits</Text>
			</HStack>
			<HStack justify="between" align="baseline">
				<Text size="lg" weight="semibold">{devpulseState.data.user.activeBranches}</Text>
				<Text size="xs" color="muted">active branches</Text>
			</HStack>
		</Stack>
	</Widget>

	<Widget title="Activity">
		<Stack gap="3">
			<HStack justify="between" align="baseline">
				<Text size="xl" weight="bold">{devpulseState.data.user.streak}d</Text>
				<Text size="xs" color="muted">streak</Text>
			</HStack>
			<HStack justify="between" align="baseline">
				<Text>{devpulseState.data.user.lastActivity}</Text>
				<Text size="xs" color="muted">last active</Text>
			</HStack>
		</Stack>
	</Widget>

	<Widget title="Community">
		<Stack gap="3">
			<HStack justify="between" align="baseline">
				<Text size="xl" weight="bold">{devpulseState.data.community.friends}</Text>
				<Text size="xs" color="muted">friends</Text>
			</HStack>
			<HStack justify="between" align="baseline">
				<Text size="lg" weight="semibold">{devpulseState.data.community.groups}</Text>
				<Text size="xs" color="muted">groups</Text>
			</HStack>
			<HStack justify="between" align="baseline">
				<Text size="lg" weight="semibold">{devpulseState.data.community.contributions}</Text>
				<Text size="xs" color="muted">contributions</Text>
			</HStack>
		</Stack>
	</Widget>

	<div class="grid-col-span-full">
		<Widget
			title="Recent Projects"
			tabs={[
				{ id: "all", label: "All" },
				{ id: "active", label: "Active" },
				{ id: "archived", label: "Archived" },
			]}
			activeTab="all"
		>
			<Grid columns="4" gap="3">
				{#each devpulseState.recentProjects as project (project.id)}
					<Card variant="outlined" size="sm">
						<Stack gap="2" class="box-sm">
							<Text weight="semibold" size="sm">{project.name}</Text>
							<Text size="xs" color="muted">{project.language} · {project.branch}</Text>
							<Text size="xs" color="muted">{project.lastModified}</Text>
						</Stack>
					</Card>
				{/each}
			</Grid>
		</Widget>
	</div>
</Grid>
