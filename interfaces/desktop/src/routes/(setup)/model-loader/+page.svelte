<!--
  @file Welcome route for the setup wizard
  @route /model-loader

	Route-rendered entrypoint for first-run setup.
	The visual shell is owned by routes/(setup)/+layout.svelte;
	this page renders the canonical welcome step.
-->
<script lang="ts">
import { goto } from "$app/navigation";
import { WelcomeStep } from "$lib/domains/app/models/features/setup-wizard/index.js";
import { logError, logInfo } from "$lib/sys/logger.js";

function handleContinue(): void {
	logInfo("wizard.welcome", "Let's Go clicked — navigating to /model-loader/models (noScroll)");
	void goto("/model-loader/models", { noScroll: true })
		.then(() => {
			logInfo("wizard.welcome", "goto(/model-loader/models) settled");
		})
		.catch((e) => {
			logError(
				"wizard.welcome",
				`goto(/model-loader/models) FAILED: ${e instanceof Error ? e.message : String(e)}`,
			);
		});
}
</script>

<WelcomeStep onContinue={handleContinue} />
