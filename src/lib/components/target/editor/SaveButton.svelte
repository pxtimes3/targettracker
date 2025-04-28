<script lang="ts">
    import { TargetStore } from "@/stores/TargetImageStore";
    import { EditorStore } from "@/stores/EditorStore";
	import { LucideAirVent, LucideSave } from "lucide-svelte";
	import { Button, Toggle, Popover } from "svelte-ux";

    let enabled = $state(false);
    let hasShots = $state(false);
    let isRefComplete = $state(false);
    
    $effect(() => {
        if ($EditorStore || $TargetStore) {
            hasShots = $TargetStore.groups[0]?.shots?.length > 0 || false;
            isRefComplete = $EditorStore.isRefComplete || false;
            enabled = isRefComplete && hasShots;
        }
    });
</script>

<Toggle let:on={open} let:toggle let:toggleOff>
    <button
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
    </button>
    
    {#if !enabled}
        <Popover {open} on:close={toggleOff} placement="bottom-end" class="mt-[-1rem]">
            <div class="px-3 py-3 bg-surface-100 border shadow text-sm max-w-48 rounded italic">
                {#if !hasShots}<p>No shots recorded.</p>{/if}
                {#if !isRefComplete}<p>You need to set the reference points.</p>{/if}
            </div>
        </Popover>
    {/if}
</Toggle>
    <!--onclick={ (e) => { showPanel(e, "save"); $activePanel='save-panel' }}-->
    