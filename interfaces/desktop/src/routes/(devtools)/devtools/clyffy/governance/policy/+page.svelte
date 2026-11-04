<!--
	@file /devtools/clyffy/governance/policy — thin route shell.
	@route /devtools/clyffy/governance/policy

	Mounts the agent-policy devtool feature component. All logic + IPC
	live in `#lib/devtools/clyffy/governance//index.js`.
-->
<script lang="ts">
import { GovernanceDevtool } from "#lib/devtools/clyffy/governance/index.js";
</script>

<GovernanceDevtool />
