<!--
  @file DevPulse Dashboard
  @route /devpulse
  @domain devpulse

  Cyberpunk dashboard with gauges, charts, and glass panels.
  Uses ColdLight components and Widget blocks exclusively.
-->
<script lang="ts">
	import { Stack, HStack, Text, Card } from "$lib/design/index.js";
	import { Widget, RadialGauge, SparkLine } from "$lib/design/blocks/widgets/index.js";
	import { devpulseState } from "$lib/domains/app/devpulse/index.js";

	const langColors: Record<string, string> = {
		TypeScript: "teal",
		Rust: "ember",
		CSS: "purple",
		Python: "cyber",
	};
</script>

<div class="grid grid-cols-12 gap-4" data-page="devpulse-dashboard">
	<!-- Row 1: Gauges + Stats -->
	<div class="col-span-4">
		<Widget title="Maestro Control">
			<div class="flex items-center justify-center py-4">
				<RadialGauge
					value={devpulseState.data.system.maestroLoad.value}
					max={devpulseState.data.system.maestroLoad.max}
					label={devpulseState.data.system.maestroLoad.label}
					unit="%"
					accent="teal"
					size={200}
				/>
			</div>
		</Widget>
	</div>

	<div class="col-span-4">
		<Widget title="System Overview">
			<div class="flex items-center justify-center gap-6 py-2">
				<RadialGauge
					value={devpulseState.data.system.contextLoad.value}
					max={devpulseState.data.system.contextLoad.max}
					label="Context"
					unit="%"
					accent="purple"
					size={130}
					strokeWidth={6}
				/>
				<RadialGauge
					value={devpulseState.data.system.memoryUsage.value}
					max={devpulseState.data.system.memoryUsage.max}
					label="Memory"
					unit="GB"
					accent="cyber"
					size={130}
					strokeWidth={6}
				/>
			</div>
		</Widget>
	</div>

	<div class="col-span-4">
		<Widget title="Developer Stats">
			<Stack gap="3">
				<HStack justify="between" align="baseline">
					<Stack gap="1">
						<Text size="xs" color="muted">Projects</Text>
						<span class="text-xl font-bold tabular-nums" style="font-family: var(--font-display); color: var(--color-teal-400); text-shadow: 0 0 8px oklch(0.55 0.18 180 / 0.4);">{devpulseState.data.user.totalProjects}</span>
					</Stack>
					<Stack gap="1">
						<Text size="xs" color="muted">Commits</Text>
						<span class="text-xl font-bold tabular-nums" style="font-family: var(--font-display); color: var(--color-teal-300); text-shadow: 0 0 8px oklch(0.55 0.18 180 / 0.3);">{devpulseState.data.user.totalCommits}</span>
					</Stack>
					<Stack gap="1">
						<Text size="xs" color="muted">Branches</Text>
						<span class="text-xl font-bold tabular-nums" style="font-family: var(--font-display); color: var(--color-teal-300); text-shadow: 0 0 8px oklch(0.55 0.18 180 / 0.3);">{devpulseState.data.user.activeBranches}</span>
					</Stack>
				</HStack>
				<div class="flex items-center gap-2 rounded-md px-3 py-2 v-s1 border border-border-subtle">
					<span class="inline-block h-2 w-2 rounded-full animate-pulse" style="background: var(--color-teal-400); box-shadow: 0 0 8px var(--color-teal-400);"></span>
					<Text size="sm" weight="semibold">{devpulseState.data.user.streak}d streak</Text>
					<Text size="xs" color="muted">· {devpulseState.data.user.lastActivity}</Text>
				</div>
			</Stack>
		</Widget>
	</div>

	<!-- Row 2: Charts -->
	<div class="col-span-8">
		<Widget
			title="Activity Timeline"
			tabs={[
				{ id: "activity", label: "Activity" },
				{ id: "commits", label: "Commits" },
				{ id: "builds", label: "Builds" },
			]}
			activeTab="activity"
		>
			<Stack gap="3">
				<SparkLine
					data={[...devpulseState.data.system.activityTimeline.data]}
					accent="teal"
					width={600}
					height={100}
					lineWidth={2}
				/>
				<div class="flex gap-4">
					<div class="flex-1">
						<Text size="xs" color="muted" class="mb-1">Commit Velocity</Text>
						<SparkLine
							data={[...devpulseState.data.system.commitHistory.data]}
							accent="purple"
							width={280}
							height={50}
							lineWidth={1.5}
						/>
					</div>
					<div class="flex-1">
						<Text size="xs" color="muted" class="mb-1">Build Health</Text>
						<SparkLine
							data={[...devpulseState.data.system.buildHealth.data]}
							accent="cyber"
							width={280}
							height={50}
							lineWidth={1.5}
						/>
					</div>
				</div>
			</Stack>
		</Widget>
	</div>

	<div class="col-span-4">
		<Widget title="Community">
			<Stack gap="4">
				<div class="flex items-center justify-around">
					<Stack gap="1" align="center">
						<span class="text-3xl font-bold tabular-nums" style="font-family: var(--font-display); color: var(--color-teal-400); text-shadow: 0 0 12px oklch(0.55 0.18 180 / 0.5);">{devpulseState.data.community.friends}</span>
						<Text size="xs" color="muted">Friends</Text>
					</Stack>
					<Stack gap="1" align="center">
						<span class="text-3xl font-bold tabular-nums" style="font-family: var(--font-display); color: var(--color-purple-400); text-shadow: 0 0 12px oklch(0.55 0.18 280 / 0.5);">{devpulseState.data.community.groups}</span>
						<Text size="xs" color="muted">Groups</Text>
					</Stack>
				</div>
				<div class="flex items-center justify-between rounded-md px-3 py-2 v-s2 border border-border-subtle">
					<span class="text-lg font-semibold tabular-nums" style="font-family: var(--font-display); color: var(--color-magenta-400);">{devpulseState.data.community.contributions}</span>
					<Text size="xs" color="muted">contributions this month</Text>
				</div>
			</Stack>
		</Widget>
	</div>

	<!-- Row 3: Recent Projects -->
	<div class="col-span-12">
		<Widget
			title="Recent Projects"
			tabs={[
				{ id: "all", label: "All" },
				{ id: "active", label: "Active" },
				{ id: "archived", label: "Archived" },
			]}
			activeTab="all"
		>
			<div class="grid grid-cols-4 gap-3">
				{#each devpulseState.recentProjects as project (project.id)}
					{@const accentName = langColors[project.language] ?? "teal"}
					<Card variant="outlined" size="sm">
						<Stack gap="2" class="p-1">
							<HStack gap="2" align="center">
								<span
									class="inline-block h-2.5 w-2.5 rounded-full"
									style="background: var(--color-{accentName}-400); box-shadow: 0 0 6px var(--color-{accentName}-400);"
								></span>
								<Text weight="semibold" size="sm">{project.name}</Text>
							</HStack>
							<HStack justify="between">
								<Text size="xs" color="muted">{project.language}</Text>
								<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs v-s1 border border-border-subtle" style="color: var(--text-secondary);">
									{project.branch}
								</span>
							</HStack>
							<Text size="xs" color="muted">{project.lastModified}</Text>
						</Stack>
					</Card>
				{/each}
			</div>
		</Widget>
	</div>
</div>
