<script lang="ts">
  export let value: number = 70;
  export let max: number = 100;
  export let label: string = 'Usage';
  export let sublabel: string = '';
  export let color: string = '#22c55e';

  $: percentage = Math.min(100, Math.max(0, (value / max) * 100));
  // Arc length calculation for 270 degree arc (3/4 circle)
  $: circumference = 2 * Math.PI * 45;
  $: arcLength = circumference * 0.75; // 270 degrees
  $: filledLength = (percentage / 100) * arcLength;
  $: strokeDashoffset = arcLength - filledLength;
</script>

<div class="gauge">
  <svg viewBox="0 0 100 100">
    <!-- Background arc -->
    <circle
      cx="50" cy="50" r="45"
      fill="none"
      stroke="rgba(255,255,255,0.1)"
      stroke-width="8"
      stroke-linecap="round"
      stroke-dasharray="{arcLength}"
      stroke-dashoffset="0"
      transform="rotate(135 50 50)"
    />
    <!-- Value arc -->
    <circle
      cx="50" cy="50" r="45"
      fill="none"
      stroke={color}
      stroke-width="8"
      stroke-linecap="round"
      stroke-dasharray="{arcLength}"
      stroke-dashoffset={strokeDashoffset}
      transform="rotate(135 50 50)"
      class="value-arc"
      style="--glow-color: {color};"
    />
  </svg>
  <div class="gauge-content">
    <span class="gauge-value" style="color: {color}">{percentage.toFixed(0)}%</span>
    <span class="gauge-label">{label}</span>
    {#if sublabel}<span class="gauge-sublabel">{sublabel}</span>{/if}
  </div>
</div>

<style>
  .gauge {
    position: relative;
    width: 140px;
    height: 140px;
  }

  svg {
    width: 100%;
    height: 100%;
  }

  .value-arc {
    filter: drop-shadow(0 0 8px var(--glow-color));
    transition: stroke-dashoffset 0.5s ease;
  }

  .gauge-content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 10px;
  }

  .gauge-value {
    font-size: 1.5rem;
    font-weight: 700;
  }

  .gauge-label {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 0.25rem;
  }

  .gauge-sublabel {
    font-size: 0.6rem;
    color: rgba(255, 255, 255, 0.5);
  }
</style>
