<!--
	@component MetricCard
	@kind sys.rro.ui
	@layer domain-ui
	@description Label + numeric/string value + optional badge variant. Dumb.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Card } from "@devpulse/coldlight/components/card";
import { Text } from "@devpulse/coldlight/components/text";

type Variant = "neutral" | "accent" | "informative" | "positive" | "notice" | "negative";

interface Props {
	label: string;
	value: string | number;
	variant?: Variant;
}

let { label, value, variant = "accent" }: Props = $props();

const display = $derived(typeof value === "number" ? value.toLocaleString() : value);
</script>

<Card preset="flat">
	<div class="p-3 flex items-center justify-between">
		<Text size="xs" preset="flat">{label}</Text>
		<Badge {variant} size="sm" fillStyle="bold">{display}</Badge>
	</div>
</Card>
