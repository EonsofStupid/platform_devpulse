<!--
	@component NeuFrame
	@file design/svg/surfaces/NeuFrame.svelte
	@layer svg
	@package @devpulse/coldlight

	Neumorphic frame surface. Renders a rounded rect SVG blank with
	strong bevel + medium noise for hero sections and featured content.
	Includes a visible stroke for the frame border.

	@example
	<NeuFrame glow="teal">
		<HeroContent />
	</NeuFrame>
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import SvgBlank from "../blanks/SvgBlank.svelte";

	type GlowAccent = "off" | "teal" | "purple";

	interface Props {
		/** Accent glow color */
		glow?: GlowAccent;
		/** Border radius in px */
		radius?: number;
		/** Fill color */
		fill?: string;
		/** Frame stroke color */
		stroke?: string;
		/** Frame stroke width */
		strokeWidth?: number;
		/** Additional CSS classes */
		class?: string;
		/** Content */
		children?: Snippet;
	}

	let {
		glow = "teal",
		radius = 16,
		fill = "var(--color-void-base)",
		stroke = "var(--border-emphasis)",
		strokeWidth = 2,
		class: className = "",
		children,
	}: Props = $props();

	const filters = $derived.by(() => {
		const list: string[] = ["bevel-strong", "noise-medium"];
		if (glow !== "off") {
			const glowMap: Record<string, string> = {
				teal: "glow-teal-svg",
				purple: "glow-purple-svg",
			};
			const filterId = glowMap[glow];
			if (filterId) list.push(filterId);
		}
		return list;
	});
</script>

<SvgBlank
	shape="rect"
	width="100%"
	height="100%"
	{radius}
	{filters}
	{fill}
	{stroke}
	{strokeWidth}
	class="neu-frame {className}"
>
	{@render children?.()}
</SvgBlank>
