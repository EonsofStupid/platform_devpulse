<!--
	@file RrdDevtool.svelte
	@module @devpulse/devtools/clyffy/reasoning/rrd

	Reason Ready Daemon devtool — surfaces the kernel daemon's
	pause/drain/swap/resume lifecycle. Subscribes to
	`platform:rrd-phase-transition` (bridged from the kernel via
	`RrdLifecycleTranslator` → `InternalEvent::RrdPhaseTransition`) and
	renders a rolling phase log + most-recent-state badge.

	The daemon itself is not yet instantiated — when it lands, this
	devtool already reads its events without further wiring. Until
	then the panel sits empty, which is the correct empty state for a
	pre-instantiation diagnostic surface.
-->
<script lang="ts">
import { Activity, Trash2, Upload } from "lucide-svelte";
import { onMount } from "svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { type HealthBadge, ScopedLogPanel, ServiceDevtoolShell } from "$lib/devtools/index.js";
import { laymanFor } from "$lib/sys/data-access/rrd/phase-labels.js";
import { rrdState } from "$lib/sys/data-access/rrd/rrd.state.svelte.js";
import { ReasoningTopology } from "../../_shared/index.js";
import SwapDialog from "./SwapDialog.svelte";

onMount(() => {
	void rrdState.boot();
});

// SwapDialog open state — driven by Actions tab button.
let swapDialogOpen = $state(false);

// Layman state derivation: failed > running > maintenance > unknown.
// Uses the centralized phase-label map so the top badge and the
// per-row badges agree on tone — drift between them used to be a
// recurring bug in the raw-phase-name era.
const stateBadge = $derived<HealthBadge>(
	(() => {
		const last = rrdState.last;
		if (!last) {
			return { state: "unknown", label: "Reasoning not started yet" };
		}
		const { tone, label } = laymanFor(last.phase);
		if (tone === "negative") {
			return { state: "degraded", label };
		}
		if (last.phase === "resume_complete" || last.phase === "ready") {
			return { state: "up", label: "Live" };
		}
		if (tone === "positive" || tone === "informative") {
			return { state: "starting", label };
		}
		return { state: "unknown", label };
	})(),
);

function fmtTime(ms: number): string {
	const d = new Date(ms);
	const hh = String(d.getHours()).padStart(2, "0");
	const mm = String(d.getMinutes()).padStart(2, "0");
	const ss = String(d.getSeconds()).padStart(2, "0");
	const msMs = String(d.getMilliseconds()).padStart(3, "0");
	return `${hh}:${mm}:${ss}.${msMs}`;
}
</script>

<ServiceDevtoolShell
	health={stateBadge}
>
	{#snippet status()}
		<div class="space-y-3">
			<!-- Deep topology — read-only view of the reasoning pipeline.
			     Lives above the phase cards because the user reads
			     left-to-right then top-to-bottom: see the system shape
			     first, then drill into events. -->
			<ReasoningTopology />

			<div class="rounded-lg p-3" style="background: var(--surface-raised); border: 1px solid var(--border-subtle);">
				<Text size="sm" weight="bold" class="block mb-1">Right now</Text>
				{#if rrdState.last}
					{@const lab = laymanFor(rrdState.last.phase)}
					<div class="flex items-center gap-2">
						<Badge variant={lab.tone} size="sm">{lab.label}</Badge>
						<Text size="xs" color="muted">{fmtTime(rrdState.last.receivedAtMs)}</Text>
					</div>
					{#if lab.subtitle}
						<Text size="xs" color="muted" class="block mt-1">{lab.subtitle}</Text>
					{/if}
					{#if rrdState.last.detail}
						<Text size="xs" color="muted" class="block mt-1 phase-detail-tech">
							<code>{rrdState.last.phase}</code> · {rrdState.last.detail}
						</Text>
					{/if}
				{:else}
					<Text size="xs" color="muted">
						Reasoning hasn't started yet — load a model into the <code>rag.embedder</code>
						slot and Clyffy's brain wires itself up. Activity shows up here in real time.
					</Text>
				{/if}
			</div>

			<div class="rounded-lg p-3" style="background: var(--surface-raised); border: 1px solid var(--border-subtle);">
				<Text size="sm" weight="bold" class="block mb-2">
					Recent activity
					<Badge variant="neutral" size="sm">{rrdState.transitions.length}</Badge>
				</Text>
				{#if rrdState.transitions.length === 0}
					<Text size="xs" color="muted">Empty.</Text>
				{:else}
					<div class="phase-list">
						{#each [...rrdState.transitions].reverse() as t (t.receivedAtMs)}
							{@const lab = laymanFor(t.phase)}
							<div class="phase-row">
								<Text size="xs" class="phase-time">{fmtTime(t.receivedAtMs)}</Text>
								<Badge variant={lab.tone} size="sm">{lab.label}</Badge>
								{#if t.detail}
									<Text size="xs" class="phase-detail">{t.detail}</Text>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/snippet}

	{#snippet config()}
		<div class="space-y-3">
			<Text size="sm" color="muted">
				The Reason Ready Daemon orchestrates encoder hot-updates via a
				four-phase protocol: pause → drain in-flight work → load and
				validate new weights → atomic swap → resume. No requests are
				dropped during the swap — they queue until the window closes.
			</Text>
			<Text size="sm" color="muted">
				The daemon starts the moment the Harrier encoder is loaded into
				the <code>rag.embedder</code> slot. Loading a second time
				(e.g. upgrading from 270M to 0.6B) triggers a full hot-update
				cycle and emits each phase here in real time.
			</Text>
		</div>
	{/snippet}

	{#snippet logs()}
		<ScopedLogPanel target="rrd.lifecycle" />
	{/snippet}

	{#snippet actions()}
		<div class="space-y-3">
			<div class="rounded-lg p-3" style="background: var(--surface-raised); border: 1px solid var(--border-subtle);">
				<div class="flex items-center justify-between mb-1">
					<Text size="sm" weight="bold">Swap encoder weights</Text>
					<Button
						preset="primary"
						size="sm"
						onclick={() => {
							swapDialogOpen = true;
						}}
					>
						<Upload size={14} />
						Swap
					</Button>
				</div>
				<Text size="xs" color="muted">
					Opens a guarded picker for a <code>.safetensors</code> checkpoint.
					On confirm the daemon runs its full
					<code>pause → drain → validate → swap → resume</code>
					protocol — query traffic queues until resume completes.
					Phase events stream into the topology and the history list
					above in real time.
				</Text>
			</div>

			<div class="rounded-lg p-3" style="background: var(--surface-raised); border: 1px solid var(--border-subtle);">
				<div class="flex items-center justify-between mb-1">
					<Text size="sm" weight="bold">Clear history buffer</Text>
					<Button preset="ghost" size="sm" onclick={() => rrdState.clear()}>
						<Trash2 size={14} />
						Clear
					</Button>
				</div>
				<Text size="xs" color="muted">
					Empties the in-memory phase log. The kernel keeps emitting; this
					just resets the devtool's view so you can isolate the next
					maintenance window.
				</Text>
			</div>
		</div>
	{/snippet}

	{#snippet debug()}
		<div class="space-y-3">
			<div class="rounded-lg p-3" style="background: var(--surface-raised); border: 1px solid var(--border-subtle);">
				<Text size="sm" weight="bold" class="block mb-2">
					<Activity size={14} />
					Bridge state
				</Text>
				<div class="text-xs space-y-1">
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Tauri event</span>
						<span class="font-mono">platform:rrd-phase-transition</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">InternalEvent variant</span>
						<span class="font-mono">RrdPhaseTransition</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Tracing target</span>
						<span class="font-mono">rrd.lifecycle</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Translator</span>
						<span class="font-mono">RrdLifecycleTranslator (lazy)</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Buffered transitions</span>
						<span class="font-mono">{rrdState.transitions.length}</span>
					</div>
				</div>
			</div>
			<Text size="sm" color="muted">
				If the buffer stays empty after the daemon should have fired, check:
				(1) <code>RrdLifecycleTranslator::install_global_sender</code>
				ran in lib.rs boot, (2) the kernel is using
				<code>emit_rrd_lifecycle!</code> on the canonical target.
			</Text>
		</div>
	{/snippet}
</ServiceDevtoolShell>

<!-- Swap dialog — overlay, mounted alongside the shell so the
     ServiceDevtoolShell's stacking context doesn't trap it inside a
     tab panel. `open` controlled here, dialog calls back on close. -->
<SwapDialog
	open={swapDialogOpen}
	onClose={() => {
		swapDialogOpen = false;
	}}
/>

<style>
	.phase-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		max-height: 24rem;
		overflow-y: auto;
	}
	.phase-row {
		display: grid;
		grid-template-columns: 7rem auto 1fr;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		background: var(--surface-base);
		border: 0.0625rem solid var(--border-soft);
	}
	:global(.phase-time) {
		font-family: var(--font-mono);
		color: var(--text-muted);
	}
	:global(.phase-detail) {
		color: var(--text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	:global(.phase-detail-tech) {
		font-family: var(--font-mono);
		color: var(--text-tertiary);
		opacity: 0.7;
	}
</style>
