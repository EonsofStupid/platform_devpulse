<!--
	@file /devtools/clyffy/reasoning/rrd — thin route shell.
	@route /devtools/clyffy/reasoning/rrd

	Mounts the RRD devtool feature component. All logic + IPC live in
	`$lib/devtools/clyffy/reasoning/rrd/`.
-->
<script lang="ts">
import { RrdDevtool } from "$lib/devtools/clyffy/reasoning/rrd/index.js";
</script>

<RrdDevtool />
