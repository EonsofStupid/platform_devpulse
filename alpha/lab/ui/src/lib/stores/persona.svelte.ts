// Persona Store - Svelte 5 runes for Maestro persona management

import * as api from '$lib/api/persona';

class PersonaStore {
	personas = $state<api.PersonaSummary[]>([]);
	activePersona = $state<api.Persona | null>(null);
	editingPersona = $state<api.Persona | null>(null);
	defaultInstructions = $state<string>('');
	loading = $state(false);
	saving = $state(false);
	error = $state<string | null>(null);

	// Edit form state
	editName = $state('');
	editInstructions = $state('');
	editPersonality = $state('');
	editVerbosity = $state('balanced');
	editTone = $state('professional');
	editIncludeExamples = $state(true);
	editExplainReasoning = $state(true);

	async loadAll() {
		this.loading = true;
		this.error = null;
		try {
			const [personas, active, defaults] = await Promise.all([
				api.listPersonas(),
				api.getActivePersona(),
				api.getDefaultInstructions()
			]);
			this.personas = personas;
			this.activePersona = active;
			this.defaultInstructions = defaults.instructions;
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to load personas';
		} finally {
			this.loading = false;
		}
	}

	async loadPersonaForEdit(id: string) {
		this.loading = true;
		this.error = null;
		try {
			const persona = await api.getPersona(id);
			this.editingPersona = persona;
			this.editName = persona.name;
			this.editInstructions = persona.instructions;
			this.editPersonality = persona.personality;
			this.editVerbosity = persona.style.verbosity;
			this.editTone = persona.style.tone;
			this.editIncludeExamples = persona.style.include_examples;
			this.editExplainReasoning = persona.style.explain_reasoning;
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to load persona';
		} finally {
			this.loading = false;
		}
	}

	startNewPersona() {
		this.editingPersona = null;
		this.editName = '';
		this.editInstructions = this.defaultInstructions;
		this.editPersonality = '';
		this.editVerbosity = 'balanced';
		this.editTone = 'professional';
		this.editIncludeExamples = true;
		this.editExplainReasoning = true;
	}

	async savePersona() {
		this.saving = true;
		this.error = null;
		try {
			const style: api.ResponseStyle = {
				verbosity: this.editVerbosity,
				tone: this.editTone,
				include_examples: this.editIncludeExamples,
				explain_reasoning: this.editExplainReasoning
			};

			if (this.editingPersona) {
				// Update existing
				await api.updatePersona(this.editingPersona.id, {
					name: this.editName,
					instructions: this.editInstructions,
					personality: this.editPersonality,
					style
				});
			} else {
				// Create new
				await api.createPersona({
					name: this.editName,
					instructions: this.editInstructions,
					personality: this.editPersonality,
					style
				});
			}
			// Refresh
			await this.loadAll();
			this.editingPersona = null;
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to save persona';
			throw e;
		} finally {
			this.saving = false;
		}
	}

	async setActive(personaId: string) {
		this.loading = true;
		this.error = null;
		try {
			await api.setActivePersona(personaId);
			await this.loadAll();
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to set active persona';
			throw e;
		} finally {
			this.loading = false;
		}
	}

	async deletePersona(id: string) {
		this.loading = true;
		this.error = null;
		try {
			await api.deletePersona(id);
			this.personas = this.personas.filter((p) => p.id !== id);
			if (this.editingPersona?.id === id) {
				this.editingPersona = null;
			}
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to delete persona';
			throw e;
		} finally {
			this.loading = false;
		}
	}

	cancelEdit() {
		this.editingPersona = null;
	}
}

export const personaStore = new PersonaStore();
