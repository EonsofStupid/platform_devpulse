<!--
  @file Welcome route for the setup wizard
  @route /model-loader

  Route-rendered entrypoint for first-run setup.
  The visual shell is owned by routes/(setup)/+layout.svelte and
  SetupWizardOverlay.svelte; this page renders the welcome step.
-->
<script lang="ts">
import { goto } from "$app/navigation";
import { WelcomeStep } from "$lib/domains/app/models/features/setup-wizard/index.js";

function handleContinue(): void {
	goto("/model-loader/models", { noScroll: true });
}
</script>

<WelcomeStep onContinue={handleContinue} />
