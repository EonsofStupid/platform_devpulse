// Signal API - Real-time signal streaming

import { connectWebSocket, connectSSE } from './client';

export interface SignalEvent {
	id: string;
	signal_type: 'chat' | 'inference' | 'rumination' | 'thought_node' | 'debug';
	source: 'user' | 'system' | 'expert' | 'clock';
	timestamp: string;
	payload: unknown;
}

export function connectSignalStream(
	onSignal: (signal: SignalEvent) => void,
	onError?: (error: Event) => void
): EventSource {
	const source = connectSSE('/api/signals/stream');

	source.onmessage = (event) => {
		const signal = JSON.parse(event.data) as SignalEvent;
		onSignal(signal);
	};

	source.onerror = (event) => {
		onError?.(event);
	};

	return source;
}

export function connectSignalWebSocket(
	onSignal: (signal: SignalEvent) => void,
	onClose?: () => void
): WebSocket {
	const ws = connectWebSocket('/api/signals/ws');

	ws.onmessage = (event) => {
		const signal = JSON.parse(event.data) as SignalEvent;
		onSignal(signal);
	};

	ws.onclose = () => {
		onClose?.();
	};

	return ws;
}
