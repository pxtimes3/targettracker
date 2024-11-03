<script lang="ts">
    import { enhance } from "$app/forms";
    import { invalidate } from "$app/navigation";
    import Button from "@/components/ui/button/button.svelte";
    import Input from "@/components/ui/input/input.svelte";
    import { DateTime } from "luxon";
    import { type PageData } from "../$types";
    import type { Invites } from '../../$types';



    let { data } : { data: PageData } = $props();

    let availableInvites: Invites[] = $state([]);
    let sentInvites: Invites[] = $state([]);

    $effect(() => {
        if (data.invites) {
            console.log(data.invites)
            availableInvites = data.invites.filter((el: Invites) => el.active === false);
            sentInvites = data.invites.filter((el: Invites) => el.active === true);
            // data.invites.forEach((el: Invites) => {
            //     if (!el.inviteeEmail) {
            //         availableInvites.push(el);
            //     }
            // })
        }
    });
</script>

<form use:enhance={() =>{
    return ({ result }) => {
		// result is of type ActionResult
        console.log('result: ', result);
        invalidate('/dashboard/invite');
	};
}} method="POST" action="?/sendinvite">

<div class="mt-4 max-w-[66%] w-[66%] grid grid-flow-row-dense grid-rows-[repeat(2,_minmax(2rem,_auto))] grid-cols-[repeat(3,_minmax(fit,_auto))] gap-x-4">
    {#if availableInvites?.length > 0}
        <div class="col-span-3 mb-4">
            <h3 class="text-xl font-semibold">Available Invites</h3>
            <span class="text-sm">You have {availableInvites.length} invites to give out.</span>
        </div>
        <select id="invites" name="invite-code" class="text-sm px-2">
            {#each availableInvites as invite}
                <option value={invite.code}>{invite.code}</option>
            {/each}
        </select>
        <Input
            name="invitee-email"
            placeholder="friendly.duck@targettracker.se"
            value="friendly.duck@targettracker.se"
        />
        <Button
            type="submit"
            class="w-fit"
        >Send it!</Button>
    {:else}
        <div class="col-span-3 mb-4">
            <h3 class="text-xl font-semibold">Available Invites</h3>
            <span class="text-sm">You have {availableInvites.length} invites to give out.</span>
        </div>
        <div>
            <p>You have no available invites to give out. Try asking any of your invited friends if they have any left.</p>
            <p>Invites are given out on a semi regular basis, so sit tight!</p>
        </div>
    {/if}
    <div class="col-span-3 mt-[4rem]">
        <h3 class="text-xl font-semibold">Invites sent</h3>
        <span class="text-sm">You have sent {sentInvites.length} invite{sentInvites.length > 1 ? 's':''}:</span>
    </div>
    {#if sentInvites.length > 0}
    <div class="col-span-3 mt-4 grid grid-cols-[repeat(4,_minmax(4ch,_auto))] gap-y-2">
        <div class="mb-2"><span class="font-semibold">Code:</span></div>
        <div class="mb-2"><span class="font-semibold">Sent to:</span></div>
        <div class="mb-2"><span class="font-semibold">Date:</span></div>
        <div class="mb-2"><span class="font-semibold">Accepted:</span></div>
        {#each sentInvites as invite}
            <div>{invite.code}</div>
            <div>{invite.invitee_email}</div>
            <div>
                {#if invite.invite_sent}
                    {DateTime.fromISO(invite.invite_sent.toISOString()).toFormat('yyyy-MM-dd')}
                {/if}
            </div>
            <div>{invite.accepted ? 'Yes' : 'No'}</div>
        {/each}
    </div>
    {/if}
</div>
</form>
