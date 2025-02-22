<!-- src/lib/components/target/editor/panels/SettingsPanel.svelte  -->
<script lang="ts">
    import type { PageServerData } from './$types';
    import { UserSettingsStore, type SettingsInterface } from '@/stores/UserSettingsStore';
	import { Button } from 'svelte-ux';
    import { Switch } from 'svelte-ux';
    import { Popover } from 'svelte-ux';
	import { slide } from 'svelte/transition'
	import { quadInOut } from 'svelte/easing';
	import { DateTime } from "luxon";
	import { EditorStore, activePanel } from '@/stores/EditorStore';
	import { TargetStore, type TargetStoreInterface } from '@/stores/TargetImageStore';
	import { LucideX, LucideChevronDown, type Icon as IconType } from 'lucide-svelte';
	import { onMount } from 'svelte';
    import InfoPopover from '../InfoPopover.svelte';
    
    let showPopover = $state(false);

    let settingsForm: HTMLFormElement|undefined = $state();
    let showmrtoggle: Switch|undefined = $state();
    let { data, active } : { data: PageServerData, active: boolean } = $props();

    $effect(() => {
        if (showmrtoggle) {
            console.log('showmr.toggle')
        }
    })
</script>

{#if $activePanel === 'settings-panel'}
	<div 
		id="settings-panel" 
		class="absolute justify-items-end z-50 left-16 grid grid-flow-row pb-0 px-2 py-4 space-y-0 bg-slate-400 dark:bg-slate-800 min-w-16 w-[24rem] h-full overflow-y-auto overflow-x-hidden"
		transition:slide={{axis: 'x', duration: 150, easing: quadInOut }}
	>
<!--<div id="settings-panel" class="absolute z-50 {$activePanel === 'settings-panel' ? 'grid' : 'hidden' }  grid-rows-[auto_1fr_auto] grid-flow-row pb-0 space-y-0 bg-slate-400 w-64 max-w-64">-->
        <form id="settingsForm" bind:this={settingsForm} class="w-full h-full">
                <div class="p-4 mb-8 grid grid-flow-row gap-y-2 w-full overflow-x-hidden min-w-48 h-full place-content-start">
                    <div class="text-md font-bold border-b-2 border-text mt-2 mb-2">Editor</div>
                <div class="text-sm grid grid-flow-col-dense place-content-start align-middle  text-primary-950 w-full min-w-full">
                    <Switch 
                        name="cursortips" 
                        id="cursortips"
                        bind:checked={$UserSettingsStore.cursortips} 
                        class="mr-2"
                    />
                    <label for="cursortips" class="text-sm">Show tips at cursor.</label>
                </div>
                <div class="text-sm grid grid-flow-col-dense place-content-start align-middle  text-primary-950">
                    <Switch 
                        name="showallshots" 
                        id="showallshots"
                        bind:checked={$UserSettingsStore.showallshots} 
                        class="mr-2"
                    />
                    <label for="showallshots" class="text-sm">Show shots all groups / current group.</label>
                </div>
                <div class="text-sm grid grid-flow-col-dense place-content-start align-middle  text-primary-950">
                    <Switch 
                        name="editorcrosshair" 
                        id="editorcrosshair"
                        bind:checked={$UserSettingsStore.editorcrosshair} 
                        class="mr-2"
                    />
                    <label for="editorcrosshair" class="text-sm">Show editor crosshairs.</label>
                </div>
                <!-- metrics -->
                <div class="text-md font-bold border-b-2 border-text mt-4 mb-2">Metrics</div>
                <div class="text-sm grid grid-flow-col-dense place-content-start align-middle  text-primary-950">
                    <Switch 
                        name="isometrics" 
                        id="isometrics"
                        bind:checked={$UserSettingsStore.isometrics} 
                        class="mr-2"
                    />
                    <label for="isometrics" class="text-sm">Units: <span class={$UserSettingsStore.isometrics ? 'opacity-50' : 'font-bold'}>Imperial</span> / <span class={$UserSettingsStore.isometrics ? 'font-bold' : 'opacity-50'}>Metric</span></label>
                </div>
                <div class="text-sm text-primary-950 mb-4">
                    <Switch 
                        name="mils" 
                        id="mils"
                        bind:checked={$UserSettingsStore.mils} 
                        class="mr-2"
                    />
                    <label for="mils" class="text-sm">Angle: <span class={$UserSettingsStore.mils ? 'opacity-50' : 'font-bold'}>MOA</span> / <span class={$UserSettingsStore.mils ? 'font-bold' : 'opacity-50'}>MIL</span></label>
                    
                </div>
                <div class="text-sm grid grid-flow-col-dense place-content-start align-middle text-primary-950">
                    <Switch 
                        name="showmr" 
                        id="showmr"
                        bind:checked={$UserSettingsStore.showmr} 
                        class="mr-2"
                    />
                    <InfoPopover 
                        text="Show circle for" 
                        info="Mean Radius"
                        position="bottom"
                        trigger="hover"
                    >
                        <p>The average distance from each shot to the group's center point. <a href="http://ballistipedia.com/index.php?title=Describing_Precision">[Source]</a></p>
                    </InfoPopover>
                </div>
                <div class="text-sm grid grid-flow-col-dense place-content-start justify-items-center align-middle text-primary-950">
                    <Switch 
                        name="showccr" 
                        id="showccr"
                        bind:checked={$UserSettingsStore.showccr} 
                        class="mr-2"
                    />
                    <InfoPopover 
                        text="Show circle for" 
                        info="Covering Circle Radius"
                        position="bottom"
                        trigger="hover"
                    >
                        <p>CCR is the smallest circle that encompasses all shots in the group. <a href="http://ballistipedia.com/index.php?title=Circular_Error_Probable">[Source]</a></p>
                    </InfoPopover>
                </div>
                <div class="text-sm grid grid-flow-col-dense place-content-start justify-items-center text-primary-950">
                    <Switch 
                        name="showes" 
                        id="showes"
                        bind:checked={$UserSettingsStore.showes} 
                        class="mr-2"
                    />
                    <InfoPopover 
                        text="Show line for" 
                        info="Extreme Spread"
                        position="bottom"
                        trigger="hover"
                    >
                        <p>The Extreme Spread is the largest distance between any two points in the group. Also called "group size". <a href="http://ballistipedia.com/index.php?title=Describing_Precision">[Source]</a></p>
                    </InfoPopover>
                </div>
                <div class="text-sm grid grid-flow-col-dense place-content-start align-middle text-primary-950">
                    <Switch 
                        name="showdiagonal" 
                        id="showdiagonal"
                        bind:checked={$UserSettingsStore.showdiagonal} 
                        class="mr-2"
                    />
                    <InfoPopover 
                        text="Show" 
                        info="FoM & Diagonal"
                        position="bottom"
                        trigger="hover"
                    >
                        <p>FoM is the average extreme width and height of the group.</p><p>Diagonal is the corner-to-corner distance of the box containing all shots. <a href="http://ballistipedia.com/index.php?title=Describing_Precision">[Source]</a></p>
                    </InfoPopover>
                </div>
                <div class="text-sm grid grid-flow-col-dense place-content-start align-middle text-primary-950">
                    <Switch 
                        name="showmpi" 
                        id="showmpi"
                        bind:checked={$UserSettingsStore.showmpi} 
                        class="mr-2"
                    />
                    <InfoPopover 
                        text="Show" 
                        info="Mean Point of Impact"
                        position="bottom"
                        trigger="hover"
                    >
                        <p>The average center point of all your shots.</p>
                    </InfoPopover>
                </div>
            </div>
        </form>
    </div>
{/if}