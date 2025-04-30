<script lang="ts">
    import { checkIfModeCanBeActivated, setMode } from "@/utils/editor/ModeSwitcher";
    import { EditorStore, activePanel } from "@/stores/EditorStore";
    import { LucideLocateFixed } from "lucide-svelte";
	import { Button } from "svelte-ux";
</script>

<Button
    title="Set point of aim"
    id="poa-button"
    onclick={ () => { setMode('poa') }}
    disabled={checkIfModeCanBeActivated('poa') ? false : true }
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
        {$EditorStore.mode === 'poa' ? 'editorButtonActive' : ''}
    "
>
    <LucideLocateFixed
        class="pointer-events-none"
    />
</Button>