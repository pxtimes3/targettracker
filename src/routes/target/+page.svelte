<script lang="ts">
    // TODO: Turnstile
	import PhotoCapture from '@/components/target/photocapture/PhotoCapture.svelte';
	import { cameraImageDataStore } from '@/stores/TargetImageStore';
	import { FileUpload, ProgressRing } from '@skeletonlabs/skeleton-svelte';
	import { CircleCheck, CircleOff } from 'lucide-svelte';
	import IconDropzone from 'lucide-svelte/icons/image-plus';
	import { onMount } from 'svelte';

    let card: HTMLDivElement|undefined = $state();
    let targetUploadForm: HTMLFormElement|undefined = $state();
    let uploadStatus: "pending"|"success"|"failed"|undefined = $state();
    let targetImageFile: File|undefined = $state();
    let targetType: string|undefined = $state()
    let targetTypeSelect: any|undefined = $state();
    let showModal = $state(false);
    let rangeUnitSelector: HTMLSelectElement|undefined = $state();
    let rangeInputGroup: HTMLDivElement|undefined = $state();
    let rangeInput: HTMLInputElement|undefined = $state();
    let rangeInputValue: string|undefined = $state();
    let targetNameInput: HTMLInputElement|undefined = $state();
    let targetNameInputValue: string|undefined = $state();
    let formSubmitDisabled: boolean = $state(true);
    let uploadModal: HTMLDivElement|undefined = $state();
    let uploadModalText: HTMLParagraphElement|undefined = $state();

    let photoUploadStatus: string|null = $state(null);
    let cameraAvailable: boolean = $state(false);

    async function handlePhoto(event) {
		const { photoData } = event.detail;

		try {
			photoUploadStatus = 'uploading';

			const response = await fetch('/api/upload', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ photoData })
			});

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error);
			}

			photoUploadStatus = 'success';
		} catch (error) {
			console.error('Upload failed:', error);
			photoUploadStatus = 'error';
		}
	}

    function targetTypeChangeHandler(e: Event)
    {
        const target = e.target as HTMLSelectElement;
        if (!target) return;
        if (!rangeUnitSelector) return;
        if (!rangeInput) return;

        // rangeunitselector switch
        const targetRangeUnit = target.value.match(/(\w)$/i)?.[0];
        targetRangeUnit === 'm' ? rangeUnitSelector.selectedIndex = 0 : rangeUnitSelector.selectedIndex = 1;
        let range = target.value.match(/(\d+)(?:\w)$/i)?.[1];
        if (range) {
            rangeInput.value = range;
            rangeInputValue = range;
        }
    }

    async function handleSubmit(e: Event)
    {
        e.preventDefault();
        e.stopPropagation();

        // console.log('handleSubmit called');

        if (!targetImageFile) return;
        if (!targetNameInputValue) return;
        if (!rangeInputValue) return;

        showModal = true;
        uploadStatus = "pending"

        let result;

        const formData = new FormData();
        formData.append('targetImage', targetImageFile);
        formData.append('targetName', targetNameInputValue?.toString());
        formData.append('targetType', targetTypeSelect.value.toString());
        formData.append('targetRange', rangeInputValue?.toString())
        formData.append('targetRangeUnit', rangeUnitSelector?.value.toString() || 'm');

        const request = await fetch('?/targetupload', {
            method: 'POST',
            body: formData
        })

        if (request) {
            result = await request.json();

            if (result.status === 200) {
                uploadStatus = "success";
                targetUploadForm?.reset();
            } else if (result.status === 400) {
                uploadStatus = "failed";
                // TODO: Logging
                // console.error('Error:', JSON.parse(result.data)[0]);
                if (!uploadModalText) return;
                uploadModalText.innerText = `Upload failed! With the error: ${JSON.parse(result.data)[0]}.`;
            }
        }
    }

    async function closeModal()
    {
        if (uploadStatus === "failed") {
            showModal = false;
            targetUploadForm?.classList.remove('blur-md');
        }
    }

    async function validateFile(files: any): Promise<void>
    {
        if (files.acceptedFiles && files.acceptedFiles[0].size  > 0) {
            targetImageFile = files.acceptedFiles[0];
        }
    }

    async function validateForm()
    {
        if (targetNameInput && targetNameInputValue?.length && !targetNameInput.validity.valid) {
            targetNameInput.classList.add('border-error-500')
        } else if(targetNameInput){
             targetNameInput.classList.remove('border-error-500');
        }

        if (rangeInput && rangeInputGroup && !rangeInput.validity.valid && rangeInputValue && rangeInputValue?.length > 0) {
            rangeInputGroup.classList.add('border-error-500');
        } else if(rangeInputGroup){
            rangeInputGroup.classList.remove('border-error-500');
        }

        if (
            targetNameInput &&
            rangeInput &&
            targetNameInput.validity.valid &&
            rangeInput.validity.valid &&
            targetTypeSelect.value.length > 0 &&
            targetImageFile
        ) {
            // console.log(targetNameInputValue, rangeInputValue, targetTypeSelect.value, targetImageFile);
            formSubmitDisabled = false;
        } else {
            // console.log(targetNameInputValue, rangeInputValue, targetTypeSelect.value, targetImageFile);
            formSubmitDisabled = true;
        }
    }

    async function hasCamera(): Promise<boolean> {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.some(device => device.kind === 'videoinput');
        } catch (err) {
            console.warn('Error checking for camera:', err);
            return false;
        }
    }

    $effect(() => {
        validateForm()
        if (showModal) {
            showModal ? targetUploadForm?.classList.add('blur-md') : targetUploadForm?.classList.remove('blur-md');
        }
    });

    onMount(async () => {
        cameraAvailable = await hasCamera();
        if (cameraAvailable) {
            // Show camera option
        } else {
            // Hide camera option or automatically show upload interface
        }
    });
</script>

{#if !$cameraImageDataStore}
<div
    bind:this={card}
    class="card grid justify-items-center place-items-center border-surface-200-800 w-fit py-6 px-8"
>
    {#if showModal}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
            bind:this={uploadModal}
            class="absolute grid justify-items-center place-items-center my-auto mx-auto z-10 stroke-tertiary-600-400"
            onclick={closeModal}
        >
            {#if uploadStatus === "pending"}
                <ProgressRing
                    value={null}
                    size="size-14"
                    meterStroke="stroke-tertiary-600-400"
                    trackStroke="stroke-tertiary-50-950"
                />
                <p bind:this={uploadModalText} class="mt-2">Uploading target ... </p>
            {/if}
            {#if uploadStatus === "success"}
                <CircleCheck size="64" />
                <p bind:this={uploadModalText} class="mt-2">Upload successful. Redirecting ... </p>
            {/if}
            {#if uploadStatus === "failed"}
                <CircleOff size="64" />
                <p bind:this={uploadModalText} class="mt-2">Upload failed! Contact <a href="/contact?subject=FileuploadError">support</a> if this problem persists.</p>
            {/if}
        </div>
    {/if}

    <form
        bind:this={targetUploadForm}
        method="POST"
        action="?/targetupload"
        enctype="multipart/form-data"
        onsubmit={handleSubmit}
        class="grid justify-center grid-flow-row-dense lg:grid-cols-[1fr,_auto] gap-4 place-content-center"
    >
        <!-- {#if cameraAvailable} -->
            <button
                class="btn btn-lg h-20 preset-filled-primary-500 mt-2 w-full mb-8"
            >Use camera</button>
            <div class="grid grid-cols-[1fr_auto_1fr] w-full items-center mb-8 opacity-70">
                <span class="border-t-[1px] h-1 align-middle"></span>
                <div class="justify-self-center align-self-middle px-4 text-sm">OR</div>
                <span class="border-t-[1px] h-1 align-middle"></span>
            </div>
        <!-- {/if} -->
        <h2 class="lg:col-span-2 text-xl font-semibold">Target information</h2>
        <div class="grid-flow-row space-y-4">
            <div>
                <label class="label bg-surface-700 rounded">
                    <input
                        type="text"
                        bind:this={targetNameInput}
                        bind:value={targetNameInputValue}
                        onkeydown={validateForm}
                        id="targetname"
                        name="targetname"
                        placeholder="Target name"
                        onload={() => focus()}
                        required
                        minlength="3"
                        maxlength="96"
                        pattern="^(?:^[.,@0-9_\- a-z A-ZÅ-ö]+)$"
                        class="form-input rounded w-full border-surface-100-900 bg-surface-200-800"
                    />
                </label>
            </div>
            <div class="bg-surface-700">
                <select
                    id="targettype"
                    name="targettype"
                    required
                    onchange={targetTypeChangeHandler}
                    bind:value={targetType}
                    bind:this={targetTypeSelect}
                    class="py-1.5 px-3 form-select rounded w-full border-surface-100-900 bg-surface-200-800 text-md"
                >
                    <option value={undefined} selected disabled>Target type:</option>
                    <option value="issf_airpistol_10m">ISSF Air Pistol 10m</option>
                    <option value="issf_rapid_fire_airpistol_10m">ISSF Rapid Fire Air Pistol 10m</option>
                    <option value="ssf_airrifle_5dot_10m">SSF Luftgevär 5 dot 10m</option>
                    <option value="issf_pistol_2025m_rifle_100m">ISSF Pistol 20/25m Rifle 100m</option>
                    <option value="issf_rifle_50m">ISSF Rifle 50m</option>
                    <option value="issf_rifle_300m">ISSF Rifle 300m</option>
                    <option value="issf_rifle_300m_reduced_100m">ISSF Rifle 300m, reduced</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div class="input-group border-[1px] divide-surface-200-800 grid-cols-[1fr_minmax(auto,_12ch)] divide-x divide-solid rounded w-full border-surface-100-900 bg-surface-200-800" bind:this={rangeInputGroup}>
                <input
                    type="text"
                    id="range"
                    name="range"
                    bind:this={rangeInput}
                    bind:value={rangeInputValue}
                    placeholder="100"
                    required
                    pattern={'^(?:^[0-9,.]{0,4})$'}
                    minlength="1"
                    maxlength="5"
                    class="form-input rounded w-full border-surface-100-900 bg-surface-200-800 to-"
                />
                <select
                    id="rangeunit"
                    name="rangeunit"
                    bind:this={rangeUnitSelector}
                    required
                    class="form-select mr-[-2rem]"
                >
                    <option value="metric">Meters</option>
                    <option value="imperial">Yards</option>
                </select>
            </div>
        </div>
        <div>
            <!--
                TODO:   onFileChange={handleSubmit}
                TODO:   onFileReject={console.error}
                        subtext="JPG, PNG & HEIC allowed."
            -->
            {#if !$cameraImageDataStore}
                <FileUpload
                    name="targetImage"
                    accept="image/*"
                    allowDrop
                    maxFiles={1}
                    onFileChange={validateFile}
                    classes=""
                    interfaceClasses="bg-gradient-to-br dark:from-surface-700 dark:to-surface-800 border-surface-100-900 border-4 border-solid rounded w-full"
                >
                    {#snippet iconInterface()}<IconDropzone class="size-8" />{/snippet}
                    <!--
                        {#snippet iconFile()}<IconFile class="size-4" />{/snippet}
                        {#snippet iconFileRemove()}<IconRemove class="size-4" />{/snippet}
                    -->
                </FileUpload>
            {:else}
                <img src={$cameraImageDataStore} alt="cam" class="max-w-20"/>
            {/if}
        </div>
        <div id="turnstile"></div>

            <button
                class="btn btn-lg h-20 preset-filled-primary-500 mt-2"
                disabled={formSubmitDisabled}
            >Upload!</button>

    </form>



	{#if uploadStatus}
		<div class="status" class:error={photoUploadStatus === 'error'}>
			{#if photoUploadStatus === 'uploading'}
				Uploading...
			{:else if photoUploadStatus === 'success'}
				Upload successful!
			{:else if photoUploadStatus === 'error'}
				Upload failed. Please try again.
			{/if}
		</div>
	{/if}
</div>
{:else}
    <PhotoCapture on:photo={handlePhoto} />
{/if}
