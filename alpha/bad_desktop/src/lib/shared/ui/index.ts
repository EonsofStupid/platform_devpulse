/**
 * Shared UI - Atomic Primitives
 *
 * Usage:
 *   import { Button, Card, GlassPanel } from '$lib/shared/ui';
 */

// Form Controls
export { default as Button } from './Button.svelte';
export { default as Input } from './Input.svelte';
export { default as Toggle } from './Toggle.svelte';

// Layout
export { default as Card } from './Card.svelte';
export { default as Panel } from './Panel.svelte';
export { default as Modal } from './Modal.svelte';
export { default as Tabs } from './Tabs.svelte';

// Status & Indicators
export { default as Badge } from './Badge.svelte';
export { default as StatusIndicator } from './StatusIndicator.svelte';
export { default as ConnectionIndicator } from './ConnectionIndicator.svelte';

// Data Visualization
export { default as ArcGauge } from './ArcGauge.svelte';
export { default as GaugeArc } from './GaugeArc.svelte';
export { default as LiveGraph } from './LiveGraph.svelte';

// Glass & Cyber
export { default as GlassPanel } from './GlassPanel.svelte';
export { default as CyberBackground } from './CyberBackground.svelte';

// Branding
export { default as AnimatedLogo } from './AnimatedLogo.svelte';

// Domain-specific (consider moving to domains)
export { default as ProjectCard } from './ProjectCard.svelte';
export { default as MinionCard } from './MinionCard.svelte';
export { default as PulseFeed } from './PulseFeed.svelte';
export { default as SystemCheck } from './SystemCheck.svelte';
