<!-- src/lib/components/target/editor/buttons/TargetReferenceButton.svelte -->
<script lang="ts">
    import { setMode } from "@/utils/editor/ModeSwitcher";
    import { EditorStore, activePanel } from "@/stores/EditorStore";
    import { LucideRuler } from "lucide-svelte";
	import { togglePanels } from "@/utils/editor/PanelSwitcher";
</script>

<button
    title="Set reference"
    id="reference-button"
    onclick={ (e) => { setMode('reference'); console.log($EditorStore.mode) }}
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
</button>