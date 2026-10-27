<script module>
import { defineMeta } from "@storybook/addon-svelte-csf";
import { UiDemoDashboard } from "$lib/domains/app/ui-demo/index.js";

const { Story } = defineMeta({
	title: "ColdLight/Composition review",
	component: UiDemoDashboard,
	parameters: { layout: "fullscreen" },
});
</script>

<Story name="Surface families" />
