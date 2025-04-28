<!-- src/routes/pixi/+page.svelte -->
<script lang="ts">
	import { browser } from '$app/environment';
	import Logo from '@/components/logo/logo.svelte';
	import { EditorStore, activePanel, activeButton } from '@/stores/EditorStore';
	import { TargetStore } from '@/stores/TargetImageStore';
	import { UserSettingsStore } from '@/stores/UserSettingsStore';
	import InfoPanel from '@/components/target/editor/panels/InfoPanel.svelte';
	import SettingsPanel from '@/components/target/editor/panels/SettingsPanel.svelte';
	import GroupPanel from '@/components/target/editor/panels/GroupPanel.svelte';
	import ReferencePanel from '@/components/target/editor/panels/ReferencePanel.svelte';
	import { Target } from '@/utils/editor/Target';
	import { LucideBug, LucideLocate, LucideLocateFixed, LucideSave, LucideRefreshCcw, LucideRotateCcwSquare, LucideRotateCwSquare, LucideRuler, LucideTarget, LucideX, SlidersHorizontal } from 'lucide-svelte';
	import type { ContainerChild, Renderer } from 'pixi.js';
	import { Assets, Container, Sprite } from 'pixi.js';
	import { onDestroy, onMount } from 'svelte';
	import type { PageServerData } from './$types';
	import { ThemeSwitch } from 'svelte-ux';

	let { data } : { data: PageServerData } = $props();

	let mode: undefined|string|"shots"|"reference"|"poa"|"move" = $state();
	let mouse: {[key: string]: number; x: number, y:number} = $state({x:0, y:0});

	let staticAssets: string[] = $state([
		'/cursors/circle-a.svg',
		'/cursors/circle-x.svg',
		'/cursors/dot.svg',
		'/cursors/move.svg',
		'/cursors/poa.svg',
		'/cursors/pointer.svg',
		'/cursors/shot.svg'
	]);


	let showMainMenu: boolean = $state(false);

	let slider: number = $state(0);

	
	let selected: Array<Sprite | Container<ContainerChild>> = $state($EditorStore.selected);
	let assignToGroupSelect: HTMLSelectElement|undefined = $state();

	let canvasContainer: HTMLDivElement;
    let loader: HTMLDivElement;
    let applicationState: string = $state('Loading...');
    let target: Target|undefined = $state();
    let chromeArea: {x: number, y: number} = $state({x: 0, y: 0});
	let referencebutton: HTMLButtonElement|undefined = $state();

	function mousePosition(e: MouseEvent): void
    {
        mouse = {
            x: e.clientX,
            y: e.clientY
        };
    }

    async function getChromeArea(e?: Event): Promise<void> {
		applicationState = "Looking out the window... ";

		let targetWindow;

		if (e && !e.target) {
			return;
		} else if (e && e.target) {
			targetWindow = e.target as Window;
			chromeArea.x = targetWindow.innerWidth;
			chromeArea.y = targetWindow.innerHeight;
		} else if (!e) {
			chromeArea.x = window.innerWidth;
			chromeArea.y = window.innerHeight;
		}
		
		// Reset the application state after getting dimensions
		applicationState = "Loading...";
	}

	function loadingDone(): void {
		console.log("loadingDone called");
		console.log("canvasContainer:", canvasContainer);
		console.log("loader:", loader);
		
		canvasContainer.classList.remove('opacity-35');
		loader.classList.add('hidden');
		
		console.log("Loading UI hidden");
	}

    function showPanel(e: Event, name: string): void
	{
		if (e.type != 'load' && !e.target) return;

		let button;
		let target;

		if (e.type === 'load') {
			button = document.getElementById(`${name}-button`) as HTMLButtonElement;
		} else {
			target = e.target as Element;
			button = target.tagName === "BUTTON"
				? target as HTMLButtonElement
				: document.getElementById(`${name}-button`) as HTMLButtonElement;

			if (!button) return;
		}

		const panel = document.getElementById(`${name}-panel`);
		if (!panel) {
			console.warn(`${name}-panel couldn't be found!?`);
			return;
		}

		panel.classList.toggle('hidden');
		panel.style.top = `${button.offsetTop}px`;
		panel.style.left = `${button.offsetWidth + 4}px`;

		// Hide other panels
		if (!panel.classList.contains('hidden')) {
			document.querySelectorAll("div[id$='-panel']").forEach((p) => {
				if (p.id != panel.id) {
					p.classList.add('hidden');
				}
			});
		}
	}


	function handleResize(e?: Event): void
	{
		if (!target) return;

		if (e?.target) {
			const target = e.target as Window;
			chromeArea.x = target.innerWidth;
			chromeArea.y = target.innerHeight;
		} else {
			chromeArea.x = window.innerWidth;
			chromeArea.y = window.innerHeight;
		}

		target.handleResize();
	}

	function logDebug()
	{
		console.log('TargetStore:', $TargetStore);
		console.log('UserSettingsStore:', $UserSettingsStore);
		console.log('EditorStore:', $EditorStore);
		console.log(`Mode: ${$EditorStore.mode}`);
		console.log(`Chromarea: ${chromeArea.x}:${chromeArea.y}`)
		console.log('---');
		showChildren(target?.app.stage);
	}

	function showChildren(parent: Container|undefined, indent = 0) {
		if(!parent) return; 

		if (indent === 0) {
			console.log(`${'-'.repeat(indent)}label: ${parent.label}, uid: ${parent.uid}, parent: ${parent.parent?.label || parent.parent?.uid || '-'}`);
		}

		if (parent.children.length > 0) {
			parent.children.forEach((child) => {
				let string = `${'-'.repeat(indent)}label: ${child.label}, uid: ${child.uid}, parent: ${parent.parent?.label || parent.parent?.uid || '-'}`;
				console.log(string, child);
				if (child.children.length > 0) {
					showChildren(child, indent + 1);
				}
			});
		}
	}

	function togglePanels(name: string)
	{
		if (!name) return;

		$activePanel === name ? $activePanel = undefined : $activePanel = name;
		$activeButton === name ? $activeButton = undefined : $activeButton = name;
	}

	onMount(async () => {
		try {
			await getChromeArea();
			applicationState = "Initializing target...";
			
			console.log("Creating Target instance");
			target = new Target(chromeArea, staticAssets);
			
			console.log("Starting Target initialization");
			await target.initialize(canvasContainer, (state) => {
				console.log(`Target state update: ${state}`);
				applicationState = state;
				
				// If we get to "Done!" state, call loadingDone
				if (state === 'Done!') {
					setTimeout(() => {
						loadingDone();
					}, 300);
				}
			});
			
			if (data.user?.id) {
				console.log("Initializing analysis");
				await target.initializeAnalysis(data.user.id);
			}
		} catch (error) {
			console.error("Fatal error during initialization:", error);
			applicationState = `Error: ${(error as Error).message || 'Unknown error'}`;
			
			// Show a more user-friendly error on the loading screen
			loader.innerHTML = `
				<div>
					<p>Error loading the target editor</p>
					<p class="text-sm mt-2">${(error as Error).message || 'WebGL context was lost'}</p>
					<button class="mt-4 px-4 py-2 bg-surface-500 rounded" onclick="location.reload()">
						Reload Page
					</button>
				</div>
			`;
		}
	});


	onDestroy(async () => {
		if (target) {
			await Assets.unload(staticAssets)
		}

		if (browser) {
			window.removeEventListener('shotsSelected', () => {});
			window.removeEventListener('referenceMeasurementSet', () => {});
		}
	});

	$effect(() => {
		if (chromeArea) {
			canvasContainer.style.width  = `${chromeArea.x}px`;
			canvasContainer.style.height = `${chromeArea.y}px`;
		}

		if ($activeButton) {
			console.log($activeButton);
		}

		if ($activePanel) {
			console.log($activePanel);
		}
	});
</script>

<svelte:window
	onload={getChromeArea}
	onresize={handleResize}
/>
<aside
	class="absolute grid grid-flow-row grid-rows-[auto_auto_auto_1fr] place-content-start justify-items-start z-50 top-0 left-0 h-[100vh] w-16 border-r-2 border-surface-400 bg-surface-300 "
>
	<a href="/">
		<button
			id="targetTrackerMenu"
			class="w-16 h-12 p-2 ml-2 my-4 cursor-pointer"
		>
			<Logo
				width=36
				height=36
			/>
		</button>
	</a>
	<div id="tools" class="grid grid-flow-row">
		<hr class="max-w-[70%] ml-[15%] opacity-40 mt-3 border-t-1 border-current"/>
		<button
			title="Target information"
			id="info-button"
			onclick={ () => togglePanels('info-panel') }
			class="w-16 h-12 mt-2 grid cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center {$activePanel === 'info-panel' ? 'active' : ''} place-items-center"
		>
			<LucideTarget

				class="pointer-events-none"
			/>
		</button>

		<button
			title="Set reference"
			id="reference-button"
			bind:this={referencebutton}
			onclick={(e) => { $EditorStore.mode === 'reference' ? $EditorStore.mode = 'none' : $EditorStore.mode = 'reference'; showPanel(e, "reference"); $activePanel = "reference-panel"; }}
			class="w-16 h-12 cursor-pointer hover:bg-gradient-radial from-white/20 grid justify-items-center place-items-center items-center"
		>
			<LucideRuler
				class="pointer-events-none"
			/>
		</button>
		<!--disabled={ refMeasurementDirty ? true : false }-->
		<button
			title={ $EditorStore.isRefDirty ? 'Set reference points first' : 'Set point of aim' }
			id="poa-button"
			onclick={() => { $EditorStore.mode === 'poa' ? $EditorStore.mode = 'none' : $EditorStore.mode = 'poa'; }}
			class="w-16 h-12 grid cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center place-items-center"
		>
			<LucideLocateFixed

				class="pointer-events-none"
			/>
		</button>
		<!--disabled={ refMeasurementDirty ? true : false }-->
		<button
			id="shots-button"
			title={ $EditorStore.isRefDirty ? 'Set reference points first' : 'Place shots' }

			onclick={() => { $EditorStore.mode === 'shots' ? $EditorStore.mode = 'none' : $EditorStore.mode = 'shots'; }}
			class="w-16 h-12 grid cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center place-items-center"
		>
			<LucideLocate

				class="pointer-events-none"
			/>
		</button>

		<hr class="max-w-[70%] ml-[15%] opacity-40 mt-3 border-t-1 border-current"/>

		<button
			class="w-16 h-12 grid cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center place-items-center"
			title="Rotate target"
			id="rotate-button"
			onclick={ (e) => { showPanel(e, "rotate"); $activePanel="rotate-panel"; }}
		>
			<LucideRefreshCcw
				size="20"

				class="pointer-events-none"
			/>
		</button>

		<hr class="max-w-[70%] ml-[15%] opacity-40 mt-3 border-t-1 border-current"/>

		<button
			class="w-16 h-12 grid cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center place-items-center"
			title="Settings"
			id="settings-button"
			onclick={ () => togglePanels('settings-panel') }
		>
			<SlidersHorizontal
				size="20"

				class="pointer-events-none"
			/>
		</button>

		<SaveButton />
	</div>

	<button
		class="w-16 h-12 grid cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center place-items-center"
		title="Debug"
		id="debug-button"
		onclick={(e) => { /*showPanel(e, "settings")*/ logDebug() }}
	>
		<LucideBug
			size="20"

			class="pointer-events-none"
		/>
	</button>
	<div class="grid place-self-end justify-self-start max-w-16 w-16 justify-items-center pb-4">
		<ThemeSwitch classes={{
			icon: "text-current",
			switch: "",
			toggle: "",
		}} />
	</div>
</aside>

<!-- panels -->
<div id="rotate-panel" class="absolute z-50 {$activePanel === 'rotate-panel' ? 'grid' : 'hidden' }  grid-rows-[auto_1fr_auto] grid-flow-row pb-0 space-y-0 bg-slate-400 w-64 max-w-64">
    <div id="header" class="w-full py-2 px-4 text-xs text-black h-8 place-items-center leading-0 uppercase grid grid-cols-2">
        <p class="tracking-widest pointer-events-none justify-self-start">Rotation</p>
        <p class="justify-self-end">
            <LucideX size="14" class="cursor-pointer" onclick={ (e) => $activePanel = '' } />
        </p>
    </div>
    <div class="pt-4">
        <button id="rotate-left" class="btn ml-4 preset-filled align-middle" onclick={() => target?.rotateTarget(-90)}>
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
						let t = e.target as HTMLInputElement; target?.rotateTarget(parseFloat(t.value), {absolute: true})
					}, 500)
				}
			}
        />

        <button id="rotate-left" class="btn preset-filled align-middle mr-4" onclick={() => target?.rotateTarget(90)}>
            <LucideRotateCwSquare color="#000" />
        </button>
    </div>
    <div class="pt-2 w-full mt-2 px-4 pb-2 place-self-start">
        <input type="range" step="1" min="-45" max="45" bind:value={slider} oninput={() => target?.rotateTarget(0, {slider: slider})} class="slider w-full" id="rotationslider">
    </div>
</div>

<ReferencePanel
	data={data}
	active={false}
	position={{
		top: referencebutton?.offsetTop + 'px',
		left: referencebutton?.offsetLeft + 68 + 'px',
	}}
	{target}
/>

<SettingsPanel 
	data={data}
	active={false}
/>

<InfoPanel 
	data={data}
/>

<!-- followcursor -->
{#if mode === "reference" && $UserSettingsStore.cursortips}
	<div class="absolute p-2 bg-black/70 max-w-40 text-xs font-white z-40 pointer-events-none" style="top: {mouse.y + 20}px; left: {mouse.x + 20}px">
		{#if !$EditorStore.aIsSet}
			Set start point.
		{:else if !$EditorStore.xIsSet}
			Set end point.
		{:else if $EditorStore.isRefDirty}
			Adjust points if necessary then enter the length and press Set.
		{:else}
			All set! Now add point of aim (required for scoring) or start placing shots on the target.
		{/if}
	</div>
{/if}

<!-- selection -->
<!--
<div class="absolute z-50 top-2 right-2 text-black">
	<div
		class="grid grid-cols-1 grid-flow-row"
	>
		{#if $EditorStore.selected && $EditorStore.selected.length > 0}
			<div class="col-span-2">
				{$EditorStore.selected.length === 1 ? `${$EditorStore.selected.length} shot` : `${$EditorStore.selected.length} shots`} selected.
			</div>

			<div class="grid grid-cols-2">
				<select name="assignToGroupSelect" id="assignToGroupSelect" bind:this={assignToGroupSelect}>
					<option value={null} selected>Assign selected to group:</option>
					{#each $TargetStore.groups as group}
						<option value={group.id}>Group {group.id}</option>
					{/each}
					<option value="createNew">Add to new group</option>
				</select>
				<button
					onclick={ /* () => { assignToGroupSelect?.value ? target?.assignSelectedShotsToGroup(assignToGroupSelect?.value) : '';} */ () => console.log('not implemented yet')}
				>
					Go
				</button>
			</div>
			
		{/if}
	</div>
</div>
-->

<div id="debugpanel" style="position: absolute; z-index: 99; right: 5rem; bottom: 5rem; background: #ccc; color: #000" class="hidden">
	{#each $TargetStore.groups as group}
		<div>
		Group: {group.id}
		Container: {target?.targetRenderer?.app ? target.targetRenderer.app.stage.getChildByLabel(group.id.toString()) : 'App not ready'}
		{#if group.shots}
			{#each group?.shots as shot}
				<div>ID: {shot.id} Pos: {shot.x.toFixed(0)}:{shot.y.toFixed(0)}</div>
			{/each}
		{/if}
		</div>
	{/each}	
</div>

{#if !$TargetStore.reference.linelength}
    <div class="warning-banner absolute right-2 top-2 z-40 p-4 bg-slate-700 text-white dark:text-black dark:bg-slate-300">
        ⚠️ Set reference points and measurement to start placing shots!
    </div>
{/if}

<GroupPanel />

<!-- canvas -->
<div
	role="application"
	aria-roledescription="The funny thing is that if you can't see properly, why would you use this service? Anyways, compliance is bliss!"
	bind:this={canvasContainer}
	onmousemove={mousePosition}
	class="relative grid justify-items-center align-middle place-content-center opacity-35 w-full h-full overflow-hidden"
></div>
<div bind:this={loader} class="z-50 transition-all top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-center absolute py-6 px-8 w-72 max-w-screen-sm rounded border-2 border-surface-500 bg-surface-300 text-surface-100 shadow-lg">{applicationState}</div>
