<script lang="ts">
    import { EditorStore } from "@/stores/EditorStore";
	import { setMode } from "@/utils/editor/ModeSwitcher";
    import { SlidersHorizontal } from "lucide-svelte";
	import { Button } from "svelte-ux";
</script>

<Button
    title="Editor Settings"
    id="settings-button"
    onclick={ () => setMode('settings') }
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