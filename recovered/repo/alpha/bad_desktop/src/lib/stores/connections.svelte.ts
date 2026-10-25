/**
 * Connections Store - Unified connection state aggregator
 *
 * Aggregates data from statusStore and modelsStore into
 * simple connection indicators for the UI.
 *
 * Technical First: These are the raw technical states.
 * Layman Facade: Will be added in the UI layer later.
 */
import { statusStore } from './status.svelte';
import { modelsStore } from './models.svelte';
import { onModelLoading, type ModelLoadEvent } from '$lib/api/models';
import {
	type ConnectionIndicator,
	type SystemConnections,
	type SessionMetrics,
	type ActiveContext,
	type ActiveSignal,
	type TerminalEntry,
	type ConnectionState,
	mapLoadState
} from '$lib/types/connections';

class ConnectionsStore {
	// ========================================
	// DERIVED CONNECTION STATES
	// ========================================

	/**
	 * Maestro (Llm/VL Model) connection state
	 * Connected when VL model is loaded in VRAM
	 */
	get maestro(): ConnectionIndicator {
		const llmStatus = statusStore.llmStatus;
		const loadedModel = modelsStore.loadedVlModel;
		const isLoading = modelsStore.isLoadingModel;

		let state: ConnectionState = 'offline';
		let detail: string | undefined;

		if (isLoading) {
			state = 'connecting';
			detail = modelsStore.loadStage || 'Loading...';
		} else if (loadedModel) {
			state = 'connected';
			detail = `${loadedModel.name} (${loadedModel.vram_gb.toFixed(1)}GB)`;
		} else if (llmStatus) {
			state = mapLoadState(llmStatus.state);
			detail = llmStatus.details ?? undefined;
		}

		return {
			id: 'maestro',
			label: 'Maestro',
			state,
			detail
		};
	}

	/**
	 * Engine (Backend) connection state
	 * Connected when we can reach the Tauri backend
	 */
	get engine(): ConnectionIndicator {
		const status = statusStore.status;
		const uptime = statusStore.uptime;

		let state: ConnectionState = 'offline';
		let detail: string | undefined;

		if (statusStore.loading) {
			state = 'connecting';
		} else if (status) {
			state = 'connected';
			// Format uptime
			const hours = Math.floor(uptime / 3600);
			const mins = Math.floor((uptime % 3600) / 60);
			detail = `Uptime: ${hours}h ${mins}m`;
		} else if (statusStore.error) {
			state = 'error';
			detail = statusStore.error;
		}

		return {
			id: 'engine',
			label: 'Engine',
			state,
			detail
		};
	}

	/**
	 * Memory (RRO/Vector DB) connection state
	 */
	get memory(): ConnectionIndicator {
		const rroStatus = statusStore.rroStatus;

		let state: ConnectionState = 'offline';
		let detail: string | undefined;

		if (rroStatus) {
			state = mapLoadState(rroStatus.state);
			if (rroStatus.memory_mb > 0) {
				detail = `${rroStatus.memory_mb.toFixed(0)}MB`;
			}
			if (rroStatus.details) {
				detail = detail ? `${detail} | ${rroStatus.details}` : rroStatus.details;
			}
		}

		return {
			id: 'memory',
			label: 'Memory',
			state,
			detail
		};
	}

	/**
	 * Embedder connection state
	 */
	get embedder(): ConnectionIndicator {
		const embedderStatus = statusStore.embedderStatus;

		let state: ConnectionState = 'offline';
		let detail: string | undefined;

		if (embedderStatus) {
			state = mapLoadState(embedderStatus.state);
			if (embedderStatus.memory_mb > 0) {
				detail = `${embedderStatus.memory_mb.toFixed(0)}MB`;
			}
		}

		return {
			id: 'embedder',
			label: 'Embedder',
			state,
			detail
		};
	}

	/**
	 * Voice TTS connection state
	 */
	get voiceTts(): ConnectionIndicator {
		const ttsStatus = statusStore.systemStatus?.voice_tts;

		let state: ConnectionState = 'offline';
		let detail: string | undefined;

		if (ttsStatus) {
			state = mapLoadState(ttsStatus.state);
			detail = ttsStatus.details ?? undefined;
		}

		return {
			id: 'voice-tts',
			label: 'Voice (TTS)',
			state,
			detail
		};
	}

	/**
	 * Voice STT connection state
	 */
	get voiceStt(): ConnectionIndicator {
		const sttStatus = statusStore.systemStatus?.voice_stt;

		let state: ConnectionState = 'offline';
		let detail: string | undefined;

		if (sttStatus) {
			state = mapLoadState(sttStatus.state);
			detail = sttStatus.details ?? undefined;
		}

		return {
			id: 'voice-stt',
			label: 'Voice (STT)',
			state,
			detail
		};
	}

	/**
	 * Database connection state
	 */
	get database(): ConnectionIndicator {
		const dbStatus = statusStore.systemStatus?.database;

		let state: ConnectionState = 'offline';
		let detail: string | undefined;

		if (dbStatus) {
			state = mapLoadState(dbStatus.state);
			detail = dbStatus.details ?? undefined;
		}

		return {
			id: 'database',
			label: 'Database',
			state,
			detail
		};
	}

	/**
	 * All connections as an object
	 */
	get all(): SystemConnections {
		return {
			maestro: this.maestro,
			engine: this.engine,
			memory: this.memory,
			voice: {
				tts: this.voiceTts,
				stt: this.voiceStt
			}
		};
	}

	/**
	 * All connections as array (for iteration)
	 */
	get list(): ConnectionIndicator[] {
		return [
			this.maestro,
			this.engine,
			this.memory,
			this.embedder,
			this.voiceTts,
			this.voiceStt,
			this.database
		];
	}

	/**
	 * Count of connected components
	 */
	get connectedCount(): number {
		return this.list.filter(c => c.state === 'connected').length;
	}

	/**
	 * Overall system health
	 */
	get systemHealth(): ConnectionState {
		const states = this.list.map(c => c.state);

		if (states.some(s => s === 'error')) return 'error';
		if (states.every(s => s === 'offline')) return 'offline';
		if (states.some(s => s === 'connecting')) return 'connecting';
		if (states.every(s => s === 'connected' || s === 'idle')) return 'connected';

		return 'idle';
	}

	// ========================================
	// SESSION METRICS - Wired to real backend uptime
	// ========================================

	private _contextSwitches = $state(0);
	private _keystrokesPerMin = $state(0);
	private _errorsToday = $state(0);

	/**
	 * Session metrics derived from backend uptime
	 * The "session" is how long the engine has been running
	 */
	get sessionMetrics(): SessionMetrics {
		// Use backend uptime as session duration
		const uptimeSecs = statusStore.uptime;
		const durationMs = uptimeSecs * 1000;

		// Calculate session start time from uptime
		const now = new Date();
		const startTime = new Date(now.getTime() - durationMs);

		// Focus score derived from activity (can be enhanced later)
		const focusScore = Math.min(100, Math.max(0,
			80 - (this._contextSwitches * 2) + (this._keystrokesPerMin > 30 ? 10 : 0)
		));

		return {
			startTime,
			durationMs,
			contextSwitches: this._contextSwitches,
			keystrokesPerMin: this._keystrokesPerMin,
			errorsToday: this._errorsToday,
			focusScore
		};
	}

	/**
	 * Update session activity metrics
	 * Called from file watcher, keystroke tracker, etc.
	 */
	updateSessionActivity(update: {
		contextSwitch?: boolean;
		keystrokesPerMin?: number;
		error?: boolean;
	}): void {
		if (update.contextSwitch) {
			this._contextSwitches++;
		}
		if (update.keystrokesPerMin !== undefined) {
			this._keystrokesPerMin = update.keystrokesPerMin;
		}
		if (update.error) {
			this._errorsToday++;
		}
	}

	// ========================================
	// ACTIVE CONTEXT (Mock for now - wire to file watcher later)
	// ========================================

	private _activeContext = $state<ActiveContext>({
		ide: 'Unknown',
		mood: 'calm',
		tracking: false
	});

	get activeContext(): ActiveContext {
		return this._activeContext;
	}

	updateContext(partial: Partial<ActiveContext>): void {
		this._activeContext = { ...this._activeContext, ...partial };
	}

	// ========================================
	// ACTIVE SIGNALS (events from backend)
	// ========================================

	private _signals = $state<ActiveSignal[]>([]);

	get activeSignals(): ActiveSignal[] {
		return this._signals;
	}

	addSignal(signal: Omit<ActiveSignal, 'id' | 'timestamp'>): void {
		const newSignal: ActiveSignal = {
			...signal,
			id: crypto.randomUUID(),
			timestamp: new Date()
		};
		this._signals = [newSignal, ...this._signals.slice(0, 9)]; // Keep last 10
	}

	clearSignals(): void {
		this._signals = [];
	}

	// ========================================
	// TERMINAL OUTPUT (errors, build output, etc.)
	// ========================================

	private _terminalEntries = $state<TerminalEntry[]>([]);

	get terminalEntries(): TerminalEntry[] {
		return this._terminalEntries;
	}

	get latestError(): TerminalEntry | null {
		return this._terminalEntries.find(e => e.hasError) ?? null;
	}

	addTerminalEntry(entry: Omit<TerminalEntry, 'id' | 'timestamp'>): void {
		const newEntry: TerminalEntry = {
			...entry,
			id: crypto.randomUUID(),
			timestamp: new Date()
		};
		this._terminalEntries = [newEntry, ...this._terminalEntries.slice(0, 49)]; // Keep last 50
	}

	clearTerminal(): void {
		this._terminalEntries = [];
	}

	// ========================================
	// INITIALIZATION & EVENT SUBSCRIPTIONS
	// ========================================

	private _unlistenModel: (() => void) | null = null;
	private _initialized = false;

	/**
	 * Initialize connections store and set up event listeners
	 * Should be called once on app startup
	 */
	async init(): Promise<void> {
		if (this._initialized) return;
		this._initialized = true;

		// Subscribe to model loading events
		try {
			this._unlistenModel = await onModelLoading((event: ModelLoadEvent) => {
				this.handleModelLoadEvent(event);
			});
		} catch (e) {
			console.warn('Failed to subscribe to model loading events:', e);
		}

		// Add initial signal
		this.addSignal({
			type: 'activity',
			label: 'Connections initialized',
			severity: 'info'
		});
	}

	/**
	 * Clean up event subscriptions
	 */
	destroy(): void {
		if (this._unlistenModel) {
			this._unlistenModel();
			this._unlistenModel = null;
		}
		this._initialized = false;
	}

	/**
	 * Handle model loading events and convert to signals
	 */
	private handleModelLoadEvent(event: ModelLoadEvent): void {
		switch (event.stage) {
			case 'starting':
				this.addSignal({
					type: 'activity',
					label: `Loading ${event.model_id}`,
					severity: 'info'
				});
				break;

			case 'loading':
				// Update existing signal with progress (could track by model_id)
				break;

			case 'complete':
				this.addSignal({
					type: 'activity',
					label: `Model ${event.model_id} loaded`,
					severity: 'info'
				});
				break;

			case 'error':
				this.addSignal({
					type: 'error',
					label: `Model load failed: ${event.error || 'Unknown error'}`,
					severity: 'critical'
				});
				// Also add to terminal as error
				this.addTerminalEntry({
					type: 'error',
					content: `Model loading failed: ${event.error || 'Unknown error'}\nModel: ${event.model_id}`,
					hasError: true,
					errorType: 'MODEL_LOAD'
				});
				this.updateSessionActivity({ error: true });
				break;
		}
	}

	/**
	 * Callback registry for external systems to push events
	 */
	private _eventCallbacks: Array<(signal: ActiveSignal) => void> = [];

	onSignal(callback: (signal: ActiveSignal) => void): () => void {
		this._eventCallbacks.push(callback);
		return () => {
			const idx = this._eventCallbacks.indexOf(callback);
			if (idx >= 0) this._eventCallbacks.splice(idx, 1);
		};
	}
}

export const connectionsStore = new ConnectionsStore();
