<script lang="ts">
    import { togglePanels } from "@/utils/editor/PanelSwitcher";
    import { activePanel, EditorStore } from "@/stores/EditorStore";
    import { LucideRefreshCcw, SlidersHorizontal } from "lucide-svelte";
	import { Button } from "svelte-ux";
	import { checkIfModeCanBeActivated } from "@/utils/editor/ModeSwitcher";
</script>

<Button
    title="Rotate Target"
    id="rotate-button"
    onclick={ () => togglePanels('rotate-panel') }
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
        {$activePanel === 'rotate' ? 'editorButtonActive' : ''}
    "
>
    <LucideRefreshCcw
        class="pointer-events-none"
    />
</Button>