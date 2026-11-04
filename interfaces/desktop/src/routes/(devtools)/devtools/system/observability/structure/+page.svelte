<!--
	@file /devtools/system/observability/structure — thin route shell.
	@route /devtools/system/observability/structure

	Mounts the Structure devtool, which reads the contracts and registries in
	`#lib/sys`. Its logic lives in `#lib/devtools/system/observability/structure`.
-->
<script lang="ts">
import { StructureDevtool } from "#lib/devtools/system/observability/structure/index.js";
</script>

<StructureDevtool />
