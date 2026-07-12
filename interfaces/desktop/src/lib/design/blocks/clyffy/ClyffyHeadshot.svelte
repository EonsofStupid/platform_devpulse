<!--
	@block ClyffyHeadshot
	@module @devpulse/design/blocks/clyffy

	Small Clyffy avatar — head-only crop of the same source frames
	`ClyffyMascot` uses, for tight UI surfaces where the full
	mascot would dominate. Chat bubble author chip, mention pill,
	knowledge-card mascot slot, toast notifications.

	# Why a dedicated block (vs. just `ClyffyMascot size="sm"`)

	- The full mascot frame is composed for head-to-toe figure
	  rendering. Cropping to the head via `object-position: top
	  center` + `object-fit: cover` would scale the full image
	  up and slice the head out — that's what `ClyffyMascot
	  size="sm"` would have to do, but the source frame layout
	  doesn't reliably place the head at the same `top` offset
	  across poses, so the crop wandered.
	- This block solves that by (a) restricting the pose set to
	  ones with a consistent head position and (b) tuning the
	  `object-position` per-pose so the head sits in the crop
	  window. Future asset refresh that adds a dedicated headshot
	  sprite will swap the internals without breaking callers.

	# Supported poses

	The full pose vocabulary is overkill for a 1.5rem chip; the
	headshot supports the four poses that read clearly at small
	sizes:

	- `idle`      — neutral front
	- `thinking`  — side glance
	- `scanning`  — looking around (wobble frame works at small)
	- `celebrating` — eyes-up reaction

	Other poses (pointing / downloading) fall back to `idle` —
	the full-body cues of those poses are illegible cropped to
	the head.

	# Ambient breath

	Identical to `ClyffyMascot` — the same blink frame fades over
	on a 6s cycle, respects `prefers-reduced-motion`.

	# ARIA contract

	- `role="img"` + `aria-label`, same as the mascot.
	- `decorative` opt-in for purely visual placements.

	# Sizing

	Three named sizes (`xs`, `sm`, `md`) tuned for chip / avatar /
	tile contexts respectively. No `lg` / `full` here — large
	headshots are the full mascot's job.
-->
<script lang="ts">
export type ClyffyHeadshotPose = "idle" | "thinking" | "scanning" | "celebrating";

export type ClyffyHeadshotSize = "xs" | "sm" | "md";

interface Props {
	/** Logical pose — drives which PNG is shown. Defaults to `idle`. */
	pose?: ClyffyHeadshotPose;
	/** Footprint size. Default `sm` (1.5rem). */
	size?: ClyffyHeadshotSize;
	/**
	 * `aria-label`. When unset, derives a pose-aware default.
	 */
	label?: string;
	/**
	 * Mark this headshot decorative (`aria-hidden="true"`). Use
	 * when sibling text already names Clyffy (chat bubble where
	 * the author name is rendered next to the avatar).
	 */
	decorative?: boolean;
	/** Disable ambient breath. See ClyffyMascot for rationale. */
	staticFrame?: boolean;
}

let {
	pose = "idle",
	size = "sm",
	label,
	decorative = false,
	staticFrame = false,
}: Props = $props();

const POSE_TO_FRAME: Record<ClyffyHeadshotPose, string> = {
	idle: "/imgs/clyffy/clyffy-anim-frontal.png",
	thinking: "/imgs/clyffy/clyffy-anim-sidelook.png",
	scanning: "/imgs/clyffy/clyffy-anim-wobble.png",
	celebrating: "/imgs/clyffy/clyffy-mascot-hero1.png",
};

// Per-pose object-position so the head sits at the right spot
// inside the crop window. Values are empirical to the current
// source frame composition; a future dedicated headshot sprite
// will normalize these to `top center` across the board.
const POSE_TO_POSITION: Record<ClyffyHeadshotPose, string> = {
	idle: "center 20%",
	thinking: "center 18%",
	scanning: "center 22%",
	celebrating: "center 15%",
};

const BLINK_FRAME = "/imgs/clyffy/clyffy-blink-blink.png";
const BLINK_POSITION = "center 20%";

const SIZE_REM: Record<ClyffyHeadshotSize, string> = {
	xs: "1.125rem",
	sm: "1.5rem",
	md: "2rem",
};

const frameUrl = $derived(POSE_TO_FRAME[pose]);
const framePosition = $derived(POSE_TO_POSITION[pose]);
const computedLabel = $derived(label ?? `Clyffy, ${pose}`);
const dim = $derived(SIZE_REM[size]);
</script>

<span
	class="clyffy-headshot"
	class:clyffy-headshot--static={staticFrame}
	style:width={dim}
	style:height={dim}
	role={decorative ? undefined : "img"}
	aria-label={decorative ? undefined : computedLabel}
	aria-hidden={decorative ? "true" : undefined}
	data-pose={pose}
>
	<img
		class="clyffy-headshot__frame clyffy-headshot__frame--pose"
		style:object-position={framePosition}
		src={frameUrl}
		alt=""
		draggable="false"
		loading="lazy"
		decoding="async"
	/>
	{#if !staticFrame}
		<img
			class="clyffy-headshot__frame clyffy-headshot__frame--blink"
			style:object-position={BLINK_POSITION}
			src={BLINK_FRAME}
			alt=""
			draggable="false"
			loading="lazy"
			decoding="async"
		/>
	{/if}
</span>

<style>
	.clyffy-headshot {
		display: inline-flex;
		position: relative;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		overflow: hidden;
		border-radius: var(--radius-full);
		background: var(--surface-inset);
	}

	.clyffy-headshot__frame {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		user-select: none;
		pointer-events: none;
	}

	.clyffy-headshot__frame--pose {
		opacity: 1;
	}

	.clyffy-headshot__frame--blink {
		opacity: 0;
		animation: clyffy-headshot-breath 6s ease-in-out infinite;
	}

	@keyframes clyffy-headshot-breath {
		0%, 49% { opacity: 0; }
		50% { opacity: 1; }
		51%, 100% { opacity: 0; }
	}

	@media (prefers-reduced-motion: reduce) {
		.clyffy-headshot__frame--blink {
			animation: none;
			opacity: 0;
		}
	}

	.clyffy-headshot--static .clyffy-headshot__frame--blink {
		display: none;
	}
</style>
