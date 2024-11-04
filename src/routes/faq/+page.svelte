<script lang="ts">
    import { Accordion } from '@skeletonlabs/skeleton-svelte';
    import { CircleHelp } from 'lucide-svelte';
    import type { PageData } from './$types';

    const value: string[]|undefined = $state(['item-0']);

    let { data } : { data: PageData } = $props();
</script>


<div class="grid grid-cols-[1fr,_5fr] gap-4 mt-8">
    <div class="col-span-2 text-2xl mb-4"><h1>Frequently Asked Questions</h1></div>
    <div>Contents</div>
    {#if data?.faq?.length}
    <div class="bg-surface-700 divide-surface-200-800 block divide-y overflow-hidden">
        <Accordion {value} multiple>
            {#each data.faq as faq, i}
                <Accordion.Item value="item-{i}">
                    {#snippet lead()}<CircleHelp />{/snippet}
                    {#snippet control()}{faq.question}{/snippet}
                    {#snippet panel()}
                        <p>{@html faq.answer.replaceAll(/(\r\n)+/gi,'</p><p>')}</p>
                    {/snippet}
                </Accordion.Item>
                <hr class="hr border-t-2" />
            {/each}
        </Accordion>
    </div>
    {/if}
</div>
