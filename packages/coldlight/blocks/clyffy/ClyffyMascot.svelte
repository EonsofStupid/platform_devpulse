<!--
	@block ClyffyMascot
	@module @devpulse/design/blocks/clyffy

	The real Clyffy mascot. Replaces the prior orb-placeholder
	implementation with image-driven poses + an ambient breath
	animation pair (open → blink → open) that gives the mascot
	subtle life without being distracting.

	# Image source

	The 17 PNGs at `interfaces/desktop/static/imgs/clyffy/` are
	the canonical art. This block maps the `pose` prop to one of
	the standing frames and uses the blink frame as the second
	half of the breath pair. No cropping happens here — the head
	region is exposed via `object-position` for the headshot
	variant (`ClyffyHeadshot.svelte`); the full-body mascot uses
	`object-fit: contain` so the whole figure stays in frame at
	any container size.

	# Pose → asset map

	| Pose          | Frame asset                          | Rationale                                                 |
	| ------------- | ------------------------------------ | --------------------------------------------------------- |
	| `idle`        | `clyffy-anim-frontal.png`            | Neutral front-facing — default for "Clyffy is present"    |
	| `thinking`    | `clyffy-anim-sidelook.png`           | Side glance — reads as "considering"                      |
	| `pointing`    | `clyffy-interactions-standing.png`   | Standing interaction pose — reads as "look at this"       |
	| `celebrating` | `clyffy-mascot-hero1.png`            | Hero pose — reads as "we did it"                          |
	| `scanning`    | `clyffy-anim-wobble.png`             | Wobble frame — reads as "working / processing"            |
	| `downloading` | `clyffy-anim-wobble.png`             | Same as scanning — both are "working" surfaces            |

	All poses use `clyffy-blink-blink.png` as the blink frame in
	the ambient breath animation.

	# Ambient breath

	A subtle CSS animation (`clyffy-breath`) crossfades between
	the pose frame and the blink frame on a 6s cycle. The blink
	is brief (~120ms of fully-blinked) so the mascot feels alive
	but doesn't draw attention. `prefers-reduced-motion: reduce`
	disables the animation entirely (WCAG 2.3.3).

	# ARIA contract

	- `role="img"` with `aria-label` describing pose unless the
	  mascot is purely decorative.
	- `aria-hidden="true"` opt-in via the `decorative` prop —
	  use when sibling text already names Clyffy (e.g. a heading
	  that says "Clyffy thinks…").

	# Sizing

	Three named sizes (`sm`, `md`, `lg`) plus a `full` size that
	expands to the parent container. Fluid clamp is intentionally
	NOT applied here — the parent layout decides the footprint;
	the mascot just renders within it.
-->
<script lang="ts">
export type ClyffyMascotPose =
	| "idle"
	| "thinking"
	| "pointing"
	| "celebrating"
	| "scanning"
	| "downloading";

export type ClyffyMascotSize = "sm" | "md" | "lg" | "full";

interface Props {
	/** Logical pose — drives which PNG is shown. */
	pose?: ClyffyMascotPose;
	/** Footprint size. Default `md` (2.5rem). */
	size?: ClyffyMascotSize;
	/**
	 * `aria-label`. When unset, derives "Clyffy mascot, pose: <pose>".
	 * Pass a custom label for surface-specific descriptions
	 * ("Clyffy is downloading models").
	 */
	label?: string;
	/**
	 * Mark this mascot decorative (`aria-hidden="true"`). Use when
	 * sibling text already names Clyffy.
	 */
	decorative?: boolean;
	/**
	 * Disable the ambient breath animation. Defaults to false —
	 * `prefers-reduced-motion: reduce` already disables it via
	 * CSS, so this prop is for callers who want a static
	 * frame regardless of user preference (e.g. screenshots).
	 */
	staticFrame?: boolean;
}

let {
	pose = "idle",
	size = "md",
	label,
	decorative = false,
	staticFrame = false,
}: Props = $props();

// Asset paths under SvelteKit static/. The static dir maps to
// the root URL, so `/imgs/...` resolves correctly in both dev
// and the bundled tauri release.
const POSE_TO_FRAME: Record<ClyffyMascotPose, string> = {
	idle: "/imgs/clyffy/clyffy-anim-frontal.png",
	thinking: "/imgs/clyffy/clyffy-anim-sidelook.png",
	pointing: "/imgs/clyffy/clyffy-interactions-standing.png",
	celebrating: "/imgs/clyffy/clyffy-mascot-hero1.png",
	scanning: "/imgs/clyffy/clyffy-anim-wobble.png",
	downloading: "/imgs/clyffy/clyffy-anim-wobble.png",
};

const BLINK_FRAME = "/imgs/clyffy/clyffy-blink-blink.png";

const SIZE_REM: Record<ClyffyMascotSize, string> = {
	sm: "1.75rem",
	md: "2.5rem",
	lg: "3.5rem",
	full: "100%",
};

const frameUrl = $derived(POSE_TO_FRAME[pose]);
const computedLabel = $derived(label ?? `Clyffy mascot, pose: ${pose}`);
const dim = $derived(SIZE_REM[size]);
</script>

<span
	class="clyffy-mascot"
	class:clyffy-mascot--static={staticFrame}
	style:width={dim}
	style:height={dim}
	role={decorative ? undefined : "img"}
	aria-label={decorative ? undefined : computedLabel}
	aria-hidden={decorative ? "true" : undefined}
	data-pose={pose}
>
	<img
		class="clyffy-mascot__frame clyffy-mascot__frame--pose"
		src={frameUrl}
		alt=""
		draggable="false"
		loading="lazy"
		decoding="async"
	/>
	{#if !staticFrame}
		<img
			class="clyffy-mascot__frame clyffy-mascot__frame--blink"
			src={BLINK_FRAME}
			alt=""
			draggable="false"
			loading="lazy"
			decoding="async"
		/>
	{/if}
</span>

<style>
	.clyffy-mascot {
		display: inline-flex;
		position: relative;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		overflow: hidden;
		border-radius: var(--radius-full);
	}

	.clyffy-mascot__frame {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		object-position: center;
		user-select: none;
		pointer-events: none;
	}

	.clyffy-mascot__frame--pose {
		opacity: 1;
	}

	.clyffy-mascot__frame--blink {
		opacity: 0;
		animation: clyffy-breath 6s ease-in-out infinite;
	}

	@keyframes clyffy-breath {
		0%, 49% { opacity: 0; }
		50% { opacity: 1; }
		51%, 100% { opacity: 0; }
	}

	@media (prefers-reduced-motion: reduce) {
		.clyffy-mascot__frame--blink {
			animation: none;
			opacity: 0;
		}
	}

	.clyffy-mascot--static .clyffy-mascot__frame--blink {
		display: none;
	}
</style>
