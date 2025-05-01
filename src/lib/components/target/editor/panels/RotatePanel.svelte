<script lang="ts">
    import { TargetStore } from "@/stores/TargetImageStore";
    import { EditorStore } from "@/stores/EditorStore";
    import { targetInstance } from "@/stores/TargetImageStore";
	import { LucideX, LucideRotateCcwSquare, LucideRotateCwSquare } from "lucide-svelte";
	import { setMode } from "@/utils/editor/ModeSwitcher";
	import { Field } from "svelte-ux";

    let { position, classes }: { position: { x: number, y: number }|undefined, classes?: string } = $props();

    let slider: number = $state(0);
</script>

<div 
    id="rotate-panel" 
    class="{classes}"
    style="left:{position?.x}px; top:{position?.y}px"
>
    <div id="header" class="w-full dark:bg-slate-900 py-3 pb-4 px-4 place-items-center leading-0 uppercase rounded-t-lg grid grid-cols-2">
        <p class="tracking-widest pointer-events-none justify-self-start">Rotation</p>
        <p class="justify-self-end">
            <LucideX size="14" class="cursor-pointer" onclick={ (e) => setMode('none') } />
        </p>
    </div>
    <div class="pt-4 bg-surface-100">
        <div id="controls">
            <div 
                id="buttons"
                class="grid grid-flow-col grid-cols-[minmax(2rem,_4rem)_auto_minmax(2rem,_4rem)]"
            >
                <button 
                    id="rotate-left" 
                    class="btn dark:text-slate-100 place-self-center"
                    title="Rotate target 90&deg; counter-clockwise."
                    onclick={() => $targetInstance?.rotateTarget(-90)}
                >
                    <LucideRotateCcwSquare 
                    />
                </button>

                <input
                    type="text"
                    maxlength="3"
                    value={`${$TargetStore.target.rotation?.toFixed(0).toString()}`}
                    title="Rotate target image by X degrees."
                    class="
                        w-full 
                        text-center 
                        rounded 
                        bg-transparent 
                        border-b-2 
                        border-solid 
                        border-transparent 
                        focus:border-b-slate-600
                        text-black 
                        dark:text-white 
                        text-sm 
                        mx-2 
                        p-2 
                        align-middle 
                        justify-self-center
                        focus:outline-none 
                        hover:bg-slate-500/20
                        focus:bg-slate-500/20
                    "
                    onkeyup={
                        (e) => {
                            setTimeout(() => {
                                let t = e.target as HTMLInputElement; $targetInstance?.rotateTarget(parseFloat(t.value), {absolute: true})
                            }, 500)
                        }
                    }
                />

                <button 
                    id="rotate-right" 
                    class="btn dark:text-slate-100 place-self-center" 
                    title="Rotate target 90&deg; clockwise."
                    onclick={() => $targetInstance?.rotateTarget(90)}
                >
                    <LucideRotateCwSquare />
                </button>
            </div>
            <hr 
                class="mt-4"
            />
            <div 
                id="slider"
                class="
                    w-full 
                    mt-2 
                    px-4 
                    py-2 
                    place-self-start
                    grid
                    grid-flow-col 
                    grid-cols-[minmax(3ch,_5ch)_auto_minmax(3ch,_5ch)]
                "
            >
                <div class="text-sm row-start-1 col-start-1">-45&deg;</div>
                <div class="text-sm row-start-1 col-start-3 text-right">-45&deg;</div>
                <div class="col-start-2">
                    <input type="range" step="1" min="-45" max="45" bind:value={slider} oninput={() => $targetInstance?.rotateTarget(0, {slider: slider})} class="slider w-full" id="rotationslider">
                </div>
            </div>
        </div>
    </div>
</div>