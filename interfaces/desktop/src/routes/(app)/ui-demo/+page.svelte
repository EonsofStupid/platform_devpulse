<!--
  @file UI Demo route — thin wrapper, composes the domain dashboard.
  @route /ui-demo
  @domain ui-demo
  See docs/platform/Desktop.md §2.3 — routes compose feature/ via index.ts.
-->
<script lang="ts">
import { UiDemoDashboard } from "#lib/domains/app/ui-demo/index.js";
</script>

<UiDemoDashboard />
