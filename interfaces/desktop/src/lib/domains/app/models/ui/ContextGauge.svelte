<!--
  @file ContextGauge — context-window fill as a radial gauge.
  Composes the ColdLight RadialGauge primitive. Brand accent stays
  stable (magenta = "context/memory of thought" voice). Threshold
  flips the *intent* axis (glass → danger) at high pressure so the
  warning signal lives on intent, not color.
-->
<script lang="ts">
import { RadialGauge } from "@devpulse/coldlight/components/radial-gauge";
import type { SvgAccent, SvgIntent } from "@devpulse/coldlight/svg";

interface Props {
	usedTokens: number | null;
	maxTokens: number | null;
	label?: string;
	size?: number;
}

let { usedTokens, maxTokens, label = "Context", size = 140 }: Props = $props();

const used = $derived(usedTokens ?? 0);
const max = $derived(maxTokens ?? 0);
const percent = $derived(max > 0 ? (used / max) * 100 : 0);

const accent: SvgAccent = "magenta";
const preset: SvgIntent = $derived(percent >= 85 ? "danger" : "glass");
</script>

<RadialGauge
	value={percent}
	max={100}
	{label}
	unit="%"
	{accent}
	{preset}
	{size}
/>
