/**
 * App Initialization Service
 *
 * Called once on app mount. Initializes all stores and starts background tasks.
 */
import { statusStore, projectsStore, voiceStore, profileStore, databaseStore } from '$lib/stores';

let initialized = false;
let initPromise: Promise<void> | null = null;

export async function initApp(): Promise<void> {
	// Prevent double init but allow re-init if previous failed
	if (initialized) return;

	// If already initializing, wait for that
	if (initPromise) {
		return initPromise;
	}

	initPromise = doInit();
	return initPromise;
}

async function doInit(): Promise<void> {
	console.log('[init] Starting DevPulse initialization...');

	try {
		// Initialize profile first (determines tenant context)
		console.log('[init] Loading profile...');
		await profileStore.init().catch(e => {
			console.warn('[init] Profile failed (continuing):', e);
		});
		console.log('[init] Profile loaded:', profileStore.displayName);

		// Initialize databases
		console.log('[init] Connecting databases...');
		await databaseStore.init().catch(e => {
			console.warn('[init] Database failed (continuing):', e);
		});
		console.log('[init] Databases connected');

		// Load app state - don't fail all if one fails
		console.log('[init] Loading app state...');
		const results = await Promise.allSettled([
			statusStore.refresh(),
			projectsStore.load(),
			voiceStore.init()
		]);

		results.forEach((result, i) => {
			const name = ['status', 'projects', 'voice'][i];
			if (result.status === 'rejected') {
				console.warn(`[init] ${name} failed:`, result.reason);
			}
		});

		console.log('[init] Status:', statusStore.aiReady ? 'AI Ready' : 'AI Loading');
		console.log('[init] Projects:', projectsStore.count);
		console.log('[init] Voice:', voiceStore.status?.tts_ready ? 'Ready' : 'Not Ready');

		// Start background polling
		statusStore.startPolling(10000);

		initialized = true;
		console.log('[init] DevPulse ready!');
	} catch (e) {
		console.error('[init] Initialization failed:', e);
		initPromise = null; // Allow retry on failure
		throw e;
	}
}

/** Force re-initialization (for debugging) */
export function resetInit(): void {
	initialized = false;
	initPromise = null;
}
