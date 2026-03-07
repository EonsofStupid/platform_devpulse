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
	import { platformState } from "$lib/sys/runes/platformState.svelte.js";

	const langColors: Record<string, string> = {
		TypeScript: "teal",
		Rust: "ember",
		CSS: "purple",
		Python: "cyber",
	};

	const healthColors: Record<string, string> = {
		Healthy: "var(--color-teal-400)",
		Degraded: "var(--color-ember-400)",
		Down: "var(--color-ember-500)",
		Unknown: "var(--color-neutral-400)",
	};
</script>

{#if devpulseState.loading}
	<div class="flex items-center justify-center py-12">
		<Text size="sm" color="muted">Loading dashboard data...</Text>
	</div>
{:else if devpulseState.error}
	<div class="flex flex-col items-center justify-center gap-2 py-12">
		<Text size="sm" color="muted">Failed to load dashboard</Text>
		<Text size="xs" color="muted">{devpulseState.error}</Text>
		<button class="mt-2 rounded px-3 py-1 text-xs border border-border-subtle text-text-secondary hover:bg-surface-elevated" onclick={() => devpulseState.refresh()}>
			Retry
		</button>
	</div>
{:else}
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
						<span class="text-xl font-bold tabular-nums" style="font-family: var(--font-display); color: var(--color-teal-400); text-shadow: var(--text-glow-sm) var(--accent-teal-glow);">{devpulseState.data.user.totalProjects}</span>
					</Stack>
					<Stack gap="1">
						<Text size="xs" color="muted">Commits</Text>
						<span class="text-xl font-bold tabular-nums" style="font-family: var(--font-display); color: var(--color-teal-300); text-shadow: var(--text-glow-sm) var(--accent-teal-glow);">{devpulseState.data.user.totalCommits}</span>
					</Stack>
					<Stack gap="1">
						<Text size="xs" color="muted">Branches</Text>
						<span class="text-xl font-bold tabular-nums" style="font-family: var(--font-display); color: var(--color-teal-300); text-shadow: var(--text-glow-sm) var(--accent-teal-glow);">{devpulseState.data.user.activeBranches}</span>
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
		<Widget title="Store Health">
			<Stack gap="3">
				{#if platformState.health}
					{#each platformState.health.subsystems as sub}
						<HStack justify="between" align="center" class="rounded-md px-3 py-2 v-s1 border border-border-subtle">
							<Stack gap="0">
								<Text size="sm" weight="semibold">{sub.name}</Text>
								{#if sub.latency_ms != null}
									<Text size="xs" color="muted">{sub.latency_ms}ms</Text>
								{/if}
							</Stack>
							<span
								class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
								style="color: {healthColors[sub.status] ?? 'var(--text-muted)'};"
							>
								<span
									class="inline-block h-1.5 w-1.5 rounded-full"
									style="background: {healthColors[sub.status] ?? 'var(--text-muted)'};"
								></span>
								{sub.status}
							</span>
						</HStack>
					{/each}
					<HStack justify="between" class="px-1">
						<Text size="xs" color="muted">Uptime</Text>
						<Text size="xs" weight="semibold">{platformState.uptimeFormatted}</Text>
					</HStack>
				{:else}
					<Text size="xs" color="muted">Waiting for health data...</Text>
				{/if}
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
{/if}
