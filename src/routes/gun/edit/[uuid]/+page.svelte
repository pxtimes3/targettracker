<!-- src/routes/gun/edit/[uuid]/+page.svelte -->
<script lang="ts">
	import AddEditGun from "@/components/gun/addEditGun.svelte";
	import { onMount } from "svelte";

    let gunData: GunData|undefined|{ error: { message: string } } = $state();

    let { data } : { data: GunEditPageServerData } = $props();

    onMount(() => {
        if (data) { console.log(data) }
        // @ts-ignore
        if (data.gundata) {
            // @ts-ignore
            gunData = data.gundata;
        }
    });
</script>

{#if gunData}
    {#if gunData.error}
            <div id="Error">{gunData.error.message}</div>
    {:else if gunData.id }
    
        
    <AddEditGun
        data={data.gundata}
        gunTypes={data.gunTypes}
    />
{/if}
{/if}