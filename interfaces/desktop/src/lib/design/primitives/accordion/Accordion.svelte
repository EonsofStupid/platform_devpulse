<!--
	@component Accordion
	@description Root context provider for accordion. No DOM element.
	Contract: kind="accordion", slot="root"
-->
<script lang="ts">
	import type { AccordionProps } from "./types.js";
	import { setAccordionContext } from "./context.js";

	let { value = $bindable([]), disabled = false, children }: AccordionProps = $props();

	setAccordionContext({
		get value() { return value; },
		get disabled() { return disabled; },
	});
</script>

{@render children?.()}
