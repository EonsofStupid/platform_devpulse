/**
 * App Initialization Service
 * 
 * Called once on app mount. Initializes all stores and starts background tasks.
 */
import { statusStore, projectsStore, voiceStore, profileStore, databaseStore } from '$lib/stores';

let initialized = false;

export async function initApp(): Promise<void> {
	if (initialized) return;
	initialized = true;

	console.log('[init] Starting DevPulse initialization...');

	try {
		// Initialize profile first (determines tenant context)
		await profileStore.init();
		console.log('[init] Profile loaded:', profileStore.displayName);

		// Initialize databases
		await databaseStore.init();
		console.log('[init] Databases connected');

		// Load app state in parallel
		await Promise.all([
			statusStore.refresh(),
			projectsStore.load(),
			voiceStore.init()
		]);

		console.log('[init] Status:', statusStore.aiReady ? 'AI Ready' : 'AI Loading');
		console.log('[init] Projects:', projectsStore.count);
		console.log('[init] Voice:', voiceStore.status?.tts_ready ? 'Ready' : 'Not Ready');

		// Start background polling
		statusStore.startPolling(10000);

		console.log('[init] DevPulse ready!');
	} catch (e) {
		console.error('[init] Initialization failed:', e);
	}
}
