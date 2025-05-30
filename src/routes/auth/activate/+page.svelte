<script lang="ts">
    import { goto } from '$app/navigation';
    import { type PageData } from "../$types";
    let { data } : { data: PageData } = $props();

    $effect(() => {
        console.log(data);
        if (data.activated) {
            goto('/dashboard');
        }
    });
</script>

{#if !data.activated}
    {#if data.error}
        <div class="error">
            {data.error}
        </div>
    {:else}
        <div>Processing activation...</div>
    {/if}
{/if}
