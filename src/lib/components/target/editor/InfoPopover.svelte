<script lang="ts">
    import { fade } from 'svelte/transition';
    
    export let text: string;
    export let info: string;
    export let position: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
    export let trigger: 'hover' | 'click' = 'hover';
    
    let showPopover = false;
    
    const positions = {
        top: '-bottom-2 translate-y-[-100%]',
        bottom: 'top-6',
        left: 'right-full top-0 mr-2',
        right: 'left-full top-0 ml-2'
    };
    
    function handleTrigger(event: MouseEvent) {
        if (trigger === 'click') {
            showPopover = !showPopover;
        }
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<span 
    class="relative inline-block"
    on:mouseenter={() => trigger === 'hover' && (showPopover = true)}
    on:mouseleave={() => trigger === 'hover' && (showPopover = false)}
    on:click={handleTrigger}
>
    {text}
    <span class="font-bold hover:text-blue-600 cursor-pointer ml-1">
        {info}
    </span>
    {#if showPopover}
        <div 
            class="absolute z-50 p-4 max-w-sm bg-white dark:bg-slate-700 min-w-[16rem] w-40rounded shadow-lg {positions[position]}"
            transition:fade
        >
            <slot />
        </div>
    {/if}
</span>