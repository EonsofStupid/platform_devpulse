<!--
  @file Overmind route — thin wrapper, composes the domain dashboard.
  @route /overmind
  @domain overmind
  See docs/platform/Desktop.md §2.3 — routes compose feature/ via index.ts.
-->
<script lang="ts">
import { OvermindDashboard } from "$lib/domains/app/overmind/index.js";
</script>

<OvermindDashboard />
