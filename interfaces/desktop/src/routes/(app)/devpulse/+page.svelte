<!--
  @file DevPulse Dashboard
  @route /devpulse
  @domain devpulse

  Cyberpunk HUD dashboard with gauges, charts, and glass panels.
  Every Widget receives visual axis props that flow through
  useColdLight() → resolveVisual() → 8-axis v-encoding classes.
  Matches DASHBOARD-REFERENCE-01.
-->
<script lang="ts">
	import { Stack } from "$lib/design/components/stack/index.js";
	import { HStack } from "$lib/design/components/hstack/index.js";
	import { Text } from "$lib/design/components/text/index.js";
	import { Box } from "$lib/design/components/box/index.js";
	import { Widget, RadialGauge, SparkLine } from "$lib/design/blocks/widgets/index.js";
	import { devpulseState } from "$lib/domains/app/devpulse/index.js";
	import { platformState } from "$lib/sys/runes/platformState.svelte.js";
	import {
		Gauge,
		Activity,
		TrendingUp,
		BarChart3,
		HeartPulse,
		FolderGit2,
	} from "lucide-svelte";

	const langColors: Record<string, string> = {
		TypeScript: "teal",
		Rust: "ember",
		CSS: "purple",
		Python: "cyber",
	};

	const healthColors: Record<string, string> = {
		Healthy: "var(--accent-teal-main)",
		Degraded: "var(--accent-ember-main)",
		Down: "var(--accent-ember-main)",
		Unknown: "var(--text-muted)",
	};

	// Fetch dashboard data only after platform boot completes
	$effect(() => {
		if (platformState.isReady && devpulseState.loading) {
			devpulseState.refresh();
		}
	});
</script>

{#if devpulseState.loading}
	<div class="flex items-center justify-center py-12">
		<Text size="sm" color="muted">Loading dashboard data...</Text>
	</div>
{:else if devpulseState.error}
	<div class="flex flex-col items-center justify-center gap-2 py-12">
		<Text size="sm" color="muted">Failed to load dashboard</Text>
		<Text size="xs" color="muted">{devpulseState.error}</Text>
		<button class="mt-2 rounded px-3 py-1 text-xs border border-border-soft text-text-secondary hover:text-text-link transition-colors" onclick={() => devpulseState.refresh()}>
			Retry
		</button>
	</div>
{:else}
<div class="grid grid-cols-12 gap-4" data-page="devpulse-dashboard">
	<!-- Row 1: Gauges + Stats -->
	<div class="col-span-4">
		<Widget
			title="Maestro Control"
			icon={Gauge}
			preset="widget-gauge"
			surface="glass-deep"
			depth="z2"
			bevel="soft"
			glow="teal"
			frame="accent-teal"
			radius="lg"
		>
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
		<Widget
			title="System Overview"
			icon={Activity}
			preset="widget-stat"
			surface="glass-deep"
			depth="z2"
			bevel="subtle"
			glow="purple"
			frame="soft"
			radius="lg"
		>
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
		<Widget
			title="Developer Stats"
			icon={TrendingUp}
			preset="widget-stat"
			surface="glass-deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
		>
			<Stack gap="3">
				<HStack justify="between" align="baseline">
					<Stack gap="1">
						<Text size="xs" color="muted">Projects</Text>
						<span class="text-xl font-bold tabular-nums font-display text-text-link drop-shadow-[0_0_8px_var(--accent-teal-glow)]">{devpulseState.data.user.totalProjects}</span>
					</Stack>
					<Stack gap="1">
						<Text size="xs" color="muted">Commits</Text>
						<span class="text-xl font-bold tabular-nums font-display text-text-link drop-shadow-[0_0_8px_var(--accent-teal-glow)]">{devpulseState.data.user.totalCommits}</span>
					</Stack>
					<Stack gap="1">
						<Text size="xs" color="muted">Branches</Text>
						<span class="text-xl font-bold tabular-nums font-display text-text-link drop-shadow-[0_0_8px_var(--accent-teal-glow)]">{devpulseState.data.user.activeBranches}</span>
					</Stack>
				</HStack>
				<Box
					surface="glass-void"
					bevel="subtle"
					frame="soft"
					radius="md"
					class="flex items-center gap-2 px-3 py-2"
				>
					<span class="inline-block h-2 w-2 rounded-full animate-pulse bg-teal-400 shadow-[0_0_8px_var(--accent-teal-glow)]"></span>
					<Text size="sm" weight="semibold">{devpulseState.data.user.streak}d streak</Text>
					<Text size="xs" color="muted">· {devpulseState.data.user.lastActivity}</Text>
				</Box>
			</Stack>
		</Widget>
	</div>

	<!-- Row 2: Charts -->
	<div class="col-span-8">
		<Widget
			title="Activity Timeline"
			icon={BarChart3}
			preset="widget-chart"
			surface="glass-deep"
			depth="z2"
			bevel="soft"
			glow="teal"
			frame="accent-teal"
			radius="lg"
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
		<Widget
			title="Store Health"
			icon={HeartPulse}
			preset="widget-stat"
			surface="glass-deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
		>
			<Stack gap="3">
				{#if platformState.health}
					{#each platformState.health.subsystems as sub}
						<Box
							surface="glass-void"
							bevel="subtle"
							frame="soft"
							radius="md"
							class="flex items-center justify-between px-3 py-2"
						>
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
									style="background: {healthColors[sub.status] ?? 'var(--text-muted)'}; box-shadow: 0 0 6px {healthColors[sub.status] ?? 'transparent'};"
								></span>
								{sub.status}
							</span>
						</Box>
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
			icon={FolderGit2}
			preset="widget-table"
			surface="glass-deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
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
					<Box
						surface="glass-void"
						bevel="subtle"
						frame="soft"
						radius="md"
						class="p-3"
					>
						<Stack gap="2">
							<HStack gap="2" align="center">
								<span
									class="inline-block h-2.5 w-2.5 rounded-full"
									style="background: var(--accent-{accentName}-main); box-shadow: 0 0 8px var(--accent-{accentName}-glow);"
								></span>
								<Text weight="semibold" size="sm">{project.name}</Text>
							</HStack>
							<HStack justify="between">
								<Text size="xs" color="muted">{project.language}</Text>
								<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs border border-border-subtle text-text-secondary">
									{project.branch}
								</span>
							</HStack>
							<Text size="xs" color="muted">{project.lastModified}</Text>
						</Stack>
					</Box>
				{/each}
			</div>
		</Widget>
	</div>
</div>
{/if}
