<!--
	@component MetricCard
	@kind sys.rro.ui
	@layer domain-ui
	@description Label + numeric/string value + optional badge variant. Dumb.
-->
<script lang="ts">
import { Badge } from "$lib/design/components/badge/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { Text } from "$lib/design/components/text/index.js";

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
