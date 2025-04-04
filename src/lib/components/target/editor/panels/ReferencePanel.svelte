<!-- src/lib/components/target/editor/panels/ReferencePanel.svelte -->
<script lang="ts">
    import { type PageServerData } from "$types";
    import { LucideX, LucideCheck } from "lucide-svelte";
    import { EditorStore, activePanel } from '@/stores/EditorStore';
    import { TargetStore, type TargetStoreInterface } from "@/stores/TargetImageStore";
    import { UserSettingsStore } from "@/stores/UserSettingsStore";
    import { Button } from "svelte-ux";
	import { Target } from "@/utils/editor/Target";
    import { onMount } from "svelte";

    let { data, active, position, target } : { 
        data: PageServerData, 
        active: boolean, 
        position: {top: string, left: string},
        target: Target | undefined
    } = $props();

    let atoxInput = $state();
    let setRefDisabled: boolean = $state(true);

    // console.log('Initial store state:', $TargetStore.reference);
        
    $effect(() => {
        // Check if both coordinates exist for both points
        const hasPointA = $TargetStore.reference.a?.[0] !== undefined && 
                         $TargetStore.reference.a?.[1] !== undefined;
        const hasPointX = $TargetStore.reference.x?.[0] !== undefined && 
                         $TargetStore.reference.x?.[1] !== undefined;
        
        setRefDisabled = !(hasPointA && hasPointX);
        
        // console.log('Reference state:', {
        //     pointA: $TargetStore.reference.a,
        //     pointX: $TargetStore.reference.x,
        //     hasPointA,
        //     hasPointX,
        //     disabled: setRefDisabled
        // });
    });
    
    // onMount(() => {
    //     console.log('Component mounted, store state:', $TargetStore.reference);
    // });
</script>


<div id="reference-panel" class="absolute z-50 grid-rows-[auto_1fr_auto] grid-flow-row pb-0 space-y-0 bg-slate-400 shadow-md w-64 max-w-64 hidden" style="top: {position.top}; left: {position.left};">
    <div id="header" class="w-full bg-slate-600 py-2 px-4 text-xs h-10 place-items-center leading-0 uppercase grid grid-cols-2">
        <p class="tracking-widest pointer-events-none justify-self-start whitespace-nowrap">Reference points</p>
        <p class="justify-self-end">
            <LucideX size="14" class="cursor-pointer" onclick={(e) => { $activePanel = ''; }} />
        </p>
    </div>
    <div class="p-4">
        <label for="atoxInput" class="text-sm text-body-color-dark"></label>
        <div class="grid grid-cols[1fr_1fr] grid-flow-col">
            
            <div class="input-group-cell preset-tonal-primary">A &rArr; X</div>
            <input 
                type="text" 
                id="atoxInput" 
                bind:this={atoxInput} 
                class="w-[8ch] text-center rounded bg-white border-0 text-black text-sm mx-2 align-middle justify-self-center" 
                bind:value={$EditorStore.refMeasurement} 
                pattern={`^(?!^0$)-?\d+[.,]?\d*$`}
            />
            <div class="input-group-cell preset-tonal-primary">{#if $UserSettingsStore.isometrics}cm{:else}in{/if}</div>
            
            {#if !$EditorStore.isRefDirty}
                <div class="z-30 absolute right-[7.75rem] mt-2 text-green-700"><LucideCheck size=20/></div>
            {/if}

            <Button 
                variant="fill-outline" 
                size="sm" 
                disabled={setRefDisabled} 
                onclick={() => target?.setRefMeasurement()}
            >
                Set
            </Button>
        </div>
        <div class="italic text-sm text-body-color-dark/70 mt-2" style="line-height: 14px;">
            Tip: You can change measurement units in <a href="##" class="anchor underline">the settings panel</a>.
        </div>
    </div>
</div>
