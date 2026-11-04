<!--
	@file /devtools/system/datastores/project-db — thin route shell.
	@route /devtools/system/datastores/project-db

	Mounts the Project-DB devtool feature component. All logic + IPC live in
	`#lib/devtools/system/datastores/project-db//index.js`.
-->
<script lang="ts">
import { ProjectDbDevtool } from "#lib/devtools/system/datastores/project-db/index.js";
</script>

<ProjectDbDevtool />
