<script lang="ts">
	import Logo from '@/components/logo/logo.svelte';
	import { TargetStore, type GroupInterface } from '@/stores/TargetImageStore';
	import { UserSettingsStore } from '@/stores/UserSettingsStore';
	import { LucideBug, LucideCheck, LucideLocate, LucideLocateFixed, LucideRefreshCcw, LucideRotateCcwSquare, LucideRotateCwSquare, LucideRuler, LucideX, SlidersHorizontal } from 'lucide-svelte';
	import type { FederatedPointerEvent, Sprite as PixiSprite, Renderer } from 'pixi.js';
	import { Application, Assets, Container, Graphics, Sprite } from 'pixi.js';
	import { onDestroy, onMount } from 'svelte';
	import type { PageServerData } from './$types';

    interface DraggableSprite extends PixiSprite {
		drag?: {
			dragging: boolean;
			data: any;
			offsetX: number;
			offsetY: number;
			startPosition: { x: number; y: number };
		} | null;
	}

	let { data } : { data: PageServerData } = $props();

	let canvasContainer: HTMLDivElement;
	let loader: HTMLDivElement;
	let applicationState: string = $state('Loading...');
	let mode: undefined|string|"shots"|"reference"|"poa"|"move" = $state();
	let app: Application<Renderer>;
	let mouse: {[key: string]: number} = $state({x:0, y:0});
	let chromeArea: {[key: string]: number} = $state({x:0, y:0});
	let targetPath: string = $state('');
	let targetSprite: Sprite;
	let staticAssets: string[] = $state([
		'/cursors/circle-a.svg',
		'/cursors/circle-x.svg',
		'/cursors/dot.svg',
		'/cursors/move.svg',
		'/cursors/poa.svg',
		'/cursors/pointer.svg',
		'/cursors/shot.svg'
	]);
	let assets: string[] = [];
	let targetContainer = new Container({isRenderGroup: true});
	let groupContainers: Container[] = [];
	let referenceContainer: Container;
	let crosshairContainer: Container;
	let scale: number = $state(0);
	let isDragging: boolean = $state(false);
	let dragTarget: DraggableSprite|undefined = undefined;
	let showMainMenu: boolean = $state(false);

	let rotationSlider: number;
	let rotation: number = $state(0);
	let previousRotation: number = $state(0);
	let slider: number = $state(0);

	let aIsSet: boolean = $state(false);
	let aIsMoved: boolean = $state(true);
	let xIsSet: boolean = $state(false);
	let xIsMoved: boolean = $state(true);
	let refLine: Graphics|undefined;
	let isDrawingReferenceLine: boolean = $state(false);
	let refMeasurement: string = $state('0');
	let refMeasurementDirty: boolean = $state(true);
	let atoxInput: HTMLInputElement|undefined = $state();

	let settingsForm: HTMLFormElement;

	/**
	 * Laddar med $TargetStore.target.image.filename osv...
	 */
	async function initialize(): Promise<Application<Renderer>>
	{
		applicationState = 'Initalizing application...'
		const app = new Application();
  		await app.init({
			width: chromeArea.x,
			height: chromeArea.y,
			backgroundColor: 0xcdcdcc,
			antialias: true,
			resolution: window.devicePixelRatio || 1,
			hello: true
		});

		canvasContainer.appendChild(app.canvas);

		if (!$TargetStore.target.image.filename) {
			throw new Error('No target?');
		} else if (!$TargetStore.target.image.filename.startsWith('uploads')) {
			applicationState = 'Adding target to assets... ';
			targetPath = `/temp/${$TargetStore.target.image.filename}`;
			staticAssets.push(targetPath);
		}

		return app;
	}

	/**
	 * PIXI verkar lösa det här, men uh...
	*/
	function mousePosition(e: MouseEvent): void
    {
        mouse = {
            x: e.clientX,
            y: e.clientY
        };
    }

	/**
	 * Sparar innerheight. Kollar om det kommer från @param e.
	 * @param e: Event. Resize etc.
	 */
    async function getChromeArea(e?: Event): Promise<void>
    {
		applicationState = "Looking out the window... ";

		let target;

        if (e && !e.target) {
			return;
		} else if (e && e.target) {
			target = e.target as Window;
			chromeArea.x = target.innerWidth;
        	chromeArea.y = target.innerHeight;
		} else if (!e) {
			chromeArea.x = window.innerWidth;
        	chromeArea.y = window.innerHeight;
		}
    }

	/**
	 * Laddar static assets. Cursors, etc.
	*/
	async function loadStaticAssets(): Promise<void>
	{
		applicationState = "Populating application with static assets... ";
		await Assets.load(staticAssets);

		// const defaultCursor = 'url(\'/cursors/dot.svg\'), auto';
		// app.renderer.events.cursorStyles.default = defaultCursor;
	}

	/**
	 * Ritar target i @param targetContainer, placerar center/center och skalar ned
	 * att passa fönstret.
	 */
	async function drawTarget(): Promise<void>
	{
		applicationState = "Drawing target... ";
		app.stage.addChild(targetContainer);

		const texture = await Assets.load(targetPath);
		texture.source.scaleMode = 'linear';

		targetSprite = new Sprite(texture);
		targetSprite.label = 'targetSprite';

		targetContainer.label = 'target';
		targetContainer.eventMode = 'dynamic';
		targetContainer.on('pointerdown', (e) => handleClick(e, targetContainer));

		targetContainer.addChild(targetSprite);

		// place targetContainer at center/center
		targetContainer.x = app.screen.width / 2;
		targetContainer.y = app.screen.height / 2;
		// pivot är typ translate?
		targetContainer.pivot.x = targetContainer.width / 2;
		targetContainer.pivot.y = targetContainer.height / 2;

		// skala ner så den ryms i screen
		scale = Math.min(
			(window.innerHeight - 100) / targetSprite.height,
			(window.innerWidth - 100) / targetSprite.width
		);

		targetContainer.scale = scale;
	}

	function setupCrosshairs()
	{
		crosshairContainer = new Container();
		targetContainer.addChild(crosshairContainer);

		const nLine = new Graphics();
		nLine.label = 'N-Line';
		crosshairContainer.addChild(nLine);

		const sLine = new Graphics();
		sLine.label = 'S-Line';
		crosshairContainer.addChild(sLine);

		const eLine = new Graphics();
		eLine.label = 'E-Line';
		crosshairContainer.addChild(eLine);

		const wLine = new Graphics();
		wLine.label = 'W-Line';
		crosshairContainer.addChild(wLine);

		app.ticker.add(() => {
			if ($UserSettingsStore.editorcrosshair) {
				nLine.clear();
				nLine.beginPath();
				nLine.setStrokeStyle({
					width: 4,
					color: 0x000000,
					alpha: 0.3,
					cap: 'round',
					join: 'round'
				});
				const nStartPoint = targetContainer.toLocal({x: mouse.x + 0, y: mouse.y - 5});
				const nEndPos = targetContainer.toLocal({x: mouse.x + 0, y: mouse.y - 3000});
				nLine.moveTo(nStartPoint.x, nStartPoint.y)
						.lineTo(nEndPos.x, nEndPos.y)
						.stroke();

				sLine.clear();
				sLine.beginPath();
				sLine.setStrokeStyle({
					width: 4,
					color: 0x000000,
					alpha: 0.3,
					cap: 'round',
					join: 'round'
				});
				const sStartPoint = targetContainer.toLocal({x: mouse.x + 0, y: mouse.y + 5});
				const sEndPos = targetContainer.toLocal({x: mouse.x + 0, y: mouse.y + 3000});
				sLine.moveTo(sStartPoint.x, sStartPoint.y)
						.lineTo(sEndPos.x, sEndPos.y)
						.stroke();

				wLine.clear();
				wLine.beginPath();
				wLine.setStrokeStyle({
					width: 4,
					color: 0x000000,
					alpha: 0.3,
					cap: 'round',
					join: 'round'
				});
				const wStartPoint = targetContainer.toLocal({x: mouse.x - 5, y: mouse.y + 0});
				const wEndPos = targetContainer.toLocal({x: mouse.x - 3000, y: mouse.y + 0});
				wLine.moveTo(wStartPoint.x, wStartPoint.y)
						.lineTo(wEndPos.x, wEndPos.y)
						.stroke();

				eLine.clear();
				eLine.beginPath();
				eLine.setStrokeStyle({
					width: 4,
					color: 0x000000,
					alpha: 0.3,
					cap: 'round',
					join: 'round'
				});
				const eStartPoint = targetContainer.toLocal({x: mouse.x + 5, y: mouse.y + 0});
				const eEndPos = targetContainer.toLocal({x: mouse.x + 3000, y: mouse.y + 0});
				eLine.moveTo(eStartPoint.x, eStartPoint.y)
						.lineTo(eEndPos.x, eEndPos.y)
						.stroke();
			}
		});
	}

	/**
	 * RefLine för senare användning...
	 */
	function setupReferenceLine(): void
	{
		if (!referenceContainer) {
			referenceContainer = new Container();
			referenceContainer.label = 'referenceContainer';
			targetContainer.addChild(referenceContainer);
		}

		refLine = new Graphics();
		refLine.label = 'reference-line';
		referenceContainer.addChild(refLine);

		app.ticker.add(() => {
			if (isDrawingReferenceLine && refLine) {
				const startPoint = referenceContainer.getChildByLabel('ref-a');
				const endPoint = !xIsSet ? undefined : referenceContainer.getChildByLabel('ref-x');

				if (!startPoint) return;

				refLine.clear();
				refLine.beginPath();
				refLine.setStrokeStyle({
					width: 3,
					color: 0x000000,
					alpha: 0.8,
					cap: 'round',
					join: 'round'
				});

				let startPos = { x: startPoint.x, y: startPoint.y };
				let endPos;

				if (isDragging) {
					if (dragTarget?.label === 'ref-a') {
						startPos = { x: dragTarget.x, y: dragTarget.y };
						endPos = endPoint ? { x: endPoint.x, y: endPoint.y } : targetContainer.toLocal({ x: mouse.x, y: mouse.y });
					} else if (dragTarget?.label === 'ref-x') {
						endPos = { x: dragTarget.x, y: dragTarget.y };
					} else {
						endPos = endPoint ? { x: endPoint.x, y: endPoint.y } : targetContainer.toLocal({ x: mouse.x, y: mouse.y });
					}
				} else {
					endPos = endPoint ? { x: endPoint.x, y: endPoint.y } : targetContainer.toLocal({ x: mouse.x, y: mouse.y });
				}

				refLine.moveTo(startPos.x, startPos.y)
					.lineTo(endPos.x, endPos.y)
					.stroke();

				const dx = endPos.x - startPos.x;
				const dy = endPos.y - startPos.y;
				const length = Math.sqrt(dx * dx + dy * dy);
				// console.log(length.toFixed(2), targetSprite.width);
			}
		});
	}


	/**
	 *	Adderar grupper som redan finns i storen.
	 */
    async function addGroups(): Promise<void>
	{
        if (!$TargetStore) {
            applicationState = "Error: No TargetStore!";
            throw new Error('No TargetStore.');
        }

        const { groups } = $TargetStore;
        if (groups.length) {
            applicationState = `Found ${groups.length} ${groups.length > 1 ? 'groups' : 'group'}...`;
            groups.forEach(createGroup);
        }
    }

	/**
	 * Asynchronously creates a new group container and adds it to the target container.
	 * Updates the application state with the group addition process.
	 * If the group contains shots, each shot is added to the container.
	 *
	 * @param {GroupInterface} group - The group object containing an ID and optional shots.
	 */
    async function createGroup(group: GroupInterface): Promise<void>
	{
        const groupContainer = new Container();
        groupContainer.label = group.id.toString();
        groupContainers.push(groupContainer);

        applicationState = `Adding group: ${group.id + 1}`;
        targetContainer.addChild(groupContainer);

        if (group.shots?.length) {
            applicationState = `Found ${group.shots.length} ${group.shots.length > 1 ? 'shots' : 'shot'}...`;
            group.shots.forEach(({ x, y }) => addShot(x, y, group.id.toString()));
        } else {
            applicationState = `No shots in group ${group.id + 1}.`;
        }
    }

	/**
	 * Adds a shot sprite to a specified group within the target container.
	 *
	 * @param x - The x-coordinate for the shot's position.
	 * @param y - The y-coordinate for the shot's position.
	 * @param group - Optional. The label of the group to which the shot should be added.
	 *                If not provided, the active group from $TargetStore is used.
	 *
	 * @throws Error if no group is supplied and no active group is available in $TargetStore.
	 * @throws Error if the specified group does not exist in the target container.
	 *
	 * The function loads a shot texture, creates a draggable sprite, and positions it
	 * within the specified group's local coordinates. The sprite is interactive and
	 * responds to pointer events.
	 */
	async function addShot(x: number, y: number, group?: string): Promise<void>
	{
		if (!group) {
			if (!$TargetStore.activeGroup) {
				throw new Error('No activeGroup and no group supplied. Exiting.');
			}
			group = $TargetStore.activeGroup.toString();
		}

		const groupContainer = targetContainer.getChildByLabel(group);
		if (!groupContainer) { throw new Error(`Wanted group with label: ${group} but none was found!`); }

		const texture = await Assets.load('/cursors/shot.svg');
		const sprite = new Sprite(texture) as DraggableSprite;
		sprite.label = `shot-${groupContainer.label}-${groupContainer.children.length}`;
    	sprite.eventMode = 'dynamic';
    	sprite.cursor = 'pointer';
		sprite.interactive = true;
		sprite.anchor.set(0.5);
		sprite.scale = (1/targetContainer.scale.x);

		const localPos = groupContainer.toLocal({ x, y }, app.stage);
    	sprite.x = localPos.x;
    	sprite.y = localPos.y;

		sprite.on('pointerdown', (e) => handleClick(e, sprite));

		groupContainer.addChild(sprite);
		console.log(`added ${sprite.label}:`, sprite);
	}

	/**
	 * Gör fancy stuff med skit.
	 */
	function loadingDone(): void
	{
		canvasContainer.classList.remove('opacity-35');
		loader.classList.add('hidden');
	}

	/**
	 * Musklick.
	 * @param e: FederatedPointerEvent
	 * @param v: Vad klickade vi på?
	 */
	function handleClick(e: FederatedPointerEvent, target: Sprite | DraggableSprite | Container): void
	{
		// console.log(`click!`, $state.snapshot(mouse), e, target);
		if (e.button === 0) {
			console.log(`target.label: ${target.label}`)
			if (target.label.startsWith('shot-') && (mode === undefined || mode === "shots")) {
				e.stopPropagation();
				onDragStart(target as DraggableSprite, e);
				return;
			}
			if (target.label.startsWith('ref-') && (mode === "reference")) {
				e.stopPropagation();
				onDragStart(target as DraggableSprite, e);
				return;
			}
			if (target.label.startsWith('target') && mode === "reference") {
				e.stopPropagation();
				// onDragStart(target as DraggableSprite, e);
				addReferencePoint(e.globalX, e.globalY)
				return;
			}
			if (target.label === 'target' && mode === "shots") {
				if (dragTarget) { dragTarget = undefined; }
				addShot(e.globalX, e.globalY, $TargetStore.activeGroup.toString());
			}
		}
	}

	async function addReferencePoint(x: number, y: number): Promise<void>
	{
		if (!aIsSet) {
			const texture = await Assets.load('/cursors/circle-a.svg');
			const sprite = new Sprite(texture) as DraggableSprite;
			sprite.label = `ref-a`;
			sprite.eventMode = 'dynamic';
			sprite.cursor = 'pointer';
			sprite.interactive = true;
			sprite.anchor.set(0.5);
			sprite.scale = (1/targetContainer.scale.x);

			const localPos = referenceContainer.toLocal({ x, y }, app.stage);
			sprite.x = localPos.x;
			sprite.y = localPos.y;

			sprite.on('pointerdown', (e) => handleClick(e, sprite));

			referenceContainer.addChild(sprite);
			aIsSet = true;
			console.log(`added ${sprite.label}:`, sprite);
			return;
		}

		if (aIsSet && !xIsSet) {
			const texture = await Assets.load('/cursors/circle-x.svg');
			const sprite = new Sprite(texture) as DraggableSprite;
			sprite.label = `ref-x`;
			sprite.eventMode = 'dynamic';
			sprite.cursor = 'pointer';
			sprite.interactive = true;
			sprite.anchor.set(0.5);
			sprite.scale = (1/targetContainer.scale.x);

			const localPos = referenceContainer.toLocal({ x, y }, app.stage);
			sprite.x = localPos.x;
			sprite.y = localPos.y;

			sprite.on('pointerdown', (e) => handleClick(e, sprite));

			referenceContainer.addChild(sprite);
			xIsSet = true;
			console.log(`added ${sprite.label}:`, sprite);
		}
	}

	/**
	 * Initiates the drag operation for a draggable sprite.
	 *
	 * @param {DraggableSprite} target - The sprite being dragged.
	 * @param {FederatedPointerEvent} event - The pointer event triggering the drag.
	 *
	 * Sets the sprite's transparency and event mode to indicate it is being dragged.
	 * Calculates the initial drag offsets and stores the starting position.
	 * Attaches event listeners to the stage for handling drag movement and end.
	 */
	function onDragStart(target: DraggableSprite, event: FederatedPointerEvent): void
	{
		isDragging = true;
		dragTarget = target;
		dragTarget.alpha = 0.5;
		dragTarget.eventMode = 'dynamic';

		// Convert global position to local position
		const groupContainer = target.parent;
		const localPos = groupContainer.toLocal(event.global);

		dragTarget.drag = {
			dragging: true,
			data: localPos,
			offsetX: target.x - localPos.x,
			offsetY: target.y - localPos.y,
			startPosition: { x: target.x, y: target.y }
		};

		app.stage.eventMode = 'dynamic';
		app.stage.on('pointermove', onDragMove);
		app.stage.on('pointerup', onDragEnd);
		app.stage.on('pointerupoutside', onDragEnd);
	}


	/**
	 * Handles the drag movement event for a draggable target.
	 * Updates the target's position based on the global position of the pointer event.
	 *
	 * @param event - The pointer event containing the new global position.
	 */
	function onDragMove(event: FederatedPointerEvent): void
	{
		if (isDragging && dragTarget?.drag?.dragging) {
			// Convert global position to local position within the group container
			const groupContainer = dragTarget.parent;
			const newPosition = groupContainer.toLocal(event.global);
			dragTarget.x = newPosition.x;
			dragTarget.y = newPosition.y;

			if (dragTarget.label?.startsWith('ref-')) {
            	isDrawingReferenceLine = true;
				if (dragTarget.label === 'ref-a') {
					aIsMoved = true;
				}
				if (dragTarget.label === 'ref-x') {
					xIsMoved = true;
				}
        	}
		}
	}

	/**
	 * Handles the end of a drag event for a draggable target.
	 *
	 * @param event - The FederatedPointerEvent triggered when the drag ends.
	 *
	 * This function stops the dragging process by setting the isDragging flag to false,
	 * removing event listeners for 'pointermove', 'pointerup', and 'pointerupoutside'
	 * from the stage, and resetting the drag target's properties.
	 */
	function onDragEnd(event: FederatedPointerEvent): void
	{
		if (dragTarget) {
			isDragging = false;

			app.stage.off('pointermove', onDragMove);
			app.stage.off('pointerup', onDragEnd);
			app.stage.off('pointerupoutside', onDragEnd);

			dragTarget.alpha = 1;
			dragTarget.drag = null;
			dragTarget = undefined;
		}
	}


	/**
	 * Rotates the 'target' container by a specified number of degrees.
	 *
	 * @param degrees - The number of degrees to rotate the target.
	 * @param input - If true, sets the rotation directly to the given degrees; otherwise, adjusts based on previous rotation and slider value.
	 * @throws Error if no container labeled 'target' is found.
	 */
    function rotateTarget(degrees: number, input = false) {
        const targetContainer = app.stage.getChildByLabel('target');
        if (!targetContainer) throw new Error('Tried rotation but found no container labelled "target"');

        let newRotation = input ? degrees % 360 : (previousRotation + slider + degrees) % 360;
        previousRotation = newRotation - slider;

        targetContainer.rotation = newRotation * (Math.PI / 180);
        $TargetStore.target.rotation = newRotation;
    }


	/**
	 * Sets the mode to the specified value if it differs from the current mode.
	 *
	 * @param setmode - The new mode to be set. If not provided, the mode remains unchanged.
	 */
    function setMode(setmode?: string): void
	{
        if (mode !== setmode) {
            mode = setmode;
        }
    }


	function setRefMeasurement()
	{
		if (aIsSet && xIsSet && atoxInput?.value.match(/^(?!^0$)-?\d+[.,]?\d*$/i)) {
			$TargetStore.reference.measurement = parseFloat(refMeasurement);
			aIsMoved = false;
			xIsMoved = false;
			refMeasurementDirty = false;
		}
	}

	function changeUserSettings(e: Event)
	{
		let target;

		if (!e.target) { return; }

		target = e.target as HTMLInputElement;
		const setting = target.name;

		if (target.type === 'checkbox') {
			$UserSettingsStore[setting] = target.checked;
		}
		if (target.type === 'radio') {
			$UserSettingsStore[setting] = target.id === 'true' ? true : false;
		}

		console.log($UserSettingsStore);
	}

	/**
	 * Toggles the visibility of a panel associated with a button.
	 *
	 * @param e - The event triggered by user interaction.
	 * @param name - The identifier for the panel and button elements.
	 *
	 * The function checks if the event target is a button or retrieves the button
	 * by its ID. It then finds the corresponding panel by its ID and toggles its
	 * visibility. The panel's position is adjusted relative to the button's position.
	 * Logs an error if the panel cannot be found.
	 */
	// TODO: Göm andra paneler
    function showPanel(e: Event, name: string): void {
        if (!e.target) return;

        const target = e.target as Element;
        const button = target.tagName === "BUTTON"
            ? target as HTMLButtonElement
            : document.getElementById(`${name}-button`) as HTMLButtonElement;

        if (!button) return;

        const panel = document.getElementById(name);
        if (!panel) {
            console.error(`${name} couldn't be found!?`);
            return;
        }

        panel.classList.toggle('hidden');
        panel.style.top = `${button.offsetTop}px`;
        panel.style.left = `${button.offsetWidth + 4}px`;
        button.classList.toggle('bg-black/20');
    }


	$effect(() => {
		if (chromeArea) {
			canvasContainer.style.width  = `${chromeArea.x}px`;
			canvasContainer.style.height = `${chromeArea.y}px`;
		}

		if (rotation) {
			rotateTarget(rotation);
		}

		if (slider) {
			rotateTarget(rotation);
		}

		isDrawingReferenceLine = (mode === "reference" && (
			(aIsSet && !xIsSet) ||
			(aIsSet && xIsSet && isDragging)
		));

		if (aIsMoved || xIsMoved) {
			refMeasurementDirty = true;
		}

		if (mode) {
			mode === "reference" ? referenceContainer.visible = true : referenceContainer.visible = false;
		}

		if ($UserSettingsStore) {
			console.log('$UserSettingsStore changed')
			if ($UserSettingsStore.editorcrosshair && crosshairContainer) {
				crosshairContainer.visible = true;
			} else if (crosshairContainer) {
				crosshairContainer.visible = false;
			}
		}
	});

	function logDebug()
	{
		console.log('TargetStore:', $TargetStore);
		console.log('UserSettingsStore:', $UserSettingsStore);
		console.log('atoxInputMatches?:', atoxInput?.value.match(/^(?!^0$)-?\d+[.,]?\d*$/i));
		console.log('refMeasurementDirty:', refMeasurementDirty, aIsMoved, xIsMoved)
	}

	onMount(async () => {
		await getChromeArea();
		app = await initialize();

		if (app) {
			await loadStaticAssets();
			await drawTarget();
			setupReferenceLine();
			setupCrosshairs();
			applicationState = "Adding groups ... "
			await addGroups();
			applicationState = `Loading done.`
			setTimeout(() => {
				loadingDone();
			}, 300);
		};

		// mode = "reference";
	});

	onDestroy(async () => {
		if (app) {
			await Assets.unload(staticAssets)
			app.destroy(true, true);
		}
	});
</script>

<svelte:window
	onload={getChromeArea}
/>
<aside
	class="absolute grid grid-flow-row place-content-start justify-items-start z-50 top-0 left-0 h-[100vh] w-16 border-r-2 border-surface-400 bg-surface-300 "
>
	<button
		id="targetTrackerMenu"
		class="w-16 h-12 p-2 ml-2 my-4 cursor-pointer"
		onclick={() => showMainMenu = true}
	>
		<Logo
			width=36
			height=36
		/>
	</button>
	<div id="tools" class="grid grid-flow-row">
		<hr class="max-w-[70%] ml-[15%] opacity-40"/>
		<button
			title="Set reference"
			id="reference-button"
			onclick={(e) => {mode === "reference" ? setMode(undefined) : setMode("reference"); showPanel(e, "reference")}}
			class="{mode === "reference" ? 'bg-black/20' : ''} w-16 h-12 mt-2 cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center"
		>
			<LucideRuler
				color="#000"
				class="pointer-events-none"
			/>
		</button>

		<button
			title="Set point of aim"
			disabled={ refMeasurementDirty ? true : false }
			onclick={() => {mode === "poa" ? setMode(undefined) : setMode("poa"); }}
			class="{mode === "poa" ? 'bg-black/20' : ''} w-16 h-12 cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center"
		>
			<LucideLocateFixed
				color="#000"
				class="pointer-events-none"
			/>
		</button>

		<button
			title={ refMeasurementDirty ? 'Set reference points first' : 'Set point of aim' }
			disabled={ refMeasurementDirty ? true : false }
			onclick={() => {mode === "shots" ? setMode(undefined) : setMode("shots"); }}
			class="{mode === "shots" ? 'bg-black/20' : ''} w-16 h-12 cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center"
		>
			<LucideLocate
				color="#000"
				class="pointer-events-none"
			/>
		</button>

		<hr class="max-w-[70%] ml-[15%] opacity-40 mt-3"/>

		<button
			class="w-16 h-12 cursor-pointer mt-3 hover:bg-gradient-radial from-white/20 justify-items-center"
			title="Rotate target"
			id="rotate-button"
			onclick={(e) => { showPanel(e, "rotate") }}
		>
			<LucideRefreshCcw
				size="20"
				color="#000"
				class="pointer-events-none"
			/>
		</button>

		<hr class="max-w-[70%] ml-[15%] opacity-40 mt-3"/>

		<button
			class="w-16 h-12 mt-3 cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center"
			title="Settings"
			id="settings-button"
			onclick={(e) => { showPanel(e, "settings") }}
		>
			<SlidersHorizontal
				size="20"
				color="#000"
				class="pointer-events-none"
			/>
		</button>
	</div>

	<button
		class="w-16 h-12 mt-12 cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center"
		title="Debug"
		id="debug-button"
		onclick={(e) => { /*showPanel(e, "settings")*/ logDebug() }}
	>
		<LucideBug
			size="20"
			color="#000"
			class="pointer-events-none"
		/>
	</button>
</aside>

<!-- panels -->
<div id="rotate" class="absolute z-50 grid grid-rows-[auto_1fr_auto] grid-flow-row pb-0 space-y-0 bg-slate-400 w-64 max-w-64 hidden">
    <div id="header" class="w-full py-2 px-4 text-xs text-black h-8 place-items-center leading-0 uppercase grid grid-cols-2">
        <p class="tracking-widest pointer-events-none justify-self-start">Rotation</p>
        <p class="justify-self-end">
            <LucideX size="14" class="cursor-pointer" onclick={ (e) => showPanel(e, "rotate") } />
        </p>
    </div>
    <div class="pt-4">
        <button id="rotate-left" class="btn ml-4 preset-filled align-middle" onclick={() => rotateTarget(-90)}>
            <LucideRotateCcwSquare color="#000" />
        </button>

        <input
            type="text"
            size="3"
            placeholder={`${$TargetStore.target.rotation?.toString()}`}
            value="{$TargetStore.target.rotation?.toString()}"
            class="w-[8ch] text-center rounded bg-white/80 border-0 text-black text-sm mx-2 pl-4 p-2 align-middle justify-self-center"
			onkeyup={
				(e) => {
					setTimeout(() => {
						let target = e.target as HTMLInputElement; rotateTarget(parseFloat(target.value), true)
					}, 500)
				}
			}
        />

        <button id="rotate-left" class="btn preset-filled align-middle mr-4" onclick={() => rotateTarget(90)}>
            <LucideRotateCwSquare color="#000" />
        </button>
    </div>
    <div class="pt-2 w-full mt-2 px-4 pb-2 place-self-start">
        <input type="range" step="0.1" min="-45" max="45" bind:value={slider} class="slider w-full" id="myRange">
    </div>
</div>

<div id="reference" class="absolute z-50 grid grid-rows-[auto_1fr_auto] grid-flow-row pb-0 space-y-0 bg-slate-400 shadow-md left-11 top-10 w-64 max-w-64 hidden">
	<div id="header" class="w-full bg-slate-600 py-2 px-4 text-xs h-10 place-items-center leading-0 uppercase grid grid-cols-2">
		<p class="tracking-widest pointer-events-none justify-self-start whitespace-nowrap">Reference points</p>
		<p class="justify-self-end">
			<LucideX size="14" class="cursor-pointer" onclick={(e) => showPanel(e, "reference") } />
		</p>
	</div>
	<div class="p-4">
		<label for="atoxInput" class="text-sm text-body-color-dark"></label>
		<div class="grid grid-cols[1fr_1fr] grid-flow-col">
			<div class="input-group text-xs divide-primary-200-800 grid-cols-[auto_1fr_auto] divide-x text-body-color-dark bg-white">
				<div class="input-group-cell preset-tonal-primary">A &rArr; X</div>
				<input type="text" id="atoxInput" bind:this={atoxInput} class="bg-white text-xs" bind:value={refMeasurement} pattern={`^(?!^0$)-?\d+[.,]?\d*$`}>
				<div class="input-group-cell preset-tonal-primary">{#if $UserSettingsStore.isometrics}cm{:else}in{/if}</div>
			</div>
			{#if !refMeasurementDirty}
				<div class="z-30 absolute right-[7.75rem] mt-2 text-green-700"><LucideCheck size=20/></div>
			{/if}
			<button
				class="rounded btn-md bg-primary-200-800 ml-2 text-sm uppercase"
				disabled={aIsSet && xIsSet && refMeasurement.match(/^(?!^0$)-?\d+[.,]?\d*$/i) ? false : true}
				onclick={setRefMeasurement}
			>Set</button>
		</div>
		<div class="italic text-sm text-body-color-dark/70 mt-2" style="line-height: 14px;">
			Tip: You can change measurement units in <a href="##" class="anchor underline">the settings panel</a>.
		</div>
	</div>
</div>

<div id="settings" class="absolute z-50 grid grid-rows-[auto_1fr_auto] grid-flow-row pb-0 space-y-0 bg-slate-400 w-64 max-w-64 hidden">
    <div id="header" class="w-full py-2 px-4 text-xs text-black h-8 place-items-center leading-0 uppercase grid grid-cols-2">
        <p class="tracking-widest pointer-events-none justify-self-start">Settings</p>
        <p class="justify-self-end">
            <LucideX size="14" class="cursor-pointer" onclick={(e) => showPanel(e, "settings")} />
        </p>
    </div>
	<form id="settingsForm" bind:this={settingsForm}>
		<div class="p-4 mb-8 grid grid-flow-row gap-y-2">
			<div class="text-sm text-primary-950">
				<input type="checkbox" class="checkbox mr-2" id="cursortips" name="cursortips" checked={$UserSettingsStore.cursortips} onchange={(e) => changeUserSettings(e)} />
				<label for="cursortips" class="text-sm">Show tips at cursor.</label>
			</div>
			<div class="text-sm text-primary-950">
				Units: <input type="radio" name="isometrics" id="true" checked={$UserSettingsStore.isometrics === true} class="ml-2 mr-1" onchange={(e) => changeUserSettings(e)} /><label for="metric">Metric</label>
				<input type="radio" name="isometrics" id="false" checked={$UserSettingsStore.isometrics === false} class="ml-2 mr-1" onchange={(e) => changeUserSettings(e)}/><label for="imperial">Imperial</label>
			</div>
			<div class="text-sm text-primary-950">
				Angle: <input type="radio" name="mils" id="true" checked={$UserSettingsStore.mils === true} class="ml-2 mr-1" onchange={(e) => changeUserSettings(e)} /><label for="metric">Mils</label>
				<input type="radio" name="mils" id="false" checked={$UserSettingsStore.mils === false} class="ml-2 mr-1" onchange={(e) => changeUserSettings(e)}/><label for="imperial">Minute</label>
			</div>
			<div class="text-sm text-primary-950">
				<input type="checkbox" class="checkbox mr-2" name="showallshots" id="showallshots" checked={$UserSettingsStore.showallshots} onchange={(e) => changeUserSettings(e)}/>
				<label for="showallshots" class="text-sm">Show shots from all groups.</label>
			</div>
			<div class="text-sm text-primary-950">
				<input type="checkbox" class="checkbox mr-2" name="editorcrosshair" id="editorcrosshair" checked={$UserSettingsStore.editorcrosshair} onchange={(e) => changeUserSettings(e)}/>
				<label for="editorcrosshair" class="text-sm">Show editor crosshairs.</label>
			</div>
		</div>
	</form>
</div>

<!-- followcursor -->
{#if mode === "reference" && $UserSettingsStore.cursortips}
	<div class="absolute p-2 bg-black/70 max-w-40 text-xs font-white z-40 pointer-events-none" style="top: {mouse.y + 20}px; left: {mouse.x + 20}px">
		{#if !aIsSet}
			Set start point.
		{:else if !xIsSet}
			Set end point.
		{:else}
			Adjust points if necessary then enter the length and press Set.
		{/if}
	</div>
{/if}

<!-- canvas -->
<div
	role="application"
	aria-roledescription="The funny thing is that if you can't see properly, why would you use this service? Anyways, compliance is bliss!"
	bind:this={canvasContainer}
	onmousemove={mousePosition}
	class="relative grid justify-items-center align-middle place-content-center opacity-35"
></div>
<div bind:this={loader} class="z-50 transition-all top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-center absolute py-6 px-8 w-72 max-w-screen-sm rounded border-2 border-surface-500 bg-surface-300 text-surface-100 shadow-lg">{applicationState}</div>
