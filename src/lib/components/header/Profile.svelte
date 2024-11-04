<script lang="ts">
    import type { PageServerData } from "./$types";

    let { data }: { data: PageServerData } = $props();
</script>

{#if data}
    Your Profile
{:else}
    Login
{/if}
