<script lang="ts">
    import { TargetStore } from "@/stores/TargetImageStore";
    import { EditorStore } from "@/stores/EditorStore";
	import { LucideAirVent, LucideSave } from "lucide-svelte";
	import { Button, Toggle, Popover } from "svelte-ux";

    let enabled = $state(false);
    let hasShots = $state(false);
    let isRefComplete = $state(false);
    let isFirearmSelected: string|boolean = $state(false);
    let isAmmunitionSelected: string|boolean = $state(false);
    let isEventValid: string|boolean = $state(false);
    
    $effect(() => {
        if ($EditorStore || $TargetStore) {
            // @ts-ignore
            hasShots = $TargetStore.groups[0]?.shots?.length > 0 || false;
            isRefComplete = $EditorStore.isRefComplete || false;
            isFirearmSelected = $TargetStore.info.firearm?.length == 36 ? true : false;
            isAmmunitionSelected = $TargetStore.info.ammunition.length == 36 ? true : false;
            isEventValid = $TargetStore.info.event.length > 2 ? true : false;
            
            enabled = isRefComplete 
                && hasShots
                && isFirearmSelected
                && isAmmunitionSelected 
                // && isEventValid;
        }
    });
</script>

<Toggle let:on={open} let:toggle let:toggleOff>
    <Button
        class="w-16 h-12 grid cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center place-items-center"
        title="Save"
        id="save-button"
        onclick={enabled ? undefined : toggle}
        onmouseover={enabled ? undefined : toggle}
        onfocus={enabled ? undefined : toggle}
        onmouseout={enabled ? undefined : toggle}
        onblur={enabled ? undefined : toggle}
        style={enabled ? "" : "opacity: 0.5;"}
    >
        <LucideSave
            size="20"
            class="pointer-events-none"
        />
    </Button>
    
    {#if !enabled}
        <Popover {open} on:close={toggleOff} placement="bottom-end" class="mt-[-1rem]">
            <div class="px-3 py-3 bg-surface-100 border shadow text-sm max-w-fit rounded italic">
                <p class="not-italic">Cannot save...</p>
                {#if !isFirearmSelected}<p>&circleddash; No firearm selected.</p>{/if}
                {#if !isAmmunitionSelected}<p>&circleddash; No ammunition selected.</p>{/if}
                {#if !isRefComplete}<p>&circleddash; You need to set reference points.</p>{/if}
                {#if !hasShots}<p>&circleddash; No shots recorded.</p>{/if}
            </div>
        </Popover>
    {/if}
</Toggle>
    <!--onclick={ (e) => { showPanel(e, "save"); $activePanel='save-panel' }}-->
    