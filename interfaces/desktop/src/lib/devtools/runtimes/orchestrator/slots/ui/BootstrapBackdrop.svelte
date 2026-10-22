<!--
	@component BootstrapBackdrop
	@module @devpulse/devtools/runtimes/orchestrator/slots/ui

	Atmospheric MP4 backdrop slot, sized to cover its parent container.
	Generic by design — the owner repurposes this region later for the
	loading minigame surface; the slot accepts a `src` so the same
	component can drive the bootstrap atmospheric loop today and the
	minigame video later.

	## Honors `prefers-reduced-motion`

	When the user has reduced-motion preference enabled, the video is
	not rendered (the `aria-hidden` static fallback container stays
	present so layout doesn't reflow). The CSS `@media` query also
	hides the video as a defense-in-depth for late style loads.

	## Layout-only

	Position + sizing only. Visual color comes from the bundled MP4
	asset (Tauri serves `static/` at the app root, so `src` is a
	root-relative path that resolves locally without a network
	round-trip). Tokens drive opacity + radius for the host container;
	no hardcoded numbers in the cascade.
-->
<script lang="ts">
import { onMount } from "svelte";

interface Props {
	/** Root-relative URL of the MP4. Defaults to the bootstrap loop. */
	src?: string;
	/** Optional ARIA label override. Defaults to "Background animation". */
	label?: string;
}

let { src = "/imgs/backgrounds/bganimation_loop.mp4", label = "Background animation" }: Props =
	$props();

/** Mirror `prefers-reduced-motion` into reactive state so the markup
 *  can drop the `<video>` element entirely under reduced motion. CSS
 *  alone would still mount + decode the video; this guard skips that
 *  cost too. */
let reducedMotion = $state(false);

onMount(() => {
	if (typeof window === "undefined") return;
	const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
	reducedMotion = mq.matches;
	const onChange = (e: MediaQueryListEvent) => {
		reducedMotion = e.matches;
	};
	mq.addEventListener("change", onChange);
	return () => mq.removeEventListener("change", onChange);
});
</script>

<div class="bootstrap-backdrop" aria-hidden="true" aria-label={label}>
	{#if !reducedMotion}
		<video
			class="bootstrap-backdrop-video"
			{src}
			autoplay
			loop
			muted
			playsinline
			preload="auto"
			aria-hidden="true"
		></video>
	{/if}
</div>

<style>
	.bootstrap-backdrop {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		opacity: 0.35;
		border-radius: var(--radius-lg);
	}

	.bootstrap-backdrop-video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	@media (prefers-reduced-motion: reduce) {
		.bootstrap-backdrop-video {
			display: none;
		}
	}
</style>
