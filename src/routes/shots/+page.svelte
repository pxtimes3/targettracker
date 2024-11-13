<script lang="ts">
	import { browser } from "$app/environment";
	import Logo from "@/components/logo/logo.svelte";
	import DebugPanel from "@/components/shots/DebugPanel.svelte";
	import { TargetStore } from "@/stores/TargetImageStore";
	import { ChevronLeft, LucideLocateFixed, LucideRefreshCcw, LucideRotateCcwSquare, LucideRotateCwSquare, LucideRuler } from "lucide-svelte";
	import { onMount } from "svelte";
	import type { PageServerData } from "./$types";

    let { data } : { data: PageServerData } = $props();

    let error: string|undefined = $state();
    let debug: boolean = $state(true);
    let mouse: {x: number, y: number} = $state({ x:0, y:0 });
    let mouseStart: {x: number, y: number} = $state({ x:0, y:0 });
    let chromeArea: {x: number, y: number} = $state({ x:0, y:0 });
    let showMainMenu: boolean = $state(false);
    let scale: undefined|number = $state(0);

    // elements
    let targetContainer: undefined|HTMLDivElement = $state();
    let targetImage: undefined|HTMLImageElement = $state();
    let targetCanvas: undefined|HTMLCanvasElement = $state();
    let rotateSlider: undefined|HTMLInputElement = $state();
    let ctx: CanvasRenderingContext2D|null;

    // canvas
    let canvasScale: number = $state(1);
    let canvasRotation: number = $state(0);

    // drag
    let isDragging: boolean = $state(false);
    let dragOffset: {x: number, y: number} = $state({ x:0, y:0 });
    let totalOffset = { x: 0, y: 0 };

    // mode
    let mode: string|undefined = $state();
    let cursor: string|undefined = $state();

    // rotate
    let rotation: number = $state(0);
    let sliderValue: number = $state(0); // Current
    let previousSliderValue: number = $state(0);

    // zoom
    const zoomStep = 0.1;

    // reference
    let aIsSet: boolean = $state(false);
    let xIsSet: boolean = $state(false);

    // let activeGroup: number = $state( || 0);

    // functions
    function handleClick(e: MouseEvent): void
    {
        if (!targetCanvas || !$TargetStore.target.scale) {
            console.error('No target canvas or scale!?');
            return;
        }
        // Canvas center
        const centerX = targetCanvas.width / 2;
        const centerY = targetCanvas.height / 2;

        // Var är vi i förhållande till center?
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;

        // Grader till radianer!
        const rotation = ($TargetStore.target.rotation * Math.PI) / 180;

        // Revert rotation...
        const unrotatedX = dx * Math.cos(-rotation) - dy * Math.sin(-rotation);
        const unrotatedY = dx * Math.sin(-rotation) + dy * Math.cos(-rotation);

        // Revert scale...
        const unscaledX = unrotatedX / $TargetStore.target.scale;
        const unscaledY = unrotatedY / $TargetStore.target.scale;

        // Revert 3!?!????
        const finalX = unscaledX + centerX;
        const finalY = unscaledY + centerY;

        const adjustedX = finalX - dragOffset.x;
        const adjustedY = finalY - dragOffset.y;

        if (mode === 'poa') {
            addEditPoa(adjustedX, adjustedY);
        }

        if (mode === 'reference') {
            addEditReferencePoint(adjustedX, adjustedY);
        }

        if (mode === 'move') {
            mouseStart = { x: e.clientX, y: e.clientY }
            isDragging = true;
        }
    }

    function addEditReferencePoint(x: number, y: number): void
    {
        if (!$TargetStore.reference) {
            console.error('No reference in target object!');
            return;
        }

        if (!$TargetStore.reference.a || aIsSet === false) {
            console.log('setting a')
            const refImage = new Image();
            refImage.src = 'cursors/circle-a.svg';
            refImage.onload = () => {
                console.log('a loaded')
                $TargetStore.reference.a = [x, y];
                $TargetStore.reference.aImage = refImage;
                aIsSet = true;
                drawCanvas();
            }
        } else if (!$TargetStore.reference.x || xIsSet === false) {
            console.log('setting x')
            const refImage = new Image();
            refImage.src = 'cursors/circle-x.svg';
            refImage.onload = () => {
                $TargetStore.reference.x = [x, y];
                $TargetStore.reference.xImage = refImage;
                xIsSet = true;
                drawCanvas();
            }
        }
    }

    function addEditPoa(x: number, y: number): void
    {
        if (!$TargetStore.groups[$TargetStore.activeGroup]) {
            console.error('No groups in store?', $TargetStore.groups);
            return;
        }

        const group = $TargetStore.groups[$TargetStore.activeGroup];
        // console.log(`adding poa ${x}:${y}`)

        if (!group.poa?.image?.src || group.poa?.image === undefined) {
            const poaImage = new Image();
            poaImage.src = 'cursors/poa.svg';  // Set src first
            poaImage.onload = () => {
                $TargetStore.groups[$TargetStore.activeGroup] = {
                    ...$TargetStore.groups[$TargetStore.activeGroup],
                    poa: {
                        image: poaImage,
                        x: x,
                        y: y
                    }
                };
                drawCanvas();
            };
        } else if(group.poa) {
            group.poa.x = x
            group.poa.y = y
            drawCanvas();
        } else {
            // TODO: Logging
            console.error('Failed PoA!');
        };

        setMode(undefined);
    }

    function handleMouseMove(e: MouseEvent): void
    {
        mousePosition(e);

        if (isDragging && mode === 'move') {
            // Offset
            const dx = e.clientX - mouseStart.x;
            const dy = e.clientY - mouseStart.y;

            // Rotation
            const rotation = ($TargetStore.target.rotation * Math.PI) / 180;

            // Do rotate
            const rotatedDX = dx * Math.cos(rotation) + dy * Math.sin(rotation);
            const rotatedDY = -dx * Math.sin(rotation) + dy * Math.cos(rotation);

            totalOffset.x += rotatedDX;
            totalOffset.y += rotatedDY;

            dragOffset = {
                x: totalOffset.x,
                y: totalOffset.y
            };

            mouseStart = {
                x: e.clientX,
                y: e.clientY
            };

            drawCanvas();
        }
    }

    function handleMouseUp(): void
    {
        isDragging = false;
    }

    function handleKeyboard(e: KeyboardEvent): void
    {
        if (e.code === 'Escape') {
            e.preventDefault();
            setMode(undefined);
        }

        if (e.code === 'Space') {
            e.preventDefault();
            if (e.type === 'keydown') {
                setMode("move");
            }
            if (e.type === 'keyup') {
                setMode(undefined);
            }
        }
    }

    function handleZoom(e: WheelEvent): void
    {
        if (!$TargetStore.target.scale) {
            console.error('No scale set?');
            return;
        }
        console.log(`delta: `, e.deltaY, `scale: ${scale}`);

        if (e.deltaY < 0 && $TargetStore.target.scale > 0.15) {
            $TargetStore.target.scale -= zoomStep
        }
        if (e.deltaY > 0  && $TargetStore.target.scale < 3.0) {
            $TargetStore.target.scale += zoomStep
        }

        drawCanvas();
    }

    function mousePosition(e: MouseEvent): void
    {
        mouse = {
            x: e.clientX,
            y: e.clientY
        };
    }

    function getChromeArea(e: Event): void
    {
        if (!e.target) return;

        const target = e.target as Window;
        chromeArea.x = target.innerWidth;
        chromeArea.y = target.innerHeight;
    }

    function initCanvas() {
        if (!targetCanvas || !ctx) return;

        if (!$TargetStore.target.image) {
            console.error('No image in store?');
        }

        const targetImage = new Image();
        targetImage.src = `temp/${$TargetStore.target.image.filename}`;
        targetImage.onload = () => {
            scale = Math.min(
                (window.innerHeight - 100) / targetImage.height,
                (window.innerWidth - 100) / targetImage.width
            );

            $TargetStore.target.scale = scale;
            $TargetStore.target.image = {
                ...$TargetStore.target.image,
                image: targetImage,
                x: (window.innerWidth / 2) - (targetImage.width / 2),
                y: (window.innerHeight / 2) - (targetImage.height / 2),
                w: targetImage.width,
                h: targetImage.height
            }

            drawCanvas();
        };

    }

    function drawCanvas() {
        if (!ctx || !targetCanvas || !$TargetStore.target.scale) return;

        ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

        ctx.save();
        ctx.translate(targetCanvas.width/2, targetCanvas.height/2);
        ctx.scale($TargetStore.target.scale, $TargetStore.target.scale);
        ctx.rotate($TargetStore.target.rotation * Math.PI / 180); // $TargetStore.target.rotation = degrees
        ctx.translate(-targetCanvas.width/2, -targetCanvas.height/2);

        // Draw target
        if (
            $TargetStore.target.image.image &&
            $TargetStore.target.image.x &&
            $TargetStore.target.image.y &&
            $TargetStore.target.image.w &&
            $TargetStore.target.image.h
        ) {
            // console.log(`drawing target. scale: ${$TargetStore.target.scale}`);
            // console.log(dragOffset)
            // console.log($TargetStore.target.image.x - dragOffset.x, $TargetStore.target.image.y - dragOffset.y, $TargetStore.target.image.w, $TargetStore.target.image.h)
            ctx.drawImage(
                $TargetStore.target.image.image,
                 + dragOffset.x,
                (window.innerHeight / 2) - ($TargetStore.target.image.h / 2) + dragOffset.y,
                $TargetStore.target.image.w,
                $TargetStore.target.image.h
            );
        }

        // RITA GROUPS!
        $TargetStore.groups.forEach(group => {
            if (group.poa?.image?.src) {
                if (!ctx || !group.poa.x || !group.poa.y || !$TargetStore.target.scale) return;
                const poaSize = 36 / $TargetStore.target.scale;
                ctx.drawImage(
                    group.poa.image,
                    group.poa.x - (poaSize/2) + dragOffset.x,
                    group.poa.y - (poaSize/2) + dragOffset.y,
                    poaSize,
                    poaSize
                );
            }

            group.shots?.forEach(shot => {
                if (shot.image) {
                    if (!ctx || !shot.x || !shot.y || !$TargetStore.target.scale) return;
                    ctx.drawImage(
                        shot.image,
                        shot.x - 18,
                        shot.y - 18,
                        36,
                        36
                    );
                }
            });
        });

        if ($TargetStore.reference.a && $TargetStore.reference.a.length > 1 && $TargetStore.reference.aImage?.src) {
            if (!ctx) return;
            const size = 36 / $TargetStore.target.scale;
            ctx.drawImage(
                $TargetStore.reference.aImage,
                $TargetStore.reference.a[0],
                $TargetStore.reference.a[1],
                36,
                36
            )
        }

        if ($TargetStore.reference.x && $TargetStore.reference.x.length > 1 && $TargetStore.reference.xImage?.src) {
            if (!ctx) return;
            const size = 36 / $TargetStore.target.scale;
            ctx.drawImage(
                $TargetStore.reference.xImage,
                $TargetStore.reference.x[0],
                $TargetStore.reference.x[1],
                36,
                36
            )
        }

        ctx.restore();
    }

    function rotateByDegrees(degrees: number): void
    {
        $TargetStore.target.rotation = ($TargetStore.target.rotation + degrees) % 360;

        drawCanvas();
    }

    function rotateByInput(e: Event): void
    {
        if (!e.target) return;
        const target = e.target as HTMLInputElement;

        // parseFloat för valueAsNumber blir keff iom. att vi visar med ° i inputen
        const deg = parseFloat(target.value);

        $TargetStore.target.rotation = 0; // sätt till 0 för att inte göra total rotation = nuvarande rotation + input.
        sliderValue = 0;
        rotateByDegrees(deg);
    }

    function handleRotateSliderChange(e: Event) {
        const newSliderValue = +(e.target as HTMLInputElement).valueAsNumber;
        const delta = newSliderValue - previousSliderValue;

        $TargetStore.target.rotation = $TargetStore.target.rotation + delta;

        previousSliderValue = newSliderValue;

        drawCanvas();
    }

    // TODO: Göm andra paneler
    function showPanel(e: Event, name: string): void
    {
        if (!e.target) return;

        let button;
        let target = e.target as Element;

        if (target.tagName === "button") {
            button = target as HTMLButtonElement;
        } else {
            button = document.getElementById(`${name}-button`);
            if (!button) return;
        }

        let panel: HTMLElement|null = document.getElementById(name) || null;

        if (panel === null) {
            console.error(`${name} couldn't be found!?`);
            return;
        }


        panel.classList.contains('hidden') ? panel.classList.remove('hidden') : panel.classList.add('hidden');
        panel.style.top = `${button.offsetTop}px`;
        panel.style.left = `${button.offsetWidth + 4}px`;
        button.classList.contains('bg-black/20') ? button.classList.remove('bg-black/20') : button.classList.add('bg-black/20');
    }

    function setReferenceMeasurement(e: Event): void
    {
        if (!e.target) return;
        const input = e.target as HTMLInputElement;
        const value = input.value
        $TargetStore.reference.measurement = parseFloat(input.value);
    }

    function setMode(setmode: string|undefined): void
    {
        // console.log('mode:', setmode);
        if (mode === setmode) return;

        mode = setmode;

        switch (mode) {
            case "poa":
                cursor = 'cursor-crosshair';
                break;
            case "move":
                cursor = 'cursor-move';
                break;
            case 'shot':
                cursor = 'cursor-shot';
                break;
            case 'reference':
                cursor = 'cursor-dot';
                break;
            case undefined:
                cursor = 'cursor-default';
                break;
            default:
                cursor = 'cursor-default';
                break;
        }

    }

    $effect(() => {
        if (canvasScale !== 1 || canvasRotation !== 0) {
            drawCanvas();
        }
        if (aIsSet && xIsSet) {
            cursor = 'cursor-default';
        }
    });

    onMount(() => {
        if (!$TargetStore) {
            error = "Cannot find any stores... ";
            return;
        }

        chromeArea.x = window.innerWidth;
        chromeArea.y = window.innerHeight;

        if (!targetCanvas) return;
        ctx = targetCanvas.getContext('2d');
        if (!ctx) return;

        // TODO: Debug
        $TargetStore.target.rotation = 0;
        totalOffset = { x: 0, y: 0 };
        dragOffset = { x: 0, y: 0 };

        initCanvas();
    });
</script>

<svelte:window
    onmousemove={handleMouseMove}
    onmouseup={handleMouseUp}
    onresize={getChromeArea}
    onload={getChromeArea}
    onkeydown={handleKeyboard}
    onkeyup={handleKeyboard}
/>

{#if !error}
    <aside id="sidebar" class="fixed grid grid-flow-row place-content-start top-0 left-0 h-full min-h-full z-50 overflow-hidden w-10 max-w-10 p-0 bg-slate-400">
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
        <div id="tools" class="grid grid-flow-row">
            <button
                class="w-10 h-10 cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center"
                title="Rotate target"
                id="rotate-button"
                onclick={(e) => { showPanel(e, "rotate") }}
            >
                <LucideRefreshCcw
                    size="20"
                    color="#000"
                    class="pointer-events-none"
                />
            </button>

            <button
                title="Set point of aim"
                onclick={() => {mode === "poa" ? setMode(undefined) : setMode("poa"); }}
                class="{mode === "poa" ? 'bg-black/20' : ''} w-10 h-10 cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center"
            >
                <LucideLocateFixed
                    color="#000"
                    class="pointer-events-none"
                />
            </button>

            <button
                title="Set reference"
                id="reference-button"
                onclick={(e) => {mode === "reference" ? setMode(undefined) : setMode("reference"); showPanel(e, "reference")}}
                class="{mode === "reference" ? 'bg-black/20' : ''} w-10 h-10 cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center"
            >
                <LucideRuler
                    color="#000"
                    class="pointer-events-none"
                />
            </button>
        </div>
    </aside>

    <!-- panels
         TODO: Conforme le sizes!
    -->
    <div id="rotate" class="absolute z-50 grid grid-rows-[auto_1fr_auto] grid-flow-row pb-0 space-y-0 bg-slate-400 max-w-fit hidden shadow-md">
        <div id="header" class="w-full bg-slate-600 py-2 px-4 text-xs h-10 place-items-center leading-0 uppercase grid grid-cols-2">
            <p class="tracking-widest pointer-events-none justify-self-start">Rotation</p>
            <p class="justify-self-end">
                <ChevronLeft size="14" class="cursor-pointer" onclick={(e) => showPanel(e, "rotate") } />
            </p>
        </div>
        <div class="pt-4">
            <button id="rotate-left" class="btn ml-4 preset-filled align-middle" onclick={() => rotateByDegrees(-90)}>
                <LucideRotateCcwSquare color="#000" />
            </button>

            <input type="text" size="3" placeholder={`${$TargetStore.target.rotation.toString()}°`} value="{$TargetStore.target.rotation.toString()}°" class="w-[8ch] text-center rounded bg-white/80 border-0 text-black text-sm mx-2 pl-4 p-2 align-middle justify-self-center" onchange={rotateByInput} />

            <button id="rotate-left" class="btn preset-filled align-middle mr-4" onclick={() => rotateByDegrees(90)}>
                <LucideRotateCwSquare color="#000" />
            </button>
        </div>
        <div class="pt-2 w-full mt-2 px-4 pb-2 place-self-start">
            <input type="range" step="0.1" min="-45" max="45" bind:this={rotateSlider} bind:value={sliderValue} oninput={handleRotateSliderChange} class="slider w-full" id="myRange">
        </div>
    </div>

    <div id="reference" class="absolute z-50 grid grid-rows-[auto_1fr_auto] grid-flow-row pb-0 space-y-0 bg-slate-400 max-w-fit shadow-md left-11 top-10 max-w-72">
        <div id="header" class="w-full bg-slate-600 py-2 px-4 text-xs h-10 place-items-center leading-0 uppercase grid grid-cols-2">
            <p class="tracking-widest pointer-events-none justify-self-start whitespace-nowrap">Reference points</p>
            <p class="justify-self-end">
                <ChevronLeft size="14" class="cursor-pointer" onclick={(e) => showPanel(e, "reference") } />
            </p>
        </div>
        <div class="p-4">
            <label for="atoxInput" class="text-sm text-body-color-dark"></label>
            <div class="input-group text-xs divide-surface-200-800 grid-cols-[auto_1fr_auto] divide-x text-body-color-dark bg-white">
                <div class="input-group-cell preset-tonal-surface">A &rArr; X</div>
                <input type="text" id="atoxInput" class="bg-white text-xs" bind:value={$TargetStore.reference.measurement} onchange={setReferenceMeasurement}>
                <div class="input-group-cell preset-tonal-surface">cm</div>
            </div>
            <div class="italic text-sm text-body-color-dark/70 mt-2" style="line-height: 14px;">
                Tip: You can change measurement units in <a href="##" class="anchor underline">the settings panel</a>.
            </div>
        </div>
    </div>
    {#if mode === "reference"}
        <div class="absolute p-2 bg-black/70 text-xs font-white z-40 pointer-events-none" style="top: {mouse.y + 20}px; left: {mouse.x + 20}px">
            {#if !aIsSet}
                Set start point.
            {:else if !xIsSet}
                Set end point.
            {:else}
                Drag points to desired position.
            {/if}
        </div>
    {/if}



    <div id="targetContainer" bind:this={targetContainer} class="relative w-[100vw] h-[100vh] overflow-hidden {cursor}">
        <div class="absolute inset-0 overflow-scroll mr-[-15px] mb-[-15px]">
            <canvas
                bind:this={targetCanvas}
                width={chromeArea.x}
                height={chromeArea.y}
                onmousedown={handleClick}
                onwheel={handleZoom}
            ></canvas>
        </div>
    </div>

    <!-- cursor -->
    <!--
        <div id="cursor" bind:this={cursorContainer}><img src={cursor} style="pointer-events: none; position:absolute; z-index: 60; top:{mouse.y}px; left:{mouse.x}px;" alt="cursor" /></div>
    -->

    {#if debug}
        <DebugPanel
            mouse={mouse}
            rotation={rotation}
            window={chromeArea}
            zoom={`${($TargetStore.target.scale * 100)  || 0}%`}
            mode={mode}
        />
    {/if}
    {#if browser}
        <img src="temp/{$TargetStore.target.image.filename}" alt="target" class="hidden" bind:this={targetImage} />
        <img src="cursors/poa.svg" alt="poa" class="hidden" />
    {/if}
{:else}
    {error}
{/if}
