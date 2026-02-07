<!--
	@component Accordion
	@description Root context provider for accordion. No DOM element.
	Contract: kind="accordion", slot="root"
-->
<script lang="ts">
import { setAccordionContext } from "./context.js";
import type { AccordionProps } from "./types.js";

let { value = $bindable([]), disabled = false, children }: AccordionProps = $props();

setAccordionContext({
	get value() {
		return value;
	},
	get disabled() {
		return disabled;
	},
});
</script>

{@render children?.()}
