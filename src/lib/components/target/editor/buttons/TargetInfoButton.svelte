<script lang="ts">
    import { EditorStore } from "@/stores/EditorStore";
    import { LucideTarget } from "lucide-svelte";
	import { setMode } from "@/utils/editor/ModeSwitcher";
</script>

<button
    title="Target information"
    id="info-button"
    onclick={ () => { setMode('info') } }
    class="w-16 h-12 mt-2 grid cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center {$EditorStore.mode === 'info' ? 'active' : ''} place-items-center"
>
    <LucideTarget
        class="pointer-events-none"
    />
</button>