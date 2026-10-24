<!--
	@component NeuPanel
	@file design/svg/surfaces/NeuPanel.svelte
	@layer svg
	@package @devpulse/coldlight

	Neumorphic panel surface. Renders a rounded rect SVG blank with
	bevel + noise filters and optional glow. Premium tier surface for
	cards, panels, modals, and key UI containers.

	Uses the SvgBlank component internally — counts toward the ~10
	SVG-filtered element budget per viewport.

	@example
	<NeuPanel bevel="medium" noise glow="teal">
		<h2>Panel Title</h2>
		<p>Content here</p>
	</NeuPanel>
-->
<script lang="ts">
import type { Snippet } from "svelte";
import SvgBlank from "../blanks/SvgBlank.svelte";

type BevelLevel = "off" | "soft" | "medium" | "strong";
type GlowAccent = "off" | "teal" | "purple";

interface Props {
	/** Bevel strength: off, soft, medium, strong */
	bevel?: BevelLevel;
	/** Whether to apply grain texture */
	noise?: boolean;
	/** Accent glow color: off, teal, purple */
	glow?: GlowAccent;
	/** Border radius in px */
	radius?: number;
	/** Fill color */
	fill?: string;
	/** Additional CSS classes */
	class?: string;
	/** Content */
	children?: Snippet;
}

let {
	bevel = "medium",
	noise = true,
	glow = "off",
	radius = 12,
	fill = "var(--glass-void)",
	class: className = "",
	children,
}: Props = $props();

// Build filter list from props
const filters = $derived.by(() => {
	const list: string[] = [];

	// Bevel filter
	if (bevel !== "off") {
		const bevelMap: Record<string, string> = {
			soft: "bevel-soft",
			medium: "bevel-medium",
			strong: "bevel-strong",
		};
		const filterId = bevelMap[bevel];
		if (filterId) list.push(filterId);
	}

	// Noise filter
	if (noise) list.push("noise-subtle");

	// Glow filter
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
	class="neu-panel {className}"
>
	{@render children?.()}
</SvgBlank>
