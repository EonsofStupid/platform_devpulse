/**
 * Connection Types - Unified connection/status states for DevPulse
 *
 * Technical First Approach:
 * - Maps backend component states to simple UI states
 * - Layman mapping can be added later (Llm → "Thinking Engine", etc.)
 */

/**
 * Simple connection state for UI indicators
 */
export type ConnectionState =
	| 'offline'    // Not running/not available
	| 'connecting' // Loading/initializing
	| 'connected'  // Ready and operational
	| 'error'      // Failed state
	| 'idle';      // Connected but not actively used

/**
 * Connection indicator data for UI
 */
export interface ConnectionIndicator {
	id: string;
	label: string;
	state: ConnectionState;
	detail?: string;       // e.g., "Qwen3-VL-4B" or "2.1GB"
	lastUpdate?: Date;
}

/**
 * All system connections grouped
 */
export interface SystemConnections {
	// Core orchestrator
	maestro: ConnectionIndicator;

	// Backend engine
	engine: ConnectionIndicator;

	// Memory/Vector DB
	memory: ConnectionIndicator;

	// Voice systems
	voice: {
		tts: ConnectionIndicator;
		stt: ConnectionIndicator;
	};

	// External integrations (future)
	ide?: ConnectionIndicator;
}

/**
 * Session metrics - technical data
 */
export interface SessionMetrics {
	startTime: Date;
	durationMs: number;
	contextSwitches: number;
	keystrokesPerMin: number;
	errorsToday: number;
	focusScore: number; // 0-100 derived from activity patterns
}

/**
 * Active context - what we're working on
 */
export interface ActiveContext {
	ide: string;           // "Cursor", "VSCode", etc.
	file?: string;         // current file path
	line?: number;         // cursor line
	repository?: string;   // git repo name
	branch?: string;       // git branch
	mood: 'fire' | 'calm' | 'focus' | 'stress';
	tracking: boolean;     // is file watcher active
}

/**
 * Signal detection - patterns detected
 */
export interface ActiveSignal {
	id: string;
	type: 'typing' | 'error' | 'activity' | 'idle' | 'custom';
	label: string;
	value?: number | string;
	severity: 'info' | 'warning' | 'critical';
	timestamp: Date;
}

/**
 * Terminal output entry
 */
export interface TerminalEntry {
	id: string;
	type: 'stdout' | 'stderr' | 'error' | 'build' | 'test';
	content: string;
	timestamp: Date;
	hasError: boolean;
	errorType?: string;  // "TypeError", "SyntaxError", etc.
}

/**
 * Map backend LoadState to simple ConnectionState
 */
export function mapLoadState(
	state: 'NotLoaded' | 'Loading' | 'Loaded' | 'Skipped' | { Failed: { error: string } }
): ConnectionState {
	if (typeof state === 'string') {
		switch (state) {
			case 'Loaded':
				return 'connected';
			case 'Loading':
				return 'connecting';
			case 'NotLoaded':
				return 'offline';
			case 'Skipped':
				return 'idle';
			default:
				return 'offline';
		}
	}
	// Failed state
	if ('Failed' in state) {
		return 'error';
	}
	return 'offline';
}
