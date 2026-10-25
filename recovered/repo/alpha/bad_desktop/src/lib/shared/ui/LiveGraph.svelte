<script lang="ts">
  export let data: number[] = [30, 45, 60, 40, 70, 55, 80, 65, 90, 75];
  export let label: string = 'Network';
  export let unit: string = '';
  export let color: string = '#06b6d4';

  const height = 60;
  const width = 100;

  $: maxVal = Math.max(...data, 1);
  $: minVal = Math.min(...data, 0);
  $: range = maxVal - minVal || 1;

  $: points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - minVal) / range) * height * 0.9 - 3;
    return `${x},${y}`;
  }).join(' ');

  $: areaPoints = `0,${height} ${points} ${width},${height}`;
  $: currentValue = data[data.length - 1];

  // Generate unique ID for gradient
  const gradientId = `graphGrad-${Math.random().toString(36).slice(2, 9)}`;
</script>

<div class="live-graph" style="--graph-color: {color};">
  <div class="graph-header">
    <span class="graph-label">{label}</span>
    <span class="graph-value">{currentValue}{unit}</span>
  </div>
  <svg viewBox="0 0 {width} {height}" preserveAspectRatio="none">
    <defs>
      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color={color} stop-opacity="0.4"/>
        <stop offset="100%" stop-color={color} stop-opacity="0"/>
      </linearGradient>
    </defs>
    <!-- Area fill -->
    <polygon
      points={areaPoints}
      fill="url(#{gradientId})"
    />
    <!-- Line -->
    <polyline
      points={points}
      fill="none"
      stroke={color}
      stroke-width="2"
      stroke-linejoin="round"
      stroke-linecap="round"
      class="graph-line"
    />
    <!-- Current value dot -->
    <circle
      cx={width}
      cy={height - ((currentValue - minVal) / range) * height * 0.9 - 3}
      r="3"
      fill={color}
      class="current-dot"
    />
  </svg>
</div>

<style>
  .live-graph {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    min-width: 180px;
  }

  .graph-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.5rem;
  }

  .graph-label {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .graph-value {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--graph-color);
  }

  svg {
    width: 100%;
    height: 60px;
    display: block;
  }

  .graph-line {
    filter: drop-shadow(0 0 4px var(--graph-color));
  }

  .current-dot {
    filter: drop-shadow(0 0 6px var(--graph-color));
    animation: dot-pulse 2s ease-in-out infinite;
  }

  @keyframes dot-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
