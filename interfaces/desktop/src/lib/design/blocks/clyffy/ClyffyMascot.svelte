<!--
	@block ClyffyMascot
	@module @devpulse/design/blocks/clyffy

	Clyffy mascot avatar. Currently renders the placeholder status
	orb (`ClyffyStatusOrb`) at the mascot's expected size — replace
	the inner render once a real mascot asset lands (SVG /
	lottie / sprite atlas). The pose prop is forward-compat: every
	consumer that asks for "thinking" will switch to the right
	frame the moment the asset surface ships.

	Drives the wizard's mascot slot, the chat sidebar peek, and any
	other "Clyffy is here" surface that wants a consistent avatar.

	# ARIA contract

	- `role="img"` so AT users hear "Clyffy mascot, pose: thinking"
	  via `aria-label`.
	- `aria-hidden="true"` opt-in when the mascot is purely
	  decorative (e.g. between sibling text that already names
	  Clyffy).

	# Asset gap (locked memory `project_clyffy_persona_representation.md`)

	The actual mascot artwork is not yet in the repo. Until then,
	this block renders the existing `ClyffyStatusOrb` primitive
	resized to the mascot footprint so the layout slot is filled
	and the wizard doesn't look half-built. The first commit that
	lands a real asset replaces the inner render — every consumer
	gets the new face for free.
-->
<script lang="ts">
import ClyffyStatusOrb from "$lib/domains/clyffy/status/ClyffyStatusOrb.svelte";

export type ClyffyMascotPose =
	| "idle"
	| "thinking"
	| "pointing"
	| "celebrating"
	| "scanning"
	| "downloading";

export type ClyffyMascotSize = "sm" | "md" | "lg";

interface Props {
	/** Logical pose. Currently forward-compat — visual stays the orb. */
	pose?: ClyffyMascotPose;
	/** Footprint size. Default `md` (2.5rem). */
	size?: ClyffyMascotSize;
	/**
	 * `aria-label`. When unset, derives "Clyffy mascot". Pass
	 * `decorative` to mark this mascot as purely visual
	 * (`aria-hidden="true"`) — use when sibling text already
	 * names Clyffy.
	 */
	label?: string;
	/** Mark this mascot decorative (hidden from AT). */
	decorative?: boolean;
}

let { pose = "idle", size = "md", label, decorative = false }: Props = $props();

const SIZE_REM: Record<ClyffyMascotSize, string> = {
	sm: "1.75rem",
	md: "2.5rem",
	lg: "3.5rem",
};

const computedLabel = $derived(label ?? `Clyffy mascot, pose: ${pose}`);
</script>

<span
	class="clyffy-mascot"
	style:width={SIZE_REM[size]}
	style:height={SIZE_REM[size]}
	role={decorative ? undefined : "img"}
	aria-label={decorative ? undefined : computedLabel}
	aria-hidden={decorative ? "true" : undefined}
	data-pose={pose}
>
	<ClyffyStatusOrb />
</span>

<style>
	.clyffy-mascot {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-full);
		overflow: hidden;
	}
</style>
