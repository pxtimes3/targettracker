<!-- PhotoCapture.svelte -->
<script lang="ts">
	import { cameraImageDataStore } from '@/stores/TargetImageStore';
	import { onDestroy, onMount } from 'svelte';

	let stream = $state<MediaStream | null>(null);
	let photoData = $state<string | null>(null);
	let error = $state<string | null>(null);

	let { cameraActive = $bindable(), classes } = $props();

	// We still need refs for DOM elements
	let videoElement = $state<HTMLVideoElement|undefined>();
	let canvasElement = $state<HTMLCanvasElement|undefined>();

	async function startCamera() {
		try {
            if (!videoElement) throw new Error('HTML Video Element.');
			stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: 'environment', // Use back camera
					width: { ideal: 1280 },
					height: { ideal: 720 }
				}
			});
			videoElement.srcObject = stream;
			cameraActive = true;
			error = null;
		} catch (err) {
			error = 'Error accessing camera: ' + (err instanceof Error ? err.message : String(err));
			console.warn('Error accessing camera:', err);
		}
	}

	function stopCamera() {
		if (stream) {
			stream.getTracks().forEach(track => track.stop());
			stream = null;
			cameraActive = false;
		}
	}

    function capturePhoto() {
		if (videoElement && canvasElement) {
			const context = canvasElement.getContext('2d');

			canvasElement.width = videoElement.videoWidth;
			canvasElement.height = videoElement.videoHeight;

            context?.drawImage(videoElement, 0, 0);
			photoData = canvasElement.toDataURL('image/jpeg');
		}
	}

	onMount(() => {
		startCamera();
	});

	onDestroy(() => {
		stopCamera();
	});
</script>

{#if !error}
	<div
		class="camera-container absolute top-0 z-10 w-full h-full {classes}"
	>
		{#if error}
			<div class="error">
				{error}
			</div>
		{/if}

		<video
			bind:this={videoElement}
			autoplay
			playsinline
			muted
			class="relative z-0"
		></video>

		<canvas
			bind:this={canvasElement}
			style="display: none;"
		></canvas>

		<div
			class="controls z-50 absolute bottom-[5vh] left-0 w-full px-4 grid {photoData ? 'grid-cols-2' : ''}"
		>
			{#if !photoData}
				<button
					class="btn btn-lg preset-filled justify-self-center"
					onclick={capturePhoto}
					disabled={!stream}
				>
					Take Photo
				</button>
			{/if}

			{#if photoData}
				<button
					class="btn btn-lg preset-filled justify-self-start"
					onclick={() => {
						photoData = null;
						startCamera();
					}}
				>
					Retake
				</button>
				<button
					class="btn btn-lg preset-filled justify-self-end"
					onclick={() => {
						if (photoData) {
							$cameraImageDataStore = photoData;
							stopCamera();
						}
					}}
				> Use Photo </button>
			{/if}
		</div>
		<div style="position: absolute; top: 0px; left:0px; width:100%; height: 100%; z-index:40;" class="grid justify-items-center place-content-center">
			<img src='10_mtarget.svg' alt="lol" style="transform:translate(50% 0)" class="opacity-30">
			<span class="text-white opacity-40">Place the target within the circle.</span>
		</div>
		{#if photoData}
			<div class="preview border-b-2 border-cyan-50 border-solid">
				<img src={photoData} alt="Capture" style="position:relative; z-index: 0;"/>
			</div>
		{/if}

	</div>
{:else}
	{error}
{/if}
