<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { Application, Assets, Sprite, type Renderer } from 'pixi.js';
	import { onDestroy, onMount } from 'svelte';

	let canvasContainer: HTMLDivElement;
	let app: Application<Renderer>;
	let spriteInfo = $state();

	function removeItem(item)
	{
		app.canvas.removeChild(item)
	}

	onMount(async () => {
		// Create new PIXI application with explicit render type
		app = new PIXI.Application();
  		await app.init({
			width: 640,
			height: 360,
			backgroundColor: 0x1099bb,
			antialias: true,
			resolution: window.devicePixelRatio || 1,
			hello: true
		});
		canvasContainer.appendChild(app.canvas);
		// document.body.appendChild(app.canvas);

		const texture = await Assets.load('0sJnWgk.jpg')
		const imageSprite = new Sprite(texture);
		imageSprite.x = -276;
		imageSprite.y = -520;

		await Assets.load('sample.png');
		let sprite = Sprite.from('sample.png');
		sprite.on('pointerdown', (e) => { removeItem(sprite) });
		sprite.eventMode = 'static';
		sprite.x = 300;

		app.stage.addChild(imageSprite);
		app.stage.addChild(sprite);
	});

	onDestroy(() => {
		if (app) {
			app.destroy(true, true);
		}
	});
</script>

<div bind:this={canvasContainer}></div>
{spriteInfo}
<img src="sample.png" width="100" height="100" style="display:none;"/>
