<script lang="ts">
    import * as Form from "$lib/components/ui/form";
    import Input from '@/components/ui/input/input.svelte';
    import {
    	superForm,
    	type Infer,
    	type SuperValidated,
    } from "sveltekit-superforms";
    import { zodClient } from "sveltekit-superforms/adapters";
    import { loginForm, type FormSchema } from "./schema";


	let { data }: { data: SuperValidated<Infer<FormSchema>> } = $props();

	const form = superForm(data, {
    	validators: zodClient(loginForm),
		dataType: 'json',
  	});

	const { form: formData } = form;

    async function processForm(e: Event)
    {
        e.preventDefault();
        e.stopPropagation();

        let logindata = new FormData();
        logindata.append('username', $formData.username);
        logindata.append('password', $formData.password);

        try {
            const req = new Request("?/login", {
                method: 'POST',
                body: logindata
            });
            const result = await fetch(req);
        } catch (error) {

        }
    }
</script>

<form id="loginForm">
    <Form.Field {form} name="username">
    <Form.Control let:attrs>
    <Form.Label>Username</Form.Label>
    <Input {...attrs} id="username" bind:value={$formData.username} />
    <Form.Label>Password</Form.Label>
    <Input {...attrs} id="password" type="password" bind:value={$formData.password} />
    </Form.Control>
    <!--<Form.Description>This is your public display name.</Form.Description>-->
    <Form.FieldErrors />
    </Form.Field>
    <Form.Button
        on:click={processForm}
    >Login</Form.Button>
</form>
