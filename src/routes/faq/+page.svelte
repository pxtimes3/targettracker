<script lang="ts">
    import { Accordion } from '@skeletonlabs/skeleton-svelte';
    import { CircleHelp } from 'lucide-svelte';
    const value = $state(['item-1']);
</script>

<div>
    <div class="grid grid-cols-[1fr,_5fr] gap-4 mt-8">
        <div class="col-span-2 text-2xl mb-4"><h1>Frequently Asked Questions</h1></div>
        <div>Contents</div>
        <Accordion {value} multiple>
            <Accordion.Item value="item-1">
                {#snippet lead()}<CircleHelp />{/snippet}
                {#snippet control()}What is this?{/snippet}
                {#snippet panel()}
                    <p>Target Tracker is a tool for you as a target shooter to keep track of your progression. You can easily see historical data, sorted on firearm, ammunition, etc. and answer questions such as "Did my 30-06 shoot better with a certain load?".</p>
                    <p>If you're a hand loader you can also keep track of your load data and compare them with each other.</p>
                {/snippet}
            </Accordion.Item>
            <hr class="hr" />
            <Accordion.Item value="item-2">
                {#snippet lead()}<CircleHelp />{/snippet}
                {#snippet control()}Is it safe?{/snippet}
                {#snippet panel()}
                    <p>Yes, as safe as it can be. All data is anonymized to the fullest extent it can be. As long as you as a user don't upload targets with personal data & keep your login information safe it's safe enough.</p>
                {/snippet}
            </Accordion.Item>
            <hr class="hr" />
            <Accordion.Item value="item-3">
                {#snippet lead()}<CircleHelp />{/snippet}
                {#snippet control()}Can I show my sub-half-MOA group to my friends?{/snippet}
                {#snippet panel()}
                    <p>Of course! You can set your profile to "public" which creates an URL to your page with targets you have marked as public. You also get an unlisted URL to link to your friends, forums etc. when you save a target.</p>
                {/snippet}
            </Accordion.Item>
            <hr class="hr" />
            <Accordion.Item value="item-4">
                {#snippet lead()}<CircleHelp />{/snippet}
                {#snippet control()}Why is this free?{/snippet}
                {#snippet panel()}
                    <p>Information wants to be free!</p>
                    <p>This is first and foremost a way for me to learn new techniques in programming. It started out as a "Let's learn Svelte" project to keep track of my off season air-gun training.</p>
                    <p>There is of course an option to donate to cover server costs, but the philosophny is that it should not be necessary to access the features of Target Tracker.</p>
                    <p>In the future there may be some sort of "VIP" membership with extra perks, but my aim is to not enshittificate the basic users experience just to make a buck.</p>
                {/snippet}
            </Accordion.Item>
            <hr class="hr" />
            <Accordion.Item value="item-5">
                {#snippet lead()}<CircleHelp />{/snippet}
                {#snippet control()}Do you sell or share any data?{/snippet}
                {#snippet panel()}
                    <p>No!</p>
                    <p>The only data "shared" is a low resolution, black and white, target image used for training a LLM in order to be able to create groups on the fly for users. That data remains a property of Mamoco AB and will not be re-sold to any party without your specific consent.</p>
                {/snippet}
            </Accordion.Item>
            <hr class="hr" />
            <Accordion.Item value="item-6">
                {#snippet lead()}<CircleHelp />{/snippet}
                {#snippet control()}The logo is silly!{/snippet}
                {#snippet panel()}
                    <p>Yes!</p>
                {/snippet}
            </Accordion.Item>
            <hr class="hr" />
        </Accordion>
    </div>
</div>
