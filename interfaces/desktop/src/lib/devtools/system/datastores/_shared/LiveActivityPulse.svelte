<!--
	@component LiveActivityPulse
	@module @devpulse/devtools/system/datastores/_shared

	Subtle animated indicator that briefly blips when the store sees a
	read or write. Caller passes an `activityTick` count — every time it
	increments, this component fires a short flash animation, then
	settles back. Combined with HealthSignal it gives the operator an
	"is anything happening?" feel at a glance without needing to scroll
	to a log panel.

	## Why a tick counter and not a timestamp

	Svelte's `$effect` reacts to identity changes; a number that
	monotonically increments is the simplest reactive trigger. Caller
	bumps the counter on each activity event observed (write completed,
	probe returned, scan finished) — this component doesn't care what
	the counter means, only that it changed.

	## Idle behavior

	When no activity has fired in the last `idleAfterMs` (default 4 s)
	the dot fades to muted gray and stops animating. The first new tick
	after idle relights it. Avoids a permanently flashing UI when the
	store sits quiet between bursts.
-->
<script lang="ts">
import { onDestroy } from "svelte";
import { Text } from "$lib/design/components/text/index.js";

interface Props {
	/** Monotonically incrementing counter — every change fires a blip. */
	activityTick: number;
	/** Accent color CSS variable name, e.g. "--accent-amber". Drives the
	 *  blip color so each store's pulse reads as its own identity. */
	accentVar?: string;
	/** Milliseconds of quiet before we fade to idle. */
	idleAfterMs?: number;
}

let { activityTick, accentVar = "--accent-electric", idleAfterMs = 4000 }: Props = $props();

let isLive = $state(false);
let isIdle = $state(true);
let lastActivityMs = $state(0);
let idleTimer: ReturnType<typeof setTimeout> | null = null;

$effect(() => {
	// Track the tick — any change fires the blip.
	const _ = activityTick;
	void _;
	lastActivityMs = Date.now();
	isLive = true;
	isIdle = false;
	// Auto-decay the live flash so the next tick can re-fire it.
	setTimeout(() => {
		isLive = false;
	}, 600);
	if (idleTimer !== null) clearTimeout(idleTimer);
	idleTimer = setTimeout(() => {
		isIdle = true;
	}, idleAfterMs);
});

onDestroy(() => {
	if (idleTimer !== null) clearTimeout(idleTimer);
});

const liveClass = $derived(
	isIdle ? "pulse pulse-idle" : isLive ? "pulse pulse-live" : "pulse pulse-armed",
);
const ago = $derived(
	lastActivityMs === 0 ? "no activity yet" : describeAgo(Date.now() - lastActivityMs),
);

function describeAgo(ms: number): string {
	if (ms < 1000) return "just now";
	if (ms < 60_000) return `${Math.round(ms / 1000)}s ago`;
	if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
	return `${Math.round(ms / 3_600_000)}h ago`;
}
</script>

<div class="live-activity" title={ago}>
	<div class={liveClass} style={`--accent: var(${accentVar});`}></div>
	<Text size="xs" color="muted">{ago}</Text>
</div>

<style>
	.live-activity {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
	.pulse {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		transition: background 0.4s ease, transform 0.2s ease, opacity 0.4s ease;
	}
	.pulse-idle {
		background: var(--text-muted);
		opacity: 0.4;
	}
	.pulse-armed {
		background: var(--accent);
		opacity: 0.7;
		box-shadow: 0 0 0.4rem color-mix(in oklch, var(--accent) 40%, transparent);
	}
	.pulse-live {
		background: var(--accent);
		opacity: 1;
		transform: scale(1.6);
		box-shadow: 0 0 0.875rem color-mix(in oklch, var(--accent) 80%, transparent);
	}

	@media (prefers-reduced-motion: reduce) {
		.pulse {
			transition: none;
		}
		.pulse-live {
			transform: none;
		}
	}
</style>
