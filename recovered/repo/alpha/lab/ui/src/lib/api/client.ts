// API Client - Base URL and helpers for Lab backend communication

const BASE_URL = 'http://localhost:3001';

export async function get<T>(path: string): Promise<T> {
	const res = await fetch(`${BASE_URL}${path}`);
	if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
	return res.json();
}

export async function post<T, R>(path: string, body: T): Promise<R> {
	const res = await fetch(`${BASE_URL}${path}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
	return res.json();
}

export async function del<T>(path: string): Promise<T> {
	const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE' });
	if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
	return res.json();
}

export function connectWebSocket(path: string): WebSocket {
	return new WebSocket(`ws://localhost:3001${path}`);
}

export function connectSSE(path: string): EventSource {
	return new EventSource(`${BASE_URL}${path}`);
}
