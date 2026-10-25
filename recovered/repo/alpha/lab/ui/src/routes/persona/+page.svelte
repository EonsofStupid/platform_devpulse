<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import { personaStore } from '$lib/stores/persona.svelte';

	let showEditor = $state(false);

	onMount(() => {
		personaStore.loadAll();
	});

	function startEdit(id: string) {
		personaStore.loadPersonaForEdit(id);
		showEditor = true;
	}

	function startNew() {
		personaStore.startNewPersona();
		showEditor = true;
	}

	async function save() {
		try {
			await personaStore.savePersona();
			showEditor = false;
		} catch {
			// Error handled in store
		}
	}

	function cancel() {
		personaStore.cancelEdit();
		showEditor = false;
	}

	function formatDate(ts: number): string {
		return new Date(ts * 1000).toLocaleDateString();
	}
</script>

<div class="flex flex-col h-full">
	<Header title="Maestro Personas" />

	<div class="flex-1 p-6 overflow-auto">
		{#if !showEditor}
			<!-- List View -->
			<div class="flex justify-between items-center mb-6">
				<div class="text-gray-400">
					Configure Maestro's personality and system instructions.
				</div>
				<button
					onclick={startNew}
					class="px-4 py-2 bg-accent-purple/20 text-accent-purple border border-accent-purple rounded-lg hover:bg-accent-purple/30 transition-all"
				>
					Create New Persona
				</button>
			</div>

			<!-- Active persona highlight -->
			{#if personaStore.activePersona}
				<div class="glass p-4 mb-6 border-accent-purple/50">
					<div class="flex items-center justify-between mb-3">
						<h3 class="text-sm font-medium text-accent-purple">Active Persona</h3>
						<button
							onclick={() => startEdit(personaStore.activePersona!.id)}
							class="text-xs text-gray-400 hover:text-white transition-all"
						>
							Edit
						</button>
					</div>
					<div class="text-lg font-semibold mb-2">{personaStore.activePersona.name}</div>
					<div class="text-sm text-gray-400 line-clamp-3">
						{personaStore.activePersona.instructions.slice(0, 200)}...
					</div>
					<div class="flex gap-4 mt-3 text-xs text-gray-500">
						<span>Verbosity: {personaStore.activePersona.style.verbosity}</span>
						<span>Tone: {personaStore.activePersona.style.tone}</span>
					</div>
				</div>
			{/if}

			<!-- Persona list -->
			<div class="glass p-4">
				<h3 class="text-sm font-medium text-gray-400 mb-3">All Personas</h3>
				<div class="space-y-2">
					{#each personaStore.personas as persona}
						<div
							class="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
						>
							<div class="flex items-center gap-3">
								<div
									class="w-2 h-2 rounded-full {persona.is_active
										? 'bg-accent-purple'
										: 'bg-gray-500'}"
								></div>
								<div>
									<div class="font-medium flex items-center gap-2">
										{persona.name}
										{#if persona.is_default}
											<span class="px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded"
												>Default</span
											>
										{/if}
									</div>
								</div>
							</div>
							<div class="flex items-center gap-2">
								{#if persona.is_active}
									<span class="px-2 py-1 text-xs bg-accent-purple/20 text-accent-purple rounded"
										>Active</span
									>
								{:else}
									<button
										onclick={() => personaStore.setActive(persona.id)}
										disabled={personaStore.loading}
										class="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-all"
									>
										Set Active
									</button>
								{/if}
								<button
									onclick={() => startEdit(persona.id)}
									class="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-all"
								>
									Edit
								</button>
								{#if !persona.is_default}
									<button
										onclick={() => personaStore.deletePersona(persona.id)}
										disabled={personaStore.loading}
										class="px-3 py-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition-all"
									>
										Delete
									</button>
								{/if}
							</div>
						</div>
					{/each}
					{#if personaStore.personas.length === 0 && !personaStore.loading}
						<div class="text-gray-500 text-sm">No personas found</div>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Editor View -->
			<div class="glass p-6">
				<div class="flex items-center justify-between mb-6">
					<h3 class="text-lg font-medium">
						{personaStore.editingPersona ? 'Edit Persona' : 'Create New Persona'}
					</h3>
					<button onclick={cancel} class="text-gray-400 hover:text-white transition-all">
						Cancel
					</button>
				</div>

				<div class="space-y-6">
					<!-- Name -->
					<div>
						<label class="block text-sm font-medium text-gray-400 mb-2">Name</label>
						<input
							type="text"
							bind:value={personaStore.editName}
							placeholder="e.g., Code Reviewer"
							class="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-purple"
						/>
					</div>

					<!-- Personality (short description) -->
					<div>
						<label class="block text-sm font-medium text-gray-400 mb-2">Personality</label>
						<input
							type="text"
							bind:value={personaStore.editPersonality}
							placeholder="e.g., Helpful, thorough, detail-oriented"
							class="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-purple"
						/>
					</div>

					<!-- Instructions (system prompt) -->
					<div>
						<label class="block text-sm font-medium text-gray-400 mb-2">
							System Instructions
							<button
								onclick={() => (personaStore.editInstructions = personaStore.defaultInstructions)}
								class="ml-2 text-xs text-accent-purple hover:underline"
							>
								Reset to default
							</button>
						</label>
						<textarea
							bind:value={personaStore.editInstructions}
							rows={12}
							placeholder="Enter the system prompt..."
							class="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-purple font-mono"
						></textarea>
					</div>

					<!-- Response Style -->
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-400 mb-2">Verbosity</label>
							<select
								bind:value={personaStore.editVerbosity}
								class="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-purple"
							>
								<option value="concise">Concise</option>
								<option value="balanced">Balanced</option>
								<option value="detailed">Detailed</option>
							</select>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-400 mb-2">Tone</label>
							<select
								bind:value={personaStore.editTone}
								class="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-purple"
							>
								<option value="casual">Casual</option>
								<option value="professional">Professional</option>
								<option value="technical">Technical</option>
								<option value="friendly">Friendly</option>
							</select>
						</div>
					</div>

					<!-- Boolean options -->
					<div class="flex gap-6">
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={personaStore.editIncludeExamples}
								class="w-4 h-4 rounded border-white/20 bg-white/5 text-accent-purple focus:ring-accent-purple"
							/>
							<span class="text-sm text-gray-400">Include code examples</span>
						</label>
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={personaStore.editExplainReasoning}
								class="w-4 h-4 rounded border-white/20 bg-white/5 text-accent-purple focus:ring-accent-purple"
							/>
							<span class="text-sm text-gray-400">Explain reasoning</span>
						</label>
					</div>

					<!-- Actions -->
					<div class="flex justify-end gap-3 pt-4 border-t border-white/10">
						<button
							onclick={cancel}
							class="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
						>
							Cancel
						</button>
						<button
							onclick={save}
							disabled={personaStore.saving || !personaStore.editName.trim()}
							class="px-4 py-2 bg-accent-purple/20 text-accent-purple border border-accent-purple rounded-lg hover:bg-accent-purple/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if personaStore.saving}
								Saving...
							{:else}
								Save Persona
							{/if}
						</button>
					</div>
				</div>
			</div>
		{/if}

		{#if personaStore.error}
			<div class="mt-4 p-4 glass border-red-500/50 text-red-400">
				{personaStore.error}
			</div>
		{/if}
	</div>
</div>
