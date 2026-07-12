<!--
	@component Dynamic Background
	@kind dynamic-background
	@layer component
	@category layout
	@description Full-viewport background layer with per-domain variants and optional image
	@container true
	@containerSlots content
	@compound false
	@blockCategory layout
	@defaultStyle dynamic-background-boot
	@styleIds dynamic-background-boot, dynamic-background-devpulse, dynamic-background-overmind, dynamic-background-wiredfront, dynamic-background-devforge, dynamic-background-clyffy
	@requiredAxes backgroundColor, color, opacity
	@slots root:all
	@defaults {
		"background-color": "oklch(0.05 0.015 224)",
		"color": "oklch(0.9319 0.015 224)",
		"opacity": "1"
}
-->
<script lang="ts">
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { DynamicBackgroundProps } from "./types.js";

let {
	variant = "boot",
	src,
	videoSrc,
	animated = true,
	style,
	children,
	class: className,
	...rest
}: DynamicBackgroundProps = $props();

// Variant-driven: the `variant` prop selects the per-hub background. "boot"
// resolves its emitted @defaults (--style-dynamic-background-boot-*); the other
// hub variants have @styleIds but no emitted values yet, so they fall to the
// shared layer until authored.
const m = $derived(renderForge({ kind: "dynamic-background", preset: variant }));
const mergedStyle = $derived(
	[cssVarString(m.cssVars), src ? `--dynamic-background-image: url('${src}');` : ""]
		.filter(Boolean)
		.join(" "),
);
</script>

<div
	aria-hidden="true"
	{...m.dataAttrs}
	style={mergedStyle}
	data-slot="root"
	data-variant={variant}
	data-animated={String(animated)}
	data-has-video={videoSrc ? "true" : "false"}
	class={cn(
		"dynamic-background absolute inset-0 overflow-hidden pointer-events-none",
		className,
	)}
	{...rest}
>
	<div class="dynamic-background__image"></div>
	{#if videoSrc}
		<video
			class="dynamic-background__video"
			autoplay
			muted
			loop
			playsinline
			preload="auto"
			aria-hidden="true"
			tabindex="-1"
		>
			<source src={videoSrc} />
		</video>
	{/if}
	<div class="dynamic-background__overlay"></div>
	<div class="dynamic-background__content">{@render children?.()}</div>
</div>

<style>
	.dynamic-background {
		isolation: isolate;
		background: var(--dynamic-background-base, var(--color-void-base));
	}

	.dynamic-background__image,
	.dynamic-background__overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.dynamic-background__image {
		background-image: var(--dynamic-background-image, none);
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		opacity: var(--dynamic-background-image-opacity, 0.28);
		filter: var(--dynamic-background-image-filter, saturate(0.95) brightness(0.55) contrast(1.05));
		transform: scale(var(--dynamic-background-image-scale, 1.03));
		transform-origin: center;
	}

	.dynamic-background__video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		pointer-events: none;
		opacity: var(--dynamic-background-video-opacity, 0.6);
		mix-blend-mode: var(--dynamic-background-video-blend, normal);
		filter: var(--dynamic-background-video-filter, saturate(1.1) brightness(0.9) contrast(1.02));
	}

	.dynamic-background__overlay {
		background-image: var(--dynamic-background-overlay-image, none);
		background-size: var(--dynamic-background-overlay-size, 100% 100%);
		background-repeat: var(--dynamic-background-overlay-repeat, no-repeat);
		background-position: var(--dynamic-background-overlay-position, center center);
		opacity: var(--dynamic-background-overlay-opacity, 1);
		mix-blend-mode: var(--dynamic-background-overlay-blend, normal);
	}

	/* When a video layer is present, dim the tint overlay so the video
	   remains visible. Per-variant CSS can further tune via
	   --dynamic-background-overlay-opacity-with-video. */
	.dynamic-background[data-has-video="true"] .dynamic-background__overlay {
		opacity: var(--dynamic-background-overlay-opacity-with-video, 0.7);
	}

	.dynamic-background__content {
		position: relative;
		z-index: 1;
	}

	.dynamic-background[data-animated="true"] .dynamic-background__image {
		animation: dynamic-background-breathe 8s ease-in-out infinite;
	}

	.dynamic-background[data-animated="true"] .dynamic-background__overlay {
		animation: dynamic-background-drift 12s ease-in-out infinite;
	}

	.dynamic-background[data-variant="boot"] {
		--dynamic-background-base: var(--color-void-base);
		--dynamic-background-overlay-image:
			radial-gradient(
				ellipse 72% 58% at 50% 22%,
				color-mix(in oklch, var(--backdrop-glow-teal) 82%, transparent) 0%,
				transparent 72%
			),
			linear-gradient(
				var(--backdrop-grid-teal) var(--backdrop-grid-line-width),
				transparent var(--backdrop-grid-line-width)
			),
			linear-gradient(
				90deg,
				var(--backdrop-grid-teal) var(--backdrop-grid-line-width),
				transparent var(--backdrop-grid-line-width)
			),
			linear-gradient(
				180deg,
				color-mix(in oklch, var(--color-void-base) 10%, transparent),
				color-mix(in oklch, var(--color-void-base) 38%, transparent)
			);
		--dynamic-background-overlay-size:
			100% 100%,
			var(--backdrop-grid-size-teal) var(--backdrop-grid-size-teal),
			var(--backdrop-grid-size-teal) var(--backdrop-grid-size-teal),
			100% 100%;
		--dynamic-background-overlay-repeat: no-repeat, repeat, repeat, no-repeat;
		--dynamic-background-overlay-position: center center, center center, center center, center center;
		--dynamic-background-image-opacity: 0.24;
		--dynamic-background-image-filter: saturate(0.92) brightness(0.48) contrast(1.06);
	}

	/* Semantic PRIMARY variant — consumes --accent-primary-* + --backdrop-*-primary.
	   Default binding resolves to blue via app.css semantic layer. Rebind that
	   layer in the visual editor to restyle everywhere at once. */
	.dynamic-background[data-variant="primary"] {
		--dynamic-background-base: var(--color-void-base);
		--dynamic-background-overlay-image:
			radial-gradient(
				ellipse 82% 68% at 50% 16%,
				color-mix(in oklch, var(--accent-primary-glow) 82%, transparent) 0%,
				transparent 62%
			),
			radial-gradient(
				circle at 82% 18%,
				color-mix(in oklch, var(--accent-primary-fill) 82%, transparent) 0%,
				transparent 34%
			),
			linear-gradient(
				var(--backdrop-grid-primary) var(--backdrop-grid-line-width),
				transparent var(--backdrop-grid-line-width)
			),
			linear-gradient(
				90deg,
				var(--backdrop-grid-primary) var(--backdrop-grid-line-width),
				transparent var(--backdrop-grid-line-width)
			),
			linear-gradient(
				180deg,
				color-mix(in oklch, var(--accent-primary-fill) 12%, transparent) 0%,
				transparent 42%,
				color-mix(in oklch, var(--color-void-base) 32%, transparent) 100%
			);
		--dynamic-background-overlay-size:
			100% 100%,
			100% 100%,
			var(--backdrop-grid-size-primary) var(--backdrop-grid-size-primary),
			var(--backdrop-grid-size-primary) var(--backdrop-grid-size-primary),
			100% 100%;
		--dynamic-background-overlay-repeat: no-repeat, no-repeat, repeat, repeat, no-repeat;
		--dynamic-background-overlay-position:
			center center,
			right top,
			center center,
			center center,
			center center;
		--dynamic-background-image-opacity: 0.58;
		--dynamic-background-image-filter: saturate(1.18) brightness(0.82) contrast(1.08);
		--dynamic-background-image-scale: 1.04;
		/* Blue-biased video tint when videoSrc is supplied */
		--dynamic-background-video-opacity: 0.62;
		--dynamic-background-video-filter: saturate(1.18) brightness(0.92) contrast(1.04) hue-rotate(-6deg);
		--dynamic-background-overlay-opacity-with-video: 0.55;
	}

	.dynamic-background[data-variant="devpulse"] {
		--dynamic-background-base: var(--color-void-base);
		--dynamic-background-overlay-image:
			radial-gradient(
				ellipse 82% 68% at 50% 16%,
				color-mix(in oklch, var(--accent-teal-glow) 72%, transparent) 0%,
				transparent 60%
			),
			radial-gradient(
				circle at 82% 18%,
				color-mix(in oklch, var(--accent-cyan-fill) 78%, transparent) 0%,
				transparent 34%
			),
			linear-gradient(
				var(--backdrop-grid-teal) var(--backdrop-grid-line-width),
				transparent var(--backdrop-grid-line-width)
			),
			linear-gradient(
				90deg,
				var(--backdrop-grid-teal) var(--backdrop-grid-line-width),
				transparent var(--backdrop-grid-line-width)
			),
			linear-gradient(
				180deg,
				color-mix(in oklch, var(--accent-cyan-fill) 8%, transparent) 0%,
				transparent 42%,
				color-mix(in oklch, var(--color-void-base) 24%, transparent) 100%
			);
		--dynamic-background-overlay-size:
			100% 100%,
			100% 100%,
			var(--backdrop-grid-size-teal) var(--backdrop-grid-size-teal),
			var(--backdrop-grid-size-teal) var(--backdrop-grid-size-teal),
			100% 100%;
		--dynamic-background-overlay-repeat: no-repeat, no-repeat, repeat, repeat, no-repeat;
		--dynamic-background-overlay-position:
			center center,
			right top,
			center center,
			center center,
			center center;
		--dynamic-background-image-opacity: 0.58;
		--dynamic-background-image-filter: saturate(1.18) brightness(0.8) contrast(1.08);
		--dynamic-background-image-scale: 1.04;
	}

	.dynamic-background[data-variant="overmind"] {
		--dynamic-background-base: var(--color-void-base);
		--dynamic-background-overlay-image:
			radial-gradient(
				ellipse 78% 62% at 50% 18%,
				color-mix(in oklch, var(--backdrop-glow-magenta) 78%, transparent) 0%,
				transparent 62%
			),
			radial-gradient(
				circle at 18% 22%,
				color-mix(in oklch, var(--accent-purple-fill) 70%, transparent) 0%,
				transparent 30%
			),
			linear-gradient(
				var(--backdrop-grid-magenta) var(--backdrop-grid-line-width),
				transparent var(--backdrop-grid-line-width)
			),
			linear-gradient(
				90deg,
				var(--backdrop-grid-magenta) var(--backdrop-grid-line-width),
				transparent var(--backdrop-grid-line-width)
			),
			linear-gradient(
				180deg,
				color-mix(in oklch, var(--accent-magenta-fill) 8%, transparent),
				color-mix(in oklch, var(--color-void-base) 26%, transparent)
			);
		--dynamic-background-overlay-size:
			100% 100%,
			100% 100%,
			var(--backdrop-grid-size-magenta) var(--backdrop-grid-size-magenta),
			var(--backdrop-grid-size-magenta) var(--backdrop-grid-size-magenta),
			100% 100%;
		--dynamic-background-overlay-repeat: no-repeat, no-repeat, repeat, repeat, no-repeat;
		--dynamic-background-overlay-position:
			center center,
			left top,
			center center,
			center center,
			center center;
		--dynamic-background-image-opacity: 0.52;
		--dynamic-background-image-filter: saturate(1.14) brightness(0.74) contrast(1.08);
	}

	.dynamic-background[data-variant="wiredfront"] {
		--dynamic-background-base: var(--color-void-base);
		--dynamic-background-overlay-image:
			radial-gradient(
				ellipse 76% 60% at 50% 18%,
				color-mix(in oklch, var(--backdrop-glow-cyber) 78%, transparent) 0%,
				transparent 62%
			),
			radial-gradient(
				circle at 78% 26%,
				color-mix(in oklch, var(--accent-cyber-fill) 76%, transparent) 0%,
				transparent 30%
			),
			linear-gradient(
				var(--backdrop-grid-cyber) var(--backdrop-grid-line-width),
				transparent var(--backdrop-grid-line-width)
			),
			linear-gradient(
				90deg,
				var(--backdrop-grid-cyber) var(--backdrop-grid-line-width),
				transparent var(--backdrop-grid-line-width)
			),
			linear-gradient(
				180deg,
				color-mix(in oklch, var(--accent-cyber-fill) 8%, transparent),
				color-mix(in oklch, var(--color-void-base) 24%, transparent)
			);
		--dynamic-background-overlay-size:
			100% 100%,
			100% 100%,
			var(--backdrop-grid-size-cyber) var(--backdrop-grid-size-cyber),
			var(--backdrop-grid-size-cyber) var(--backdrop-grid-size-cyber),
			100% 100%;
		--dynamic-background-overlay-repeat: no-repeat, no-repeat, repeat, repeat, no-repeat;
		--dynamic-background-overlay-position:
			center center,
			right top,
			center center,
			center center,
			center center;
		--dynamic-background-image-opacity: 0.48;
		--dynamic-background-image-filter: saturate(1.08) brightness(0.76) contrast(1.06);
	}

	.dynamic-background[data-variant="devforge"] {
		--dynamic-background-base: var(--color-void-base);
		--dynamic-background-overlay-image:
			radial-gradient(
				ellipse 76% 62% at 50% 18%,
				color-mix(in oklch, var(--backdrop-glow-ember) 80%, transparent) 0%,
				transparent 60%
			),
			radial-gradient(
				circle at 16% 24%,
				color-mix(in oklch, var(--accent-ember-fill) 74%, transparent) 0%,
				transparent 30%
			),
			linear-gradient(
				var(--backdrop-grid-ember) var(--backdrop-grid-line-width),
				transparent var(--backdrop-grid-line-width)
			),
			linear-gradient(
				90deg,
				var(--backdrop-grid-ember) var(--backdrop-grid-line-width),
				transparent var(--backdrop-grid-line-width)
			),
			linear-gradient(
				180deg,
				color-mix(in oklch, var(--accent-ember-fill) 8%, transparent),
				color-mix(in oklch, var(--color-void-base) 24%, transparent)
			);
		--dynamic-background-overlay-size:
			100% 100%,
			100% 100%,
			var(--backdrop-grid-size-ember) var(--backdrop-grid-size-ember),
			var(--backdrop-grid-size-ember) var(--backdrop-grid-size-ember),
			100% 100%;
		--dynamic-background-overlay-repeat: no-repeat, no-repeat, repeat, repeat, no-repeat;
		--dynamic-background-overlay-position:
			center center,
			left top,
			center center,
			center center,
			center center;
		--dynamic-background-image-opacity: 0.5;
		--dynamic-background-image-filter: saturate(1.1) brightness(0.74) contrast(1.08);
	}

	.dynamic-background[data-variant="clyffy"] {
		--dynamic-background-base: var(--color-void-base);
		--dynamic-background-overlay-image:
			radial-gradient(
				ellipse 80% 64% at 50% 18%,
				color-mix(in oklch, var(--backdrop-glow-purple) 78%, transparent) 0%,
				transparent 60%
			),
			radial-gradient(
				circle at 82% 18%,
				color-mix(in oklch, var(--accent-purple-fill) 74%, transparent) 0%,
				transparent 30%
			),
			linear-gradient(
				var(--backdrop-grid-purple) var(--backdrop-grid-line-width),
				transparent var(--backdrop-grid-line-width)
			),
			linear-gradient(
				90deg,
				var(--backdrop-grid-purple) var(--backdrop-grid-line-width),
				transparent var(--backdrop-grid-line-width)
			),
			linear-gradient(
				180deg,
				color-mix(in oklch, var(--accent-purple-fill) 8%, transparent),
				color-mix(in oklch, var(--color-void-base) 24%, transparent)
			);
		--dynamic-background-overlay-size:
			100% 100%,
			100% 100%,
			var(--backdrop-grid-size-purple) var(--backdrop-grid-size-purple),
			var(--backdrop-grid-size-purple) var(--backdrop-grid-size-purple),
			100% 100%;
		--dynamic-background-overlay-repeat: no-repeat, no-repeat, repeat, repeat, no-repeat;
		--dynamic-background-overlay-position:
			center center,
			right top,
			center center,
			center center,
			center center;
		--dynamic-background-image-opacity: 0.54;
		--dynamic-background-image-filter: saturate(1.12) brightness(0.76) contrast(1.08);
	}

	@keyframes dynamic-background-breathe {
		0%, 100% {
			opacity: var(--dynamic-background-image-opacity, 0.28);
			transform: scale(var(--dynamic-background-image-scale, 1.03));
		}

		50% {
			opacity: calc(var(--dynamic-background-image-opacity, 0.28) + 0.06);
			transform: scale(calc(var(--dynamic-background-image-scale, 1.03) + 0.015));
		}
	}

	@keyframes dynamic-background-drift {
		0%, 100% {
			transform: translate3d(0, 0, 0);
		}

		50% {
			transform: translate3d(0, -1.5%, 0);
		}
	}
</style>
