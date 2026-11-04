/**
 * @file Setup session draft state.
 * @module @devpulse/domains/app/models/data-access/setup-session-state
 */

import { logInfo } from "#lib/sys/logger.js";
import { modelsState } from "./models.state.svelte.js";

class SetupSessionState {
	private pendingSelections = $state<Record<string, string>>({});

	committedModelId(slotId: string): string | null {
		return modelsState.slots.find((slot) => slot.id === slotId)?.assigned_model_id ?? null;
	}

	pendingModelId(slotId: string): string | null {
		return this.pendingSelections[slotId] ?? null;
	}

	selectedModelId(slotId: string): string | null {
		return this.pendingModelId(slotId) ?? this.committedModelId(slotId);
	}

	get hasPendingSelections(): boolean {
		return Object.keys(this.pendingSelections).length > 0;
	}

	get pendingEntries(): Array<[string, string]> {
		return Object.entries(this.pendingSelections);
	}

	selectModel(slotId: string, modelId: string | null): void {
		const nextSelections = { ...this.pendingSelections };
		const committedModelId = this.committedModelId(slotId);

		if (!modelId || modelId === committedModelId) {
			delete nextSelections[slotId];
		} else {
			nextSelections[slotId] = modelId;
		}

		this.pendingSelections = nextSelections;
	}

	clearSlot(slotId: string): void {
		if (!(slotId in this.pendingSelections)) {
			return;
		}

		const nextSelections = { ...this.pendingSelections };
		delete nextSelections[slotId];
		this.pendingSelections = nextSelections;
	}

	isDirty(slotId: string): boolean {
		return this.pendingModelId(slotId) !== null;
	}

	clearAll(): void {
		if (!this.hasPendingSelections) {
			return;
		}

		this.pendingSelections = {};
	}

	async applyPendingSelections(): Promise<void> {
		const pendingEntries = this.pendingEntries;

		for (const [slotId, modelId] of pendingEntries) {
			const committedModelId = this.committedModelId(slotId);
			if (!modelId || modelId === committedModelId) {
				this.clearSlot(slotId);
				continue;
			}

			const status = modelsState.statuses[slotId];
			if (status?.type === "loading" || status?.type === "unloading") {
				throw new Error(
					`Slot ${slotId} is still transitioning. Wait for it to finish before applying.`,
				);
			}

			logInfo("models.setupSession", `Applying pending selection ${slotId} -> ${modelId}`);

			if (status?.type === "hot") {
				await modelsState.swap(slotId, modelId);
			} else if (status?.type === "warm") {
				await modelsState.unload(slotId);
				await modelsState.assign(slotId, modelId);
				await modelsState.warm(slotId);
			} else {
				await modelsState.assign(slotId, modelId);
			}

			this.clearSlot(slotId);
		}
	}
}

export const setupSessionState = new SetupSessionState();
