<!--
	@file /devtools/clyffy/ears/stt — thin route shell.
	@route /devtools/clyffy/ears/stt

	Mounts the STT devtool feature component. All logic + IPC live in
	`#lib/devtools/clyffy/ears/stt//index.js`.
-->
<script lang="ts">
import { SttDevtool } from "#lib/devtools/clyffy/ears/stt/index.js";
</script>

<SttDevtool />
