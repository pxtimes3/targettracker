<script lang="ts">
	/**
	 * TODO: Cleanup!
	 * TODO: GroupContainers finns inte längre, gör om @ line 658.
	 * TODO: Scoring.
	 * TODO: Add firearm.
	 * TODO: Add ammunition.
	 * TODO: Add weather data.
	 * TODO: Save.
	 * TODO: Unit Tests @ src/routes/pixi/page.svelte
	 */
	import { browser } from '$app/environment';
	import Logo from '@/components/logo/logo.svelte';
	import { EditorStore, activePanel, activeButton } from '@/stores/EditorStore';
	import { TargetStore } from '@/stores/TargetImageStore';
	import { UserSettingsStore } from '@/stores/UserSettingsStore';
	
	import InfoPanel from '@/components/target/editor/panels/InfoPanel.svelte';
	import { Target } from '@/utils/editor/target';
	import { LucideBug, LucideCheck, LucideLocate, LucideLocateFixed, LucideRefreshCcw, LucideRotateCcwSquare, LucideRotateCwSquare, LucideRuler, LucideTarget, LucideX, SlidersHorizontal } from 'lucide-svelte';
	import type { ContainerChild, Renderer } from 'pixi.js';
	import { Application, Assets, Container, Sprite } from 'pixi.js';
	import { onDestroy, onMount } from 'svelte';
	import type { PageServerData } from './$types';

	let { data } : { data: PageServerData } = $props();

	let mode: undefined|string|"shots"|"reference"|"poa"|"move" = $state();
	let app: Application<Renderer>;
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


	let groupContainers: Container[] = $state([]);
	let crosshairContainer: Container;
	let showMainMenu: boolean = $state(false);

	let slider: number = $state(0);

	let atoxInput: HTMLInputElement|undefined = $state();

	let settingsForm: HTMLFormElement;

	let selected: Array<Sprite | Container<ContainerChild>> = $state($EditorStore.selected);
	let assignToGroupSelect: HTMLSelectElement|undefined = $state();

	let canvasContainer: HTMLDivElement;
    let loader: HTMLDivElement;
    let applicationState: string = $state('Loading...');
    let target: Target|undefined = $state();
    let chromeArea: {x: number, y: number} = $state({x: 0, y: 0});

	function mousePosition(e: MouseEvent): void
    {
        mouse = {
            x: e.clientX,
            y: e.clientY
        };
    }

    async function getChromeArea(e?: Event): Promise<void>
    {
		applicationState = "Looking out the window... ";

		let target;

        if (e && !e.target) {
			return;
		} else if (e && e.target) {
			target = e.target as Window;
			chromeArea.x = target.innerWidth;
        	chromeArea.y = target.innerHeight;
		} else if (!e) {
			chromeArea.x = window.innerWidth;
        	chromeArea.y = window.innerHeight;
		}
    }

	function loadingDone(): void
	{
		canvasContainer.classList.remove('opacity-35');
		loader.classList.add('hidden');
	}

    function changeUserSettings(e: Event): void
	{
        const target = e.target as HTMLInputElement;
        if (!target) return;

        const setting = target.name;

        $UserSettingsStore[setting] = target.type === 'checkbox'
            ? target.checked
            : target.id === 'true';

        // TODO: Push to DB
        // console.log($UserSettingsStore);
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
			console.error(`${name} couldn't be found!?`);
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
		await getChromeArea();
		target = new Target(chromeArea, staticAssets);
        await target.initialize(canvasContainer, (state) => applicationState = state);

		if (target) {
			setTimeout(() => {
				loadingDone();
			}, 300);
		}

        if (data.user?.id) {
            await target.initializeAnalysis(data.user.id);
        }

		window.addEventListener('shotsSelected', ((event: CustomEvent) => {
			const selectedShots = event.detail.shots;
			selected = selectedShots;
		}) as EventListener);
	});

	onDestroy(async () => {
		if (target) {
			await Assets.unload(staticAssets)
			app.destroy(true, true);
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

		if ($UserSettingsStore) {
			if ($UserSettingsStore.editorcrosshair && crosshairContainer) {
				crosshairContainer.visible = true;
			} else if (crosshairContainer) {
				crosshairContainer.visible = false;
			}
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
	class="absolute grid grid-flow-row place-content-start justify-items-start z-50 top-0 left-0 h-[100vh] w-16 border-r-2 border-surface-400 bg-surface-300 "
>
	<button
		id="targetTrackerMenu"
		class="w-16 h-12 p-2 ml-2 my-4 cursor-pointer"
		onclick={() => showMainMenu = true}
	>
		<Logo
			width=36
			height=36
		/>
	</button>
	<div id="tools" class="grid grid-flow-row">
		<hr class="max-w-[70%] ml-[15%] opacity-40"/>
		<button
			title="Target information"
			id="info-button"
			onclick={ () => togglePanels('info-panel') }
			class="w-12 h-12 mt-2 ml-2 cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center {$activePanel === 'info-panel' ? 'active' : ''}"
		>
			<LucideTarget
				color="#000"
				class="pointer-events-none"
			/>
		</button>

		<button
			title="Set reference"
			id="reference-button"
			onclick={(e) => { $EditorStore.mode === 'reference' ? $EditorStore.mode = 'none' : $EditorStore.mode = 'reference'; showPanel(e, "reference"); $activePanel = "reference-panel"; }}
			class="w-16 h-12 cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center"
		>
			<LucideRuler
				color="#000"
				class="pointer-events-none"
			/>
		</button>
		<!--disabled={ refMeasurementDirty ? true : false }-->
		<button
			title={ $EditorStore.isRefDirty ? 'Set reference points first' : 'Set point of aim' }
			id="poa-button"
			onclick={() => { $EditorStore.mode === 'poa' ? $EditorStore.mode = 'none' : $EditorStore.mode = 'poa'; }}
			class="w-16 h-12 cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center"
		>
			<LucideLocateFixed
				color="#000"
				class="pointer-events-none"
			/>
		</button>
		<!--disabled={ refMeasurementDirty ? true : false }-->
		<button
			id="shots-button"
			title={ $EditorStore.isRefDirty ? 'Set reference points first' : 'Place shots' }

			onclick={() => { $EditorStore.mode === 'shots' ? $EditorStore.mode = 'none' : $EditorStore.mode = 'shots'; }}
			class="w-16 h-12 cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center"
		>
			<LucideLocate
				color="#000"
				class="pointer-events-none"
			/>
		</button>

		<hr class="max-w-[70%] ml-[15%] opacity-40 mt-3"/>

		<button
			class="w-16 h-12 cursor-pointer mt-3 hover:bg-gradient-radial from-white/20 justify-items-center"
			title="Rotate target"
			id="rotate-button"
			onclick={ (e) => { showPanel(e, "rotate"); $activePanel="rotate-panel"; }}
		>
			<LucideRefreshCcw
				size="20"
				color="#000"
				class="pointer-events-none"
			/>
		</button>

		<hr class="max-w-[70%] ml-[15%] opacity-40 mt-3"/>

		<button
			class="w-16 h-12 mt-3 cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center"
			title="Settings"
			id="settings-button"
			onclick={ (e) => { showPanel(e, "settings"); $activePanel='settings-panel' }}
		>
			<SlidersHorizontal
				size="20"
				color="#000"
				class="pointer-events-none"
			/>
		</button>
	</div>

	<button
		class="w-16 h-12 mt-12 cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center"
		title="Debug"
		id="debug-button"
		onclick={(e) => { /*showPanel(e, "settings")*/ logDebug() }}
	>
		<LucideBug
			size="20"
			color="#000"
			class="pointer-events-none"
		/>
	</button>
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

<div id="reference-panel" class="absolute z-50 {$activePanel === 'reference-panel' ? 'grid' : 'hidden' }  grid-rows-[auto_1fr_auto] grid-flow-row pb-0 space-y-0 bg-slate-400 shadow-md left-11 top-10 w-64 max-w-64">
	<div id="header" class="w-full bg-slate-600 py-2 px-4 text-xs h-10 place-items-center leading-0 uppercase grid grid-cols-2">
		<p class="tracking-widest pointer-events-none justify-self-start whitespace-nowrap">Reference points</p>
		<p class="justify-self-end">
			<LucideX size="14" class="cursor-pointer" onclick={(e) => { $activePanel = ''; }} />
		</p>
	</div>
	<div class="p-4">
		<label for="atoxInput" class="text-sm text-body-color-dark"></label>
		<div class="grid grid-cols[1fr_1fr] grid-flow-col">
			<div class="input-group text-xs divide-primary-200-800 grid-cols-[auto_1fr_auto] divide-x text-body-color-dark bg-white">
				<div class="input-group-cell preset-tonal-primary">A &rArr; X</div>
				<input type="text" id="atoxInput" bind:this={atoxInput} class="bg-white text-xs" bind:value={$EditorStore.refMeasurement} pattern={`^(?!^0$)-?\d+[.,]?\d*$`}>
				<div class="input-group-cell preset-tonal-primary">{#if $UserSettingsStore.isometrics}cm{:else}in{/if}</div>
			</div>
			{#if !$EditorStore.isRefDirty}
				<div class="z-30 absolute right-[7.75rem] mt-2 text-green-700"><LucideCheck size=20/></div>
			{/if}
				<button
					class="rounded btn-md bg-primary-200-800 ml-2 text-sm uppercase"
					onclick={() => target?.setRefMeasurement()}
				>Set</button>
		</div>
		<div class="italic text-sm text-body-color-dark/70 mt-2" style="line-height: 14px;">
			Tip: You can change measurement units in <a href="##" class="anchor underline">the settings panel</a>.
		</div>
	</div>
</div>

<div id="settings-panel" class="absolute z-50 {$activePanel === 'settings-panel' ? 'grid' : 'hidden' }  grid-rows-[auto_1fr_auto] grid-flow-row pb-0 space-y-0 bg-slate-400 w-64 max-w-64">
    <div id="header" class="w-full py-2 px-4 text-xs text-black h-8 place-items-center leading-0 uppercase grid grid-cols-2">
        <p class="tracking-widest pointer-events-none justify-self-start">Settings</p>
        <p class="justify-self-end">
            <LucideX size="14" class="cursor-pointer" onclick={(e) => $activePanel = '' } />
        </p>
    </div>
	<form id="settingsForm" bind:this={settingsForm}>
		<div class="p-4 mb-8 grid grid-flow-row gap-y-2">
			<div class="text-sm text-primary-950">
				<input type="checkbox" class="checkbox mr-2" id="cursortips" name="cursortips" checked={$UserSettingsStore.cursortips} onchange={(e) => changeUserSettings(e)} />
				<label for="cursortips" class="text-sm">Show tips at cursor.</label>
			</div>
			<div class="text-sm text-primary-950">
				Units: <input type="radio" name="isometrics" id="true" checked={$UserSettingsStore.isometrics === true} class="ml-2 mr-1" onchange={(e) => changeUserSettings(e)} /><label for="metric">Metric</label>
				<input type="radio" name="isometrics" id="false" checked={$UserSettingsStore.isometrics === false} class="ml-2 mr-1" onchange={(e) => changeUserSettings(e)}/><label for="imperial">Imperial</label>
			</div>
			<div class="text-sm text-primary-950">
				Angle: <input type="radio" name="mils" id="true" checked={$UserSettingsStore.mils === true} class="ml-2 mr-1" onchange={(e) => changeUserSettings(e)} /><label for="metric">Mils</label>
				<input type="radio" name="mils" id="false" checked={$UserSettingsStore.mils === false} class="ml-2 mr-1" onchange={(e) => changeUserSettings(e)}/><label for="imperial">Minute</label>
			</div>
			<div class="text-sm text-primary-950">
				<input type="checkbox" class="checkbox mr-2" name="showallshots" id="showallshots" checked={$UserSettingsStore.showallshots} onchange={(e) => changeUserSettings(e)}/>
				<label for="showallshots" class="text-sm">Show shots from all groups.</label>
			</div>
			<div class="text-sm text-primary-950">
				<input type="checkbox" class="checkbox mr-2" name="editorcrosshair" id="editorcrosshair" checked={$UserSettingsStore.editorcrosshair} onchange={(e) => changeUserSettings(e)}/>
				<label for="editorcrosshair" class="text-sm">Show editor crosshairs.</label>
			</div>
		</div>
	</form>
</div>

<!-- <div id="info-panel" class="absolute z-50 {$activePanel === 'info-panel' ? 'grid' : 'hidden' } grid-rows-[auto_1fr_auto] grid-flow-row pb-0 space-y-0 bg-slate-400 w-64 max-w-64">
    <div id="header" class="w-full py-2 px-4 text-xs text-black h-8 place-items-center leading-0 uppercase grid grid-cols-2">
        <p class="tracking-widest pointer-events-none justify-self-start whitespace-nowrap">Target information</p>
        <p class="justify-self-end">
            <LucideX size="14" class="cursor-pointer" onclick={(e) => $activePanel = ''} />
        </p>
    </div>
	<div class="p-4 mb-8 grid grid-flow-row gap-y-2">
		<div class="text-sm text-primary-950">
			<label for="target_name">Name</label>
			<input type="text" class="appearance-none block w-full bg-gray-200 text-gray-700 border border-red-500 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white" id="target_name" name="target_name" />
		</div>
		<div class="text-sm text-primary-950">
			Type
		</div>
		<div class="text-sm text-primary-950">
			Note
		</div>
		<div class="text-sm text-primary-950">
			Firearm
		</div>
		<div class="text-sm text-primary-950">
			Ammunition
		</div>
		<div class="text-sm text-primary-950">
			Weather data
		</div>
	</div>
</div> -->

<InfoPanel />

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

{#if Array.isArray($EditorStore.warnings) && $EditorStore.warnings.length > 0}
	<div class="z-[100] absolute right-10 bottom-10 bg-slate-400 p-4 text-sm">
		Warnings:
		{#each $EditorStore.warnings as warning}
			<p>{warning.message}</p>
		{/each}
	</div>
{/if}

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
					onclick={ () => { assignToGroupSelect?.value ? target?.assignSelectedShotsToGroup(assignToGroupSelect?.value) : '';}}
				>
					Go
				</button>
			</div>
			
		{/if}
	</div>
</div>


<div id="debugpanel" style="position: absolute; z-index: 99; right: 5rem; bottom: 5rem; background: #ccc; color: #000">
	{#each $TargetStore.groups as group}
		<div>
		Group: {group.id}
		Container: {target?.app.stage.getChildByLabel(group.id.toString())}
		{#if group.shots}
			{#each group?.shots as shot}
				<div>ID: {shot.id} Pos: {shot.x.toFixed(0)}:{shot.y.toFixed(0)}</div>
			{/each}
		{/if}
		</div>
	{/each}	
</div>

<!-- canvas -->
<div
	role="application"
	aria-roledescription="The funny thing is that if you can't see properly, why would you use this service? Anyways, compliance is bliss!"
	bind:this={canvasContainer}
	onmousemove={mousePosition}
	class="relative grid justify-items-center align-middle place-content-center opacity-35 w-[100vw] h-[100vh]"
></div>
<div bind:this={loader} class="z-50 transition-all top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-center absolute py-6 px-8 w-72 max-w-screen-sm rounded border-2 border-surface-500 bg-surface-300 text-surface-100 shadow-lg">{applicationState}</div>
