<!--
  @file WiredfrontDashboard — Wiredfront domain dashboard.
  Rendered by (app)/wiredfront/+page.svelte.
  Hub: Screenshots, Video Editor, Audio Editor, Image Editor, Streaming, Notes, Voice.
-->
<script lang="ts">
import { Widget } from "@devpulse/coldlight/blocks/widgets";
import { Badge } from "@devpulse/coldlight/components/badge";
import { Text } from "@devpulse/coldlight/components/text";
import { hstack, stack } from "@devpulse/coldlight/utils";
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
import { copyState } from "$lib/sys/copy/index.js";

const unavailable = $derived(copyState.catalog?.hubs.dashboard.unavailable);
</script>

<div class="grid grid-cols-12 gap-4" data-page="wiredfront-dashboard">
	<!-- Row 1: Storage + Screenshots -->
	<div class="col-span-4">
		<Widget
			title="Storage"
			icon={HardDrive}
			surface="glass" variant="deep"
			depth="z2"
			bevel="subtle"
			glow="teal"
			frame="accent-teal"
			radius="lg"
		>
			<div class={stack({ gap: "2" })}>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Total Files</Text>
					<Text color="muted">{unavailable}</Text>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Storage Used</Text>
					<Text color="muted">{unavailable}</Text>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Captures Today</Text>
					<Text color="muted">{unavailable}</Text>
				</div>
			</div>
		</Widget>
	</div>

	<div class="col-span-8">
		<Widget
			title="Screenshots"
			icon={Camera}
			surface="glass" variant="deep"
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
			surface="glass" variant="deep"
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
			surface="glass" variant="deep"
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
			surface="glass" variant="deep"
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
			surface="glass" variant="deep"
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
					<Badge variant="neutral" size="sm">{unavailable}</Badge>
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
			surface="glass" variant="deep"
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
			surface="glass" variant="deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
		>
			<div class={stack({ gap: "2" })}>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Recordings</Text>
					<Text color="muted">{unavailable}</Text>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Transcriptions</Text>
					<Text color="muted">{unavailable}</Text>
				</div>
			</div>
		</Widget>
	</div>
</div>
