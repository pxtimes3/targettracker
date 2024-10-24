<script lang="ts">
    import type { PageServerData } from "../../../routes/$types";

    let { data }: { data: PageServerData } = $props();
</script>

{#if data}
    Your Profile
{:else}
    Login
{/if}
