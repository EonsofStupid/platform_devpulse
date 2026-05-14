<!--
	@ui AuroraGradientBackdrop
	@module @devpulse/domains/app/models/feature/downloader/ui

	Aurora-gradient backdrop layer for the ModelDownloaderOverlay. Two
	overlaid gradient planes — a static base + a slow-drifting offset
	plane in screen-blend — produce the soft purple/teal/green motion
	the owner specified. Pure presentational; no state, no events.

	Token sources:
	  - Background:    `--gradient-mesh-aurora`  (gradient.css)
	  - Blur magnitude: `--space-48`              (fluid-clamped)
	  - Outset inset:   `--space-48` (negated via calc)

	Motion respects `prefers-reduced-motion: reduce` — the shifting
	plane falls back to a static layer with the same gradient applied,
	so the visual identity is preserved without animation.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";

interface Props {
	/** Optional class for layout positioning by the parent. */
	class?: string;
}

let { class: className }: Props = $props();
</script>

<div class={cn("aurora-backdrop", className)} aria-hidden="true">
	<div class="aurora-layer aurora-layer--base"></div>
	<div class="aurora-layer aurora-layer--shift"></div>
</div>

<style>
	.aurora-backdrop {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		isolation: isolate;
	}

	.aurora-layer {
		position: absolute;
		inset: calc(var(--space-48) * -1);
	}

	.aurora-layer--base {
		background: var(--gradient-mesh-aurora);
		opacity: 0.85;
	}

	.aurora-layer--shift {
		background: var(--gradient-mesh-aurora);
		opacity: 0.5;
		mix-blend-mode: screen;
		filter: blur(var(--space-48));
		animation: aurora-drift 28s ease-in-out infinite;
	}

	@keyframes aurora-drift {
		0%,
		100% {
			transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
		}
		25% {
			transform: translate3d(2%, -3%, 0) rotate(8deg) scale(1.05);
		}
		50% {
			transform: translate3d(-3%, 2%, 0) rotate(-6deg) scale(0.95);
		}
		75% {
			transform: translate3d(1%, 4%, 0) rotate(4deg) scale(1.02);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.aurora-layer--shift {
			animation: none;
		}
	}
</style>
