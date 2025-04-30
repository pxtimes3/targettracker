<script lang="ts">
    import { togglePanels } from "@/utils/editor/PanelSwitcher";
    import { EditorStore } from "@/stores/EditorStore";
    import { SlidersHorizontal } from "lucide-svelte";
	import { Button } from "svelte-ux";
</script>

<Button
    title="Editor Settings"
    id="settings-button"
    onclick={ () => togglePanels('settings-panel') }
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
        {$EditorStore.mode === 'settings' ? 'editorButtonActive' : ''}
    "
>
    <SlidersHorizontal
        class="pointer-events-none"
    />
</Button>