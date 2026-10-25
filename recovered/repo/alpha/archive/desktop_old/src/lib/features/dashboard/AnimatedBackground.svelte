<script lang="ts">
	/**
	 * AnimatedBackground - Subtle animated particles and neural network effect
	 * For dashboard background atmosphere
	 */
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		particleCount?: number;
		connectionDistance?: number;
	}

	let { particleCount = 50, connectionDistance = 100 }: Props = $props();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let animationId: number;
	let particles: Particle[] = [];
	let width = 0;
	let height = 0;

	interface Particle {
		x: number;
		y: number;
		vx: number;
		vy: number;
		size: number;
		opacity: number;
	}

	function initParticles() {
		particles = [];
		for (let i = 0; i < particleCount; i++) {
			particles.push({
				x: Math.random() * width,
				y: Math.random() * height,
				vx: (Math.random() - 0.5) * 0.5,
				vy: (Math.random() - 0.5) * 0.5,
				size: Math.random() * 2 + 1,
				opacity: Math.random() * 0.5 + 0.1
			});
		}
	}

	function resizeCanvas() {
		if (!canvas) return;
		const rect = canvas.parentElement?.getBoundingClientRect();
		if (rect) {
			width = rect.width;
			height = rect.height;
			canvas.width = width;
			canvas.height = height;
			initParticles();
		}
	}

	function animate() {
		if (!ctx) return;

		ctx.clearRect(0, 0, width, height);

		// Update and draw particles
		particles.forEach((p, i) => {
			// Update position
			p.x += p.vx;
			p.y += p.vy;

			// Wrap around edges
			if (p.x < 0) p.x = width;
			if (p.x > width) p.x = 0;
			if (p.y < 0) p.y = height;
			if (p.y > height) p.y = 0;

			// Draw particle
			ctx!.beginPath();
			ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
			ctx!.fillStyle = `rgba(99, 102, 241, ${p.opacity})`;
			ctx!.fill();

			// Draw connections
			particles.slice(i + 1).forEach((p2) => {
				const dx = p.x - p2.x;
				const dy = p.y - p2.y;
				const dist = Math.sqrt(dx * dx + dy * dy);

				if (dist < connectionDistance) {
					const opacity = (1 - dist / connectionDistance) * 0.15;
					ctx!.beginPath();
					ctx!.moveTo(p.x, p.y);
					ctx!.lineTo(p2.x, p2.y);
					ctx!.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
					ctx!.lineWidth = 1;
					ctx!.stroke();
				}
			});
		});

		animationId = requestAnimationFrame(animate);
	}

	onMount(() => {
		ctx = canvas.getContext('2d');
		resizeCanvas();
		animate();

		window.addEventListener('resize', resizeCanvas);
	});

	onDestroy(() => {
		cancelAnimationFrame(animationId);
		window.removeEventListener('resize', resizeCanvas);
	});
</script>

<div class="animated-bg">
	<canvas bind:this={canvas}></canvas>
	<div class="gradient-overlay"></div>
</div>

<style>
	.animated-bg {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		z-index: 0;
	}

	canvas {
		width: 100%;
		height: 100%;
	}

	.gradient-overlay {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			ellipse at center,
			transparent 0%,
			rgba(10, 10, 15, 0.5) 70%,
			rgba(10, 10, 15, 0.9) 100%
		);
	}
</style>
