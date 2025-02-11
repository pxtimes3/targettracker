<script lang="ts">
	import type { PageServerData } from './$types';
	import { slide } from 'svelte/transition'
	import { DateTime } from "luxon";
	import { EditorStore, activePanel } from '@/stores/EditorStore';
	import { LucideBug, LucideCheck, LucideLocate, LucideLocateFixed, LucideRefreshCcw, LucideRotateCcwSquare, LucideRotateCwSquare, LucideRuler, LucideTarget, LucideX, SlidersHorizontal } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let { data, active } : { data: PageServerData, active: boolean } = $props();
	let infoform : HTMLFormElement|undefined = $state();

	async function saveInfo(): Promise<boolean>
	{
		let success: boolean = true;

		if (!infoform) { 
			return false;
		}
		
		console.log(infoform.elements);

		setTimeout(() => saveInfo(), 1000);
			
		return success;
	}

	onMount(() => {
		setTimeout(() => saveInfo(), 1000)
	})
</script>

{#if $activePanel === 'info-panel'}
	<div 
		id="info-panel" 
		class="absolute z-50 left-16 grid-rows-[auto_1fr_auto] grid-flow-row pb-0 px-2 py-4 space-y-0 bg-slate-400 w-128 max-w-128 h-full"
		transition:slide={{axis: 'x'}}
	>
		<div id="header" class="w-full py-2 px-4 text-xs text-black h-8 place-items-center leading-0 uppercase grid grid-cols-2">
			<p class="tracking-widest pointer-events-none justify-self-start whitespace-nowrap">Target information</p>
			<p class="justify-self-end">
				<LucideX size="14" class="cursor-pointer" onclick={(e) => $activePanel = ''} />
			</p>
		</div>
		<div class="p-4 mb-8 grid grid-flow-row gap-y-2">
			<form id="infoform" bind:this={infoform}>
			<div class="text-sm text-primary-950">
				<label for="target_name">Name</label>
				<input 
					type="text" 
					class="appearance-none block w-full bg-gray-200 text-gray-700 border border-red-500 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white" 
					id="target_name" 
					name="target_name"
					placeholder="{ DateTime.now().toISODate() }"
				/>
			</div>
			<div class="text-sm text-primary-950">
				Type
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
			<div class="text-sm text-primary-950">
				Note
			</div>
			</form>
		</div>
	</div>
{/if}