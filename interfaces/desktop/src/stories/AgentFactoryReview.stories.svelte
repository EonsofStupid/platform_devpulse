<script module>
import { defineMeta } from "@storybook/addon-svelte-csf";
import FactoryReview from "#lib/domains/agenthub/fixtures/FactoryReview.svelte";

const { Story } = defineMeta({
	title: "AgentHub/Factory review",
	component: FactoryReview,
	parameters: { layout: "fullscreen" },
});
</script>

<Story name="Tickets and human review" />
