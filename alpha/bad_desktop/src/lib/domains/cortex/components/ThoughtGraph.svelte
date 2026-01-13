<script lang="ts">
    /**
     * ThoughtGraph - Interactive node visualization for Cortex Memory
     *
     * Renders an SVG-based graph showing:
     * - Central brain node (Project Brain)
     * - Connected peripheral nodes (Vector DB, LibSQL, Images, Notes, etc.)
     * - Animated connection lines with particle effects
     */
    import { onMount } from 'svelte';

    interface CortexNode {
        id: string;
        label: string;
        icon: string;
        type: 'core' | 'storage' | 'memory' | 'output';
        active?: boolean;
        count?: number;
    }

    interface Props {
        nodes?: CortexNode[];
        projectName?: string;
        activeModel?: string;
    }

    let {
        nodes = $bindable([]),
        projectName = 'No Project',
        activeModel = 'None'
    }: Props = $props();

    // Default nodes if none provided
    const defaultNodes: CortexNode[] = [
        { id: 'vectordb', label: 'VECTOR DB', icon: '◎', type: 'storage', active: true },
        { id: 'flatfile', label: 'FLAT FILE', icon: '◉', type: 'storage' },
        { id: 'libsql', label: 'LIBSQL', icon: '◉', type: 'storage', active: true },
        { id: 'images', label: 'IMAGES', icon: '◎', type: 'memory' },
        { id: 'notes', label: 'NOTES', icon: '◉', type: 'memory', active: true },
        { id: 'decisions', label: 'DECISIONS', icon: '◎', type: 'output' },
        { id: 'context', label: 'CONTEXT', icon: '◉', type: 'memory', active: true },
    ];

    let displayNodes = $derived(nodes.length > 0 ? nodes : defaultNodes);

    // Animation state
    let animationFrame = $state(0);
    let mounted = $state(false);

    // Calculate node positions in a circle around center
    function getNodePosition(index: number, total: number, radius: number) {
        const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
        return {
            x: 250 + Math.cos(angle) * radius,
            y: 200 + Math.sin(angle) * radius,
        };
    }

    // Animate particles along connections
    onMount(() => {
        mounted = true;
        let frame = 0;
        const animate = () => {
            frame = (frame + 1) % 100;
            animationFrame = frame;
            requestAnimationFrame(animate);
        };
        const id = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(id);
    });

    // Get particle position along path
    function getParticleOffset(progress: number): number {
        return progress * 100;
    }
</script>

<div class="thought-graph-container">
    <div class="graph-header">
        <span class="header-title">CORTEX MEMORY</span>
    </div>

    <svg viewBox="0 0 500 400" class="thought-graph">
        <!-- Background grid effect -->
        <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(139,92,246,0.05)" stroke-width="0.5"/>
            </pattern>
            <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="rgba(139,92,246,0.3)"/>
                <stop offset="100%" stop-color="rgba(139,92,246,0)"/>
            </radialGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="rgba(139,92,246,0.1)"/>
                <stop offset="50%" stop-color="rgba(139,92,246,0.4)"/>
                <stop offset="100%" stop-color="rgba(139,92,246,0.1)"/>
            </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid)"/>

        <!-- Connection lines from peripheral nodes to center -->
        {#each displayNodes as node, i}
            {@const pos = getNodePosition(i, displayNodes.length, 140)}
            <g class="connection" class:active={node.active}>
                <!-- Main line -->
                <line
                    x1={pos.x}
                    y1={pos.y}
                    x2="250"
                    y2="200"
                    stroke="url(#lineGradient)"
                    stroke-width="2"
                    class:pulse={node.active}
                />
                <!-- Animated particle -->
                {#if node.active && mounted}
                    <circle
                        r="3"
                        fill="#8b5cf6"
                        filter="url(#glow)"
                        class="particle"
                        style="--offset: {((animationFrame + i * 15) % 100) / 100}"
                    >
                        <animateMotion
                            dur="3s"
                            repeatCount="indefinite"
                            path="M{pos.x},{pos.y} L250,200"
                        />
                    </circle>
                {/if}
            </g>
        {/each}

        <!-- Central brain node -->
        <g class="core-node" transform="translate(250, 200)">
            <circle r="60" fill="url(#coreGlow)"/>
            <circle r="45" fill="rgba(15,15,25,0.9)" stroke="#8b5cf6" stroke-width="2" filter="url(#glow)"/>
            <text y="-8" text-anchor="middle" class="core-icon">🧠</text>
            <text y="12" text-anchor="middle" class="core-label">PROJECT BRAIN</text>
            <text y="26" text-anchor="middle" class="core-sublabel">(REASONING)</text>
        </g>

        <!-- Peripheral nodes -->
        {#each displayNodes as node, i}
            {@const pos = getNodePosition(i, displayNodes.length, 140)}
            <g
                class="peripheral-node"
                class:active={node.active}
                transform="translate({pos.x}, {pos.y})"
            >
                <circle r="28" fill="rgba(15,15,25,0.8)" stroke={node.active ? '#8b5cf6' : 'rgba(255,255,255,0.2)'} stroke-width="1.5"/>
                <text y="-5" text-anchor="middle" class="node-icon">{node.icon}</text>
                <text y="10" text-anchor="middle" class="node-label">{node.label}</text>
                {#if node.count !== undefined}
                    <text y="22" text-anchor="middle" class="node-count">{node.count}</text>
                {/if}
            </g>
        {/each}
    </svg>

    <div class="graph-footer">
        <span class="footer-label">PROJECT LOADED:</span>
        <span class="footer-value">{projectName}</span>
        {#if activeModel && activeModel !== 'None'}
            <span class="footer-model">| {activeModel}</span>
        {/if}
    </div>
</div>

<style>
    .thought-graph-container {
        background: linear-gradient(135deg, rgba(10,10,20,0.95), rgba(20,15,35,0.95));
        border: 1px solid rgba(139,92,246,0.2);
        border-radius: 12px;
        overflow: hidden;
    }

    .graph-header {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid rgba(139,92,246,0.1);
    }

    .header-title {
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        color: rgba(255,255,255,0.6);
    }

    .thought-graph {
        width: 100%;
        height: auto;
        display: block;
    }

    .core-icon {
        font-size: 24px;
    }

    .core-label {
        font-size: 8px;
        font-weight: 600;
        fill: white;
        letter-spacing: 0.05em;
    }

    .core-sublabel {
        font-size: 6px;
        fill: rgba(255,255,255,0.5);
        letter-spacing: 0.05em;
    }

    .node-icon {
        font-size: 12px;
        fill: #8b5cf6;
    }

    .node-label {
        font-size: 6px;
        font-weight: 500;
        fill: rgba(255,255,255,0.7);
        letter-spacing: 0.05em;
    }

    .node-count {
        font-size: 5px;
        fill: rgba(255,255,255,0.4);
    }

    .peripheral-node {
        transition: all 0.3s ease;
    }

    .peripheral-node.active .node-icon {
        fill: #a78bfa;
    }

    .peripheral-node.active .node-label {
        fill: white;
    }

    .connection line {
        transition: stroke-opacity 0.3s;
    }

    .connection.active line {
        stroke-opacity: 1;
    }

    .connection line.pulse {
        animation: linePulse 2s ease-in-out infinite;
    }

    @keyframes linePulse {
        0%, 100% { stroke-opacity: 0.3; }
        50% { stroke-opacity: 0.8; }
    }

    .particle {
        opacity: 0.8;
    }

    .graph-footer {
        padding: 0.5rem 1rem;
        border-top: 1px solid rgba(139,92,246,0.1);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(0,0,0,0.3);
    }

    .footer-label {
        font-size: 0.65rem;
        color: rgba(255,255,255,0.4);
        letter-spacing: 0.05em;
    }

    .footer-value {
        font-size: 0.75rem;
        color: #8b5cf6;
        font-weight: 600;
    }

    .footer-model {
        font-size: 0.65rem;
        color: rgba(255,255,255,0.5);
    }
</style>
