<!-- src/lib/components/target/editor/panels/GroupPanel.svelte -->
 <script lang="ts">
    import { TargetStore } from "@/stores/TargetImageStore";

    let totalShots = $state(0);

    $effect(() => {
        if ($TargetStore) {
            totalShots = TargetStore.totalShots();
            // console.log(totalShots)
        }
        
    });
 </script>

{#if totalShots > 0}
    <div class="min-w-[25rem] max-w-[25rem] min-h-[5rem] grid grid-flow-row space-y-2 absolute right-5 top-28 bg-slate-300 dark:bg-slate-700 z-40">
        {#each $TargetStore.groups as group}
            <div id="group-{group.id}">
                <p>Group: {group.id} Shots: {group.shots?.length || 0}</p>
                <div id="group-{group.id}-metrics">
                    <p>MR: {group.metrics?.meanradius?.mm}</p>
                    <p>ES: {group.metrics?.extremespread?.mm}</p>
                </div>
            </div>
        {/each}
        {totalShots}
    </div>
{/if}