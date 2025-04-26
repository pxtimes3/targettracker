<script lang="ts">
    import type { PageServerData } from "$types";
    import { GunStore } from "@/stores/GunStore";
    
    const { id, session }: { id: string, session: PageServerData } = $props();
    
    function getGun() {
        const idx = $GunStore.guns.findIndex((el) => el.id === id);
        return idx !== -1 ? $GunStore.guns[idx] : null;
    }
    
    let gun = $state(getGun());
    
    $effect(() => {
        if($GunStore) {
            console.log('store updated');
            gun = getGun();
        }
    });
</script>

{#if gun}
<div class="grid grid-flow-row text-lg bg-slate-400/10 border-slate-200/10 border-[1px] rounded-xl p-8 min-h-12 w-full">
    <div class="grid grid-flow-col grid-cols-2 min-w-full w-full items-start">
        <h2 class="place-self-start">{gun.gun_data.name}</h2>
        <div class="uppercase tracking-wider text-xs grid grid-flow-col-dense place-self-end gap-x-2 pb-1">
            <div>{gun.gun_data.type}</div>
            <div>{gun.gun_data.caliber}</div>
        </div>
    </div>
</div>

{/if}