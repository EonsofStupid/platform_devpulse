<!--
  @file About you and your project
  @route /model-loader/profile
  @domain models

  The guided setup from its start: Clyffy's welcome, your name and email, your
  experience level, your project and the live hardware snapshot (WelcomeView,
  which absorbed ProjectSetupStep, Step0Welcome and WelcomeStep). From here the
  five views run in place.
-->
<script lang="ts">
import { goto } from "$app/navigation";
import { SetupWizard, setupWizardOverlayState } from "$lib/domains/app/models/index.js";
import { hrefOf, routeAt } from "$lib/sys/routing/index.js";

const browse = routeAt("/model-loader/browse");

setupWizardOverlayState.showWelcome();
</script>

<SetupWizard onPickDifferent={() => browse && goto(hrefOf(browse))} />
