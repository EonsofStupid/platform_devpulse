<!--
  @file GpuUtilGauge — GPU utilization % as a radial gauge.
  Composes the ColdLight RadialGauge primitive. Brand accent stays
  stable (ember = "load/heat" voice). Threshold flips the *intent*
  axis (glass → danger) at high pressure so the warning signal lives
  on intent, not color — keeps the dashboard visually diverse.
-->
<script lang="ts">
import { RadialGauge } from "@devpulse/coldlight/components/radial-gauge";
import type { SvgAccent, SvgIntent } from "@devpulse/coldlight/svg";

interface Props {
	utilPercent: number | null;
	tempC?: number | null;
	label?: string;
	size?: number;
}

let { utilPercent, tempC: _tempC = null, label = "GPU Load", size = 140 }: Props = $props();

const percent = $derived(utilPercent ?? 0);

const accent: SvgAccent = "ember";
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
