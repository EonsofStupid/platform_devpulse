<script lang="ts">
	import { voiceStore } from '$lib/stores/voice.svelte';

	let fileInput: HTMLInputElement;
	let dragOver = $state(false);
	let selectedFiles = $state<File[]>([]);

	// Get the first profile or allow selection
	let selectedProfileId = $state<string | null>(null);
	let profiles = $derived(voiceStore.profiles);

	// Auto-select first profile
	$effect(() => {
		if (!selectedProfileId && profiles.length > 0) {
			selectedProfileId = profiles[0].id;
		}
	});

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragOver = true;
	}

	function handleDragLeave() {
		dragOver = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		const files = Array.from(e.dataTransfer?.files || []);
		addFiles(files);
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const files = Array.from(input.files || []);
		addFiles(files);
		input.value = ''; // Reset for next selection
	}

	function addFiles(files: File[]) {
		const audioFiles = files.filter((f) => f.type.startsWith('audio/'));
		if (audioFiles.length === 0) return;
		selectedFiles = [...selectedFiles, ...audioFiles];
	}

	function removeFile(index: number) {
		selectedFiles = selectedFiles.filter((_, i) => i !== index);
	}

	async function uploadAll() {
		if (!selectedProfileId || selectedFiles.length === 0) return;

		for (const file of selectedFiles) {
			try {
				await voiceStore.uploadSample(selectedProfileId, file);
			} catch (e) {
				console.error('Upload failed:', e);
			}
		}
		selectedFiles = [];
	}

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<div class="glass p-4">
	<h3 class="text-sm font-medium text-gray-400 mb-3">Upload Voice Samples</h3>

	<!-- Profile selector -->
	{#if profiles.length > 0}
		<div class="mb-3">
			<label for="upload-profile-select" class="text-xs text-gray-500 block mb-1">Upload to profile:</label>
			<select
				id="upload-profile-select"
				bind:value={selectedProfileId}
				class="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-accent-purple"
			>
				{#each profiles as profile}
					<option value={profile.id}>{profile.name} ({profile.gender})</option>
				{/each}
			</select>
		</div>
	{:else}
		<div class="text-center text-gray-500 py-4 text-sm">
			Create a profile first to upload samples
		</div>
	{/if}

	<!-- Drop zone -->
	{#if profiles.length > 0}
		<button
			type="button"
			class="drop-zone w-full p-6 border-2 border-dashed rounded-lg text-center transition-all cursor-pointer text-left {dragOver
				? 'border-accent-purple bg-accent-purple/10'
				: 'border-white/20 hover:border-white/40'}"
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
			onclick={() => fileInput.click()}
		>
			<div class="text-3xl mb-2">🎵</div>
			<div class="text-sm text-gray-400">
				{#if dragOver}
					Drop audio files here
				{:else}
					Drag & drop MP3/WAV files or click to browse
				{/if}
			</div>
			<div class="text-xs text-gray-600 mt-1">Max 50MB per file</div>
		</button>

		<input
			type="file"
			accept="audio/*"
			multiple
			bind:this={fileInput}
			onchange={handleFileSelect}
			class="hidden"
		/>
	{/if}

	<!-- Selected files list -->
	{#if selectedFiles.length > 0}
		<div class="mt-3 space-y-2">
			<div class="text-xs text-gray-500">{selectedFiles.length} file(s) selected</div>
			{#each selectedFiles as file, index}
				<div class="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
					<span class="text-accent-purple">🎵</span>
					<div class="flex-1 min-w-0">
						<div class="text-sm text-white truncate">{file.name}</div>
						<div class="text-xs text-gray-500">{formatSize(file.size)}</div>
					</div>
					<button
						type="button"
						class="text-red-400 hover:text-red-300 p-1"
						onclick={() => removeFile(index)}
					>
						✕
					</button>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Upload button + progress -->
	{#if selectedFiles.length > 0}
		<div class="mt-3">
			{#if voiceStore.uploading}
				<div class="mb-2">
					<div class="h-2 bg-white/10 rounded-full overflow-hidden">
						<div
							class="h-full bg-accent-purple transition-all duration-300"
							style="width: {voiceStore.uploadProgress}%"
						></div>
					</div>
					<div class="text-xs text-gray-500 text-center mt-1">{voiceStore.uploadProgress}%</div>
				</div>
			{:else}
				<button
					type="button"
					onclick={uploadAll}
					disabled={!selectedProfileId}
					class="w-full px-4 py-2 bg-accent-green/20 text-accent-green border border-accent-green rounded-lg hover:bg-accent-green/30 transition-all disabled:opacity-50"
				>
					Upload {selectedFiles.length} file(s)
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.drop-zone {
		background: transparent;
	}
</style>
