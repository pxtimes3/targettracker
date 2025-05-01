<!-- src/routes/pixi/+page.svelte -->
<script lang="ts">
	import { browser } from '$app/environment';
	import { EditorStore } from '@/stores/EditorStore';
	import { TargetStore } from '@/stores/TargetImageStore';
	import { UserSettingsStore } from '@/stores/UserSettingsStore';
	import GroupPanel from '@/components/target/editor/panels/GroupPanel.svelte';
	import { Target } from '@/utils/editor/Target';
	import { Assets, Container, Sprite } from 'pixi.js';
	import { onDestroy, onMount } from 'svelte';
	import type { PageServerData } from './$types';
	import AppBar from '@/components/target/editor/AppBar.svelte';
	import { targetInstance } from '@/stores/TargetImageStore';

	let { data } : { data: {data: PageServerData, gunsEvents: GunsEvents} } = $props();

	let target: Target | undefined = $state();

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

	let canvasContainer: HTMLDivElement;
    let loader: HTMLDivElement;
    let applicationState: string = $state('Loading...');
    let chromeArea: {x: number, y: number} = $state({x: 0, y: 0});
	

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
			console.log("loader:", loader);
			
			canvasContainer.classList.remove('opacity-35');
			loader.classList.add('hidden');
			
			console.log("Loading UI hidden");
		}
	}

	function loadingDone(): void {
		console.log("loadingDone called");
		console.log("canvasContainer:", canvasContainer);
		console.log("loader:", loader);
		
		canvasContainer.classList.remove('opacity-35');
		loader.classList.add('hidden');
		
		console.log("Loading UI hidden");
	}

	function closeAll(): number
	{
		let count: number = 0;
		const panels = document.querySelectorAll(`div[id$='-panel']`);
		panels.forEach((el) => {
			if(!el.classList.contains('hidden')) {
				el.classList.add('hidden');
				count++;
			}
		});

		return count;
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
		// showChildren(target?.app.stage);
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

	onMount(async () => {
		try {
			await getChromeArea();
			applicationState = "Initializing target...";
			
			console.log("Creating Target instance");
			target = new Target(chromeArea, staticAssets);
			targetInstance.set(target);
			
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
			
			if (data.data?.user?.id) {
				console.log("Initializing analysis");
				await target.initializeAnalysis(data.data.user.id);
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
			await Assets.unload(staticAssets);
			targetInstance.set(undefined);
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
	});
</script>

<svelte:window
	onload={getChromeArea}
	onresize={handleResize}
/>
<AppBar 
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
