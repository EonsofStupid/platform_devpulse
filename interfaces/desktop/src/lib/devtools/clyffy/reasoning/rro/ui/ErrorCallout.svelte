<!--
	@component ErrorCallout
	@kind sys.rro.ui
	@layer domain-ui
	@description Standard error Callout used across all RRO panels.
-->
<script lang="ts">
import { Callout } from "$lib/design/components/callout/index.js";
import { Text } from "$lib/design/components/text/index.js";

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
