<!--
  @file Model Loader — Wizard Route
  @route /model-loader
  @domain models

  Renders the SetupWizard from the domain.
  Domain owns all logic, state, and components.
  Route composes and renders. Nothing else.
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import SetupWizard from "$lib/domains/app/models/features/setup-wizard/SetupWizard.svelte";

function handleComplete(): void {
	invoke("close_window", { label: "model-loader" });
}
</script>

<SetupWizard onComplete={handleComplete} />
