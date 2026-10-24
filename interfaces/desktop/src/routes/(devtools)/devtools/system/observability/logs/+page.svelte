<!--
	@file /devtools/system/observability/logs — thin route shell.
	@route /devtools/system/observability/logs

	Mounts the Action log devtool, a System › Observability devtool whose
	dashboard tile comes from this folder (plan 0008 R19). Its logic and IPC
	live in `$lib/devtools/system/observability/logs/` (R20b).
-->
<script lang="ts">
import { ActionLogDevtool } from "$lib/devtools/system/observability/logs/index.js";
</script>

<ActionLogDevtool />
