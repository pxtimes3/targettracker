<script lang="ts">
    import { EditorStore } from "@/stores/EditorStore";
    import { LucideRefreshCcw } from "lucide-svelte";
    import RotatePanel from "../panels/RotatePanel.svelte";
	import { Button } from "svelte-ux";
	import { setMode } from "@/utils/editor/ModeSwitcher";

    let position: {x: number, y: number} = $state({x:0, y:0});
</script>

<Button
    title="Rotate Target"
    id="rotate-button"
    onclick={ () => setMode('rotate') }
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
/>
{/if}