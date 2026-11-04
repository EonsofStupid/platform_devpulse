<!--
  @file You're all set
  @route /model-loader/complete
  @domain models

  Review and launch (DoneView, which absorbed Step7Complete and CompletionStep).
-->
<script lang="ts">
import { SetupWizard, setupWizardOverlayState } from "#lib/domains/app/models/index.js";
import { hrefOf, routeAt } from "#lib/sys/routing/index.js";
import { goto } from "$app/navigation";

const browse = routeAt("/model-loader/browse");

setupWizardOverlayState.showDone();
</script>

<SetupWizard checkOnOpen={false} onPickDifferent={() => browse && goto(hrefOf(browse))} />
