<script lang="ts">
	import Logo from "@/components/logo/logo.svelte";
	import DebugPanel from "@/components/shots/DebugPanel.svelte";
	import { TargetStore } from "@/stores/TargetImageStore";
	import { ChevronLeft, LucideRefreshCcw, LucideRotateCcwSquare, LucideRotateCwSquare } from "lucide-svelte";
	import { onMount } from "svelte";
	import type { PageServerData } from "./$types";

    let { data } : { data: PageServerData } = $props();
    let error: string|undefined = $state();
    let debug: boolean = $state(true);
    let mouse: {x: number, y: number} = $state({ x:0, y:0 });
    let mouseStart: {x: number, y: number} = $state({ x:0, y:0 });
    let chromeArea: {x: number, y: number} = $state({ x:0, y:0 });
    let showMainMenu: boolean = $state(false);
    let scale: undefined|number = $state(1);

    // elements
    let targetContainer: undefined|HTMLDivElement = $state();
    let targetImage: undefined|HTMLImageElement = $state();
    let targetCanvas: undefined|HTMLCanvasElement = $state();
    let rotateSlider: undefined|HTMLInputElement = $state();
    let ctx: CanvasRenderingContext2D|null;
    let target: CanvasImageSource;
    let targetPosition: {x: number, y: number} = $state({ x:0, y:0 });
    let targetWidth: number = $state(0);
    let targetHeight: number = $state(0);

    // drag
    let isDragging: boolean = $state(false);
    let dragOffset: {x: number, y: number} = $state({ x:0, y:0 });

    // mode
    let mode: string|undefined = $state();

    // rotate
    let rotation: number = $state(0);
    let sliderValue: number = $state(0); // Current slider value
    let previousSliderValue: number = $state(0); // Previous slider value
    let showRotationPanel: boolean = $state(false);

    function handleMouseDown(e: MouseEvent) {
        if (mode === 'move') {
            isDragging = true;
            dragOffset = {
                x: e.clientX - targetPosition.x,
                y: e.clientY - targetPosition.y
            };
        }
    }

    function handleMouseMove(e: MouseEvent) {
        mousePosition(e);

        if (isDragging && mode === 'move') {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            targetPosition = {
                x: newX,
                y: newY
            };

            // Redraw the canvas with new position
            redrawCanvas(targetPosition.x, targetPosition.y);
        }
    }

    function handleMouseUp() {
        isDragging = false;
    }

    function handleKeyboard(e: KeyboardEvent)
    {


        // console.log(e)

        if (e.code === 'Escape') {
            e.preventDefault();
            mode = undefined;
        }

        if (e.code === 'Space') {
            e.preventDefault();
            if (e.type === 'keydown') {
                mode = "move";
            }
            if (e.type === 'keyup') {
                mode = undefined;
            }
        }
    }

    function handleWheel(e: MouseEvent)
    {
        console.log(e);
    }

    function mousePosition(e: MouseEvent) {
        mouse = {
            x: e.clientX,
            y: e.clientY
        };
    }

    function getChromeArea(e: Event)
    {
        if (!e.target) return;

        const target = e.target as Window;
        chromeArea.x = target.innerWidth;
        chromeArea.y = target.innerHeight;
    }

    function redrawCanvas(x = targetPosition.x, y = targetPosition.y, width = targetWidth, height = targetHeight, angle = 0, zoom = 1) {
        if (!ctx || !target || !targetCanvas) return;

        const centerX = width / 2.0;
        const centerY = height / 2.0;

        ctx.save();

        ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
        ctx.translate(x,y);
        ctx.rotate( angle )
        ctx.scale( zoom, zoom );

        ctx.drawImage(target, -centerX, -centerY, targetWidth, targetHeight);

        ctx.restore();
    }

    function rotateByDegrees(degrees: number) {
        // rotation = (rotation + degrees) % 360; // Keep rotation between 0-360
        // const angleInRadians = rotation * Math.PI / 180;
        // redrawCanvas(targetPosition.x, targetPosition.y, targetWidth, targetHeight, angleInRadians);
        rotation = rotation + degrees;
        // Reset slider to center position without triggering rotation
        // sliderValue = 0;
        // previousSliderValue = 0;

        const angleInRadians = rotation * Math.PI / 180;
        redrawCanvas(targetPosition.x, targetPosition.y, targetWidth, targetHeight, angleInRadians);
    }

    function rotateByInput(e: Event)
    {

        const deg = parseFloat(e.target.value);
        console.log(deg)
        rotation = 0;
        rotateByDegrees(deg);
    }

    function placeImage()
    {
        if (!targetImage) return;
        if (!targetCanvas) return;
        if (!scale) return;

        $TargetStore.target.image.originalsize = [targetImage.naturalWidth, targetImage.naturalHeight];

        const maxY = chromeArea.y - 100;
        const maxX = chromeArea.x - 100;

        if (targetImage.naturalHeight > maxY) {
            scale = maxY / targetImage.naturalHeight;
        }

        targetWidth = targetImage.naturalWidth * scale;
        targetHeight = targetImage.naturalHeight * scale;
        // console.log(targetWidth, targetHeight)

        // initial position
        targetPosition = {
            x: (chromeArea.x / 2), // - (targetWidth / 2),
            y: (chromeArea.y / 2)// - (targetHeight / 2)),
        };

        console.log(chromeArea.x, targetPosition)

        ctx = targetCanvas.getContext("2d");
        target = new Image();

        target.addEventListener("load", () => {
            // ctx?.drawImage(target, targetPosition.x, targetPosition.y, targetWidth, targetHeight);
            redrawCanvas(targetPosition.x, targetPosition.y);
        });

        target.src = `temp/${$TargetStore.target.image.filename}`;

        // fit



    }

    function handleRotateSliderChange(e: Event) {
        // const newRotation = +(e.target as HTMLInputElement).valueAsNumber;
        // rotation = rotation + newRotation;

        // // Convert degrees to radians for the canvas rotation
        // const angleInRadians = rotation * Math.PI / 180;
        // redrawCanvas(targetPosition.x, targetPosition.y, targetWidth, targetHeight, angleInRadians);
        const newSliderValue = +(e.target as HTMLInputElement).valueAsNumber;
        // Calculate how much the slider has changed
        const delta = newSliderValue - previousSliderValue;

        // Update the total rotation by the slider's change
        rotation = rotation + delta;

        // Update previous slider value for next change
        previousSliderValue = newSliderValue;

        // Convert to radians and redraw
        const angleInRadians = rotation * Math.PI / 180;
        redrawCanvas(targetPosition.x, targetPosition.y, targetWidth, targetHeight, angleInRadians);
    }

    $effect(() => {

    });

    onMount(() => {
        if (!$TargetStore) {
            error = "Cannot find any stores... ";
        }

        chromeArea.x = window.innerWidth;
        chromeArea.y = window.innerHeight;

        // set  image dimensions
        placeImage()
    });
</script>

<svelte:window
    onmousemove={handleMouseMove}
    onmouseup={handleMouseUp}
    onresize={getChromeArea}
    onload={getChromeArea}
    onmousedown={handleMouseDown}
    onkeydown={handleKeyboard}
    onkeyup={handleKeyboard}
    onwheel={handleWheel}
/>

{#if !error}
<aside id="sidebar" class="fixed top-0 left-0 h-full min-h-full z-50 overflow-hidden max-w-28 bg-slate-400 w-fit">
    <button
        id="targetTrackerMenu"
        class="w-10 h-10 p-2 ml-1 my-4 cursor-pointer"
        onclick={() => showMainMenu = true}
    >
        <Logo
            width=22
            height=22
        />
    </button>
    <hr class="max-w-[70%] ml-[15%] opacity-40"/>
    <div id="tools" class="">
        <div id="rotate" class="grid grid-rows-[auto_1fr_auto] grid-flow-row pb-0 space-y-0 bg-slate-400 max-w-fit mt-4">

                <button
                    class="p-2 ml-1 w-10 h-10 cursor-pointer"
                    title="Rotate"
                    onclick={() => showRotationPanel = true }
                >
                    <LucideRefreshCcw size="20" color="#000"/>
                </button>
            {#if showRotationPanel}
                <div id="header" class="w-full bg-slate-600 py-2 px-4 text-xs leading-0 uppercase grid grid-cols-2 cursor-move">
                    <p class="tracking-widest pointer-events-none">Rotation</p>
                    <p class="justify-self-end">
                        <ChevronLeft size="14" class="cursor-pointer" onclick={() => showRotationPanel = false } />
                    </p>
                </div>
                <div class="pt-4">
                    <button id="rotate-left" class="btn ml-4 preset-filled align-middle" onclick={() => rotateByDegrees(-90)}>
                        <LucideRotateCcwSquare color="#000" />
                    </button>

                    <input type="text" size="3" placeholder={`${rotation.toString()}°`} value="{rotation.toString()}°" class="w-[8ch] text-center rounded bg-white/80 border-0 text-black text-sm mx-2 pl-4 p-2 align-middle justify-self-center" onchange={rotateByInput} />

                    <button id="rotate-left" class="btn preset-filled align-middle mr-4" onclick={() => rotateByDegrees(90)}>
                        <LucideRotateCwSquare color="#000" />
                    </button>
                </div>
                <div class="pt-2 w-full mt-2 px-4 pb-2 place-self-start">
                    <input type="range" step="0.1" min="-45" max="45" bind:this={rotateSlider} bind:value={sliderValue} oninput={handleRotateSliderChange} class="slider w-full" id="myRange">
                </div>
            {/if}
        </div>
    </div>
</aside>

    <div id="targetContainer" bind:this={targetContainer} onload={placeImage} class="relative w-[100vw] h-[100vh] overflow-hidden {mode === "move" ? 'cursor-move' : ''}">
        <div class="absolute inset-0 overflow-scroll mr-[-15px] mb-[-15px]">
            <canvas bind:this={targetCanvas} width={chromeArea.x} height={chromeArea.y}></canvas>
        </div>
    </div>

    {#if debug}
        <DebugPanel
            mouse={mouse}
            rotation={rotation}
            window={chromeArea}
            zoom={`${(scale * 100).toPrecision(2) || 0}%`}
        />
    {/if}
    <img src="temp/{$TargetStore.target.image.filename}" onload={placeImage} alt="target" class="hidden" bind:this={targetImage} />
{:else}
    {error}
{/if}
