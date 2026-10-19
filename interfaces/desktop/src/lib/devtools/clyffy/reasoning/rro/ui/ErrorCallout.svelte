<!--
	@component ErrorCallout
	@kind sys.rro.ui
	@layer domain-ui
	@description Standard error Callout used across all RRO panels.
-->
<script lang="ts">
import { Callout } from "@devpulse/coldlight/components/callout";
import { Text } from "@devpulse/coldlight/components/text";

interface Props {
	prefix: string;
	message: string | null;
}

let { prefix, message }: Props = $props();
</script>

{#if message}
	<Callout variant="error" preset="flat">
		<Text size="xs">{prefix}: {message}</Text>
	</Callout>
{/if}
