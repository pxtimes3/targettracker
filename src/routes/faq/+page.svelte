<script lang="ts">
    import * as Accordion from "$lib/components/ui/accordion/index.js";
	let value = "item-1";
</script>

<Accordion.Root class="w-full">
    <Accordion.Item value="item-1" data-state="open">
        <Accordion.Trigger>What is this?</Accordion.Trigger>
        <Accordion.Content>
			<p>Target Tracker is a tool for you as a target shooter to keep track of your progression. You can easily see historical data, sorted on firearm, ammunition, etc. and answer questions such as "Did my 30-06 shoot better with a certain load?".</p>
			<p>If you're a hand loader you can also keep track of your load data and compare them with each other.</p>
		</Accordion.Content>
    </Accordion.Item>
    <Accordion.Item value="item-2">
        <Accordion.Trigger>Is it safe?</Accordion.Trigger>
        <Accordion.Content>
			<p>Yes, as safe as it can be. All data is anonymized to the fullest extent it can be. As long as you as a user don't upload targets with personal data & keep your login information safe it's safe.</p>
        </Accordion.Content>
    </Accordion.Item>
    <Accordion.Item value="item-3">
        <Accordion.Trigger>Can I show my sub-half-MOA group to my friends?</Accordion.Trigger>
        <Accordion.Content>
			<p>Of course! You can set your profile to "public" which creates an URL to your page with targets you have marked as public. You also get an unlisted URL to link to your friends, forums etc. when you save a target.</p>
        </Accordion.Content>
    </Accordion.Item>
	<Accordion.Item value="item-4">
        <Accordion.Trigger>Why is this free?</Accordion.Trigger>
        <Accordion.Content>
			<p>Information wants to be free!</p>
			<p>This is first and foremost a way for me to learn new techniques in programming. It started out as a "Let's learn Svelte" project to keep track of my off season air-gun training.</p>
			<p>There is of course an option to donate to cover server costs, but the philosophny is that it should not be necessary to access the features of Target Tracker.</p>
			<p>In the future there may be some sort of "VIP" membership with extra perks, but my aim is to not enshittificate the basic users experience just to make a buck.</p>
        </Accordion.Content>
    </Accordion.Item>
	<Accordion.Item value="item-5">
        <Accordion.Trigger>Do you sell or share any data?</Accordion.Trigger>
        <Accordion.Content>
			<p>No!</p>
			<p>The only data "shared" is a low resolution, black and white, target image used for training a LLM in order to be able to create groups on the fly for users. That data remains a property of Mamoco AB and will not be re-sold to any party without your specific consent.</p>
        </Accordion.Content>
    </Accordion.Item>
	<Accordion.Item value="item-6">
        <Accordion.Trigger>The logo is silly!</Accordion.Trigger>
        <Accordion.Content>
			<p>Yes!</p>
        </Accordion.Content>
    </Accordion.Item>
</Accordion.Root>
