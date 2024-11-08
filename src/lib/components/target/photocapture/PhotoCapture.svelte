<!-- PhotoCapture.svelte -->
<script lang="ts">
	import { LucideSkull } from 'lucide-svelte';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';

	let stream = $state<MediaStream | null>(null);
	let photoData = $state<string | null>(null);
	let error = $state<string | null>(null);

	// We still need refs for DOM elements
	let videoElement = $state<HTMLVideoElement|undefined>();
	let canvasElement = $state<HTMLCanvasElement|undefined>();

	// Event dispatcher for component events
	const dispatch = createEventDispatcher<{
		photo: { photoData: string };
	}>();

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
		}
	}

    function capturePhoto() {
		if (videoElement && canvasElement) {
			const context = canvasElement.getContext('2d');

			canvasElement.width = videoElement.videoWidth;
			canvasElement.height = videoElement.videoHeight;

            context?.drawImage(videoElement, 0, 0);
			photoData = canvasElement.toDataURL('image/jpeg');
			dispatch('photo', { photoData: photoData });
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
<div class="camera-container">
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
	></video>

	<canvas
		bind:this={canvasElement}
		style="display: none;"
	></canvas>

	<div class="controls">
		<button
			onclick={capturePhoto}
			disabled={!stream}
		>
			Take Photo
		</button>

		{#if photoData}
			<button onclick={() => {
				photoData = null;
				startCamera();
			}}>
				Retake
			</button>
		{/if}
	</div>


    <div style="position: absolute; top: 50px; left:50px;z-index:50;">HELVETET<LucideSkull /></div>
	{#if photoData}
        <div class="preview border-b-2 border-cyan-50 border-solid">
			<img src={photoData} alt="Capture" style="position:relative; z-index: 0; display:none;"/>
		</div>
	{/if}

</div>
{/if}

<style>
	.camera-container {
		position: relative;
		max-width: 100%;
		width: 100%;
	}

	video {
		width: 100%;
		max-width: 100%;
		height: auto;
	}

	.controls {
		position: relative;
		padding: 1rem;
		text-align: center;
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.preview {
		margin-top: 1rem;
	}

	.preview img {
		max-width: 100%;
		height: auto;
	}

	.error {
		color: red;
		padding: 1rem;
		text-align: center;
	}
</style>
