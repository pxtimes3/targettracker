<script lang="ts">
	import { enhance } from "$app/forms";
	import { ImageUp } from "lucide-svelte";
	import { Toaster } from 'svelte-sonner';

    let targetUploadForm: HTMLFormElement|undefined = $state();
    let targetType: string|undefined = $state()
    let targetTypeSelect: any|undefined = $state();
    let files: FileList|undefined = $state();
    let showModal = $state(false);
    let rangeUnitSelector: HTMLSelectElement|undefined = $state();

    function targetTypeChangeHandler(e: Event)
    {
        const target = e.target as HTMLSelectElement;
        if (!target) return;
        if (!rangeUnitSelector) return;

        // rangeunitselector switch
        const targetRangeUnit = target.value.match(/(\w)$/i)?.[0];
        targetRangeUnit === 'm' ? rangeUnitSelector.selectedIndex = 0 : rangeUnitSelector.selectedIndex = 1;

    }

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
</script>
<Toaster />
<div class="flex flex-col my-auto gap-4 items-end place-content-center h-fit max-h-fit w-fit">
    <form
        bind:this={targetUploadForm}
        method="POST"
        action="?/targetupload"
        enctype="multipart/form-data"
        use:enhance
    >
    <!--class="flex flex-row my-auto gap-4 items-start place-content-start h-fit max-h-fit"-->
        <div>
            <h4>Target information</h4>
            <div>
                <label class="label">
                    <input
                        type="text"
                        id="targetname"
                        name="targetname"
                        placeholder="Target name"
                        required
                        pattern="^(?:^[.,@0-9_\- a-z A-ZÅ-ö]*)$"
                        class="input"
                    />
                </label>
            </div>
            <div>
                <select id="targettype" name="targettype" required onchange={targetTypeChangeHandler}>
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
            <div>
                <input type="text" id="range" name="range" placeholder="100" required pattern="^(?:^[0-9,.]+)$" max="5" />
                <select id="rangeunit" name="rangeunit" bind:this={rangeUnitSelector} required>
                    <option value="metric">Meters</option>
                    <option value="imperial">Yards</option>
                </select>
            </div>
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
