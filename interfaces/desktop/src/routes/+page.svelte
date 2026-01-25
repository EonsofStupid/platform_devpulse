<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    goto('/devpulse');
  });
</script>

<div class="loading">Loading...</div>

<style>
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    color: rgba(255, 255, 255, 0.5);
  }
</style>
