<script lang="ts">
    import { EditorStore } from "@/stores/EditorStore";
    import { LucideRefreshCcw } from "lucide-svelte";
    import RotatePanel from "../panels/RotatePanel.svelte";
	import { Button } from "svelte-ux";
	import { setMode } from "@/utils/editor/ModeSwitcher";
    import { getElementPosition } from "@/utils/editor/EditorUtils";

    // let target: Writable<Target|undefined>= $state(targetInstance);
    let button: Button|undefined = $state();
    let position: {x: number, y: number} = $state({x: 0, y: 0});

    $effect(() => {
        if(button) {
            let actualbutton = getElementPosition(document.getElementById('rotate-button'));
            if (actualbutton) position = actualbutton;
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
    title="Rotate Target"
    id="rotate-button"
    onclick={ () => {setMode('rotate'); console.log(position)} }
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
    "
>
    <LucideRefreshCcw
        class="pointer-events-none"
    />
</Button>

{#if $EditorStore.mode == 'rotate'}
<RotatePanel 
    {position}
    classes="bg-white dark:bg-slate-800 border shadow rounded-lg absolute z-50 max-w-fit min-w-72 text-sm"
/>
{/if}