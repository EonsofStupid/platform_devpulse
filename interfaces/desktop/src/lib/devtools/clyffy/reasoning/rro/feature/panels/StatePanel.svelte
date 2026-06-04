<!--
	@component StatePanel
	@kind sys.rro.feature
	@layer feature
	@description Live rumination lifecycle — layman-first narration, colored zones,
	             per-action loading state, colorful transition history.

	UX rules:
	- Narration is the PRIMARY text. Technical state name ("ruminating") is a small subtitle.
	- Every action button owns its loading flag — disables during flight, shows spinner.
	- Proximity is a color-gradient bar, not a numeric slider.
	- Transition history rows are color-coded by destination state.
-->
<script lang="ts">
import { Activity, GitFork, Sparkles, Trash } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Callout } from "$lib/design/components/callout/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { RadialGauge } from "$lib/design/components/radial-gauge/index.js";
import { Slider } from "$lib/design/components/slider/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { StatusDot, type StatusDotStatus } from "$lib/design/components/status-dot/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { TextField } from "$lib/design/components/text-field/index.js";
import { rroState } from "$lib/sys/data-access/rro/rro.state.svelte.js";
import { CapabilityHeader, ErrorCallout } from "../../ui/index.js";
import {
	proximityGradientClass,
	proximityLabel,
	proximityVariant,
	proximityZone,
} from "../../util/rro.format.js";
import { RRO_DEPTH_NARRATIONS, RRO_STATE_NARRATIONS } from "../../util/rro.narrations.js";
import type { RroDepth, RroState } from "../../util/rro.types.js";

type StateVariant = "accent" | "informative" | "positive" | "notice" | "negative" | "neutral";

const DEPTHS: { value: RroDepth; label: string; hint: string }[] = [
	{ value: "shallow", label: "Quick", hint: "Fast answers — skips deep thought" },
	{ value: "normal", label: "Normal", hint: "Balanced — the usual mode" },
	{ value: "deep", label: "Deep", hint: "Full rumination — catches edge cases" },
];

function stateVariant(s: RroState): StateVariant {
	switch (s) {
		case "idle":
			return "neutral";
		case "gathering":
		case "processing":
			return "informative";
		case "ruminating":
			return "notice";
		case "ready":
			return "positive";
		case "purged":
			return "negative";
		case "forked":
			return "accent";
		default:
			return "neutral";
	}
}

function stateDotTone(s: RroState): StatusDotStatus {
	switch (s) {
		case "idle":
			return "offline";
		case "gathering":
		case "processing":
			return "loading";
		case "ruminating":
			return "pending";
		case "ready":
			return "ready";
		case "purged":
			return "failed";
		case "forked":
			return "online";
		default:
			return "offline";
	}
}

function formatAt(atMs: number | bigint): string {
	const n = Number(atMs);
	if (!n) return "—";
	const d = new Date(n);
	return d.toLocaleTimeString(undefined, { hour12: false });
}

function elapsedSince(atMs: number | bigint): string {
	const n = Number(atMs);
	if (!n) return "—";
	const delta = Math.max(0, Date.now() - n);
	if (delta < 1000) return `${delta}ms ago`;
	if (delta < 60_000) return `${Math.round(delta / 1000)}s ago`;
	if (delta < 3_600_000) return `${Math.round(delta / 60_000)}m ago`;
	return `${Math.round(delta / 3_600_000)}h ago`;
}

const snapshot = $derived(rroState.rroSnapshot);
const layman = $derived(snapshot ? (RRO_STATE_NARRATIONS[snapshot.state]?.layman[0] ?? "") : "");
const depthNarration = $derived(
	snapshot ? (RRO_DEPTH_NARRATIONS[snapshot.depth]?.layman[0] ?? "") : "",
);
const zone = $derived(proximityZone(snapshot?.proximity ?? 0.5));
const zoneLabel = $derived(proximityLabel(zone));
const zoneBadgeVariant = $derived(proximityVariant(zone));
</script>

<ErrorCallout prefix="Reasoning engine" message={rroState.rroStateError} />

<!-- ═══════ CURRENT STATE — narration primary, state secondary ═══════ -->
<Card preset="glass">
	<div class="p-4 space-y-3">
		{#snippet icon()}
			<Activity size={14} class="text-[var(--accent-service-main)]" />
		{/snippet}
		<CapabilityHeader
			title="What Clyffy is doing"
			subtitle="Live — updates the moment anything changes."
			{icon}
		/>

		{#if snapshot}
			<div class="space-y-2">
				<div class="flex items-center gap-3">
					<StatusDot status={stateDotTone(snapshot.state)} />
					<Text size="lg" weight="semibold">
						{layman || snapshot.state}
					</Text>
				</div>

				<div class="flex items-center gap-2 flex-wrap">
					<Badge variant={stateVariant(snapshot.state)} size="sm" fillStyle="bold">
						{snapshot.state}
					</Badge>
					<Badge variant="informative" size="sm" fillStyle="subtle">
						Depth: {snapshot.depth}
					</Badge>
					{#if snapshot.source}
						<Badge variant="accent" size="sm" fillStyle="outline">
							from {snapshot.source}
						</Badge>
					{/if}
					<Badge variant="neutral" size="sm" fillStyle="outline">
						{elapsedSince(snapshot.last_transition_at_ms)}
					</Badge>
				</div>
			</div>
		{:else if rroState.rroStateLoading}
			<div class="flex items-center gap-2">
				<Spinner size="sm" />
				<Text size="sm" preset="flat">Connecting to reasoning engine…</Text>
			</div>
		{:else}
			<Text size="sm" preset="flat">Waiting for the first state…</Text>
		{/if}
	</div>
</Card>

<!-- ═══════ DEPTH — 3 layman-labeled buttons, real control ═══════ -->
<Card preset="glass">
	<div class="p-4 space-y-3">
		<CapabilityHeader
			title="How hard should Clyffy think?"
			subtitle="Pick one. Takes effect immediately."
		/>

		<div class="grid grid-cols-3 gap-2">
			{#each DEPTHS as d}
				<Button
					preset={snapshot?.depth === d.value ? "primary" : "secondary"}
					size="sm"
					onclick={() => rroState.setDepth(d.value)}
					disabled={rroState.rroActionLoading.depth}
				>
					<div class="flex flex-col items-start gap-0.5 w-full">
						<div class="flex items-center gap-1.5 font-medium">
							{#if rroState.rroActionLoading.depth && snapshot?.depth !== d.value}
								<Spinner size="xs" />
							{/if}
							{d.label}
						</div>
						<div class="text-xs opacity-80 text-left">{d.hint}</div>
					</div>
				</Button>
			{/each}
		</div>

		{#if depthNarration}
			<Callout variant="info" preset="flat">
				<Text size="xs">Right now: &ldquo;{depthNarration}&rdquo;</Text>
			</Callout>
		{/if}
	</div>
</Card>

<!-- ═══════ PROXIMITY — radial gauge + color-zoned bar + slider ═══════ -->
<Card preset="glass">
	<div class="p-4">
		<div class="flex items-center gap-5">
			<!-- Radial: instant glance, big-and-bold visual hit. -->
			<RadialGauge
				value={(snapshot?.proximity ?? 0.5) * 100}
				max={100}
				label="Friction"
				unit="%"
				accent="cyber"
				preset="glass"
				size={140}
				strokeWidth={8}
			/>

			<!-- Detail column: zoned bar + numeric slider + axis labels. -->
			<div class="flex-1 space-y-3">
				<div class="flex items-start justify-between gap-2">
					<div>
						<Text size="sm" weight="semibold">Friction gauge</Text>
						<Text size="xs" preset="flat">
							How close the current context is to hitting trouble.
						</Text>
					</div>
					<Badge variant={zoneBadgeVariant} size="md" fillStyle="bold">
						{zoneLabel}
					</Badge>
				</div>

				<!-- Color-gradient bar — the position of the current value within the zone. -->
				<div class="relative h-3 rounded-full overflow-hidden {proximityGradientClass()} opacity-80">
					<div
						class="absolute top-0 bottom-0 w-1 bg-[var(--text-primary)] shadow-md"
						style:left="{((snapshot?.proximity ?? 0.5) * 100).toFixed(1)}%"
					></div>
				</div>

				<Slider
					min={0}
					max={1}
					step={0.05}
					value={snapshot?.proximity ?? 0.5}
					onValueChange={(v) => rroState.setProximity(v)}
					disabled={rroState.rroActionLoading.proximity}
				/>

				<div class="flex justify-between">
					<Text size="xs" preset="flat">Calm</Text>
					<Text size="xs" preset="flat">Paying attention</Text>
					<Text size="xs" preset="flat">Near friction</Text>
				</div>
			</div>
		</div>
	</div>
</Card>

<!-- ═══════ ACTIONS — layman labels, per-button loading ═══════ -->
<Card preset="glass">
	<div class="p-4 space-y-4">
		{#snippet icon()}
			<Sparkles size={14} class="text-[var(--accent-service-main)]" />
		{/snippet}
		<CapabilityHeader
			title="Ask Clyffy to do something"
			subtitle="Manual nudges to the reasoning lifecycle."
			{icon}
		/>

		<!-- GATHER — teal/accent -->
		<div class="space-y-2">
			<div class="flex items-end gap-2">
				<div class="flex-1">
					<TextField
						value={rroState.gatherSource}
						onValueChange={(v) => (rroState.gatherSource = v)}
						label="Gather fresh context about…"
						placeholder="sprint, user-question, code-review…"
						size="sm"
					/>
				</div>
				<Button
					preset="primary"
					size="sm"
					onclick={() => rroState.triggerGather()}
					disabled={rroState.rroActionLoading.gather}
				>
					{#if rroState.rroActionLoading.gather}
						<Spinner size="xs" />
					{/if}
					Gather
				</Button>
			</div>
			{#if RRO_STATE_NARRATIONS.gathering.learning?.[0]}
				<Callout variant="tip" preset="flat">
					<Text size="xs">{RRO_STATE_NARRATIONS.gathering.learning[0]}</Text>
				</Callout>
			{/if}
		</div>

		<!-- PURGE — red/negative -->
		<div class="space-y-2">
			<div class="flex items-end gap-2">
				<div class="flex-1">
					<TextField
						value={rroState.purgeReason}
						onValueChange={(v) => (rroState.purgeReason = v)}
						label="Throw out the current context (why?)"
						placeholder="stale, contaminated, wrong-project…"
						size="sm"
					/>
				</div>
				<Button
					preset="danger"
					size="sm"
					onclick={() => rroState.triggerPurge()}
					disabled={rroState.rroActionLoading.purge}
				>
					{#if rroState.rroActionLoading.purge}
						<Spinner size="xs" />
					{:else}
						<Trash size={12} />
					{/if}
					Clear
				</Button>
			</div>
			{#if RRO_STATE_NARRATIONS.purged.learning?.[0]}
				<Callout variant="warning" preset="flat">
					<Text size="xs">{RRO_STATE_NARRATIONS.purged.learning[0]}</Text>
				</Callout>
			{/if}
		</div>

		<!-- FORK — purple/accent -->
		<div class="space-y-2">
			<div class="flex items-end gap-2">
				<div class="flex-1">
					<TextField
						value={rroState.forkLabel}
						onValueChange={(v) => (rroState.forkLabel = v)}
						label="Try a different path (name it)"
						placeholder="path-a, alt-approach…"
						size="sm"
					/>
				</div>
				<Button
					preset="secondary"
					size="sm"
					onclick={() => rroState.triggerFork()}
					disabled={rroState.rroActionLoading.fork}
				>
					{#if rroState.rroActionLoading.fork}
						<Spinner size="xs" />
					{:else}
						<GitFork size={12} />
					{/if}
					Branch
				</Button>
			</div>
			{#if RRO_STATE_NARRATIONS.forked.learning?.[0]}
				<Callout variant="info" preset="flat">
					<Text size="xs">{RRO_STATE_NARRATIONS.forked.learning[0]}</Text>
				</Callout>
			{/if}
		</div>
	</div>
</Card>

<!-- ═══════ HISTORY — color-coded transition log ═══════ -->
{#if snapshot && snapshot.history.length > 0}
	<Card preset="flat">
		<div class="p-4 space-y-2">
			<div class="flex items-center justify-between">
				<Text size="sm" weight="semibold">What Clyffy has been doing</Text>
				<Badge variant="neutral" size="sm" fillStyle="outline">
					{snapshot.history.length} {snapshot.history.length === 1 ? "event" : "events"}
				</Badge>
			</div>
			<div class="space-y-1 max-h-72 overflow-y-auto">
				{#each snapshot.history as t, idx}
					<div
						class="flex items-center justify-between gap-2 px-3 py-2 rounded bg-[var(--surface-base)] {idx ===
						0
							? 'ring-1 ring-[var(--accent-service-main)]'
							: ''}"
					>
						<div class="flex items-center gap-2 min-w-0 flex-1">
							<StatusDot status={stateDotTone(t.to)} />
							{#if t.from}
								<Text size="xs" preset="flat">{t.from}</Text>
								<Text size="xs" preset="flat">→</Text>
							{/if}
							<Badge variant={stateVariant(t.to)} size="sm" fillStyle="subtle">
								{t.to}
							</Badge>
							<Text size="xs" preset="flat">{t.reason}</Text>
						</div>
						<Text size="xs" preset="flat">{formatAt(t.at_ms)}</Text>
					</div>
				{/each}
			</div>
		</div>
	</Card>
{/if}
