<!--
  @file Customize Individual Models
  @route /model-loader/customize
  @domain models

  Every slot across Brain, Encoder, Voice, Helpers and Routing (ConfigView, which
  absorbed Step2Brain to Step5Helpers and CustomizeStep).
-->
<script lang="ts">
import { SetupWizard, setupWizardOverlayState } from "#lib/domains/app/models/index.js";
import { hrefOf, routeAt } from "#lib/sys/routing/index.js";
import { goto } from "$app/navigation";

const browse = routeAt("/model-loader/browse");

setupWizardOverlayState.showConfig();
</script>

<SetupWizard checkOnOpen={false} onPickDifferent={() => browse && goto(hrefOf(browse))} />
