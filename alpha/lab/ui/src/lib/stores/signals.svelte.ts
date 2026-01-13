// Signal Store - Svelte 5 runes for real-time signal stream

import { connectSignalStream, type SignalEvent } from '$lib/api/signals';

class SignalStore {
	signals = $state<SignalEvent[]>([]);
	connected = $state(false);
	filter = $state<string | null>(null);

	private source: EventSource | null = null;
	private maxSignals = 100;

	get filtered() {
		if (!this.filter) return this.signals;
		return this.signals.filter((s) => s.signal_type === this.filter);
	}

	get stats() {
		const byType: Record<string, number> = {};
		for (const s of this.signals) {
			byType[s.signal_type] = (byType[s.signal_type] || 0) + 1;
		}
		return byType;
	}

	connect() {
		if (this.source) return;

		this.source = connectSignalStream(
			(signal) => {
				this.signals = [signal, ...this.signals].slice(0, this.maxSignals);
			},
			() => {
				this.connected = false;
			}
		);

		this.connected = true;
	}

	disconnect() {
		this.source?.close();
		this.source = null;
		this.connected = false;
	}

	setFilter(type: string | null) {
		this.filter = type;
	}

	clear() {
		this.signals = [];
	}
}

export const signalStore = new SignalStore();
