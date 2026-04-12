<!--
  @file BackgroundScene.svelte
  @kind background-scene
  @layer component
  @category layout
  @description Configurable animated background with 5 variations.
  Not tied to the wizard — reusable anywhere (dashboard, chat, etc.).
  Mount inside Frame.svelte behind the app shell as an absolutely-
  positioned layer. Every prop drives runtime through CSS custom
  properties so changes are zero-re-render.

  **Variations**
  1. circuit-drift  — SVG grid lines with slow hue drift
  2. neural-pulse   — radial gradient with breathing scale
  3. void-breathe   — dual-gradient with slow colour rotation
  4. loop-video     — muted autoplay <video> over bganimation_loop.mp4
  5. chrome-flow    — animated gradient mesh (CSS @property hue shift)

  **Props**
  - `variation` — which scene. `"auto"` = pick from palette.
  - `palette`   — teal | purple | ember | cyber | frost | magenta
  - `speed`     — slow | normal | fast
  - `intensity` — subtle | normal | strong
  - `motion`    — on | off | reduced

  Respects `prefers-reduced-motion` — when the OS says reduce, all
  animations pause regardless of the `motion` prop.
-->
<script lang="ts">
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";

export type Variation =
	| "circuit-drift"
	| "neural-pulse"
	| "void-breathe"
	| "loop-video"
	| "chrome-flow"
	| "auto";
export type Palette = "teal" | "purple" | "ember" | "cyber" | "frost" | "magenta";
export type Speed = "slow" | "normal" | "fast";
export type Intensity = "subtle" | "normal" | "strong";
export type Motion = "on" | "off" | "reduced";

interface Props {
	variation?: Variation;
	palette?: Palette;
	speed?: Speed;
	intensity?: Intensity;
	motion?: Motion;
	class?: string;
}

let {
	variation = "void-breathe",
	palette = "teal",
	speed = "normal",
	intensity = "normal",
	motion = "on",
	class: className,
}: Props = $props();

const resolved = $derived(variation === "auto" ? paletteToVariation(palette) : variation);
const dur = $derived(speed === "slow" ? "25s" : speed === "fast" ? "8s" : "15s");
const opac = $derived(intensity === "subtle" ? "0.06" : intensity === "strong" ? "0.18" : "0.12");
const paused = $derived(motion === "off" ? "paused" : "running");

function paletteToVariation(p: Palette): Exclude<Variation, "auto"> {
	switch (p) {
		case "teal":
			return "void-breathe";
		case "purple":
			return "neural-pulse";
		case "ember":
			return "chrome-flow";
		case "cyber":
			return "circuit-drift";
		case "frost":
			return "void-breathe";
		case "magenta":
			return "neural-pulse";
	}
}

const HUE_MAP: Record<Palette, string> = {
	teal: "173",
	purple: "280",
	ember: "25",
	cyber: "135",
	frost: "210",
	magenta: "310",
};

const m = $derived(renderForge({ kind: "background-scene", preset: "default" }));
</script>

<div
	{...m.dataAttrs}
	style="{cssVarString(m.cssVars)}; --bg-hue: {HUE_MAP[palette]}; --bg-dur: {dur}; --bg-opac: {opac}; --bg-play: {paused};"
	class="bg-scene bg-{resolved} {className ?? ''}"
	aria-hidden="true"
>
	{#if resolved === "loop-video"}
		<video
			class="bg-video"
			autoplay
			muted
			loop
			playsinline
			preload="auto"
			src="/imgs/backgrounds/bganimation_loop.mp4"
		></video>
	{/if}
</div>

<style>
	.bg-scene {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		overflow: hidden;
		opacity: var(--bg-opac, 0.12);
		animation-play-state: var(--bg-play, running);
	}

	@media (prefers-reduced-motion: reduce) {
		.bg-scene {
			animation-play-state: paused !important;
		}
		.bg-scene * {
			animation-play-state: paused !important;
		}
	}

	/* ── circuit-drift: SVG grid lines ──────────────────── */
	.bg-circuit-drift {
		background-image:
			linear-gradient(oklch(0.3 0.03 var(--bg-hue)) 0.0625rem, transparent 0.0625rem),
			linear-gradient(90deg, oklch(0.3 0.03 var(--bg-hue)) 0.0625rem, transparent 0.0625rem);
		background-size: 2.5rem 2.5rem;
		animation: drift var(--bg-dur) linear infinite;
	}
	@keyframes drift {
		from { background-position: 0 0; }
		to { background-position: 2.5rem 2.5rem; }
	}

	/* ── neural-pulse: radial gradient breathing ────────── */
	.bg-neural-pulse {
		background: radial-gradient(
			ellipse at 50% 50%,
			oklch(0.25 0.08 var(--bg-hue) / 0.6) 0%,
			oklch(0.08 0.02 var(--bg-hue) / 0) 70%
		);
		animation: pulse-scale var(--bg-dur) ease-in-out infinite alternate;
	}
	@keyframes pulse-scale {
		from { transform: scale(1); }
		to { transform: scale(1.15); }
	}

	/* ── void-breathe: dual-gradient hue rotation ──────── */
	.bg-void-breathe {
		background:
			radial-gradient(
				ellipse at 30% 30%,
				oklch(0.2 0.06 var(--bg-hue) / 0.5) 0%,
				transparent 60%
			),
			radial-gradient(
				ellipse at 70% 70%,
				oklch(0.15 0.04 calc(var(--bg-hue) + 60) / 0.4) 0%,
				transparent 60%
			);
		animation: hue-shift var(--bg-dur) linear infinite;
	}
	@keyframes hue-shift {
		from { filter: hue-rotate(0deg); }
		to { filter: hue-rotate(30deg); }
	}

	/* ── loop-video ─────────────────────────────────────── */
	.bg-loop-video {
		background: transparent;
	}
	.bg-video {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center top;
		mask-image: linear-gradient(to bottom, black 0%, black 60%, transparent 100%);
		-webkit-mask-image: linear-gradient(to bottom, black 0%, black 60%, transparent 100%);
	}

	/* ── chrome-flow: animated gradient mesh ────────────── */
	.bg-chrome-flow {
		background: linear-gradient(
			135deg,
			oklch(0.15 0.05 var(--bg-hue)) 0%,
			oklch(0.1 0.08 calc(var(--bg-hue) + 40)) 33%,
			oklch(0.12 0.06 calc(var(--bg-hue) + 80)) 66%,
			oklch(0.08 0.04 calc(var(--bg-hue) + 120)) 100%
		);
		background-size: 300% 300%;
		animation: mesh-flow var(--bg-dur) ease-in-out infinite;
	}
	@keyframes mesh-flow {
		0%, 100% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
	}
</style>
