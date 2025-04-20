<script lang="ts">
	import { onMount } from "svelte";
    /**
     * TODO: Chart m. datta för allt möjligt.
     * TODO: Change password.
     * TODO: Toggle för public/inte public target.
     * TODO: Klicka för att kopiera länk till public target.
     * TODO: Add firearm.
     * TODO: Add ammunition.
    */
	import type { PageServerData } from "./$types";
    import { Plus } from "lucide-svelte";

    let { data }: { data: PageServerData} = $props();

    onMount(() => {
        console.log(data);
    })
</script>

<div class="dashboard">
    Hello
    <div
        id="main-container" 
        class="grid grid-flow-col grid-cols-3 grid-rows-2 gap-x-8"
    >
        <div
            id="graph"
            class="col-span-3"
        >
            Graph
        </div>
        <div
            id="guns"
        >
            <div>
                {#if data.gundata.length}
                    Your guns:
                    {#each data.gundata as gundata}
                        <button
                            class="grid bg-slate-400/10 border-slate-200/10 border-[1px] rounded-xl p-4 min-h-12 w-full mb-4 grid-flow-col-dense gap-8 place-content-start align-top"
                            id={gundata.id}
                        >
                            <div><a href="../gun/edit/{gundata.id}">{gundata.gun_data.name}</a></div>
                            {#if gundata.averages.ccr != 0}
                                <div>{gundata.averages}</div>
                            {/if}
                            <div>Targets: {gundata.targets.length}</div>
                        </button>
                    {/each}
                {/if}
            </div>
            <a href="../gun/add">
                <button
                    class="grid bg-slate-400/10 border-slate-200/10 border-[1px] rounded-xl p-8 min-h-12 place-content-center items-center w-full"
                >
                    <center>
                        <Plus 
                            
                        />
                    </center>
                    <div>Add new gun</div>
                </button>
            </a>
        </div>
        <div
            id="events"
        >
            Your events:
        </div>
        <div
            id="load-data"
        >
            Your ammunition:
        </div>
    </div>
</div>
