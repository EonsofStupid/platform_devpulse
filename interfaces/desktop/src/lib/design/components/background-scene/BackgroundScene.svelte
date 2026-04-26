<!--
  @file BackgroundScene.svelte
  @kind background-scene
  @layer component
  @category layout
  @description Configurable animated background with 6 variations.
  Not tied to the wizard — reusable anywhere (dashboard, chat, devtools,
  sidebar). Mount as an absolutely-positioned layer inside any container
  (parent must be `position: relative` and `overflow: hidden`). Every
  prop drives runtime through CSS custom properties so changes are
  zero-re-render.

  **Variations**
  1. circuit-drift  — SVG grid lines with slow hue drift
  2. neural-pulse   — radial gradient with breathing scale
  3. void-breathe   — dual-gradient with slow colour rotation
  4. loop-video     — muted autoplay <video> over bganimation_loop.mp4
  5. chrome-flow    — animated gradient mesh (CSS @property hue shift)
  6. cosmic-galaxy  — layered milky-way: purple core + conic spiral arms
                      + starfield + slow galactic rotation. Optional
                      `imageSrc` overlays a real starfield image at low
                      opacity for premium depth.

  **Props**
  - `variation` — which scene. `"auto"` = pick from palette.
  - `palette`   — teal | purple | ember | cyber | frost | magenta | cosmic
  - `speed`     — slow | normal | fast
  - `intensity` — subtle | normal | strong
  - `motion`    — on | off | reduced
  - `imageSrc`  — optional URL to a starfield .webp/.png; layered under
                  the cosmic-galaxy gradients at intensity-scaled opacity.
                  Ignored by other variations.

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
	| "cosmic-galaxy"
	| "auto";
export type Palette = "teal" | "purple" | "ember" | "cyber" | "frost" | "magenta" | "cosmic";
export type Speed = "slow" | "normal" | "fast";
export type Intensity = "subtle" | "normal" | "strong";
export type Motion = "on" | "off" | "reduced";

interface Props {
	variation?: Variation;
	palette?: Palette;
	speed?: Speed;
	intensity?: Intensity;
	motion?: Motion;
	/**
	 * Optional starfield image URL (cosmic-galaxy only). When provided,
	 * layers under the gradients at intensity-scaled opacity for premium
	 * "real photo" depth. Ignored by other variations.
	 */
	imageSrc?: string;
	class?: string;
}

let {
	variation = "void-breathe",
	palette = "teal",
	speed = "normal",
	intensity = "normal",
	motion = "on",
	imageSrc,
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
		case "cosmic":
			return "cosmic-galaxy";
	}
}

const HUE_MAP: Record<Palette, string> = {
	teal: "173",
	purple: "280",
	ember: "25",
	cyber: "135",
	frost: "210",
	magenta: "310",
	cosmic: "290",
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
	{:else if resolved === "cosmic-galaxy"}
		{#if imageSrc}
			<div
				class="bg-cosmic-image"
				style={`background-image: url("${imageSrc}");`}
			></div>
		{/if}
		<div class="bg-cosmic-stars" aria-hidden="true"></div>
		<div class="bg-cosmic-arms" aria-hidden="true"></div>
		<div class="bg-cosmic-core" aria-hidden="true"></div>
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
		/* a11y override — must defeat the inline `--bg-play: running`
		   custom property the script writes; only `!important` does that
		   in the cascade. WCAG 2.3.3 (Animation from Interactions). */
		.bg-scene {
			/* stylelint-disable-next-line declaration-no-important */
			animation-play-state: paused !important;
		}
		.bg-scene * {
			/* stylelint-disable-next-line declaration-no-important */
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

	/* ── cosmic-galaxy: layered milky-way ─────────────────
	   Stack (bottom → top):
	     0. bg-scene root: deep cosmic black (no animation)
	     1. bg-cosmic-image (optional): user-provided starfield .webp
	     2. bg-cosmic-stars: CSS-only starfield (many tiny radial-gradients)
	     3. bg-cosmic-arms: conic-gradient spiral arms, slow rotation
	     4. bg-cosmic-core: deep purple radial core, breathing scale
	   All layers blend additively via mix-blend-mode: screen so
	   colours stack into the photographic milky-way feel.
	*/
	.bg-cosmic-galaxy {
		background: radial-gradient(
			ellipse at 50% 50%,
			oklch(0.06 0.04 var(--bg-hue)) 0%,
			oklch(0.03 0.02 var(--bg-hue)) 100%
		);
	}
	.bg-cosmic-galaxy > div {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.bg-cosmic-image {
		background-size: cover;
		background-position: center;
		opacity: calc(var(--bg-opac) * 2.5);
		mix-blend-mode: screen;
	}
	.bg-cosmic-stars {
		background-image:
			radial-gradient(0.0625rem 0.0625rem at 12% 18%, oklch(0.95 0.02 var(--bg-hue) / 0.9), transparent 50%),
			radial-gradient(0.0625rem 0.0625rem at 28% 65%, oklch(0.92 0.04 var(--bg-hue) / 0.8), transparent 50%),
			radial-gradient(0.0938rem 0.0938rem at 47% 22%, oklch(0.98 0.02 calc(var(--bg-hue) - 30) / 0.85), transparent 50%),
			radial-gradient(0.0625rem 0.0625rem at 63% 78%, oklch(0.9 0.06 var(--bg-hue) / 0.7), transparent 50%),
			radial-gradient(0.125rem 0.125rem at 81% 33%, oklch(0.97 0.03 calc(var(--bg-hue) + 40) / 0.95), transparent 50%),
			radial-gradient(0.0625rem 0.0625rem at 19% 88%, oklch(0.88 0.05 var(--bg-hue) / 0.6), transparent 50%),
			radial-gradient(0.0938rem 0.0938rem at 73% 11%, oklch(0.94 0.04 var(--bg-hue) / 0.85), transparent 50%),
			radial-gradient(0.0625rem 0.0625rem at 36% 47%, oklch(0.91 0.03 var(--bg-hue) / 0.75), transparent 50%),
			radial-gradient(0.0938rem 0.0938rem at 92% 71%, oklch(0.96 0.05 calc(var(--bg-hue) - 60) / 0.9), transparent 50%),
			radial-gradient(0.0625rem 0.0625rem at 8% 54%, oklch(0.89 0.04 var(--bg-hue) / 0.7), transparent 50%),
			radial-gradient(0.0625rem 0.0625rem at 56% 92%, oklch(0.93 0.03 var(--bg-hue) / 0.8), transparent 50%);
		opacity: calc(var(--bg-opac) * 6);
		mix-blend-mode: screen;
		animation: cosmic-twinkle var(--bg-dur) ease-in-out infinite alternate;
	}
	.bg-cosmic-arms {
		background: conic-gradient(
			from 0deg at 50% 50%,
			oklch(0.18 0.12 var(--bg-hue) / 0.4) 0deg,
			oklch(0.12 0.06 calc(var(--bg-hue) + 30) / 0.2) 60deg,
			oklch(0.22 0.16 calc(var(--bg-hue) - 30) / 0.5) 120deg,
			oklch(0.1 0.04 var(--bg-hue) / 0.15) 180deg,
			oklch(0.2 0.14 calc(var(--bg-hue) + 60) / 0.45) 240deg,
			oklch(0.14 0.08 var(--bg-hue) / 0.25) 300deg,
			oklch(0.18 0.12 var(--bg-hue) / 0.4) 360deg
		);
		opacity: calc(var(--bg-opac) * 3);
		mix-blend-mode: screen;
		animation: cosmic-rotate calc(var(--bg-dur) * 4) linear infinite;
		transform-origin: center;
	}
	.bg-cosmic-core {
		background: radial-gradient(
			ellipse 60% 45% at 50% 50%,
			oklch(0.32 0.18 var(--bg-hue) / 0.6) 0%,
			oklch(0.2 0.12 calc(var(--bg-hue) + 20) / 0.3) 35%,
			transparent 70%
		);
		opacity: calc(var(--bg-opac) * 2);
		mix-blend-mode: screen;
		animation: cosmic-breathe calc(var(--bg-dur) * 1.5) ease-in-out infinite alternate;
	}
	@keyframes cosmic-twinkle {
		from { opacity: calc(var(--bg-opac) * 5); }
		to   { opacity: calc(var(--bg-opac) * 7); }
	}
	@keyframes cosmic-rotate {
		from { transform: rotate(0deg); }
		to   { transform: rotate(360deg); }
	}
	@keyframes cosmic-breathe {
		from { transform: scale(1); }
		to   { transform: scale(1.08); }
	}
</style>
