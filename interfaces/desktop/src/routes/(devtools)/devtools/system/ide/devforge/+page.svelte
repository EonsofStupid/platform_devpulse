<!--
	@file /devtools/system/ide/devforge — thin route shell.
	@route /devtools/system/ide/devforge

	Mounts the DevForge devtool feature component. All logic + IPC live in
	`#lib/devtools/system/ide/devforge//index.js`.
-->
<script lang="ts">
import { DevforgeDevtool } from "#lib/devtools/system/ide/devforge/index.js";
</script>

<DevforgeDevtool />
