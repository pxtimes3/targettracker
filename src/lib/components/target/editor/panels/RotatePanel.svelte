<script lang="ts">
    import { TargetStore } from "@/stores/TargetImageStore";
    import { EditorStore } from "@/stores/EditorStore";
    import { targetInstance } from "@/stores/TargetImageStore";
	import { LucideX, LucideRotateCcwSquare, LucideRotateCwSquare } from "lucide-svelte";
	import { setMode } from "@/utils/editor/ModeSwitcher";

    let { position }: { position: { x: number, y: number }|undefined } = $props();

    let slider: number = $state(0);
</script>

<div id="rotate-panel" class="absolute z-50 {$EditorStore.mode === 'rotate' ? 'grid' : 'hidden' }  grid-rows-[auto_1fr_auto] grid-flow-row pb-0 space-y-0 bg-slate-400 w-64 max-w-64">
    <div id="header" class="w-full py-2 px-4 text-xs text-black h-8 place-items-center leading-0 uppercase grid grid-cols-2">
        <p class="tracking-widest pointer-events-none justify-self-start">Rotation</p>
        <p class="justify-self-end">
            <LucideX size="14" class="cursor-pointer" onclick={ (e) => setMode('none') } />
        </p>
    </div>
    <div class="pt-4">
        <button id="rotate-left" class="btn ml-4 preset-filled align-middle" onclick={() => $targetInstance?.rotateTarget(-90)}>
            <LucideRotateCcwSquare color="#000" />
        </button>

        <input
            type="text"
            size="3"
            placeholder={`${$TargetStore.target.rotation?.toString()}`}
            value={`${$TargetStore.target.rotation?.toFixed(0).toString()}`}
            class="w-[8ch] text-center rounded bg-white/80 border-0 text-black text-sm mx-2 pl-4 p-2 align-middle justify-self-center"
			onkeyup={
				(e) => {
					setTimeout(() => {
						let t = e.target as HTMLInputElement; $targetInstance?.rotateTarget(parseFloat(t.value), {absolute: true})
					}, 500)
				}
			}
        />

        <button id="rotate-left" class="btn preset-filled align-middle mr-4" onclick={() => $targetInstance?.rotateTarget(90)}>
            <LucideRotateCwSquare color="#000" />
        </button>
    </div>
    <div class="pt-2 w-full mt-2 px-4 pb-2 place-self-start">
        <input type="range" step="1" min="-45" max="45" bind:value={slider} oninput={() => $targetInstance?.rotateTarget(0, {slider: slider})} class="slider w-full" id="rotationslider">
    </div>
</div>