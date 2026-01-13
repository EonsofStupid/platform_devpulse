<script lang="ts">
    /**
     * Cortex Memory - Dynamic Reasoning Visualization
     *
     * Shows the project brain and its connections to various data sources.
     * Visualizes the reasoning system's memory architecture.
     */
    import { invoke } from '@tauri-apps/api/core';
    import { onMount } from 'svelte';
    import { ThoughtGraph } from '$lib/domains/cortex';

    // State
    let projectName = $state('Loading...');
    let activeModel = $state<string | null>(null);
    let stats = $state({
        vectorCount: 0,
        documentCount: 0,
        noteCount: 0,
        decisionCount: 0,
        contextTokens: 0,
    });
    let loading = $state(true);
    let roles = $state<Record<string, string | null>>({});

    // Derived nodes with real counts
    let cortexNodes = $derived([
        { id: 'vectordb', label: 'VECTOR DB', icon: '◎', type: 'storage' as const, active: stats.vectorCount > 0, count: stats.vectorCount },
        { id: 'flatfile', label: 'FLAT FILE', icon: '◉', type: 'storage' as const, active: stats.documentCount > 0, count: stats.documentCount },
        { id: 'libsql', label: 'LIBSQL', icon: '◉', type: 'storage' as const, active: true },
        { id: 'images', label: 'IMAGES', icon: '◎', type: 'memory' as const, active: false },
        { id: 'notes', label: 'NOTES', icon: '◉', type: 'memory' as const, active: stats.noteCount > 0, count: stats.noteCount },
        { id: 'decisions', label: 'DECISIONS', icon: '◎', type: 'output' as const, active: stats.decisionCount > 0, count: stats.decisionCount },
        { id: 'context', label: 'CONTEXT', icon: '◉', type: 'memory' as const, active: stats.contextTokens > 0 },
    ]);

    async function loadData() {
        loading = true;
        try {
            // Get selected project
            const project = await invoke<{ name: string } | null>('get_selected_project');
            projectName = project?.name || 'No Project Selected';

            // Get current VL model
            const model = await invoke<string | null>('get_current_vl_model');
            activeModel = model;

            // Get model roles
            try {
                const roleData = await invoke<Record<string, string | null>>('get_model_roles');
                roles = roleData;
            } catch {
                // Roles not available yet
            }

            // TODO: Get real stats from engine
            // For now, simulate some activity
            stats = {
                vectorCount: 1247,
                documentCount: 89,
                noteCount: 23,
                decisionCount: 156,
                contextTokens: 4096,
            };
        } catch (e) {
            console.error('Failed to load cortex data:', e);
            projectName = 'Error Loading';
        }
        loading = false;
    }

    onMount(() => {
        loadData();
    });
</script>

<svelte:head>
    <title>Cortex Memory - DevPulse</title>
</svelte:head>

<div class="cortex-view">
    <header class="view-header">
        <div class="header-content">
            <h1 class="view-title">Cortex Memory</h1>
            <p class="view-subtitle">Dynamic reasoning and memory architecture</p>
        </div>
        <button class="btn secondary" onclick={loadData} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
        </button>
    </header>

    <div class="cortex-layout">
        <!-- Main visualization -->
        <div class="graph-section">
            <ThoughtGraph
                nodes={cortexNodes}
                {projectName}
                activeModel={activeModel || roles.mainCortex || 'None'}
            />
        </div>

        <!-- Stats panel -->
        <div class="stats-section">
            <div class="stats-card glass">
                <h3 class="card-title">Memory Stats</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-value">{stats.vectorCount.toLocaleString()}</span>
                        <span class="stat-label">Vectors</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">{stats.documentCount}</span>
                        <span class="stat-label">Documents</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">{stats.noteCount}</span>
                        <span class="stat-label">Notes</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">{stats.decisionCount}</span>
                        <span class="stat-label">Decisions</span>
                    </div>
                </div>
            </div>

            <div class="roles-card glass">
                <h3 class="card-title">Active Roles</h3>
                <div class="roles-list">
                    <div class="role-item">
                        <span class="role-icon">🧠</span>
                        <div class="role-info">
                            <span class="role-name">Main Cortex</span>
                            <span class="role-model">{roles.mainCortex || 'Not assigned'}</span>
                        </div>
                    </div>
                    <div class="role-item">
                        <span class="role-icon">📊</span>
                        <div class="role-info">
                            <span class="role-name">Encoder</span>
                            <span class="role-model">{roles.encoder || 'Not assigned'}</span>
                        </div>
                    </div>
                    <div class="role-item">
                        <span class="role-icon">💭</span>
                        <div class="role-info">
                            <span class="role-name">Reasoning</span>
                            <span class="role-model">{roles.reasoning || 'Not assigned'}</span>
                        </div>
                    </div>
                    <div class="role-item">
                        <span class="role-icon">🤖</span>
                        <div class="role-info">
                            <span class="role-name">Minion</span>
                            <span class="role-model">{roles.minion || 'Not assigned'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="context-card glass">
                <h3 class="card-title">Context Window</h3>
                <div class="context-bar">
                    <div class="context-fill" style="width: {Math.min((stats.contextTokens / 8192) * 100, 100)}%"></div>
                </div>
                <div class="context-info">
                    <span class="context-used">{stats.contextTokens.toLocaleString()} tokens used</span>
                    <span class="context-max">/ 8,192 max</span>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .cortex-view {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        height: 100%;
    }

    .view-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }

    .header-content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .view-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: white;
        margin: 0;
    }

    .view-subtitle {
        font-size: 0.875rem;
        color: rgba(255,255,255,0.6);
        margin: 0;
    }

    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
    }

    .btn.secondary {
        background: rgba(255,255,255,0.1);
        color: white;
    }

    .btn.secondary:hover {
        background: rgba(255,255,255,0.15);
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .cortex-layout {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 1.5rem;
        flex: 1;
        min-height: 0;
    }

    .graph-section {
        min-height: 400px;
    }

    .stats-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .glass {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 1rem;
    }

    .card-title {
        font-size: 0.75rem;
        font-weight: 600;
        color: rgba(255,255,255,0.6);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0 0 1rem 0;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }

    .stat-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #8b5cf6;
        font-family: monospace;
    }

    .stat-label {
        font-size: 0.75rem;
        color: rgba(255,255,255,0.5);
    }

    .roles-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .role-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem;
        background: rgba(0,0,0,0.2);
        border-radius: 0.5rem;
    }

    .role-icon {
        font-size: 1.25rem;
    }

    .role-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        flex: 1;
        min-width: 0;
    }

    .role-name {
        font-size: 0.75rem;
        font-weight: 600;
        color: white;
    }

    .role-model {
        font-size: 0.65rem;
        color: rgba(255,255,255,0.5);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .context-bar {
        height: 8px;
        background: rgba(255,255,255,0.1);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }

    .context-fill {
        height: 100%;
        background: linear-gradient(90deg, #8b5cf6, #6366f1);
        border-radius: 4px;
        transition: width 0.3s ease;
    }

    .context-info {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
    }

    .context-used {
        color: #8b5cf6;
    }

    .context-max {
        color: rgba(255,255,255,0.4);
    }

    @media (max-width: 900px) {
        .cortex-layout {
            grid-template-columns: 1fr;
        }

        .stats-section {
            flex-direction: row;
            flex-wrap: wrap;
        }

        .stats-card, .roles-card, .context-card {
            flex: 1;
            min-width: 250px;
        }
    }
</style>
