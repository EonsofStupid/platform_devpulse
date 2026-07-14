<!--
	@file ScanPanel.svelte
	@module @devpulse/domains/app/models/feature/setup-wizard/ui/scan-panel

	The live scan surface — pops up when a scan begins and renders ONLY
	what the discovery signals prove happened (NO-MOCK LAW): per-rung
	truth rows, the real probe stream, honest totals. Pure render —
	reads the fold model (scan.state), calls nothing.

	ONE chrome: a wizard-inset carved-in well. The sweep disc animates
	via the UNIVERSAL `cl-spin` keyframe (keyframes SSOT + `spin`
	animation token — 2s linear infinite per its consumption pattern)
	and is RENDERED ONLY while phase === "searching": the animation
	cannot outlive the real scan. Zero @keyframes in this file.
-->
<script lang="ts">
import { Card } from "$lib/design/components/card/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/design/components/tooltip/index.js";
import { RUNG_ORDER, type RungId, scanState } from "../scan.state.svelte.js";
import type { ScanPanelProps } from "../util/wizard.types.js";

let { copy, phase, rungs, probes, probedTotal, foundTotal, error }: ScanPanelProps = $props();

/** Rung id → its [connect] SSOT label/tooltip keys (wire vocabulary,
 *  snake_case, matches DiscoverySource verbatim). */
const RUNG_COPY: Record<RungId, { label: () => string; tip: () => string }> = {
	persisted: {
		label: () => copy?.scan_rung_persisted ?? "",
		tip: () => copy?.scan_rung_persisted_tip ?? "",
	},
	configured: {
		label: () => copy?.scan_rung_configured ?? "",
		tip: () => copy?.scan_rung_configured_tip ?? "",
	},
	localhost: {
		label: () => copy?.scan_rung_localhost ?? "",
		tip: () => copy?.scan_rung_localhost_tip ?? "",
	},
	mdns: {
		label: () => copy?.scan_rung_mdns ?? "",
		tip: () => copy?.scan_rung_mdns_tip ?? "",
	},
	mesh_peer: {
		label: () => copy?.scan_rung_mesh ?? "",
		tip: () => copy?.scan_rung_mesh_tip ?? "",
	},
};

function rungStatusText(rung: RungId): string {
	const status = rungs[rung];
	if (status.kind === "waiting") {
		return phase === "searching" ? (copy?.scan_rung_waiting ?? "") : "";
	}
	if (status.kind === "silent") {
		return copy?.scan_rung_not_run ?? "";
	}
	if (status.candidates === 0) {
		return copy?.scan_rung_done_none ?? "";
	}
	const answered = scanState.answeredFor(rung);
	return (copy?.scan_rung_done_some ?? "").replace("{count}", String(answered));
}

const finishLine = $derived.by(() => {
	if (phase !== "done") return null;
	if (error) return (copy?.scan_error ?? "").replace("{error}", error);
	if (foundTotal !== null && foundTotal > 0) {
		return (copy?.scan_finished_some ?? "")
			.replace("{found}", String(foundTotal))
			.replace("{probed}", String(probedTotal ?? 0));
	}
	return (copy?.scan_finished_none ?? "").replace("{probed}", String(probedTotal ?? 0));
});
</script>

{#if phase !== "idle"}
	<Card preset="wizard-inset" class="scan-panel" label={copy?.scan_title ?? ""}>
		<header class="scan-head">
			{#if phase === "searching"}
				<!-- Real-state-gated sweep: universal cl-spin keyframe (SSOT),
				     token-painted conic disc. Exists ONLY while scanning. -->
				<div class="scan-sweep animate-[cl-spin_2s_linear_infinite]" aria-hidden="true"></div>
			{:else}
				<div class="scan-dot" data-found={(foundTotal ?? 0) > 0 ? "true" : undefined} aria-hidden="true"></div>
			{/if}
			<div class="scan-head-text">
				<Heading level={3} size="sm">{copy?.scan_title ?? ""}</Heading>
				<Text size="xs" color="muted">{copy?.scan_subtitle ?? ""}</Text>
			</div>
		</header>

		<ul class="scan-rungs" aria-live="polite">
			{#each RUNG_ORDER as rung (rung)}
				<li class="scan-rung">
					<Tooltip>
						<TooltipTrigger class="scan-rung-label">
							<Text size="sm">{RUNG_COPY[rung].label()}</Text>
						</TooltipTrigger>
						<TooltipContent preset="stark">
							{rungs[rung].kind === "silent"
								? (copy?.scan_rung_not_run_tip ?? "")
								: RUNG_COPY[rung].tip()}
						</TooltipContent>
					</Tooltip>
					<Text size="xs" color="muted" class="scan-rung-status" data-status={rungs[rung].kind}>
						{rungStatusText(rung)}
					</Text>
				</li>
			{/each}
		</ul>

		{#if probes.length > 0}
			<div class="scan-probes" role="log" aria-label={copy?.scan_title ?? ""}>
				{#each probes as probe, i (i)}
					<span class="scan-probe-line" data-reached={probe.reached ? "true" : undefined}>
						{(copy?.scan_probe_trying ?? "").replace("{url}", probe.url)}
						— {probe.reached ? (copy?.scan_probe_answered ?? "") : (copy?.scan_probe_silent ?? "")}
					</span>
				{/each}
			</div>
		{/if}

		{#if finishLine}
			<Text size="xs" color="muted" class="scan-finish">{finishLine}</Text>
		{/if}
	</Card>
{/if}

<style>
	/* Layout + end-of-cascade token bindings only. Zero @keyframes —
	   the sweep rides the universal cl-spin (keyframes SSOT). */
	:global(.scan-panel) {
		flex-direction: column;
		gap: clamp(0.5rem, 1cqi, 0.75rem);
		padding: clamp(0.875rem, 1.6cqi, 1.125rem);
	}

	.scan-head {
		display: flex;
		align-items: center;
		gap: clamp(0.5rem, 1cqi, 0.75rem);
	}

	.scan-head-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.scan-sweep {
		flex: none;
		width: clamp(1rem, 2cqi, 1.5rem);
		height: clamp(1rem, 2cqi, 1.5rem);
		border-radius: 50%;
		background: conic-gradient(from 0deg, var(--cta-main), transparent 70%);
	}

	@media (prefers-reduced-motion: reduce) {
		/* a11y guard — pauses the universal animation at this binding
		   site (no global reduced-motion rule covers animate-[…]). */
		.scan-sweep {
			animation: none;
		}
	}

	.scan-dot {
		flex: none;
		width: clamp(0.625rem, 1.2cqi, 0.875rem);
		height: clamp(0.625rem, 1.2cqi, 0.875rem);
		border-radius: 50%;
		background-color: var(--text-muted);
		transition: background-color var(--duration-fast) ease;
	}
	.scan-dot[data-found] {
		background-color: var(--accent-green-main, var(--cta-main));
	}

	.scan-rungs {
		display: flex;
		flex-direction: column;
		gap: clamp(0.25rem, 0.6cqi, 0.375rem);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.scan-rung {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		min-width: 0;
	}

	:global(.scan-rung-label) {
		min-width: 0;
	}

	:global(.scan-rung-status) {
		transition: color var(--duration-fast) ease;
	}

	.scan-probes {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		max-height: clamp(6rem, 12cqi, 9rem);
		overflow-y: auto;
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: var(--font-size-xs, 0.75rem);
		color: var(--text-muted);
	}

	.scan-probe-line[data-reached] {
		color: var(--accent-green-main, var(--text-primary));
	}
</style>
