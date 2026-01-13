/**
 * Layout Module - App Shell Infrastructure
 *
 * Usage:
 *   import { Shell, shellStore } from '$lib/layout';
 */
export { Shell, Topbar, Sidebar, Statusbar } from './components';
export { shellStore } from './stores/shell.svelte';
export type { NavItem, NavGroup, ShellState } from './types';
