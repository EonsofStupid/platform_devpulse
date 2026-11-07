/**
 * TanStack Query Client Configuration
 * Optimized for Tauri desktop app with local AI + API fallback
 */
import { QueryClient } from '@tanstack/svelte-query';

/**
 * Create a QueryClient instance with settings optimized for desktop use:
 * - Longer stale times (local data doesn't change often)
 * - No refetch on window focus (not a web app)
 * - Retry logic for API calls
 */
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Data is considered fresh for 5 minutes
			staleTime: 1000 * 60 * 5,
			// Cache data for 30 minutes
			gcTime: 1000 * 60 * 30,
			// Don't refetch on window focus (desktop app)
			refetchOnWindowFocus: false,
			// Don't refetch on reconnect (local-first)
			refetchOnReconnect: false,
			// Retry failed queries 2 times
			retry: 2,
			// Exponential backoff
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
		},
		mutations: {
			// Retry mutations once
			retry: 1,
		},
	},
});
