<!-- src/lib/components/target/editor/buttons/TargetReferenceButton.svelte -->
<script lang="ts">
    import { setMode } from "@/utils/editor/ModeSwitcher";
    import { EditorStore } from "@/stores/EditorStore";
    import { targetInstance } from "@/stores/TargetImageStore";
    import type { Target } from "@/utils/editor/Target";
    import type { PageServerData } from "$types";
    import type { Writable } from "svelte/store";
    import { LucideRuler } from "lucide-svelte";
	import { Button, Toggle, Popover } from "svelte-ux";
	import ReferencePanel from "../panels/ReferencePanel.svelte";
	import { onMount } from "svelte";
	
    let { data } : { data: {data: PageServerData, gunsEvents: GunsEvents} } = $props();
    let target: Writable<Target|undefined>= $state(targetInstance);
    let button = $state();
    let position: {x: number, y: number} = $state({x: 0, y: 0});

    $effect(() => {
        if(button) {
            getButtonPosition(document.getElementById('reference-button'));
        }
    })

    function getButtonPosition(button: HTMLElement | null)
    {
        if(!button) return;
        position.x = button.offsetWidth;
        position.y = button.offsetTop;
        console.log(button)
    }
</script>


<Button
    title="Set reference"
    id="reference-button"
    onclick={ () => setMode('reference') }
    bind:this={button}
    class="
        w-16 
        h-12 
        cursor-pointer 
        hover:bg-gradient-radial 
        from-white/20 
        grid 
        justify-items-center 
        place-items-center 
        items-center
        {$EditorStore.mode === 'reference' ? 'editorButtonActive' : ''}
    "
>
    <LucideRuler
        class="pointer-events-none"
    />

    
</Button>

{#if $EditorStore.mode == 'reference' }
    <ReferencePanel
        data={data.data}
        {target}
        {position}
        classes="bg-white dark:bg-slate-800 border shadow rounded-lg absolute z-50 max-w-fit"
    />
{/if}