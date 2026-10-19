<!--
	@component HealthSignal
	@module @devpulse/devtools/system/datastores/_shared

	Animated semantic health indicator for a datastore. Replaces the
	static `style="background: var(--signal-success)"` dot pattern that
	the existing DuckDB / Turso / SurrealDB devtools render six different
	ways. Single source for the up / starting / degraded / down / unknown
	visual language.

	## Visual language

	- **up** — soft green dot, slow ambient pulse (breathing animation)
	- **starting** — cyan dot, fast pulse (anticipating activity)
	- **degraded** — amber dot, fast pulse (attention needed)
	- **down** — red dot, no pulse (settled into the bad state)
	- **unknown** — neutral gray dot, no animation (haven't probed yet)

	Optional `latency` prop renders a small mono-font reading next to
	the dot — `"3 µs"` / `"14 ms"` / `"2.1 s"` — so the operator sees
	probe time alongside the up/down at a glance.
-->
<script lang="ts">
import { Text } from "@devpulse/coldlight/components/text";

type HealthState = "up" | "starting" | "degraded" | "down" | "unknown";

interface Props {
	state: HealthState;
	/** Latency in milliseconds, optional. Renders as µs/ms/s next to the dot. */
	latencyMs?: number | null;
	/** Optional short label like "Online" / "Probing…" / "Unreachable". */
	label?: string;
}

let { state, latencyMs = null, label = undefined }: Props = $props();

function fmtLatency(ms: number): string {
	if (ms < 1) return `${(ms * 1000).toFixed(0)} µs`;
	if (ms < 1000) return `${ms.toFixed(0)} ms`;
	return `${(ms / 1000).toFixed(1)} s`;
}

const dotClass = $derived(`dot dot-${state}`);
</script>

<div class="health-signal">
	<div class={dotClass} aria-label={`health: ${state}`}></div>
	{#if label}
		<Text size="xs" weight="medium">{label}</Text>
	{/if}
	{#if latencyMs !== null && latencyMs !== undefined}
		<Text size="xs" color="muted" class="latency-readout">{fmtLatency(latencyMs)}</Text>
	{/if}
</div>

<style>
	.health-signal {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
	.dot {
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.dot-up {
		background: var(--signal-success);
		box-shadow: 0 0 0.5rem color-mix(in oklch, var(--signal-success) 60%, transparent);
		animation: breathing 2.4s ease-in-out infinite;
	}
	.dot-starting {
		background: var(--accent-cyber, var(--accent-electric));
		box-shadow: 0 0 0.5rem color-mix(in oklch, var(--accent-cyber, var(--accent-electric)) 60%, transparent);
		animation: pulse-fast 0.9s ease-in-out infinite;
	}
	.dot-degraded {
		background: var(--signal-warning);
		box-shadow: 0 0 0.5rem color-mix(in oklch, var(--signal-warning) 60%, transparent);
		animation: pulse-fast 0.9s ease-in-out infinite;
	}
	.dot-down {
		background: var(--signal-error);
		box-shadow: 0 0 0.625rem color-mix(in oklch, var(--signal-error) 70%, transparent);
	}
	.dot-unknown {
		background: var(--text-muted);
		opacity: 0.5;
	}

	@keyframes breathing {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.7; transform: scale(0.92); }
	}
	@keyframes pulse-fast {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.55; transform: scale(0.85); }
	}

	:global(.latency-readout) {
		font-family: var(--font-mono);
	}

	@media (prefers-reduced-motion: reduce) {
		.dot-up, .dot-starting, .dot-degraded {
			animation: none;
		}
	}
</style>
