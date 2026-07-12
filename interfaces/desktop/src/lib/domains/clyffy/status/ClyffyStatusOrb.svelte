<!--
	@file ClyffyStatusOrb - Clyffy's presence indicator.
	@domain clyffy

	Layman-safe visual. Renders Clyffy's current mood as a layered
	ColdLight presence orb — outer halo + inner core, both driven by
	generated `cl-presence-*` keyframes and glow tokens. No scoped
	styles, no hand-rolled animations, no hardcoded colors.

	Reads `clyffyStatus` state only — never mutates. All mood changes
	flow through `clyffyStatus.start()` which owns subscriptions.

	Sizes:
	- sm: topbar footprint
	- md: card / inline footprint
	- lg: feature page / dashboard footprint
-->
<script lang="ts">
import { clyffyStatus } from "./clyffy.state.svelte.js";

type OrbSize = "sm" | "md" | "lg";

interface Props {
	size?: OrbSize;
	label?: boolean;
	class?: string;
}

let { size = "sm", label = false, class: className = "" }: Props = $props();

const mood = $derived(clyffyStatus.mood);
const activity = $derived(clyffyStatus.activity);

/**
 * Per-size sizing classes. All values are tailwind arbitrary utils
 * referencing the design token rems — never raw px inline.
 */
const sizeClasses = $derived.by(() => {
	switch (size) {
		case "lg":
			return {
				halo: "h-28 w-28",
				core: "h-20 w-20",
				label: "text-sm",
			};
		case "md":
			return {
				halo: "h-14 w-14",
				core: "h-10 w-10",
				label: "text-xs",
			};
		default:
			return {
				halo: "h-6 w-6",
				core: "h-4 w-4",
				label: "text-[0.625rem]",
			};
	}
});

/**
 * Per-mood visual contract.
 * - `glowVar`: ColdLight semantic glow CSS var that drives the halo color.
 * - `coreAnim`: tailwind arbitrary utility referencing a `cl-presence-*` keyframe.
 * - `haloAnim`: outer halo animation (usually `cl-presence-halo`).
 * - `label`: layman mood word for aria + optional rendered label.
 */
const moodVisual = $derived.by(() => {
	switch (mood) {
		case "idle":
			return {
				glowVar: "var(--glow-teal)",
				accentVar: "var(--color-teal-400)",
				coreAnim: "animate-[cl-presence-breathe_3.2s_ease-in-out_infinite]",
				haloAnim: "animate-[cl-presence-halo_3.2s_ease-in-out_infinite]",
				label: "Ready",
			};
		case "listening":
			return {
				glowVar: "var(--glow-teal)",
				accentVar: "var(--color-teal-300)",
				coreAnim: "animate-[cl-presence-listen_1.6s_ease-in-out_infinite]",
				haloAnim: "animate-[cl-presence-halo_1.6s_ease-in-out_infinite]",
				label: "Listening",
			};
		case "thinking":
			return {
				glowVar: "var(--glow-purple)",
				accentVar: "var(--color-purple-400)",
				coreAnim: "animate-[cl-presence-think_2.4s_linear_infinite]",
				haloAnim: "animate-[cl-presence-halo_2.4s_ease-in-out_infinite]",
				label: "Thinking",
			};
		case "working":
			return {
				glowVar: "var(--glow-teal)",
				accentVar: "var(--color-teal-500)",
				coreAnim: "animate-[cl-presence-pulse_1.4s_ease-in-out_infinite]",
				haloAnim: "animate-[cl-presence-halo_1.4s_ease-in-out_infinite]",
				label: "Working",
			};
		case "alert":
			return {
				glowVar: "var(--glow-ember)",
				accentVar: "var(--color-amber-400)",
				coreAnim: "animate-[cl-presence-alert_0.9s_ease-in-out_infinite]",
				haloAnim: "animate-[cl-presence-halo_0.9s_ease-in-out_infinite]",
				label: "Attention",
			};
		case "resting":
			return {
				glowVar: "var(--glow-frost)",
				accentVar: "var(--text-muted)",
				coreAnim: "animate-[cl-presence-rest_6s_ease-in-out_infinite]",
				haloAnim: "animate-[cl-presence-halo_6s_ease-in-out_infinite]",
				label: "Resting",
			};
		default:
			return {
				glowVar: "var(--glow-frost)",
				accentVar: "var(--text-muted)",
				coreAnim: "animate-[cl-presence-rest_6s_ease-in-out_infinite]",
				haloAnim: "animate-[cl-presence-halo_6s_ease-in-out_infinite]",
				label: "Starting",
			};
	}
});

const tooltip = $derived(activity.text.length > 0 ? activity.text : moodVisual.label);
</script>

<div
	class="inline-flex items-center gap-2 {className}"
	data-kind="clyffy-orb"
	data-slot="root"
	data-mood={mood}
	data-size={size}
	title={tooltip}
	aria-label="Clyffy status: {moodVisual.label}"
>
	<div
		class="relative inline-grid place-items-center rounded-full motion-reduce:animate-none
			[background:radial-gradient(circle,var(--orb-accent)_0%,transparent_70%)]
			[box-shadow:var(--orb-glow)]
			{sizeClasses.halo} {moodVisual.haloAnim}"
		data-slot="halo"
		style:--orb-accent={moodVisual.accentVar}
		style:--orb-glow={moodVisual.glowVar}
	>
		<div
			class="rounded-full motion-reduce:animate-none
				[background:radial-gradient(circle_at_35%_30%,oklch(1_0_0_/_0.4),var(--orb-accent)_45%,var(--surface-base)_100%)]
				[box-shadow:var(--orb-glow),inset_0_0_0.5rem_var(--bevel-subtle)]
				{sizeClasses.core} {moodVisual.coreAnim}"
			data-slot="core"
		></div>
	</div>

	{#if label}
		<span class="{sizeClasses.label} text-[color:var(--text-primary)]" data-slot="label">
			{moodVisual.label}
		</span>
	{/if}
</div>
