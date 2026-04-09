<!--
  @file Model Loader — Wizard Route
  @route /model-loader
  @domain models

  Renders the SetupWizard from the domain.
  Domain owns all logic, state, and components.
  Route composes and renders. Nothing else.
-->
<script lang="ts">
import { goto } from "$app/navigation";
import SetupWizard from "$lib/domains/app/models/features/setup-wizard/SetupWizard.svelte";

function handleComplete(): void {
	goto("/devpulse");
}
</script>

<SetupWizard onComplete={handleComplete} />
