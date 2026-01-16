<script lang="ts">
    import Carousel from "../components/Carousel.svelte";
    import Viewport from "../components/Viewport.svelte";

    // Domain Items
    const domains = [
        { id: "overmind", label: "OverMind", icon: "🧠" }, // Sandbox
        { id: "projects", label: "Projects", icon: "🚀" }, // Work
        { id: "user", label: "Identity", icon: "👤" }, // Settings
    ];

    function handleSelect(item: any) {
        console.log("Selected Domain:", item.id);
        // wiring TODO: route to domain
    }
</script>

<div class="home-dashboard">
    <Viewport>
        <section class="hero-section">
            <h1>DevPulse</h1>
            <p class="subtitle">The Hub</p>
        </section>

        <section class="nav-section">
            <Carousel items={domains} onSelect={handleSelect} />
        </section>
    </Viewport>
</div>

<style>
    .home-dashboard {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .hero-section {
        text-align: center;
        margin-bottom: 4rem;
        margin-top: 4rem;
    }

    h1 {
        font-size: 4rem;
        font-weight: 200;
        letter-spacing: 4px;
        background: linear-gradient(135deg, #fff 0%, #aaa 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0;
    }

    .subtitle {
        font-size: 1.2rem;
        color: rgba(255, 255, 255, 0.5);
        letter-spacing: 2px;
        text-transform: uppercase;
    }

    .nav-section {
        height: 400px; /* Space for Carousel */
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
