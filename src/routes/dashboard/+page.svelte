<!-- src/routes/dashboard/+page.svelte -->
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
    import { Drawer, Button } from "svelte-ux";
	import GunCard from "@/components/gun/GunCard.svelte";
	import AddEditGun from "@/components/gun/AddEditGun.svelte";
	import { invalidate } from "$app/navigation";
	import { GunStore } from "@/stores/GunStore";

    const guns = $derived($GunStore.guns);

    let { data }: { data: PageServerData} = $props();

    let editData = $state<GunData | EventData | AmmunitionData | null>(null);

    type DrawerType = 'ammunition' | 'event' | 'gun';

    let drawerStates: Record<DrawerType, boolean> = $state({
        ammunition: false,
        event: false,
        gun: false,
    });

    let mode: "add"|"edit" = $state('add');

    function openDrawer(newMode: "add"|"edit", drawerType: DrawerType, data?: GunData | EventData | AmmunitionData): void
    {
        mode = newMode;
        editData = data || null;
        // console.log('editData:', editData, 'mode', mode)
        drawerStates[drawerType] = !drawerStates[drawerType];

        if (drawerStates[drawerType]) {
            Object.keys(drawerStates).forEach(key => {
                if (key !== drawerType) {
                    drawerStates[key as DrawerType] = false;
                }
            });
        }
    }

    async function refreshGunData(gunId: string, updatedGun?: GunData) {
        if (updatedGun) {
            // Update the gun in the store
            GunStore.updateGun(updatedGun);
            
            // Also update the local data
            data.gundata = data.gundata.map(gun => 
                gun.id === gunId ? updatedGun : gun
            );
        } else {
            // Fallback to invalidation if no updated gun data is provided
            await invalidate('app:dashboard');
        }
        
        // Close the drawer
        drawerStates.gun = false;
    }

    onMount(() => {
        GunStore.setGuns(data.gundata);
        console.log('gunstore initial data', $GunStore);
        const handleGunSaved = () => {
            drawerStates.gun = false;
        };

        document.addEventListener('gun-saved', handleGunSaved);
        
        return () => {
            document.removeEventListener('gun-saved', handleGunSaved);
        };
    });

    $effect(() => {
        if ($GunStore) {
            console.log('GunStore updated!', $GunStore);
        }
        if ($GunStore) {
            console.log($GunStore);
        }
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
            class="grid grid-flow-row gap-4"
        >
            
            {#if guns.length}
                Your guns ({guns.length}):
                {#each guns as gundata}
                    <button
                        onclick={() => (openDrawer("edit", 'gun', gundata))}
                        class="w-full"
                    >
                        <GunCard
                            id={gundata.id}
                            session={data}
                        />
                    </button>
                {/each}
            {/if}
            
            <Button 
                on:click={() => (openDrawer("add", 'gun'))}
                class="grid bg-slate-400/10 border-slate-200/10 border-[1px] rounded-xl p-8 min-h-12 place-content-center items-center w-full"
            >
                <center>
                    <Plus 
                        
                    />
                </center>
                <div>Add new gun</div>
            </Button>
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

<Drawer bind:open={drawerStates.gun} placement="left">
    <div slot="actions">
        <Button on:click={() => (drawerStates.gun = false)}>Close</Button>
    </div>
    <div class="h-full min-w-[36rem] p-8 pt-4">
        {#if mode === 'add'}
            <AddEditGun
                data={undefined}
                userId={data.user.id}
                onSuccess={(id, updatedGun) => refreshGunData(id, updatedGun)}
            />
        {:else}
            <AddEditGun
                data={$state.snapshot(editData?.gun_data as unknown as GunData)}
                userId={data.user.id}
                onSuccess={(id, updatedGun) => refreshGunData(id, updatedGun)}
            />
        {/if}
    </div>
</Drawer>