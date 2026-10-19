<!--
  @file VramGauge — VRAM usage as a radial gauge.
  Composes the ColdLight RadialGauge primitive. Brand accent stays
  stable per gauge (frost = "memory" voice) so the dashboard reads as
  visually diverse alongside GpuUtilGauge (ember) and ContextGauge
  (magenta). Threshold flips the *intent* axis (default → danger) at
  high pressure — preserves the warning signal without flattening
  every gauge to the same color.
-->
<script lang="ts">
import { RadialGauge } from "@devpulse/coldlight/components/radial-gauge";
import type { SvgAccent, SvgIntent } from "@devpulse/coldlight/svg";

interface Props {
	usedMb: number | null;
	totalMb: number | null;
	hasGpu: boolean;
	gpuError?: string | null;
	label?: string;
	size?: number;
}

let {
	usedMb,
	totalMb,
	hasGpu,
	gpuError: _gpuError = null,
	label = "VRAM",
	size = 140,
}: Props = $props();

const used = $derived(usedMb ?? 0);
const total = $derived(totalMb ?? 0);
const percent = $derived(total > 0 ? (used / total) * 100 : 0);

const accent: SvgAccent = "frost";

const preset: SvgIntent = $derived.by(() => {
	if (!hasGpu) return "ghost";
	if (percent >= 85) return "danger";
	return "glass";
});
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
