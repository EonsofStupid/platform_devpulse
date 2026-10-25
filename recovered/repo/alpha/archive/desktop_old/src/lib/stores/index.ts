/**
 * Desktop Stores - SSOT for all app state (Svelte 5 runes)
 * 
 * Architecture:
 * - All stores use class pattern with $state/$derived
 * - Stores call API layer (lib/api/) for Tauri commands
 * - Components import from here, never create local state for shared data
 */

// Core app state
export { chatStore, type ChatMode, type AssistantMode, type PanelType } from './chat.svelte';
export { statusStore } from './status.svelte';
export { projectsStore } from './projects.svelte';
export { voiceStore } from './voice.svelte';
export { modelsStore } from './models.svelte';
export { hardwareStore, type HardwareMetrics, type GpuMetrics } from './hardware.svelte';

// Multi-tenant profile
export { profileStore, type Profile, type TenantMode } from './profile.svelte';

// Database connections
export { databaseStore, type DbConnection, type DbType } from './database.svelte';

// Rumination (AI thinking state)
export { ruminationState, type RuminationLayer } from './rumination.svelte';

// Tasks (Maestro-generated)
export { taskStore, type MaestroTask, type TaskStatus } from './tasks.svelte';

