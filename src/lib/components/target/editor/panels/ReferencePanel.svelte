<!-- src/lib/components/target/editor/panels/ReferencePanel.svelte -->
<script lang="ts">
    import { type PageServerData } from "$types";
    import { LucideX, LucideCheck } from "lucide-svelte";
    import { EditorStore } from '@/stores/EditorStore';
    import { TargetStore } from "@/stores/TargetImageStore";
    import { targetInstance } from "@/stores/TargetImageStore";
    import { UserSettingsStore } from "@/stores/UserSettingsStore";
    import { Button, Field, Input } from "svelte-ux";
	import { Target } from "@/utils/editor/Target";
	import type { Writable } from "svelte/store";
	import { onMount } from "svelte";

    let { data, target, position, classes } : { 
        data: PageServerData, 
        target: Writable<Target | undefined>,
        position: {x: number, y: number},
        classes?: string
    } = $props();

    let atoxInput: HTMLInputElement|undefined|any = $state();
    let setRefDisabled: boolean = $state(true);
    let isometrics = $state($UserSettingsStore.isometrics);
        
    $effect(() => {
        const hasPointA = $TargetStore.reference.a?.[0] !== undefined && 
                         $TargetStore.reference.a?.[1] !== undefined;
        const hasPointX = $TargetStore.reference.x?.[0] !== undefined && 
                         $TargetStore.reference.x?.[1] !== undefined;
        
        setRefDisabled = !(hasPointA && hasPointX);

        if(atoxInput) {
            // atoxInput.focus()
        }
        
        // console.debug('Reference state:', {
        //     pointA: $TargetStore.reference.a,
        //     pointX: $TargetStore.reference.x,
        //     hasPointA,
        //     hasPointX,
        //     disabled: setRefDisabled
        // });
    });

    onMount(() => {
        
    })
</script>


<div 
    id="reference-panel"
    class="{classes}"
    style="left:{position.x}px; top:{position.y}px"
>
    <div id="header" class="w-full dark:bg-slate-900 py-3 pb-4 px-4 place-items-center leading-0 uppercase rounded-t-lg grid grid-cols-2">
        <p class="tracking-widest pointer-events-none justify-self-start whitespace-nowrap">Reference points</p>
        <p class="justify-self-end">
            <LucideX size="14" class="cursor-pointer" onclick={(e) => { $EditorStore.mode = 'none'; }} />
        </p>
    </div>
    <div class="p-4">
        <label for="atoxInput" class="text-body-color-dark"></label>
        <div class="grid grid-flow-col gap-x-2 grid-cols-[1fr_1fr]">
            <Field
                label="A to X distance:"
                class="grid grid-flow-col grid-cols-[2fr_auto_3fr] gap-x-1 max-w-[75%]"
                let:id
            >
                <input 
                    {id}
                    type="text" 
                    name="atoxInput" 
                    bind:this={atoxInput} 
                    class="text-right appearance-none bg-transparent dark:bg-transparent focus:outline-none border-b-2 border-solid border-transparent focus:border-b-slate-600" 
                    bind:value={$EditorStore.refMeasurement} 
                    pattern={`^(?!^0$)-?\d+[.,]?\d*$`}
                />
                <div class="input-group-cell preset-tonal-primary ">
                    <select 
                        bind:value={$EditorStore.refMeasurementUnit}
                        class="min-w-16 mr-2 p-2 bg-transparent border-solid border-transparent border-b-2"
                    >
                        <!-- Yanky lösning #7168-->
                        {#if isometrics == true}
                            <option selected value="cm">cm</option>
                            <option value="in">in</option>
                        {:else}
                            
                            <option selected value="in">in</option>
                            <option value="cm">cm</option>
                        {/if}
                    </select>
                </div>
                
                    <div class="{$EditorStore.isRefDirty ? 'text-transparent' : 'text-green-700'}">
                        <LucideCheck 
                            size=20 
                        />
                    </div>
            </Field>
            <button 
                disabled={setRefDisabled} 
                onclick={() => $targetInstance?.setRefMeasurement()}
                class="min-w-20 border rounded bg-slate-600"
            >
                Set
            </button>
        </div>
    </div>
</div>
