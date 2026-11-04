<!--
  @file Wiredfront route — thin wrapper, composes the domain dashboard.
  @route /wiredfront
  @domain wiredfront
  See docs/platform/Desktop.md §2.3 — routes compose feature/ via index.ts.
-->
<script lang="ts">
import { WiredfrontDashboard } from "#lib/domains/app/wiredfront/index.js";
</script>

<WiredfrontDashboard />
