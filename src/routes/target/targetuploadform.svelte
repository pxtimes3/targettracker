<script lang="ts">
  import * as Form from "$lib/components/ui/form/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import {
  	type Infer,
  	superForm,
  	type SuperValidated,
  } from "sveltekit-superforms";
  import { zodClient } from "sveltekit-superforms/adapters";
  import { targetUploadFormSchema, type TargetUploadFormSchema } from "./targetuploadformschema";

  let data: SuperValidated<Infer<TargetUploadFormSchema>> = $props();

  const form = superForm(data, {
    validators: zodClient(targetUploadFormSchema),
  });

  const { form: formData, enhance } = form;
</script>

<form method="POST" use:enhance action="?/upload">
  <Form.Field {form} name="targetname">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>TargetName</Form.Label>
        <Input {...props} bind:value={$formData.targetname} />
      {/snippet}
    </Form.Control>
    <Form.Description>This is your public display name.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>
  <Form.Button>Submit</Form.Button>
</form>
