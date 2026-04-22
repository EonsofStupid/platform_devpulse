<!--
  @file DevForge route — thin wrapper, composes the domain dashboard.
  @route /devforge
  @domain devforge
  See docs/platform/Desktop.md §2.3 — routes compose feature/ via index.ts.
-->
<script lang="ts">
import { DevForgeDashboard } from "$lib/domains/app/devforge/index.js";
</script>

<DevForgeDashboard />
