<!--
  @file DevPulseDashboard — DevPulse domain dashboard.
  Rendered by (app)/devpulse/+page.svelte.
  Cyberpunk HUD dashboard with gauges, charts, and glass panels.
  Matches DASHBOARD-REFERENCE-01.
-->
<script lang="ts">
import { Widget } from "@devpulse/coldlight/blocks/widgets";
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { DynamicBackground } from "@devpulse/coldlight/components/dynamic-background";
import { RadialGauge } from "@devpulse/coldlight/components/radial-gauge";
import { SparkLine } from "@devpulse/coldlight/components/spark-line";
import { Text } from "@devpulse/coldlight/components/text";
import { cn, hstack, stack } from "@devpulse/coldlight/utils";
import { Activity, BarChart3, FolderGit2, Gauge, HeartPulse, TrendingUp } from "lucide-svelte";
import { devpulseState } from "$lib/domains/app/devpulse/index.js";
import { GpuUtilGauge, hardwareState, VramGauge } from "$lib/domains/app/models/index.js";
import { groupHealthSubsystems } from "$lib/layouts/app/StatusBar.types.js";
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

const healthGroups = $derived(
	platformState.health ? groupHealthSubsystems(platformState.health.subsystems) : [],
);

// Subscribe to live hardware telemetry (CPU / RAM / VRAM / GPU util / temp).
// Ref-counted: attaches on mount, detaches on unmount, shared with
// other active subscribers (StatusBar, ModelLoaderPanel, wizard).
$effect(() => hardwareState.subscribe("devpulse-dashboard"));

const MB_PER_GB = 1024;
const ramUsedGb = $derived(
	hardwareState.ramUsedMb === null ? 0 : Number((hardwareState.ramUsedMb / MB_PER_GB).toFixed(1)),
);
const ramTotalGb = $derived(
	hardwareState.ramTotalMb === null ? 0 : Number((hardwareState.ramTotalMb / MB_PER_GB).toFixed(1)),
);

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
		<Button variant="ghost" size="sm" onclick={() => devpulseState.refresh()}>
			Retry
		</Button>
	</div>
{:else}
<div class="relative" data-page="devpulse-dashboard">
	<!-- Per-domain animated backdrop — teal radial + cyan accent + grid
	     pattern + slow breathe/drift. Sits behind the dashboard grid;
	     the shell-wide cosmic layer in Frame.svelte stays as the base. -->
	<DynamicBackground variant="devpulse" animated />

	<div class="relative grid grid-cols-12 gap-4 auto-rows-min">
	<!-- Row 1: Gauges + Stats -->
	<div class="col-span-12 lg:col-span-4">
		<Widget
			title="Clyffy Control"
			icon={Gauge}
			surface="glass" variant="deep"
		>
			<div class="flex items-center justify-center py-4">
				<RadialGauge
					value={Math.round(hardwareState.cpuUsagePercent ?? 0)}
					max={100}
					label="CPU"
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
			surface="glass" variant="minimal"
		>
			<div class="flex items-center justify-center gap-6 py-2">
				<RadialGauge
					value={ramUsedGb}
					max={ramTotalGb}
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
			surface="neuro" variant="elevated"
		>
			<div class={stack({ gap: "3" })}>
				<div class={hstack({ justify: "between", align: "baseline" })}>
					<div class={stack({ gap: "1" })}>
						<Text size="xs" preset="default">Projects</Text>
						<Text size="xl" weight="bold" preset="default" class="tabular-nums font-display drop-shadow-[0_0_0.5rem_var(--accent-teal-glow)]">{devpulseState.data.user.totalProjects}</Text>
					</div>
					<div class={stack({ gap: "1" })}>
						<Text size="xs" preset="default">Messages</Text>
						<Text size="xl" weight="bold" preset="default" class="tabular-nums font-display drop-shadow-[0_0_0.5rem_var(--accent-teal-glow)]">{devpulseState.data.user.totalMessages}</Text>
					</div>
					<div class={stack({ gap: "1" })}>
						<Text size="xs" preset="default">Sessions</Text>
						<Text size="xl" weight="bold" preset="default" class="tabular-nums font-display drop-shadow-[0_0_0.5rem_var(--accent-teal-glow)]">{devpulseState.data.user.totalSessions}</Text>
					</div>
				</div>
				<Card surface="neuro" variant="deep" class="flex items-center gap-2 px-3 py-2">
					<span class="inline-block h-2 w-2 rounded-full animate-pulse" style="background: var(--accent-teal-main); box-shadow: var(--glow-dot-md);"></span>
					<Text size="sm" weight="semibold" preset="default">Up {devpulseState.data.user.uptime}</Text>
				</Card>
			</div>
		</Widget>
	</div>

	<!-- Row 1.5: AI Model Gauges -->
	<div class="col-span-12">
		<Widget
			title="AI Models"
			icon={Gauge}
			surface="glass" variant="minimal"
		>
			<div class="flex items-center justify-center gap-8 py-2">
				<VramGauge
					usedMb={hardwareState.vramUsedMb}
					totalMb={hardwareState.vramTotalMb}
					hasGpu={hardwareState.hasGpu}
					gpuError={hardwareState.gpuError}
					label={hardwareState.hasGpu ? (hardwareState.gpuName ?? undefined) : "CPU Mode"}
					size={130}
				/>
				<GpuUtilGauge
					utilPercent={hardwareState.gpuUtilPercent}
					tempC={hardwareState.gpuTempC}
					label="GPU Load"
					size={130}
				/>
			</div>
		</Widget>
	</div>

	<!-- Row 2: Charts -->
	<div class="col-span-12 lg:col-span-8">
		<Widget
			title="Activity Timeline"
			icon={BarChart3}
			surface="glass" variant="deep"
		>
			<div class={stack({ gap: "3" })}>
				<SparkLine
					data={[...devpulseState.data.history.activityTimeline.data]}
					accent="teal"
					preset="glass"
					width={400}
					height={80}
					lineWidth={2}
					class="w-full"
				/>
				<div class="flex gap-4">
					<div class="flex-1 min-w-0">
						<Text size="xs" preset="default" class="mb-1">{devpulseState.data.history.messageHistory.label}</Text>
						<SparkLine
							data={[...devpulseState.data.history.messageHistory.data]}
							accent="purple"
							preset="glass"
							width={200}
							height={40}
							lineWidth={1.5}
							class="w-full"
						/>
					</div>
					<div class="flex-1 min-w-0">
						<Text size="xs" preset="default" class="mb-1">{devpulseState.data.history.latencyHistory.label}</Text>
						<SparkLine
							data={[...devpulseState.data.history.latencyHistory.data]}
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
			surface="neuro" variant="deep"
		>
			<div class={stack({ gap: "3" })}>
				{#if platformState.health && healthGroups.length > 0}
					{#each healthGroups as group}
						<div class={stack({ gap: "1" })}>
							<Text size="xs" weight="semibold" preset="default" class="uppercase tracking-wider opacity-60 px-1">{group.label}</Text>
							{#each group.subs as sub}
								<Card surface="neuro" variant="minimal" class="flex items-center justify-between px-3 py-2">
									<div class={stack({ gap: "0" })}>
										<Text size="sm" weight="semibold" preset="default">{sub.name}</Text>
										{#if sub.latency_us != null}
											<Text size="xs" preset="default">{sub.latency_us >= 1000 ? `${Math.round(sub.latency_us / 1000)}ms` : `${sub.latency_us}µs`}</Text>
										{/if}
									</div>
									<Badge
										variant={sub.status === "Healthy" ? "positive" : sub.status === "Down" ? "negative" : "neutral"}
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
						</div>
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
			surface="neuro" variant="minimal"
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
					<Card surface="neuro" variant="deep" class="p-3">
						<div class={stack({ gap: "2" })}>
							<div class={hstack({ gap: "2", align: "center" })}>
								<span
									class="inline-block h-2.5 w-2.5 rounded-full"
									style="background: var(--accent-{accentName}-main); box-shadow: var(--glow-dot-md);"
								></span>
								<Text weight="semibold" size="sm" preset="default">{project.name}</Text>
							</div>
							<Text size="xs" preset="default">{project.language}</Text>
							<Text size="xs" preset="default">{project.lastModified}</Text>
						</div>
					</Card>
				{/each}
			</div>
		</Widget>
	</div>
	</div>
</div>
{/if}
