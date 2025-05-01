<script lang="ts">
    import { setMode } from "@/utils/editor/ModeSwitcher";
    import { EditorStore } from "@/stores/EditorStore";
    import { LucideLocateFixed } from "lucide-svelte";
	import { Button, Toggle, Popover } from "svelte-ux";
	import { TargetStore } from "@/stores/TargetImageStore";
	import { canWeActivateMode } from "@/utils/editor/EditorUtils";

    let enabled: { status: boolean, missing: string[]} = $state({ status: false, missing: []});
    let hasShots = $state(false);
    let isRefComplete = $state(false);
    let isFirearmSelected = $state(false);
    let isAmmunitionSelected = $state(false);
    let isEventValid = $state(false);

    $effect(() => {
        if ($EditorStore || $TargetStore) {
            // @ts-ignore
            hasShots = $TargetStore.groups[0]?.shots?.length > 0 || false;
            isRefComplete = $EditorStore.isRefComplete || false;
            isFirearmSelected = $TargetStore.info.firearm?.length == 36 ? true : false;
            isAmmunitionSelected = $TargetStore.info.ammunition.length == 36 ? true : false;
            isEventValid = $TargetStore.info.event.length > 2 ? true : false;

            enabled = canWeActivateMode('poa');
        }
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
            {$EditorStore.mode === 'poa' ? 'editorButtonActive' : ''}
        "
        onclick={ () => enabled.status ? setMode('poa') : toggle}
        onmouseover={enabled.status ? undefined : toggle}
        onfocus={enabled.status ? undefined : toggle}
        onmouseout={enabled.status ? undefined : toggle}
        onblur={enabled.status ? undefined : toggle}
        style={enabled.status ? "" : "opacity: 0.5;"}
    >
        <LucideLocateFixed
            class="pointer-events-none"
        />
        {#if !enabled.status}
            <Popover {open} on:close={toggleOff} placement="right-start">
                <div class="px-3 py-3 border shadow text-sm text-slate-800 max-w-fit rounded italic bg-yellow-100 dark:bg-yellow-100">
                    <p class="not-italic font-bold">Cannot set POA...</p>
                    {#if !isFirearmSelected}<p>&circleddash; No firearm selected.</p>{/if}
                    {#if !isAmmunitionSelected}<p>&circleddash; No ammunition selected.</p>{/if}
                    {#if !isRefComplete}<p>&circleddash; You need to set reference points.</p>{/if}
                </div>
            </Popover>
        {/if}
    </Button>
</Toggle>