<!--
  @file DevPulse Dashboard
  @route /devpulse
  @domain devpulse

  Cyberpunk HUD dashboard with gauges, charts, and glass panels.
  ALL containers use ColdLight components with resolveMacro — no box() bypass.
  Each widget uses a DISTINCT preset for visual hierarchy.
  Matches DASHBOARD-REFERENCE-01.
-->
<script lang="ts">
import { Activity, BarChart3, FolderGit2, Gauge, HeartPulse, TrendingUp } from "lucide-svelte";
import { Widget } from "$lib/design/blocks/widgets/index.js";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import Card from "$lib/design/components/card/Card.svelte";
import { RadialGauge } from "$lib/design/components/radial-gauge/index.js";
import { SparkLine } from "$lib/design/components/spark-line/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { devpulseState } from "$lib/domains/app/devpulse/index.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";

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
		<Text size="sm" preset="default">Loading dashboard data...</Text>
	</div>
{:else if devpulseState.error}
	<div class="flex flex-col items-center justify-center gap-2 py-12">
		<Text size="sm" preset="default">Failed to load dashboard</Text>
		<Text size="xs" preset="default">{devpulseState.error}</Text>
		<Button preset="ghost" size="sm" onclick={() => devpulseState.refresh()}>
			Retry
		</Button>
	</div>
{:else}
<div class="grid grid-cols-12 gap-4 auto-rows-min" data-page="devpulse-dashboard">
	<!-- Row 1: Gauges + Stats -->
	<div class="col-span-12 lg:col-span-4">
		<Widget
			title="Clyffy Control"
			icon={Gauge}
			preset="glass-deep"
		>
			<div class="flex items-center justify-center py-4">
				<RadialGauge
					value={devpulseState.data.system.clyffyLoad.value}
					max={devpulseState.data.system.clyffyLoad.max}
					label={devpulseState.data.system.clyffyLoad.label}
					unit="%"
					accent="teal"
					preset="glass"
					size={200}
				/>
			</div>
		</Widget>
	</div>

	<div class="col-span-12 lg:col-span-4">
		<Widget
			title="System Overview"
			icon={Activity}
			preset="glass-minimal"
		>
			<div class="flex items-center justify-center gap-6 py-2">
				<RadialGauge
					value={devpulseState.data.system.contextLoad.value}
					max={devpulseState.data.system.contextLoad.max}
					label="Context"
					unit="%"
					accent="purple"
					preset="glass"
					size={130}
					strokeWidth={6}
				/>
				<RadialGauge
					value={devpulseState.data.system.memoryUsage.value}
					max={devpulseState.data.system.memoryUsage.max}
					label="Memory"
					unit="GB"
					accent="cyber"
					preset="glass"
					size={130}
					strokeWidth={6}
				/>
			</div>
		</Widget>
	</div>

	<div class="col-span-12 lg:col-span-4">
		<Widget
			title="Developer Stats"
			icon={TrendingUp}
			preset="neuro-elevated"
		>
			<div class={stack({ gap: "3" })}>
				<div class={hstack({ justify: "between", align: "baseline" })}>
					<div class={stack({ gap: "1" })}>
						<Text size="xs" preset="default">Projects</Text>
						<Text size="xl" weight="bold" preset="default" class="tabular-nums font-display drop-shadow-[0_0_0.5rem_var(--accent-teal-glow)]">{devpulseState.data.user.totalProjects}</Text>
					</div>
					<div class={stack({ gap: "1" })}>
						<Text size="xs" preset="default">Commits</Text>
						<Text size="xl" weight="bold" preset="default" class="tabular-nums font-display drop-shadow-[0_0_0.5rem_var(--accent-teal-glow)]">{devpulseState.data.user.totalCommits}</Text>
					</div>
					<div class={stack({ gap: "1" })}>
						<Text size="xs" preset="default">Branches</Text>
						<Text size="xl" weight="bold" preset="default" class="tabular-nums font-display drop-shadow-[0_0_0.5rem_var(--accent-teal-glow)]">{devpulseState.data.user.activeBranches}</Text>
					</div>
				</div>
				<Card preset="neuro-deep" class="flex items-center gap-2 px-3 py-2">
					<span class="inline-block h-2 w-2 rounded-full animate-pulse" style="background: var(--accent-teal-main); box-shadow: var(--glow-dot-md);"></span>
					<Text size="sm" weight="semibold" preset="default">{devpulseState.data.user.streak}d streak</Text>
					<Text size="xs" preset="default">{"\u00B7"} {devpulseState.data.user.lastActivity}</Text>
				</Card>
			</div>
		</Widget>
	</div>

	<!-- Row 2: Charts -->
	<div class="col-span-12 lg:col-span-8">
		<Widget
			title="Activity Timeline"
			icon={BarChart3}
			preset="glass-deep"
			tabs={[
				{ id: "activity", label: "Activity" },
				{ id: "commits", label: "Commits" },
				{ id: "builds", label: "Builds" },
			]}
			activeTab="activity"
		>
			<div class={stack({ gap: "3" })}>
				<SparkLine
					data={[...devpulseState.data.system.activityTimeline.data]}
					accent="teal"
					preset="glass"
					width={400}
					height={80}
					lineWidth={2}
					class="w-full"
				/>
				<div class="flex gap-4">
					<div class="flex-1 min-w-0">
						<Text size="xs" preset="default" class="mb-1">Commit Velocity</Text>
						<SparkLine
							data={[...devpulseState.data.system.commitHistory.data]}
							accent="purple"
							preset="glass"
							width={200}
							height={40}
							lineWidth={1.5}
							class="w-full"
						/>
					</div>
					<div class="flex-1 min-w-0">
						<Text size="xs" preset="default" class="mb-1">Build Health</Text>
						<SparkLine
							data={[...devpulseState.data.system.buildHealth.data]}
							accent="cyber"
							preset="glass"
							width={200}
							height={40}
							lineWidth={1.5}
							class="w-full"
						/>
					</div>
				</div>
			</div>
		</Widget>
	</div>

	<div class="col-span-12 lg:col-span-4">
		<Widget
			title="Store Health"
			icon={HeartPulse}
			preset="neuro-deep"
		>
			<div class={stack({ gap: "3" })}>
				{#if platformState.health}
					{#each platformState.health.subsystems as sub}
						<Card preset="neuro-minimal" class="flex items-center justify-between px-3 py-2">
							<div class={stack({ gap: "0" })}>
								<Text size="sm" weight="semibold" preset="default">{sub.name}</Text>
								{#if sub.latency_us != null}
									<Text size="xs" preset="default">{sub.latency_us >= 1000 ? `${Math.round(sub.latency_us / 1000)}ms` : `${sub.latency_us}µs`}</Text>
								{/if}
							</div>
							<Badge
								variant="positive"
								size="sm"
								class="gap-1.5"
							>
								<span
									class="inline-block h-1.5 w-1.5 rounded-full"
									style="background: {healthColors[sub.status] ?? 'var(--text-muted)'}; box-shadow: var(--glow-dot-sm);"
								></span>
								{sub.state ?? sub.status}
							</Badge>
						</Card>
					{/each}
					<div class={cn(hstack({ justify: "between" }), "px-1")}>
						<Text size="xs" preset="default">Uptime</Text>
						<Text size="xs" weight="semibold" preset="default">{platformState.uptimeFormatted}</Text>
					</div>
				{:else}
					<Text size="xs" preset="default">Waiting for health data...</Text>
				{/if}
			</div>
		</Widget>
	</div>

	<!-- Row 3: Recent Projects -->
	<div class="col-span-12">
		<Widget
			title="Recent Projects"
			icon={FolderGit2}
			preset="neuro-minimal"
			tabs={[
				{ id: "all", label: "All" },
				{ id: "active", label: "Active" },
				{ id: "archived", label: "Archived" },
			]}
			activeTab="all"
		>
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
				{#each devpulseState.recentProjects as project (project.id)}
					{@const accentName = langColors[project.language] ?? "teal"}
					<Card preset="neuro-deep" class="p-3">
						<div class={stack({ gap: "2" })}>
							<div class={hstack({ gap: "2", align: "center" })}>
								<span
									class="inline-block h-2.5 w-2.5 rounded-full"
									style="background: var(--accent-{accentName}-main); box-shadow: var(--glow-dot-md);"
								></span>
								<Text weight="semibold" size="sm" preset="default">{project.name}</Text>
							</div>
							<div class={hstack({ justify: "between" })}>
								<Text size="xs" preset="default">{project.language}</Text>
								<Badge variant="neutral" size="sm">
									{project.branch}
								</Badge>
							</div>
							<Text size="xs" preset="default">{project.lastModified}</Text>
						</div>
					</Card>
				{/each}
			</div>
		</Widget>
	</div>
</div>
{/if}
