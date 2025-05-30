<script lang="ts">
    import { enhance } from "$app/forms";
    import { page } from "$app/stores";
    import PasswordInput from "@/components/password-input/password-input.svelte";

    import type { SubmitFunction } from "@sveltejs/kit";
    import { Turnstile } from 'svelte-turnstile';
    import type { PageData } from "../$types";

    let { data } : { data: PageData } = $props();

    let allowRegister = $state(false);
    let registerDisabled: boolean = $derived(allowRegister === false ? true : false);
    let usernameValue: string|undefined = $state();
    let emailValue: string|undefined = $state($page.url.searchParams.get('email') || '');
    let passwordValue: string|undefined = $state();
    let inviteCodeValue: string|undefined = $state($page.url.searchParams.get('code') || '');
    let registerUserForm: HTMLFormElement;
    let error: HTMLDivElement;
    let params: {code: string|undefined, email: string|undefined} = {code: undefined, email: undefined}

    async function turnstileCallback(e: CustomEvent)
    {
        if (e.detail.token) {
            const formData = new FormData();
            formData.append('token', e.detail.token);

            const result = await fetch('?/checkTurnstile', {
                method: "POST",
                body: formData
            })

            if (result.status === 200) {
                allowRegister = true;
            } else {
                console.log(result);
            }
        }
    }

    function validateForm(form: HTMLFormElement): boolean
    {
        const nodes = form.getElementsByTagName('input');
        let result = true;

        for (let i = 0; i < nodes.length; i++)
        {
            if (!nodes.item(i)?.validity.valid) {
                nodes.item(i)?.classList.add('border-red-500');
                result = false;
            }
        }

        return result;
    }

    const onSubmit: SubmitFunction = ({
        formData,
        formElement,
        cancel
    }) => {
        if (validateForm(formElement) === false) {
            cancel();
            return;
        }

        if (!inviteCodeValue || !passwordValue || !usernameValue || !emailValue) {
            cancel();
            return;
        }

        formData.append('username', usernameValue.toString())
        formData.append('email', emailValue.toString())
        formData.append('password', passwordValue.toString())
        formData.append('invitecode', inviteCodeValue.toString())

        return async ({ result, update }) => {
            if (result.type === 'failure') {
                error.classList.remove('hidden');
                error.textContent = result.data?.message || 'An error occurred';
            } else if (result.type === 'redirect') {
                await update();
            }
        };
    };

    /*
    const onSubmit: SubmitFunction = ({ form, data, action, cancel }) =>
    {
        // e.preventDefault();
        // e.stopPropagation();
        if (!registerUserForm) return;

        // if (validateForm(registerUserForm) === false) return;
        if (validateForm(registerUserForm) === false) {
            cancel();
            return;
        }

        return async ({ result, update }) => {
            if (['error', 'failure'].includes(result.type)) {
                error.classList.remove('hidden');
                error.innerHTML = result.data.message;
            }
        };

        // const formData = new FormData(registerUserForm);
        // if (!inviteCodeValue || !passwordValue || !usernameValue || !emailValue) return;
        // formData.append('username', usernameValue.toString())
        // formData.append('email', emailValue.toString())
        // formData.append('password', passwordValue.toString())
        // formData.append('invitecode', inviteCodeValue.toString())

        // const request = await fetch ('?/register',{
        //     method: "POST",
        //     body: formData
        // });

        // let result = await request.json();

        // if (result.status != 200) {
        //     error.classList.remove('hidden');
        //     console.log(result);
        //     // error.innerHTML = JSON.parse(result.data)[1];
        // }
    }
    */
</script>

<svelte:head>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</svelte:head>

<form id="registerUserForm" bind:this={registerUserForm} action="?/register" use:enhance={onSubmit} method="POST" class="grid">
<div class="grid space-y-2 p-6 pb-10 bg-card text-card-foreground rounded-xl border shadow mx-auto my-auto max-w-md w-[28rem] place-self-center">
    <div class="mb-4">
        <h3 class="font-semibold tracking-tight text-2xl">Register</h3>
        {#if data.inviteonly}
            <p class="text-muted-foreground text-sm">Currently invite only.</p>
        {/if}
    </div>
    <div>
        <label for="username">Username:</label>
        <input
            type="text"
            id="username"
            name="username"
            placeholder="xXx_1337user_xXx"
            required
            bind:value={usernameValue}
            class="input-text w-full rounded"
        />
    </div>
    <div>
        <label for="email">E-mail:</label>
        <input
            type="email"
            id="email"
            name="email"
            required
            placeholder="user@example.com"
            bind:value={emailValue}
            class="input-text w-full rounded"
        />
    </div>
    <div>
        <label for="passwordInput">Password:</label>
        <PasswordInput
            id="passwordInput"
            required
            checkPass={false}
            textcolor="text-surface-900"
            css="input-password w-full rounded"
            bind:value={passwordValue}
        />
    </div>
    <div>
        <label for="invitecode">Invite code:</label>
        <input
            type="text"
            id="invitecode"
            bind:value={inviteCodeValue}
            name="invitecode"
            required={data.inviteonly}
            placeholder="AAA098765321ZZZ"
            class={`${data.inviteonly ? 'required' : ''} input-text w-full rounded`}
        />
    </div>

    <div id="error" class="hidden text-red-500" bind:this={error}></div>

    <div class="grid grid-flow-col max-h-fit place-content-between pt-4">
        <Turnstile
            siteKey={'1x00000000000000000000AA'/*data.key*/}
            on:callback={turnstileCallback}
            appearance="interaction-only"
            class="align-middle"
        />
        <button
            type="submit"
            disabled={registerDisabled}
            class="w-fit place-self-center"
        >
            Submit
        </button>
    </div>
</div>
</form>
