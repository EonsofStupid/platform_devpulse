<!--
  @file DevPulse route — thin wrapper, composes the domain dashboard.
  @route /devpulse
  @domain devpulse
  See docs/platform/Desktop.md §2.3 — routes compose feature/ via index.ts.
-->
<script lang="ts">
import { DevPulseDashboard } from "$lib/domains/app/devpulse/index.js";
</script>

<DevPulseDashboard />
