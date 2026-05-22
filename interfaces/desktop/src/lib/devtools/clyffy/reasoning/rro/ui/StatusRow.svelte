<!--
	@component StatusRow
	@kind sys.rro.ui
	@layer domain-ui
	@description A label + status badge with an optional detail. Dumb; props in, events out.
-->
<script lang="ts">
import { Badge } from "$lib/design/components/badge/index.js";
import { StatusDot, type StatusDotStatus } from "$lib/design/components/status-dot/index.js";
import { Text } from "$lib/design/components/text/index.js";

type Tone = "success" | "warning" | "error" | "accent" | "neutral";

const TONE_TO_STATUS: Record<Tone, StatusDotStatus> = {
	success: "ready",
	warning: "pending",
	error: "failed",
	accent: "online",
	neutral: "offline",
};

interface Props {
	label: string;
	detail?: string;
	ok: boolean;
	okText?: string;
	failText?: string;
	/** Override the StatusDot tone. */
	tone?: Tone;
}

let { label, detail, ok, okText = "Ready", failText = "Unreachable", tone }: Props = $props();

const resolvedTone: Tone = $derived(tone ?? (ok ? "success" : "error"));
const resolvedStatus = $derived(TONE_TO_STATUS[resolvedTone]);
</script>

<div class="flex items-center justify-between gap-2">
	<div class="min-w-0">
		<Text size="sm" weight="medium">{label}</Text>
		{#if detail}
			<Text size="xs" preset="flat">{detail}</Text>
		{/if}
	</div>
	<Badge variant={ok ? "positive" : "negative"} size="sm" fillStyle="subtle">
		<StatusDot status={resolvedStatus} />
		{ok ? okText : failText}
	</Badge>
</div>
