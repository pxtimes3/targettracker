<script lang="ts">
	import { page } from "$app/stores";
	import * as Form from "$lib/components/ui/form/index.js";
	import Input from "@/components/ui/input/input.svelte";
	import { ImageUp } from "lucide-svelte";
	import { Toaster, toast } from 'svelte-sonner';
	import {
		superForm,
		type Infer,
		type SuperValidated,
	} from "sveltekit-superforms";
	import { zodClient } from "sveltekit-superforms/adapters";
	import { formSchema, type TargetInformationFormSchema } from "./targetuploadformschema";

    let {
        form: data = $page.data.select
    }: { form: SuperValidated<Infer<TargetInformationFormSchema>> } = $props();

    const form = superForm(data, {
        validators: zodClient(formSchema),
        onUpdated: ({ form: f }) => {
            if (f.valid) {
                toast.success(`You submitted ${JSON.stringify(f.data, null, 2)}`);
            } else {
                toast.error("Please fix the errors in the form.");
            }
        }
    });

    let targetUploadForm: HTMLFormElement|undefined = $state();
    let targetType: string|undefined = $state()
    let targetTypeSelect: any|undefined = $state();
    let files: FileList|undefined = $state();
    let showModal = $state(false);

    $effect(() => {
        console.log(targetType)
        if (files && files.length > 0) {
            // Create FormData manually
            const formData = new FormData();
            formData.append('file', files[0]);

            // Submit via fetch
            fetch('?/targetupload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(result => {
                console.log('Success:', result);
                showModal = true; // Show modal on success
                files = undefined; // Reset file input
            })
            .catch(error => {
                console.error('Error:', error);
                // Handle error
            });
        }
    });

    const { form: formData, enhance } = form;
</script>
<Toaster />
<div class="flex flex-col my-auto gap-4 items-end place-content-center h-fit max-h-fit w-fit">
    <form
        bind:this={targetUploadForm}
        method="POST"
        action="?/targetupload"
        enctype="multipart/form-data"
        class="flex flex-row my-auto gap-4 items-start place-content-start h-fit max-h-fit"
        use:enhance
    >
        <div>
            <h4>Target information</h4>
            <div>
                <Form.Field
                    {form}
                    name="targetname"
                >
                    <Form.Control>
                        {#snippet children({ props })}
                            <Input {...props} bind:value={$formData.targetname} placeholder="Target name:" />
                        {/snippet}
                    </Form.Control>
                </Form.Field>
            </div>
            <!--
            <div class="grid">
                <Form.Field
                    {form}
                    name="targettype"
                >
                    <Form.Control>
                        {#snippet children({ props })}
                            <Select.Root bind:this={targetTypeSelect}>
                                <Select.Trigger {...props} class="w-full">Target type:</Select.Trigger>
                                <Select.Content>
                                    <Select.Item value="issf_airpistol_10m">ISSF Air Pistol 10m</Select.Item>
                                    <Select.Item value="issf_rapid_fire_airpistol_10m">ISSF Rapid Fire Air Pistol 10m</Select.Item>
                                    <Select.Item value="ssf_airrifle_5dot_10m">SSF Luftgevär 5 dot 10m</Select.Item>
                                    <Select.Item value="issf_pistol_2025m_rifle_100m">ISSF Pistol 20/25m Rifle 100m</Select.Item>
                                    <Select.Item value="issf_rifle_50m">ISSF Rifle 50m</Select.Item>
                                    <Select.Item value="issf_rifle_300m">ISSF Rifle 300m</Select.Item>
                                    <Select.Item value="issf_rifle_300m_reduced">ISSF Rifle 300m, reduced</Select.Item>
                                    <Select.Item value="other">Other</Select.Item>
                                </Select.Content>
                            </Select.Root>
                        {/snippet}
                    </Form.Control>
                </Form.Field>
            </div>
            -->
        </div>
        <label
            for="imageupload"
            class="border-2 bg-slate-100 cursor-pointer border-slate-300 shadow-xl content-center grid grid-flow-row place-items-center w-[164px] min-w-[164px] max-w-[164px] h-[164px] min-h-[164px] max-h-[164px]"
        >
            <div class="mx-4"><center><ImageUp /></center></div>
            <div class="mx-4">Upload Target</div>
        </label>

        <input
            bind:files
            name="file"
            accept="image/png, image/jpeg, image/heic"
            type="file"
            id="imageupload"
            hidden
        />
    </form>
    <p class="text-sm">JPG, PNG & HEIC allowed.</p>
</div>

{#if showModal}
    <div class="modal">
        <div class="modal-content">
            <h2>Upload Complete!</h2>
            <button onclick={() => showModal = false}>Close</button>
        </div>
    </div>
{/if}
