<script lang="ts">
    /**
     * Adapter Settings - API Key Management
     *
     * Manage LLM adapters:
     * - Save/delete API keys securely in OS keyring
     * - Test adapter connections
     * - Switch active adapter
     */
    import { invoke } from '@tauri-apps/api/core';
    import { onMount } from 'svelte';

    interface AdapterInfo {
        id: string;
        name: string;
        kind: string;
        has_key: boolean;
        is_active: boolean;
        is_available: boolean;
    }

    interface TestResult {
        success: boolean;
        message: string;
        latency_ms: number | null;
        model: string | null;
    }

    let adapters = $state<AdapterInfo[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);
    let testingAdapter = $state<string | null>(null);
    let testResult = $state<TestResult | null>(null);

    // API key input state
    let selectedAdapter = $state<string | null>(null);
    let apiKeyInput = $state('');
    let savingKey = $state(false);

    async function loadAdapters() {
        loading = true;
        error = null;
        try {
            adapters = await invoke<AdapterInfo[]>('list_adapters');
        } catch (e) {
            error = String(e);
        }
        loading = false;
    }

    async function saveApiKey() {
        if (!selectedAdapter || !apiKeyInput.trim()) return;

        savingKey = true;
        error = null;
        try {
            await invoke('save_api_key', {
                adapter: selectedAdapter,
                apiKey: apiKeyInput.trim()
            });
            apiKeyInput = '';
            selectedAdapter = null;
            await loadAdapters();
        } catch (e) {
            error = String(e);
        }
        savingKey = false;
    }

    async function deleteApiKey(adapterId: string) {
        if (!confirm(`Delete API key for ${adapterId}?`)) return;

        try {
            await invoke('delete_api_key', { adapter: adapterId });
            await loadAdapters();
        } catch (e) {
            error = String(e);
        }
    }

    async function setActiveAdapter(adapterId: string) {
        try {
            await invoke('set_active_adapter', { adapter: adapterId });
            await loadAdapters();
        } catch (e) {
            error = String(e);
        }
    }

    async function testAdapter(adapterId: string) {
        testingAdapter = adapterId;
        testResult = null;
        try {
            testResult = await invoke<TestResult>('test_adapter', { adapter: adapterId });
        } catch (e) {
            testResult = {
                success: false,
                message: String(e),
                latency_ms: null,
                model: null
            };
        }
        testingAdapter = null;
    }

    function getAdapterIcon(kind: string): string {
        switch (kind) {
            case 'local': return '🖥️';
            case 'anthropic': return '🤖';
            case 'openai': return '🧠';
            case 'ollama': return '🦙';
            case 'lmstudio': return '📦';
            case 'groq': return '⚡';
            default: return '🔌';
        }
    }

    onMount(() => {
        loadAdapters();
    });
</script>

<svelte:head>
    <title>Adapters - DevPulse Settings</title>
</svelte:head>

<div class="adapters-view">
    <header class="view-header">
        <h1 class="view-title">🔌 LLM Adapters</h1>
        <p class="view-subtitle">Manage API keys and select your AI adapter</p>
    </header>

    {#if error}
        <div class="error-banner">{error}</div>
    {/if}

    {#if testResult}
        <div class="test-result" class:success={testResult.success} class:failure={!testResult.success}>
            <div class="test-icon">{testResult.success ? '✓' : '✗'}</div>
            <div class="test-content">
                <div class="test-message">{testResult.message}</div>
                {#if testResult.latency_ms}
                    <div class="test-meta">Latency: {testResult.latency_ms}ms</div>
                {/if}
                {#if testResult.model}
                    <div class="test-meta">Model: {testResult.model}</div>
                {/if}
            </div>
            <button class="close-btn" onclick={() => testResult = null}>×</button>
        </div>
    {/if}

    <div class="adapters-grid">
        {#if loading}
            <div class="loading">Loading adapters...</div>
        {:else}
            {#each adapters as adapter}
                <div
                    class="adapter-card glass"
                    class:active={adapter.is_active}
                    class:available={adapter.is_available}
                >
                    <div class="adapter-header">
                        <span class="adapter-icon">{getAdapterIcon(adapter.kind)}</span>
                        <div class="adapter-info">
                            <h3 class="adapter-name">{adapter.name}</h3>
                            <span class="adapter-kind">{adapter.kind}</span>
                        </div>
                        {#if adapter.is_active}
                            <span class="badge active">Active</span>
                        {/if}
                    </div>

                    <div class="adapter-status">
                        {#if adapter.kind === 'local'}
                            <span class="status ready">✓ Always available</span>
                        {:else if adapter.kind === 'ollama' || adapter.kind === 'lmstudio'}
                            {#if adapter.is_available}
                                <span class="status ready">✓ Server running</span>
                            {:else}
                                <span class="status offline">○ Server not detected</span>
                            {/if}
                        {:else}
                            {#if adapter.has_key}
                                <span class="status ready">✓ API key configured</span>
                            {:else}
                                <span class="status missing">○ API key required</span>
                            {/if}
                        {/if}
                    </div>

                    <div class="adapter-actions">
                        {#if adapter.kind !== 'local' && adapter.kind !== 'ollama' && adapter.kind !== 'lmstudio'}
                            {#if adapter.has_key}
                                <button
                                    class="btn secondary small"
                                    onclick={() => deleteApiKey(adapter.id)}
                                >
                                    Remove Key
                                </button>
                            {:else}
                                <button
                                    class="btn primary small"
                                    onclick={() => { selectedAdapter = adapter.id; apiKeyInput = ''; }}
                                >
                                    Add Key
                                </button>
                            {/if}
                        {/if}

                        <button
                            class="btn secondary small"
                            disabled={testingAdapter === adapter.id}
                            onclick={() => testAdapter(adapter.id)}
                        >
                            {testingAdapter === adapter.id ? 'Testing...' : 'Test'}
                        </button>

                        {#if !adapter.is_active && adapter.is_available}
                            <button
                                class="btn primary small"
                                onclick={() => setActiveAdapter(adapter.id)}
                            >
                                Use
                            </button>
                        {/if}
                    </div>
                </div>
            {/each}
        {/if}
    </div>

    <!-- API Key Modal -->
    {#if selectedAdapter}
        <div class="modal-overlay" onclick={() => selectedAdapter = null}>
            <div class="modal glass" onclick={(e) => e.stopPropagation()}>
                <h2>Add API Key</h2>
                <p class="modal-desc">
                    Enter your API key for <strong>{selectedAdapter}</strong>.
                    Keys are stored securely in your OS keyring.
                </p>

                <div class="key-hints">
                    {#if selectedAdapter === 'anthropic'}
                        <p>Get your key from <a href="https://console.anthropic.com/settings/keys" target="_blank">console.anthropic.com</a></p>
                        <p class="hint">Format: sk-ant-...</p>
                    {:else if selectedAdapter === 'openai'}
                        <p>Get your key from <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com</a></p>
                        <p class="hint">Format: sk-...</p>
                    {:else if selectedAdapter === 'groq'}
                        <p>Get your key from <a href="https://console.groq.com/keys" target="_blank">console.groq.com</a></p>
                    {/if}
                </div>

                <input
                    type="password"
                    class="key-input"
                    placeholder="Enter API key..."
                    bind:value={apiKeyInput}
                    onkeydown={(e) => e.key === 'Enter' && saveApiKey()}
                />

                <div class="modal-actions">
                    <button class="btn secondary" onclick={() => selectedAdapter = null}>
                        Cancel
                    </button>
                    <button
                        class="btn primary"
                        disabled={!apiKeyInput.trim() || savingKey}
                        onclick={saveApiKey}
                    >
                        {savingKey ? 'Saving...' : 'Save Key'}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .adapters-view {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
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

    .error-banner {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #ef4444;
        padding: 0.75rem;
        border-radius: 0.5rem;
    }

    .test-result {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border-radius: 0.5rem;
        position: relative;
    }

    .test-result.success {
        background: rgba(34, 197, 94, 0.1);
        border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .test-result.failure {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .test-icon {
        font-size: 1.5rem;
    }

    .success .test-icon { color: #22c55e; }
    .failure .test-icon { color: #ef4444; }

    .test-content {
        flex: 1;
    }

    .test-message {
        font-weight: 500;
    }

    .test-meta {
        font-size: 0.875rem;
        color: rgba(255,255,255,0.6);
    }

    .close-btn {
        background: none;
        border: none;
        color: rgba(255,255,255,0.5);
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.25rem;
    }

    .adapters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
    }

    .adapter-card {
        padding: 1.25rem;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        transition: all 0.2s;
    }

    .glass {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .adapter-card.active {
        border-color: #8b5cf6;
        background: rgba(139, 92, 246, 0.1);
    }

    .adapter-card:not(.available):not(.active) {
        opacity: 0.7;
    }

    .adapter-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .adapter-icon {
        font-size: 2rem;
    }

    .adapter-info {
        flex: 1;
    }

    .adapter-name {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: white;
    }

    .adapter-kind {
        font-size: 0.75rem;
        color: rgba(255,255,255,0.5);
        text-transform: uppercase;
        letter-spacing: 0.05em;
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

    .adapter-status {
        display: flex;
        align-items: center;
    }

    .status {
        font-size: 0.875rem;
    }

    .status.ready { color: #22c55e; }
    .status.missing { color: #f59e0b; }
    .status.offline { color: rgba(255,255,255,0.4); }

    .adapter-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .btn {
        padding: 0.5rem 0.75rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn.small {
        padding: 0.375rem 0.625rem;
        font-size: 0.8125rem;
    }

    .btn.primary {
        background: linear-gradient(135deg, #8b5cf6, #6366f1);
        color: white;
    }

    .btn.primary:hover {
        opacity: 0.9;
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

    .loading {
        text-align: center;
        padding: 2rem;
        color: rgba(255,255,255,0.5);
        grid-column: 1 / -1;
    }

    /* Modal */
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal {
        width: 90%;
        max-width: 400px;
        padding: 1.5rem;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .modal h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
    }

    .modal-desc {
        margin: 0;
        color: rgba(255,255,255,0.7);
        font-size: 0.875rem;
    }

    .key-hints {
        font-size: 0.8125rem;
        color: rgba(255,255,255,0.6);
    }

    .key-hints a {
        color: #8b5cf6;
    }

    .key-hints .hint {
        color: rgba(255,255,255,0.4);
        font-family: monospace;
    }

    .key-input {
        width: 100%;
        padding: 0.75rem;
        background: rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 0.5rem;
        color: white;
        font-family: monospace;
        font-size: 0.875rem;
    }

    .key-input:focus {
        outline: none;
        border-color: #8b5cf6;
    }

    .modal-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
    }
</style>
