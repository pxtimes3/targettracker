<script lang="ts">
    // TODO: Turnstile
	import { goto } from '$app/navigation';
	import PhotoCapture from '@/components/target/photocapture/PhotoCapture.svelte';
	import { cameraImageDataStore, TargetStore } from '@/stores/TargetImageStore';
	import { FileUpload, ProgressRing } from '@skeletonlabs/skeleton-svelte';
	import { CircleCheck, CircleOff } from 'lucide-svelte';
	import IconDropzone from 'lucide-svelte/icons/image-plus';
	import { onMount } from 'svelte';
	import type { PageServerData } from './$types';

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
    let showCameraOption: boolean|undefined = $state();
    let cameraActive: boolean = $state(false);

    let debug: any = $state();

    let { data } : { data: PageServerData } = $props();

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

    function convertToBlob(data: string): Blob
    {
        try {
            // Check if it's a DataURL
            if (data.startsWith('data:')) {
                const [prefix, base64Data] = data.split(',');
                if (!base64Data) {
                    throw new Error('Invalid DataURL format');
                }

                const contentType = prefix.split(':')[1]?.split(';')[0] || '';
                const actualData = base64Data.replace(/^base64,/, '');

                try {
                    const byteString = atob(actualData);
                    const arrayBuffer = new ArrayBuffer(byteString.length);
                    const uint8Array = new Uint8Array(arrayBuffer);

                    for (let i = 0; i < byteString.length; i++) {
                        uint8Array[i] = byteString.charCodeAt(i);
                    }

                    return new Blob([arrayBuffer], { type: contentType });
                } catch (e) {
                    throw new Error('Failed to decode base64 data');
                }
            }

            // If it's just a base64 string
            try {
                const byteString = atob(data);
                const arrayBuffer = new ArrayBuffer(byteString.length);
                const uint8Array = new Uint8Array(arrayBuffer);

                for (let i = 0; i < byteString.length; i++) {
                    uint8Array[i] = byteString.charCodeAt(i);
                }

                return new Blob([arrayBuffer]);
            } catch (e) {
                throw new Error('Invalid base64 string');
            }
        } catch (e: any) {
            throw new Error(`Failed to convert to Blob: ${e.message}`);
        }
    }

    function extractExtensionFromDataURL(DataURL: string): string|undefined
    {
        if (!DataURL.match(/^(data:)/)) return;
        let extension: string;

        const contentType = DataURL.match(/^(?:data:image\/)(\w*)(?:;)/i);

        if (contentType === null) {
            return;
        } else {
            extension = contentType[1].toLowerCase();
        }

        switch (extension) {
            case 'jpeg':
                return 'jpg';
            case 'png':
                return 'png';
            case 'heic':
                return 'heic';
            default:
                // TODO: Logging
                console.error(`Unknown extension: ${extension}`);
                return;
        }
    }

    async function handleSubmit(e: Event)
    {
        e.preventDefault();
        e.stopPropagation();

        debug = 'handleSubmit called';

        if (!targetImageFile && !$cameraImageDataStore) return;
        if (!targetNameInputValue) return;
        if (!rangeInputValue) return;

        console.log($TargetStore);
        TargetStore.clearStorage();
        console.log($TargetStore);

        showModal = true;
        uploadStatus = "pending"

        let result;

        const formData = new FormData();

        if (!$cameraImageDataStore && targetImageFile) {
            formData.append('targetImage', targetImageFile);
            formData.append('targetName', targetNameInputValue?.toString());
        } else if ($cameraImageDataStore) {
            const ext = extractExtensionFromDataURL($cameraImageDataStore);
            if (ext) formData.append('extension', ext);
            formData.append('targetImage', convertToBlob($cameraImageDataStore))
            formData.append('targetName', `${targetNameInputValue?.toString()}.${ext}`);
        }

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

                // console.log('result:', result);
                // console.log(JSON.parse(result.data));

                const parsedData = JSON.parse(result.data);
                const storeData = JSON.parse(parsedData[2]);

                if (storeData) {
                    TargetStore.set(storeData);
                }

                setTimeout(() => {
                    goto('/shots/');
                }, 3000);
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
            (targetImageFile || $cameraImageDataStore)
        ) {
            // console.log(targetNameInputValue, rangeInputValue, targetTypeSelect.value, targetImageFile);
            formSubmitDisabled = false;
        } else {
            // console.log(targetNameInputValue, rangeInputValue, targetTypeSelect.value, targetImageFile);
            formSubmitDisabled = true;
        }
    }

    function isMobileWithTouch(): boolean {
        return ('ontouchstart' in window) &&
            (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }

    async function shouldShowCameraOption(): Promise<boolean> {
        const hasCam = await hasCamera();
        const isMobileTouch = isMobileWithTouch();
        return hasCam && isMobileTouch;
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
        // console.log(cameraActive)
    });

    onMount(async () => {
        showCameraOption = await shouldShowCameraOption();
        extractExtensionFromDataURL('data:image/jpeg;base64,/9j/4AAQSkZJRgABA');
        showModal = false;
    });
</script>

{#if !cameraActive}
<div
    bind:this={card}
    class="card grid justify-items-center md:mt-8 place-items-center {showCameraOption ? '' : 'bg-surface-500 border-surface-800 border-[1px] place-self-center mt-10'}border-surface-200-800 w-fit py-6 px-8"
>
    {#if showModal}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
            bind:this={uploadModal}
            class="absolute top-0 left-0 grid w-full h-full justify-items-center place-items-center z-10 stroke-tertiary-600-400"
            onclick={closeModal}
        >
            {#if uploadStatus === "pending"}
                <ProgressRing
                    value={null}
                    size="size-36"
                    strokeWidth="20px"
                    meterStroke="stroke-white"
                    trackStroke="stroke-white/10"
                    classes="place-self-end justify-self-center"
                />
                <p bind:this={uploadModalText} class="mt-4 text-lg place-self-start justify-self-center">Uploading target ... </p>
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
        onsubmit={handleSubmit}
        action="?/targetupload"
        enctype="multipart/form-data"
        class="grid justify-center grid-flow-row-dense lg:grid-cols-[1fr,_auto] gap-4 place-content-center"
    >
        {#if showCameraOption}
            <button
                class="btn btn-lg h-20 preset-filled-primary-500 mt-2 w-full mb-8"
                onclick={() => cameraActive = true}
            >Use camera</button>
            <div class="grid grid-cols-[1fr_auto_1fr] w-full items-center mb-8 opacity-70">
                <span class="border-t-[1px] h-1 align-middle"></span>
                <div class="justify-self-center align-self-middle px-4 text-sm">OR</div>
                <span class="border-t-[1px] h-1 align-middle"></span>
            </div>
        {/if}
        <h2 class="lg:col-span-2 text-xl font-semibold">Upload target:</h2>
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
                    <option value="ipsc_target">IPSC Target</option>
                    <option value="ipsc_mini_target">IPSC Mini Target</option>
                    <option value="ipsc_rifle_target">IPSC Rifle Target</option>
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
        <div class="h-full">
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
                    classes="h-full"
                    interfaceClasses="bg-gradient-to-br dark:from-surface-700 dark:to-surface-800 border-surface-100-900 border-4 border-solid rounded w-full "
                >
                    {#snippet iconInterface()}<IconDropzone class="size-8" />{/snippet}
                    <!--
                        {#snippet iconFile()}<IconFile class="size-4" />{/snippet}
                        {#snippet iconFileRemove()}<IconRemove class="size-4" />{/snippet}
                    -->
                </FileUpload>
            {:else}
                <div class="relative max-h-20 w-full overflow-hidden">
                    <div class="absolute top-0 left-0 z-10 w-full h-full grid justify-center place-content-center">
                        <button class="p-2 bg-white/50 text-primary-900" onclick={(e) => {cameraActive = true; e.preventDefault();} }>Retake photo</button>
                    </div>
                    <img src={$cameraImageDataStore} alt="cam" class="translate-y-[-50%]"/>
                </div>
            {/if}
        </div>
        <div id="turnstile"></div>
        <button
            class="btn {showCameraOption ? 'btn-lg h-20' : ''}  preset-filled-primary-500"
            type="submit"
            onclick={() => debug = 'clicked upload button'}
            disabled={formSubmitDisabled}
        >Upload!</button>

        <hr class="lg:col-span-2 opacity-40 maw-w-sm mt-3 mb-2"/>

        <div class="text-sm opacity-50 max-w-[40rem] lg:col-span-2">
            <ul class="list-disc ml-4 space-y-2">
                <li class="list-item">Do not upload images containing anything else but targets. No persons, pets or identifying information. Failure to abide by this can cause your account to be terminated.</li>
                <li class="list-item">For best results use an image taken straight on with as little angle as possible. This is especially important if you want accurate scoring.</li>
            </ul>
        </div>
    </form>
</div>
{:else}
    <PhotoCapture
        bind:cameraActive={cameraActive}
        classes={cameraActive ? '' : 'hidden'}
    />
{/if}
