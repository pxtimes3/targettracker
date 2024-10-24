<script lang="ts">
    import type { PageServerData } from './$types';

    let { data }: { data: PageServerData } = $props();

    console.log(data)
</script>
<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
