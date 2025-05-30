<!-- src/lib/components/target/editor/buttons/TargetShotsButton.svelte -->
<script lang="ts">
    import { setMode } from "@/utils/editor/ModeSwitcher";
    import { canWeActivateMode } from "@/utils/editor/EditorUtils";
    import { EditorStore } from "@/stores/EditorStore";
    import { TargetStore } from "@/stores/TargetImageStore";
    import { Button, Toggle, Popover } from "svelte-ux";
    import { LucideLocate } from "lucide-svelte";
	import { onMount } from "svelte";
	
    let enabled: { status: boolean, missing: string[]} = $state({ status: false, missing: []});

    let targetInfoState = $derived({
        firearm: $TargetStore.info.firearm,
        ammunition: $TargetStore.info.ammunition,
        event: $TargetStore.info.event,
        range: $TargetStore.target.range,
        isRefComplete: $EditorStore.isRefComplete
    });
    
    function updateEnabled() {
        enabled = canWeActivateMode('shots');
        console.log('Checking mode activation, enabled:', $state.snapshot(enabled));
    }

    $effect(() => {
        // This should now react to changes in the store
        const firearm = $TargetStore.info.firearm;
        const ammunition = $TargetStore.info.ammunition;
        const event = $TargetStore.info.event;
        const isRefComplete = $EditorStore.isRefComplete;
        const range = $TargetStore.target.range;
        
        console.log('Store values changed:', { 
            firearm, 
            ammunition, 
            event, 
            isRefComplete,
            range
        });
        
        enabled = canWeActivateMode('shots');
    });

    onMount(() => {
        enabled = canWeActivateMode('shots');
    });
</script>

<Toggle let:on={open} let:toggle let:toggleOff>
    <Button
        title="Set point of aim"
        id="poa-button"
        class="
            w-16 
            h-12 
            cursor-pointer 
            hover:bg-gradient-radial 
            from-white/20 
            grid 
            justify-items-center 
            place-items-center 
            items-center
            {$EditorStore.mode === 'shots' ? 'editorButtonActive' : ''}
        "
        onclick={ () => { setMode('shots') }}
        onmouseover={enabled ? undefined : toggle}
        onfocus={enabled ? undefined : toggle}
        onmouseout={enabled ? undefined : toggle}
        onblur={enabled ? undefined : toggle}
        style={enabled.status ? "" : "opacity: 0.5;"}
    >
        <LucideLocate
            class="pointer-events-none"
        />
        {#if !enabled.status}
            <Popover {open} on:close={toggleOff} placement="right-start">
                <div class="px-3 py-3 border shadow text-sm text-slate-800 max-w-fit rounded italic bg-yellow-100 dark:bg-yellow-100">
                    <p class="not-italic font-bold">Cannot place shots...</p>
                    {#each enabled.missing as value}
                        <p>{value}</p>
                    {/each}
                </div>
            </Popover>
        {/if}
    </Button>
</Toggle>