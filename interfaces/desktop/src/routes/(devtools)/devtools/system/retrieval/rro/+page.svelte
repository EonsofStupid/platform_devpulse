<!--
	@file /devtools/system/retrieval/rro — thin route shell.
	@route /devtools/system/retrieval/rro

	Per docs/platform/Desktop.md §1.2: routes mirror their domain sister
	and compose feature components. All logic, state, and IPC live in
	$lib/domains/sys/rro.
-->
<script lang="ts">
import { RroDevtool } from "$lib/domains/sys/rro/index.js";
</script>

<RroDevtool />
