<!--
  @file DevPulse Settings
  @route /devpulse/settings
  @domain devpulse
-->
<script lang="ts">
	import { Stack } from "$lib/design/components/stack/index.js";
	import { HStack } from "$lib/design/components/hstack/index.js";
	import { Text } from "$lib/design/components/text/index.js";
	import { Container } from "$lib/design/components/container/index.js";
	import { Widget } from "$lib/design/blocks/widgets/index.js";
</script>

<Container class="container-md box-lg" data-page="devpulse-settings">
	<Stack gap="4">
		<Widget title="Profile">
			<Stack gap="3">
				<HStack justify="between">
					<Text color="secondary">Display Name</Text>
					<Text>Developer</Text>
				</HStack>
				<HStack justify="between">
					<Text color="secondary">Theme</Text>
					<Text>ColdLight Dark</Text>
				</HStack>
			</Stack>
		</Widget>

		<Widget title="Integrations">
			<Text as="p" size="sm" color="muted">GitHub, GitLab, and Bitbucket integrations will be configured here.</Text>
		</Widget>
	</Stack>
</Container>
