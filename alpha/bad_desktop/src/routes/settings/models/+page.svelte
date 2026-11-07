<script lang="ts">
    /**
     * Models Settings - Complete model management
     *
     * Features:
     * - Model directory setup with Browse
     * - Download from HuggingFace with progress
     * - Role assignment (Encoder/Main Cortex/Reasoning/Minion)
     * - KvCache configuration
     */
    import { invoke } from '@tauri-apps/api/core';
    import { listen } from '@tauri-apps/api/event';
    import { open } from '@tauri-apps/plugin-dialog';
    import { onMount, onDestroy } from 'svelte';

    // === State ===
    type Tab = 'vl' | 'embed' | 'rerank' | 'voice';
    let activeTab = $state<Tab>('vl');
    let models = $state<any[]>([]);
    let loading = $state(false);
    let error = $state<string | null>(null);
    let success = $state<string | null>(null);

    // Model directory
    let modelPath = $state<string>('');
    let pathLoading = $state(false);
    let scanResult = $state<{ found: number; models: any[] } | null>(null);

    // Download state
    let downloading = $state<string | null>(null);
    let downloadProgress = $state<{ downloaded: number; total: number; stage: string } | null>(null);
    let downloadSize = $state<{ [key: string]: number }>({});
    let unlisten: (() => void) | null = null;

    // Role assignments
    let roles = $state<{
        encoder: string | null;
        mainCortex: string | null;
        reasoning: string | null;
        minion: string | null;
    }>({
        encoder: null,
        mainCortex: null,
        reasoning: null,
        minion: null,
    });

    // KvCache config
    let kvCacheEnabled = $state(false);
    let kvCacheRamBudget = $state(8.0);

    const tabs = [
        { id: 'vl', label: 'VL Models', icon: '🧠', desc: 'Vision-Language models for main reasoning' },
        { id: 'embed', label: 'Embedders', icon: '📊', desc: 'Text embedders for semantic search' },
        { id: 'rerank', label: 'Rerankers', icon: '🔄', desc: 'Reranking models for search quality' },
        { id: 'voice', label: 'Voice', icon: '🎤', desc: 'Speech-to-text and text-to-speech' },
    ];

    const roleInfo = [
        { id: 'encoder', label: 'Encoder', icon: '📊', desc: 'Embeds text for semantic search', family: 'embed' },
        { id: 'mainCortex', label: 'Main Cortex', icon: '🧠', desc: 'Primary reasoning model', family: 'vl' },
        { id: 'reasoning', label: 'Reasoning', icon: '💭', desc: 'Deep thinking tasks', family: 'vl' },
        { id: 'minion', label: 'Minion', icon: '🤖', desc: 'Background workers', family: 'vl' },
    ];

    // === Functions ===
    async function loadModels() {
        loading = true;
        error = null;
        try {
            models = await invoke('list_models_by_family', { family: activeTab });
        } catch (e) {
            error = String(e);
            models = [];
        }
        loading = false;
    }

    async function loadModelPath() {
        try {
            const path = await invoke<string | null>('get_model_path');
            modelPath = path || '';
        } catch (e) {
            console.error('Failed to load model path:', e);
        }
    }

    async function browseFolder() {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: 'Select Models Directory',
            });

            if (selected && typeof selected === 'string') {
                await setModelPath(selected);
            }
        } catch (e) {
            error = String(e);
        }
    }

    async function setModelPath(path: string) {
        pathLoading = true;
        error = null;
        success = null;

        try {
            // Set path and trigger scan - returns array of discovered models
            const discoveredModels = await invoke<any[]>('set_model_directory', { path });
            modelPath = path;

            // Save the path to config
            await invoke('set_model_path', { path });

            scanResult = {
                found: discoveredModels.length,
                models: discoveredModels,
            };

            if (discoveredModels.length > 0) {
                success = `Found ${discoveredModels.length} model${discoveredModels.length > 1 ? 's' : ''}!`;
            } else {
                success = 'Directory set. No models found yet - download some below.';
            }

            // Refresh model list
            await loadModels();
        } catch (e) {
            error = String(e);
        }

        pathLoading = false;
    }

    async function loadModel(modelId: string) {
        error = null;
        try {
            await invoke('load_vl_model', { modelId });
            success = 'Model loaded to VRAM';
            await loadModels();
        } catch (e) {
            error = String(e);
        }
    }

    async function setActive(modelId: string) {
        error = null;
        try {
            await invoke('set_active_model', { id: modelId });
            success = 'Model set as active';
            await loadModels();
        } catch (e) {
            error = String(e);
        }
    }

    async function getDownloadSize(modelId: string) {
        if (downloadSize[modelId]) return;
        try {
            const size = await invoke<number>('get_model_download_size', { modelId });
            downloadSize = { ...downloadSize, [modelId]: size };
        } catch (e) {
            console.warn('Could not get download size:', e);
        }
    }

    async function downloadModel(modelId: string) {
        downloading = modelId;
        downloadProgress = { downloaded: 0, total: 0, stage: 'starting' };
        error = null;
        success = null;

        try {
            await invoke('download_model', { modelId });
            success = 'Download complete!';
            await loadModels();
        } catch (e) {
            error = String(e);
        } finally {
            downloading = null;
            downloadProgress = null;
        }
    }

    async function setRole(role: string, modelId: string | null) {
        try {
            await invoke('set_model_role', { role, modelId });
            roles = { ...roles, [role]: modelId };
            success = `${role} role updated`;
        } catch (e) {
            // Role assignment might not be implemented yet - store locally
            console.warn('Role assignment:', e);
            roles = { ...roles, [role]: modelId };
        }
    }

    function formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    async function loadRoles() {
        try {
            const savedRoles = await invoke<Record<string, string | null>>('get_model_roles');
            roles = {
                encoder: savedRoles.encoder || null,
                mainCortex: savedRoles.mainCortex || null,
                reasoning: savedRoles.reasoning || null,
                minion: savedRoles.minion || null,
            };
        } catch (e) {
            console.warn('Could not load roles:', e);
        }
    }

    // === Lifecycle ===
    onMount(async () => {
        await loadModelPath();
        await loadModels();
        await loadRoles();

        // Listen for download progress
        unlisten = await listen<{ model_id: string; downloaded: number; total: number; stage: string }>(
            'download-progress',
            (event) => {
                if (event.payload.model_id === downloading) {
                    downloadProgress = {
                        downloaded: event.payload.downloaded,
                        total: event.payload.total,
                        stage: event.payload.stage,
                    };
                }
            }
        );
    });

    onDestroy(() => {
        if (unlisten) unlisten();
    });

    $effect(() => {
        activeTab;
        loadModels();
    });

    // Pre-fetch download sizes for unavailable models
    $effect(() => {
        models.filter(m => !m.available).forEach(m => getDownloadSize(m.id));
    });
</script>

<svelte:head>
    <title>Models - DevPulse</title>
</svelte:head>

<div class="models-view">
    <!-- Header -->
    <header class="view-header">
        <h1 class="view-title">Models</h1>
        <p class="view-subtitle">Download, configure, and assign AI models to system roles</p>
    </header>

    <!-- Alerts -->
    {#if error}
        <div class="alert error">
            <span class="alert-icon">⚠</span>
            <span>{error}</span>
            <button class="alert-close" onclick={() => error = null}>×</button>
        </div>
    {/if}
    {#if success}
        <div class="alert success">
            <span class="alert-icon">✓</span>
            <span>{success}</span>
            <button class="alert-close" onclick={() => success = null}>×</button>
        </div>
    {/if}

    <!-- Model Directory Setup -->
    <section class="setup-section glass">
        <div class="setup-header">
            <div class="setup-info">
                <h2 class="section-title">📁 Models Directory</h2>
                <p class="section-desc">Where your AI models are stored</p>
            </div>
            <button class="btn primary" onclick={browseFolder} disabled={pathLoading}>
                {pathLoading ? 'Scanning...' : 'Browse Folder'}
            </button>
        </div>

        <div class="path-display">
            <input
                type="text"
                class="path-input"
                bind:value={modelPath}
                placeholder="No directory set - click Browse to select"
                readonly
            />
            {#if modelPath}
                <button class="btn secondary small" onclick={() => setModelPath(modelPath)}>
                    Rescan
                </button>
            {/if}
        </div>

        {#if scanResult}
            <div class="scan-result">
                <span class="scan-stat">
                    <span class="stat-value">{scanResult.found}</span>
                    <span class="stat-label">models found</span>
                </span>
                {#if scanResult.models.length > 0}
                    <span class="scan-models">
                        {scanResult.models.slice(0, 3).map(m => m.name).join(', ')}
                        {#if scanResult.models.length > 3}
                            <span class="more">+{scanResult.models.length - 3} more</span>
                        {/if}
                    </span>
                {/if}
            </div>
        {/if}
    </section>

    <!-- Role Assignment -->
    <section class="roles-section glass">
        <h2 class="section-title">🎯 Role Assignment</h2>
        <p class="section-desc">Assign models to specific system functions</p>

        <div class="roles-grid">
            {#each roleInfo as role}
                <div class="role-card">
                    <div class="role-header">
                        <span class="role-icon">{role.icon}</span>
                        <div class="role-info">
                            <span class="role-name">{role.label}</span>
                            <span class="role-desc">{role.desc}</span>
                        </div>
                    </div>
                    <select
                        class="role-select"
                        value={roles[role.id as keyof typeof roles] || ''}
                        onchange={(e) => setRole(role.id, e.currentTarget.value || null)}
                    >
                        <option value="">Not assigned</option>
                        {#each models.filter(m => m.available) as model}
                            <option value={model.id}>{model.name}</option>
                        {/each}
                    </select>
                </div>
            {/each}
        </div>
    </section>

    <!-- KvCache Config -->
    <section class="cache-section glass">
        <div class="cache-header">
            <div class="cache-info">
                <h2 class="section-title">💾 KV Cache (RAM Offload)</h2>
                <p class="section-desc">Use system RAM to extend context length</p>
            </div>
            <label class="toggle-switch">
                <input type="checkbox" bind:checked={kvCacheEnabled} />
                <span class="toggle-slider"></span>
            </label>
        </div>

        {#if kvCacheEnabled}
            <div class="cache-config">
                <label class="config-row">
                    <span class="config-label">RAM Budget</span>
                    <div class="config-input">
                        <input
                            type="range"
                            min="2"
                            max="32"
                            step="1"
                            bind:value={kvCacheRamBudget}
                        />
                        <span class="config-value">{kvCacheRamBudget} GB</span>
                    </div>
                </label>
            </div>
        {/if}
    </section>

    <!-- Model Tabs -->
    <div class="tabs-container">
        {#each tabs as tab}
            <button
                class="tab"
                class:active={activeTab === tab.id}
                onclick={() => activeTab = tab.id as Tab}
            >
                <span class="tab-icon">{tab.icon}</span>
                <span class="tab-label">{tab.label}</span>
            </button>
        {/each}
    </div>

    <!-- Tab Description -->
    <p class="tab-desc">{tabs.find(t => t.id === activeTab)?.desc}</p>

    <!-- Models Grid -->
    <div class="models-grid">
        {#if loading}
            <div class="loading">
                <div class="spinner"></div>
                <span>Loading models...</span>
            </div>
        {:else if models.length === 0}
            <div class="empty">
                <span class="empty-icon">📦</span>
                <p class="empty-title">No {activeTab} models found</p>
                <p class="empty-desc">
                    {#if !modelPath}
                        Set your models directory above to get started.
                    {:else}
                        Download a model below or add .gguf files to your models directory.
                    {/if}
                </p>
            </div>
        {:else}
            {#each models as model}
                <div class="model-card" class:active={model.is_active} class:unavailable={!model.available}>
                    <div class="model-header">
                        <h3 class="model-name">{model.name}</h3>
                        {#if model.is_active}
                            <span class="badge active">Active</span>
                        {/if}
                    </div>

                    <div class="model-meta">
                        <span class="meta-item" title="Parameters">{model.params_b}B</span>
                        <span class="meta-item" title="Quantization">{model.quantization}</span>
                        <span class="meta-item" title="VRAM Required">{model.vram_gb} GB</span>
                    </div>

                    <div class="model-status">
                        {#if model.available}
                            <span class="status ready">✓ Ready to use</span>
                        {:else}
                            <span class="status missing">
                                ⬇ Not downloaded
                                {#if downloadSize[model.id]}
                                    ({formatBytes(downloadSize[model.id])})
                                {/if}
                            </span>
                        {/if}
                    </div>

                    <div class="model-actions">
                        {#if downloading === model.id}
                            <div class="download-progress">
                                <div class="progress-bar">
                                    <div
                                        class="progress-fill"
                                        style="width: {downloadProgress && downloadProgress.total > 0
                                            ? (downloadProgress.downloaded / downloadProgress.total * 100)
                                            : 0}%"
                                    ></div>
                                </div>
                                <span class="progress-text">
                                    {#if downloadProgress}
                                        {downloadProgress.stage}
                                        {#if downloadProgress.total > 0}
                                            - {formatBytes(downloadProgress.downloaded)} / {formatBytes(downloadProgress.total)}
                                        {/if}
                                    {:else}
                                        Starting...
                                    {/if}
                                </span>
                            </div>
                        {:else if model.available && !model.is_active}
                            <button class="btn primary" onclick={() => setActive(model.id)}>
                                Set Active
                            </button>
                            {#if activeTab === 'vl'}
                                <button class="btn secondary" onclick={() => loadModel(model.id)}>
                                    Load to VRAM
                                </button>
                            {/if}
                        {:else if !model.available}
                            <button class="btn download" onclick={() => downloadModel(model.id)}>
                                Download
                                {#if downloadSize[model.id]}
                                    ({formatBytes(downloadSize[model.id])})
                                {/if}
                            </button>
                        {:else}
                            <span class="current">✓ Currently Active</span>
                        {/if}
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>

<style>
    .models-view {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        max-width: 1000px;
    }

    .view-header {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
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

    /* Alerts */
    .alert {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
    }

    .alert.error {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #ef4444;
    }

    .alert.success {
        background: rgba(34, 197, 94, 0.1);
        border: 1px solid rgba(34, 197, 94, 0.3);
        color: #22c55e;
    }

    .alert-close {
        margin-left: auto;
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 1.25rem;
        opacity: 0.7;
    }

    .alert-close:hover {
        opacity: 1;
    }

    /* Glass sections */
    .glass {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 1.25rem;
    }

    .section-title {
        font-size: 1rem;
        font-weight: 600;
        color: white;
        margin: 0;
    }

    .section-desc {
        font-size: 0.75rem;
        color: rgba(255,255,255,0.5);
        margin: 0.25rem 0 0 0;
    }

    /* Setup Section */
    .setup-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .setup-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }

    .path-display {
        display: flex;
        gap: 0.5rem;
    }

    .path-input {
        flex: 1;
        padding: 0.75rem 1rem;
        background: rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 0.5rem;
        color: white;
        font-family: monospace;
        font-size: 0.875rem;
    }

    .path-input::placeholder {
        color: rgba(255,255,255,0.3);
    }

    .scan-result {
        display: flex;
        gap: 1.5rem;
        align-items: center;
    }

    .scan-stat {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
    }

    .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #8b5cf6;
    }

    .stat-label {
        font-size: 0.875rem;
        color: rgba(255,255,255,0.6);
    }

    .scan-models {
        font-size: 0.75rem;
        color: rgba(255,255,255,0.6);
        font-style: italic;
    }

    .scan-models .more {
        color: #8b5cf6;
    }

    /* Roles Section */
    .roles-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .roles-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }

    .role-card {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1rem;
        background: rgba(0,0,0,0.2);
        border-radius: 0.5rem;
    }

    .role-header {
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
    }

    .role-icon {
        font-size: 1.5rem;
    }

    .role-info {
        display: flex;
        flex-direction: column;
    }

    .role-name {
        font-weight: 600;
        color: white;
    }

    .role-desc {
        font-size: 0.75rem;
        color: rgba(255,255,255,0.5);
    }

    .role-select {
        padding: 0.5rem 0.75rem;
        background: rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 0.375rem;
        color: white;
        font-size: 0.875rem;
    }

    .role-select:focus {
        outline: none;
        border-color: #8b5cf6;
    }

    /* Cache Section */
    .cache-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .cache-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }

    .toggle-switch {
        position: relative;
        width: 48px;
        height: 26px;
        cursor: pointer;
    }

    .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .toggle-slider {
        position: absolute;
        inset: 0;
        background: rgba(255,255,255,0.1);
        border-radius: 13px;
        transition: 0.2s;
    }

    .toggle-slider::before {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        left: 3px;
        bottom: 3px;
        background: white;
        border-radius: 50%;
        transition: 0.2s;
    }

    .toggle-switch input:checked + .toggle-slider {
        background: #8b5cf6;
    }

    .toggle-switch input:checked + .toggle-slider::before {
        transform: translateX(22px);
    }

    .cache-config {
        padding-top: 0.5rem;
    }

    .config-row {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .config-label {
        font-size: 0.875rem;
        color: rgba(255,255,255,0.7);
    }

    .config-input {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .config-input input[type="range"] {
        flex: 1;
        accent-color: #8b5cf6;
    }

    .config-value {
        font-family: monospace;
        font-size: 0.875rem;
        color: #8b5cf6;
        min-width: 60px;
    }

    /* Tabs */
    .tabs-container {
        display: flex;
        gap: 0.5rem;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding-bottom: 0.5rem;
    }

    .tab {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: transparent;
        border: none;
        color: rgba(255,255,255,0.6);
        cursor: pointer;
        border-radius: 0.5rem;
        transition: all 0.2s;
    }

    .tab:hover {
        background: rgba(255,255,255,0.05);
        color: white;
    }

    .tab.active {
        background: rgba(139, 92, 246, 0.2);
        color: #8b5cf6;
    }

    .tab-desc {
        font-size: 0.875rem;
        color: rgba(255,255,255,0.5);
        margin: 0;
    }

    /* Models Grid */
    .models-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
    }

    .model-card {
        padding: 1.25rem;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.2s;
    }

    .model-card:hover {
        border-color: rgba(255, 255, 255, 0.2);
    }

    .model-card.active {
        border-color: #8b5cf6;
        background: rgba(139, 92, 246, 0.1);
    }

    .model-card.unavailable {
        opacity: 0.7;
    }

    .model-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .model-name {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
    }

    .badge {
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
    }

    .badge.active {
        background: #8b5cf6;
        color: white;
    }

    .model-meta {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .meta-item {
        font-size: 0.75rem;
        color: rgba(255,255,255,0.5);
        font-family: monospace;
        padding: 0.25rem 0.5rem;
        background: rgba(0,0,0,0.2);
        border-radius: 0.25rem;
    }

    .model-status {
        display: flex;
        align-items: center;
    }

    .status {
        font-size: 0.875rem;
    }

    .status.ready {
        color: #22c55e;
    }

    .status.missing {
        color: #f59e0b;
    }

    .model-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }

    /* Buttons */
    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
    }

    .btn.primary {
        background: linear-gradient(135deg, #8b5cf6, #6366f1);
        color: white;
    }

    .btn.primary:hover {
        filter: brightness(1.1);
    }

    .btn.secondary {
        background: rgba(255,255,255,0.1);
        color: white;
    }

    .btn.secondary:hover {
        background: rgba(255,255,255,0.15);
    }

    .btn.secondary.small {
        padding: 0.5rem 0.75rem;
        font-size: 0.75rem;
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn.download {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        color: white;
    }

    .btn.download:hover {
        filter: brightness(1.1);
    }

    .current {
        font-size: 0.875rem;
        color: #8b5cf6;
    }

    /* Download Progress */
    .download-progress {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
    }

    .progress-bar {
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #8b5cf6, #6366f1);
        border-radius: 4px;
        transition: width 0.3s ease;
    }

    .progress-text {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.6);
    }

    /* Empty/Loading States */
    .loading, .empty {
        text-align: center;
        padding: 3rem 2rem;
        color: rgba(255,255,255,0.5);
        grid-column: 1 / -1;
    }

    .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }

    .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid rgba(139, 92, 246, 0.2);
        border-top-color: #8b5cf6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .empty-icon {
        font-size: 3rem;
        display: block;
        margin-bottom: 1rem;
    }

    .empty-title {
        font-size: 1.125rem;
        color: white;
        margin: 0 0 0.5rem 0;
    }

    .empty-desc {
        margin: 0;
        font-size: 0.875rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .roles-grid {
            grid-template-columns: 1fr;
        }

        .setup-header {
            flex-direction: column;
            gap: 1rem;
        }

        .setup-header .btn {
            width: 100%;
        }
    }
</style>
