<!--
  @file WiredfrontDashboard — Wiredfront domain dashboard.
  Rendered by (app)/wiredfront/+page.svelte.
  Hub: Screenshots, Video Editor, Audio Editor, Image Editor, Streaming, Notes, Voice.
-->
<script lang="ts">
import {
	AudioLines,
	Camera,
	HardDrive,
	ImagePlus,
	Mic,
	Radio,
	StickyNote,
	Video,
} from "lucide-svelte";
import { Widget } from "$lib/design/blocks/widgets/index.js";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
</script>

<div class="grid grid-cols-12 gap-4" data-page="wiredfront-dashboard">
	<!-- Row 1: Storage + Screenshots -->
	<div class="col-span-4">
		<Widget
			title="Storage"
			icon={HardDrive}
			surface="glass-deep"
			depth="z2"
			bevel="subtle"
			glow="teal"
			frame="accent-teal"
			radius="lg"
		>
			<div class={stack({ gap: "2" })}>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Total Files</Text>
					<Text>0</Text>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Storage Used</Text>
					<Text>0 MB</Text>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Captures Today</Text>
					<Text>0</Text>
				</div>
			</div>
		</Widget>
	</div>

	<div class="col-span-8">
		<Widget
			title="Screenshots"
			icon={Camera}
			surface="glass-deep"
			depth="z2"
			bevel="soft"
			glow="purple"
			frame="soft"
			radius="lg"
			tabs={[
				{ id: "recent", label: "Recent" },
				{ id: "annotated", label: "Annotated" },
				{ id: "collections", label: "Collections" },
			]}
			activeTab="recent"
		>
			<Text as="p" size="sm" color="muted">Screen capture tool with annotation, OCR, and smart cropping.</Text>
		</Widget>
	</div>

	<!-- Row 2: Video + Audio -->
	<div class="col-span-6">
		<Widget
			title="Video Editor"
			icon={Video}
			surface="glass-deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
			tabs={[
				{ id: "projects", label: "Projects" },
				{ id: "exports", label: "Exports" },
			]}
			activeTab="projects"
		>
			<Text as="p" size="sm" color="muted">Edit video files, trim clips, add overlays and transitions.</Text>
		</Widget>
	</div>

	<div class="col-span-6">
		<Widget
			title="Audio Editor"
			icon={AudioLines}
			surface="glass-deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
		>
			<Text as="p" size="sm" color="muted">Audio editing, noise reduction, format conversion, and waveform visualization.</Text>
		</Widget>
	</div>

	<!-- Row 3: Image + Streaming -->
	<div class="col-span-6">
		<Widget
			title="Image Editor"
			icon={ImagePlus}
			surface="glass-deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
		>
			<Text as="p" size="sm" color="muted">Resize, crop, filter, and batch-process images for web and social.</Text>
		</Widget>
	</div>

	<div class="col-span-6">
		<Widget
			title="Streaming"
			icon={Radio}
			surface="glass-deep"
			depth="z1"
			bevel="subtle"
			glow="ember"
			frame="soft"
			radius="lg"
			tabs={[
				{ id: "twitch", label: "Twitch" },
				{ id: "youtube", label: "YouTube" },
				{ id: "angryvibers", label: "AngryVibers" },
			]}
			activeTab="twitch"
		>
			<div class={stack({ gap: "2" })}>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Status</Text>
					<Badge variant="neutral" size="sm">Offline</Badge>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Viewers</Text>
					<Text color="muted">--</Text>
				</div>
			</div>
		</Widget>
	</div>

	<!-- Row 4: Notes + Voice -->
	<div class="col-span-6">
		<Widget
			title="Notes"
			icon={StickyNote}
			surface="glass-deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
		>
			<Text as="p" size="sm" color="muted">Quick notes, markdown support, project-linked documentation.</Text>
		</Widget>
	</div>

	<div class="col-span-6">
		<Widget
			title="Voice"
			icon={Mic}
			surface="glass-deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
		>
			<div class={stack({ gap: "2" })}>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Recordings</Text>
					<Text>0</Text>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Transcriptions</Text>
					<Text>0</Text>
				</div>
			</div>
		</Widget>
	</div>
</div>
