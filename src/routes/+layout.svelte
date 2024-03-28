<script>
    import { SyncLoader } from 'svelte-loading-spinners';
    import { page, navigating } from '$app/stores';
    import { dev } from '$app/environment';
    import { inject } from '@vercel/analytics';
    
    inject({ mode: dev ? 'development' : 'production' });
</script>

<style>
    .container {
        padding: 1rem 0.5rem;
        max-width: 400px;
        margin: 4rem auto;
    }

    .outer {
        margin: 0 auto;
    }

    nav {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        justify-content: space-between;
        /* margin: 1rem; */
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background-color: whitesmoke;
        border: 1px solid var(--primary-color);
        padding: 0.5rem;
        border-radius: 12px;
        box-shadow: #ff400046 0px 3px 8px;
        max-width: min(90vw, 365px);
        margin: 1rem auto;
    }

    a {
        color: var(--primary-color);
        text-decoration: none;
        font-weight: 600;
        padding: 3px 6px;
        border-radius: 5px;
    }

    a.active {
        color: white;
        background-color: var(--primary-color);
    }

    .title {
        font-weight: 700;
        font-size: 1.25rem;
    }

    footer {
        color: gray;
    }

    footer p {
        margin: 0;
        text-align: center;
        font-size: 12px;
    }

    .loading {
        display: flex;
        justify-content: center;
        align-items: center;
    }

</style>

<nav>
    <div class="title">MLB 2024</div>
    <a href="/" data-sveltekit-preload-data class:active={$page.url.pathname==='/'}>Standings</a>
    <a href="/trends" data-sveltekit-preload-data class:active={$page.url.pathname==='/trends'}>Trends</a>
    <!-- <a href="/picks" class:active={$page.url.pathname==='/picks'}>Picks</a> -->
    <a href="/stats" data-sveltekit-preload-data class:active={$page.url.pathname==='/stats'}>Stats</a>
</nav>

<div class="container">
{#if $navigating}
    <div class="loading">
        <SyncLoader size="60" color="#ff3e00" unit="px" duration="1s" />
    </div>
{:else}
    <slot />
{/if}
</div>


<footer>
    <p>twelveminusfive</p>
</footer>