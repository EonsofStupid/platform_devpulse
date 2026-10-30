<!--
  @component SessionRow — session rail row
-->
<script lang="ts">
import { Card } from "@devpulse/coldlight/components/card";
import { Text } from "@devpulse/coldlight/components/text";
import { cn } from "@devpulse/coldlight/utils";
import { formatTime } from "../../util/format.js";
import type { SessionRowProps } from "./session-row.types.js";

let { session, active, onClick, disabled = false, class: className }: SessionRowProps = $props();
</script>

<Card
	as="button"
	variant="minimal"
	{disabled}
	data-ui="chat-session-row"
	data-selected={active || undefined}
	aria-current={active ? "true" : undefined}
	class={cn("w-full shrink-0 gap-0.5 px-2 py-2 text-left", className)}
	onclick={onClick}
>
	<Text size="xs" weight="semibold" class="truncate">{session.title ?? session.id}</Text>
	<Text size="xs" data-ui="chat-session-row" data-slot="timestamp" class="truncate">{formatTime(session.updatedAt)}</Text>
</Card>
