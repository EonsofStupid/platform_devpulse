<script lang="ts">
  export let name: string = 'Project Name';
  export let client: string = '';
  export let status: string = 'Active';
  export let progress: number = 0;
  export let health: 'good' | 'warning' | 'error' = 'good';
</script>

<div class="project-card health-{health}">
  <div class="project-visual">
    <div class="cube-container">
      <div class="cube">
        <div class="cube-face front"></div>
        <div class="cube-face back"></div>
        <div class="cube-face left"></div>
        <div class="cube-face right"></div>
        <div class="cube-face top"></div>
        <div class="cube-face bottom"></div>
      </div>
    </div>
  </div>

  <div class="project-info">
    <div class="project-header">
      <span class="project-label">Project:</span>
      <span class="project-name">{name}</span>
    </div>
    {#if client}
      <div class="project-row">
        <span class="row-label">Client:</span>
        <span class="row-value">{client}</span>
      </div>
    {/if}
    <div class="project-row">
      <span class="row-label">Status:</span>
      <span class="row-value">{status}</span>
    </div>
  </div>

  {#if progress > 0}
    <div class="project-progress">
      <div class="progress-bar">
        <div class="progress-fill" style="width: {progress}%"></div>
      </div>
      <span class="progress-value">{progress}%</span>
    </div>
  {/if}

  <div class="project-footer">
    <div class="avatars">
      <div class="avatar">👤</div>
      <div class="avatar">👤</div>
      <div class="avatar">👤</div>
    </div>
  </div>
</div>

<style>
  .project-card {
    background: rgba(15, 23, 42, 0.7);
    border: 2px solid rgba(249, 115, 22, 0.3);
    border-radius: 0.75rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    transition: all 0.3s ease;
    min-width: 220px;
  }

  .project-card:hover {
    border-color: rgba(249, 115, 22, 0.6);
    box-shadow: 0 0 30px rgba(249, 115, 22, 0.15);
    transform: translateY(-2px);
  }

  .project-card.health-warning {
    border-color: rgba(245, 158, 11, 0.4);
  }
  .project-card.health-warning:hover {
    border-color: rgba(245, 158, 11, 0.7);
    box-shadow: 0 0 30px rgba(245, 158, 11, 0.15);
  }

  .project-card.health-error {
    border-color: rgba(239, 68, 68, 0.4);
  }
  .project-card.health-error:hover {
    border-color: rgba(239, 68, 68, 0.7);
    box-shadow: 0 0 30px rgba(239, 68, 68, 0.15);
  }

  .project-visual {
    height: 80px;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15));
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .cube-container {
    perspective: 150px;
  }

  .cube {
    width: 40px;
    height: 40px;
    position: relative;
    transform-style: preserve-3d;
    animation: cube-rotate 12s ease-in-out infinite;
  }

  .cube-face {
    position: absolute;
    width: 40px;
    height: 40px;
    border: 1px solid rgba(139, 92, 246, 0.5);
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.3));
    box-shadow: inset 0 0 10px rgba(139, 92, 246, 0.2);
  }

  .front  { transform: translateZ(20px); }
  .back   { transform: translateZ(-20px) rotateY(180deg); }
  .left   { transform: translateX(-20px) rotateY(-90deg); }
  .right  { transform: translateX(20px) rotateY(90deg); }
  .top    { transform: translateY(-20px) rotateX(90deg); }
  .bottom { transform: translateY(20px) rotateX(-90deg); }

  @keyframes cube-rotate {
    0%, 100% { transform: rotateX(-15deg) rotateY(25deg); }
    25% { transform: rotateX(-15deg) rotateY(115deg); }
    50% { transform: rotateX(-15deg) rotateY(205deg); }
    75% { transform: rotateX(-15deg) rotateY(295deg); }
  }

  .project-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .project-header {
    display: flex;
    flex-direction: column;
  }

  .project-label {
    font-size: 0.6rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .project-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: white;
  }

  .project-row {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    display: flex;
    gap: 0.25rem;
  }

  .row-label {
    color: rgba(255, 255, 255, 0.5);
  }

  .project-progress {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .progress-bar {
    flex: 1;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
    background: #22c55e;
    box-shadow: 0 0 8px #22c55e;
  }

  .health-warning .progress-fill {
    background: #f59e0b;
    box-shadow: 0 0 8px #f59e0b;
  }

  .health-error .progress-fill {
    background: #ef4444;
    box-shadow: 0 0 8px #ef4444;
  }

  .progress-value {
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    min-width: 32px;
    text-align: right;
  }

  .project-footer {
    display: flex;
    justify-content: flex-start;
    padding-top: 0.25rem;
  }

  .avatars {
    display: flex;
  }

  .avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(15, 23, 42, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    margin-left: -8px;
  }

  .avatar:first-child {
    margin-left: 0;
  }
</style>
