<script lang="ts">
    import Logo from "@/components/logo/logo.svelte";
    import { LucideBug } from "lucide-svelte";
    import { ThemeSwitch } from "svelte-ux";
    import { targetInstance, TargetStore } from "@/stores/TargetImageStore";
    import type { PageServerData } from "$types";
	import type { Target } from "@/utils/editor/Target";
	import type { Writable } from "svelte/store";
	// Buttons
    import SaveButton from "./buttons/SaveButton.svelte";
	import TargetInfoButton from "./buttons/TargetInfoButton.svelte";
	import TargetReferenceButton from "./buttons/TargetReferenceButton.svelte";
	import TargetPointOfAimButton from "./buttons/TargetPointOfAimButton.svelte";
	import TargetShotsButton from "./buttons/TargetShotsButton.svelte";
	import TargetSettingsButton from "./buttons/TargetSettingsButton.svelte";
	import TargetRotateButton from "./buttons/TargetRotateButton.svelte";
	// Panels
    import RotatePanel from "./panels/RotatePanel.svelte";
    import SettingsPanel from "./panels/SettingsPanel.svelte";
	import InfoPanel from "./panels/InfoPanel.svelte";

    let { data } : { data: {data: PageServerData, gunsEvents: GunsEvents} } = $props();

    let target: Writable<Target|undefined>= $state(targetInstance);
</script>

<aside
	class="absolute grid grid-flow-row grid-rows-[auto_auto_1fr] place-content-start justify-items-start z-50 top-0 left-0 h-[100vh] w-16 border-r-2 border-surface-400 bg-surface-300 "
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
        <TargetInfoButton />
		<TargetReferenceButton
            {data}
        />
        <TargetPointOfAimButton />
        <TargetShotsButton />
		
		<hr class="max-w-[70%] ml-[15%] opacity-40 mt-3 border-t-1 border-current"/>

        <TargetSettingsButton />
        <TargetRotateButton />

		<hr class="max-w-[70%] ml-[15%] opacity-40 mt-3 border-t-1 border-current"/>

		<SaveButton 
			on:click={(e) => console.log($TargetStore)}
		/>
	</div>

    <!-- 
    TODO: Bättre funktionalitet för debug button.
	<button
		class="w-16 h-12 grid cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center place-items-center"
		title="Debug"
		id="debug-button"
	>
		<LucideBug
			size="20"

			class="pointer-events-none"
		/>
	</button>
    -->
	<div class="grid place-self-end justify-self-start max-w-16 w-16 justify-items-center pb-4">
		<ThemeSwitch classes={{
			icon: "text-current",
			switch: "",
			toggle: "",
		}} />
	</div>
</aside>

<!-- panels -->


<SettingsPanel 
	data={data.data}
	active={false}
/>

<InfoPanel
	data={data}
/>