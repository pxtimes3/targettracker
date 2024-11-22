<script lang="ts">
	/**
	 * TODO: Lyft ut addShot till egen klass (shottool.ts?)
	 * TODO: Lyft ut grupphanteringen till en egen klass.
	 * TODO: Lyft ut crosshairs och
	 * TODO: Scoring.
	 * TODO: Add firearm.
	 * TODO: Add ammunition.
	 * TODO: Add weather data.
	 * TODO: Save.
	 * TODO: Unit Tests @ src/routes/pixi/page.svelte
	 */
	import { browser } from '$app/environment';
	import Logo from '@/components/logo/logo.svelte';
	import { activePanel, EditorStore } from '@/stores/EditorStore';
	import { TargetStore, type GroupInterface } from '@/stores/TargetImageStore';
	import { UserSettingsStore } from '@/stores/UserSettingsStore';
	import { ReferenceTool } from '@/utils/editor/referencetool';
	import { SelectionTool } from '@/utils/editor/selectiontool';
	import { fetchAnalysis, initialize } from '@/utils/target';
	import type { UUID } from 'crypto';
	import { LucideBug, LucideCheck, LucideLocate, LucideLocateFixed, LucideRefreshCcw, LucideRotateCcwSquare, LucideRotateCwSquare, LucideRuler, LucideTarget, LucideX, SlidersHorizontal } from 'lucide-svelte';
	import type { ContainerChild, FederatedPointerEvent, Container as PixiContainer, Sprite as PixiSprite, Point, Renderer } from 'pixi.js';
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

	interface DraggableContainer extends PixiContainer {
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
	let mouse: {[key: string]: number; x: number, y:number} = $state({x:0, y:0});
	let mouseStart: {[key: string]: number; x: number, y:number} = $state({x:0, y:0});
	let chromeArea: {[key: string]: number; x: number; y: number;} = $state({x:0, y:0});
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

	let targetContainer: DraggableContainer;
	let groupContainers: Container[] = $state([]);
	let referenceContainer: Container;
	let crosshairContainer: Container;
	let scale: number = $state(0);
	let isDragging: boolean = $state(false);
	let dragTarget: DraggableSprite|undefined|DraggableContainer = undefined;
	let showMainMenu: boolean = $state(false);

	let rotation: number = $state(0);
	let previousRotation: number = $state(0);
	let slider: number = $state(0);

	let aIsSet: boolean = $state(false);
	let aIsMoved: boolean = $state(true);
	let xIsSet: boolean = $state(false);
	let xIsMoved: boolean = $state(true);
	let refLine: Graphics|undefined;
	let refLineLength: number = $state(0);
	let isDrawingReferenceLine: boolean = $state(false);
	let refMeasurement: string = $state('0');
	let refMeasurementDirty: boolean = $state(true);
	let refMeasurementComplete: boolean = $state(false);
	let atoxInput: HTMLInputElement|undefined = $state();
	let referenceTool: ReferenceTool|undefined = $state();

	let settingsForm: HTMLFormElement;

	let selected: Array<DraggableSprite | Sprite | Container<ContainerChild>> = $state([]);
	let assignToGroupSelect: HTMLSelectElement|undefined = $state();
	let selectionTool: SelectionTool;

	const zoomBoundaries = [0.25, 3.0];
	const zoomStep = 0.1;

	/**
	 * Laddar med $TargetStore.target.image.filename osv...
	 */
	async function initializeApp() {
		app = await initialize(
			chromeArea,
			canvasContainer,
			(state) => applicationState = state,
			(assets) => staticAssets = assets,
			staticAssets,
			$TargetStore
		);
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
	async function drawTarget(e?: Event): Promise<void>
	{
		applicationState = "Drawing target... ";

		const targetPath = `/temp/${$TargetStore.target.image.filename}`;
		const texture = await Assets.load(targetPath);
		texture.source.scaleMode = 'linear';

		targetSprite = new Sprite(texture);
		targetSprite.label = 'targetSprite';

		targetContainer = new Container({isRenderGroup: true});
		app.stage.addChild(targetContainer);

		targetContainer.label = 'targetContainer';
		targetContainer.eventMode = 'dynamic';
		targetContainer.on('pointerdown', (e) => handleClick(e, targetContainer));

		targetContainer.addChild(targetSprite);
		targetContainer.width = targetSprite.width;
		targetContainer.height = targetSprite.height;

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

		// update targetStore if dimensions differ
		$TargetStore.target.image.originalsize[0] != targetSprite.width  ? $TargetStore.target.image.originalsize[0] = targetSprite.width  : '';
		$TargetStore.target.image.originalsize[1] != targetSprite.height ? $TargetStore.target.image.originalsize[1] = targetSprite.height : '';
	}


	/**
	 * Skapar sprites för editor-crosshair.
	 * TODO: Följer inte med vid drag.
	 */
	function setupCrosshairs()
	{
		crosshairContainer = new Container();
		crosshairContainer.label = 'crosshairContainer';

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
					width: 2 * (1/scale),
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
					width: 2 * (1/scale),
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
					width: 2 * (1/scale),
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
					width: 2 * (1/scale),
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
            applicationState = `Found ${groups.length} ${groups.length > 1 ? 'groups' : 'group'} in targetStore...`;
			console.log(`Found ${groups.length} ${groups.length > 1 ? 'groups' : 'group'} in targetStore...`);

            groups.forEach((group) => {
				if (!targetContainer.getChildrenByLabel(group.id.toString())) {
					createGroup(group);
				} else {
					group.shots?.forEach((shot) => {
						addShot(shot.x, shot.y, group.id.toString());
					});
				}
			});
        }
    }

	/**
	 * Asynchronously creates a new group container and adds it to the target container.
	 * Updates the application state with the group addition process.
	 * If the group contains shots, each shot is added to the container.
	 *
	 * @param {GroupInterface} group - The group object containing an ID and optional shots.
	 */
    async function createGroup(group: GroupInterface): Promise<Container>
	{
		const groupContainer = new Container();
        groupContainer.label = group.id.toString();
        groupContainers.push(groupContainer);

        applicationState = `Creating group: ${group.id + 1}`;
		console.log(`Creating group: ${group.id} ${groupContainer.uid}`);
        targetContainer.addChild(groupContainer);

        if (group.shots?.length) {
            applicationState = `Found ${group.shots.length} ${group.shots.length > 1 ? 'shots' : 'shot'}...`;
            group.shots.forEach(({ x, y }) => addShot(x, y, group.id.toString()));
        } else {
            applicationState = `No shots in group ${group.id + 1}.`;
        }

		return groupContainer;
    }

	/**
	 * Assigns selected shots to either a new or existing group container.
	 * Creates a new group if "createNew" is selected, otherwise adds shots to specified group.
	 * Updates shot labels to match their new group assignment.
	 * @throws {Error} Logs error if target group is not found
	 */
	function assignSelectedShotsToGroup(): void
	{
		let newGroup: Container|null|undefined;

		if (!assignToGroupSelect || !assignToGroupSelect.value) return;

		console.log(assignToGroupSelect.value);

		if (assignToGroupSelect.value === "createNew") {
			newGroup = new Container();
			newGroup.label = (groupContainers.length + 1).toString();
			targetContainer.addChild(newGroup);
			groupContainers.push(newGroup);
			console.log(`adding to newGroup: ${newGroup?.label}`);
		} else {
			newGroup = targetContainer.getChildByLabel(assignToGroupSelect.value);
			console.log(`adding to existing: ${newGroup?.label}`);
		}


		if (!newGroup) {
			console.error(`Was supposed to assign to group ${assignToGroupSelect.value} but no such group was found!`);
			return;
		}

		selected.forEach((shot) => {
			newGroup.addChild(shot);
			shot.label = shot.label.replace(/\d+$/, `${newGroup.label}`);
		});
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
		console.log(`function addShot called to add shot at position ${x}:${y} in group ${group}`)
		if (!group) {
			if ($TargetStore.activeGroup) {
				console.log(`TargetStore has active group ${$TargetStore.activeGroup}`);
				group = $TargetStore.activeGroup.toString();
			} else {
				group = '1';
				console.log(`TargetStore has no active group ${$TargetStore.activeGroup}`);
				$TargetStore.activeGroup = parseInt(group);
			}
		}

		let groupContainer = targetContainer.getChildByLabel(group.toString().trim());
		if (!groupContainer) {
			console.log(`Wanted group with label: ${group} but none was found! Creating group with label: ${group}`);
			showChildren(targetContainer);
			groupContainer = await createGroup({id: parseInt(group)});
		}

		const texture = await Assets.load('/cursors/shot.svg');
		const shot = new Sprite(texture) as DraggableSprite;
		shot.label = `shot-${groupContainer.children.length}-${groupContainer.label}`;
    	shot.eventMode = 'dynamic';
    	shot.cursor = 'pointer';
		shot.interactive = true;
		shot.anchor.set(0.5);
		// shot.scale = 1 * (1/scale);
		if (!$TargetStore.target.caliberInMm) {
			// console.log('caliber in px',TargetStore.mmToPx(4.5))
			// sätt till 4.5mm
			shot.width = TargetStore.mmToPx(4.5);
			shot.height = shot.width;
			// lägg in en varning i editorstore
			if ($EditorStore.warnings && !$EditorStore.warnings?.find((w) => w.id === 'caliber')) {
				const newWarning = [...$EditorStore.warnings, {
					id: 'caliber',
					message: 'Set caliber in the info-panel to have the cursors display at the correct size.'
				}];
				EditorStore.set({...$EditorStore, warnings: newWarning });
			}
		} else {
			console.log(`set! ${$TargetStore.target.caliberInMm} in px`,TargetStore.mmToPx($TargetStore.target.caliberInMm))
			shot.width = TargetStore.mmToPx($TargetStore.target.caliberInMm) / 10;
			shot.height = shot.width;
		}

		const localPos = groupContainer.toLocal({ x, y }, app.stage);
    	shot.x = localPos.x;
    	shot.y = localPos.y;

		shot.on('pointerdown', (e) => handleClick(e, shot));

		groupContainer.addChild(shot);
		console.log(`added shot ${shot.label} to group ${groupContainer.label}`);
	}

	/**
	 * Adds a Point of Attention (PoA) sprite to a specified group within the target container.
	 *
	 * @param x - The x-coordinate for the PoA sprite's position.
	 * @param y - The y-coordinate for the PoA sprite's position.
	 * @param group - Optional. The label of the group to which the PoA should be added. Defaults to the active group in the TargetStore.
	 * @throws Will throw an error if no active group is found or if the specified group does not exist.
	 * @returns A promise that resolves when the PoA sprite is successfully added.
	 *
	 * The function checks if the group already contains a PoA sprite and logs a warning if so.
	 * It loads a texture for the PoA sprite, sets its properties, and positions it within the group container.
	 * The sprite is made interactive and listens for pointer down events to handle clicks.
	 */
    async function addPoa(x: number, y: number, group?: string): Promise<void> {
        group = group || $TargetStore.activeGroup?.toString();
        if (!group) {
            throw new Error('No activeGroup and no group supplied. Exiting.');
        }

        const groupContainer = targetContainer.getChildByLabel(group);
        if (!groupContainer) {
            throw new Error(`Wanted group with label: ${group} but none was found!`);
        }

        if (groupContainer.getChildByLabel(`poa-${groupContainer.label}`)) {
            console.warn('Group already has a PoA set.');
            return;
        }

        const texture = await Assets.load('/cursors/poa.svg');
        const sprite = new Sprite(texture) as DraggableSprite;
        sprite.label = `poa-${groupContainer.label}`;
        sprite.eventMode = 'dynamic';
        sprite.cursor = 'pointer';
        sprite.interactive = true;
        sprite.anchor.set(0.5);

        const localPos = groupContainer.toLocal({ x, y }, app.stage);
        sprite.x = localPos.x;
        sprite.y = localPos.y;

        sprite.on('pointerdown', (e) => handleClick(e, sprite));

        groupContainer.addChild(sprite);
        // console.log(`added ${sprite.label}:`, sprite);
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
	 * Handles the wheel event to zoom in or out on the target container.
	 *
	 * Adjusts the scale of the target container based on the wheel event's deltaY value,
	 * ensuring the new scale remains within defined zoom boundaries.
	 *
	 * @param e - The wheel event containing the deltaY value for zooming.
	 */
    function handleWheel(e: WheelEvent): void {
		if (!targetContainer) return;

		// Prevent any default scrolling behavior
		e.preventDefault();

		// Get the current scale (considering the current transformation)
		const currentScale = targetContainer.scale.x;  // or targetContainer.scale since x and y should be the same

		// Calculate new scale
		let newScale = currentScale;
		newScale += e.deltaY > 0 ? -zoomStep : zoomStep;

		// Check boundaries
		if (newScale >= zoomBoundaries[0] && newScale <= zoomBoundaries[1]) {
			scale = newScale;
			targetContainer.scale.set(scale);
		}
	}

	/**
	 * Musklick.
	 * @param e: FederatedPointerEvent
	 */
	function handleClick(e: FederatedPointerEvent, target: Sprite | DraggableSprite | Container): void
	{
		console.log(`click!`, e.button, e.buttons, $state.snapshot(mouse), e, target);
		mouseStart = mouse;

		if (e.button === 0) {
			if (target.label.startsWith('shot-')) {
				e.stopPropagation();

				if (selected.includes(target) && e.shiftKey) {
					const idx = selected.findIndex((sp) => sp === target);
					selected.splice(idx, 1);
				} else if (!selected.includes(target) && !e.shiftKey) {
					// töm selected
					selected = [];
					selected.push(target);
				} else if (!selected.includes(target) && e.shiftKey) {
					selected.push(target);
				} else if (selected.includes(target) && !e.shiftKey) {
					selected = [];
					selected.push(target);
				}

				onDragStart(target as DraggableSprite, e);
				return;
			}
			if (target.label.startsWith('target') && mode === "reference") {
				e.stopPropagation();
				referenceTool?.addReferencePoint(e.globalX, e.globalY);
				return;
			}
			if (target.label.startsWith('poa-')) {
				e.stopPropagation();
				onDragStart(target as DraggableSprite, e);
				return;
			}
			if (target.label.startsWith('ref-')) {
				console.log(`click on ref-point`);
				e.stopPropagation();
				onDragStart(target as DraggableSprite, e);
				return;
			}

			if (target.label === 'target') {
				// töm selected
				selected = [];

				if (dragTarget) { dragTarget = undefined; }
				if (mode === "shots") {
					addShot(e.globalX, e.globalY, $TargetStore.activeGroup.toString());
				} else if (mode === "poa") {
					addPoa(e.globalX, e.globalY, $TargetStore.activeGroup.toString());
				}
				return;
			}
		}

		// middleclick
		if (e.button === 1) {
			e.stopPropagation();
			e.preventDefault();

			if (target.label === 'target') {
				dragTarget = targetContainer;
				onDragStart(targetContainer as DraggableContainer, e);
				return;
			}

			if (target.label.startsWith('shot-')) {
				e.preventDefault();
				e.stopPropagation();

				removeShot(target);
			}
		}
	}


	function removeShot(target: DraggableSprite | Sprite | Container<ContainerChild>): void
	{
		try {
			target.parent.removeChild(target) || new Error('Failed to remove shot!');
		} catch (error) {
			console.error('Failed to remove shot!', target, error);
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
	function onDragStart(target: DraggableSprite|DraggableContainer, e: FederatedPointerEvent): void
	{
		isDragging = true;
		dragTarget = target;
		// dragTarget.alpha = 0.5;
		dragTarget.eventMode = 'dynamic';

		// global position => local position
		const groupContainer = target.parent;
		const localPos = groupContainer.toLocal(e.global);

		dragTarget.drag = {
			dragging: true,
			data: localPos,
			offsetX: 0,
			offsetY: 0,
			startPosition: { x: target.x, y: target.y }
		};

		mouseStart = mouse;

		if (dragTarget != targetContainer) {
			dragTarget.drag.offsetX = target.x - localPos.x;
			dragTarget.drag.offsetY = target.y - localPos.y;
		}

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
	function onDragMove(e: FederatedPointerEvent): void
	{
		if (isDragging && dragTarget?.drag?.dragging) {
			// Convert global position to local position within the group container
			const groupContainer = dragTarget.parent;
			const newPosition = groupContainer.toLocal(e.global);
			if (dragTarget === targetContainer) {
				dragTarget.x = dragTarget.drag.startPosition.x + (e.clientX - mouseStart.x);
				dragTarget.y = dragTarget.drag.startPosition.y + (e.clientY - mouseStart.y);
				return;
			} else {
				dragTarget.x = newPosition.x;
				dragTarget.y = newPosition.y;
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
		if (dragTarget && isDragging) {
			isDragging = false;

			app.stage.off('pointermove', onDragMove);
			app.stage.off('pointerup', onDragEnd);
			app.stage.off('pointerupoutside', onDragEnd);

			// dragTarget.alpha = 1;
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


    /**
     * Sets reference measurement values in the target store if validation passes.
     * Converts decimal separators and updates measurement and line length references.
     */
    function setRefMeasurement(): void
	{
        referenceTool?.setRefMeasurement(refMeasurement);
    }


    /**
     * Updates user settings based on form input changes
     * @param {Event} e - The change event from the form input
     */
    function changeUserSettings(e: Event): void
	{
        const target = e.target as HTMLInputElement;
        if (!target) return;

        const setting = target.name;

        $UserSettingsStore[setting] = target.type === 'checkbox'
            ? target.checked
            : target.id === 'true';

        // TODO: Push to DB
        // console.log($UserSettingsStore);
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
	// TODO: Store för active button => css-klass active eller något.
    function showPanel(e: Event, name: string): void
	{
		if (e.type != 'load' && !e.target) return;

		let button;
		let target;

		if (e.type === 'load') {
			button = document.getElementById(`${name}-button`) as HTMLButtonElement;
		} else {
			target = e.target as Element;
			button = target.tagName === "BUTTON"
				? target as HTMLButtonElement
				: document.getElementById(`${name}-button`) as HTMLButtonElement;

			if (!button) return;
		}

		const panel = document.getElementById(`${name}-panel`);
		if (!panel) {
			console.error(`${name} couldn't be found!?`);
			return;
		}

		panel.classList.toggle('hidden');
		panel.style.top = `${button.offsetTop}px`;
		panel.style.left = `${button.offsetWidth + 4}px`;

		// Hide other panels
		if (!panel.classList.contains('hidden')) {
			document.querySelectorAll("div[id$='-panel']").forEach((p) => {
				if (p.id != panel.id) {
					p.classList.add('hidden');
				}
			});
		}
	}


	function handleResize(e?: Event): void
	{
		if (!app) return;

		if (e?.target) {
			const target = e.target as Window;
			chromeArea.x = target.innerWidth;
			chromeArea.y = target.innerHeight;
		} else {
			chromeArea.x = window.innerWidth;
			chromeArea.y = window.innerHeight;
		}

		app.renderer.resize(chromeArea.x, chromeArea.y);

		if (targetContainer) {
			scale = Math.min(
				(window.innerHeight - 100) / targetSprite.height,
				(window.innerWidth - 100) / targetSprite.width
			);

			targetContainer.scale.set(scale);

			targetContainer.x = app.screen.width / 2;
			targetContainer.y = app.screen.height / 2;
		}
	}


	function converTopLeftCoordinates(x:number, y:number): Point
	{
		return targetContainer.toGlobal({x, y});
	}

	function showChildren(parent: Container, indent = 0) {
		if (indent === 0) {
			console.log(`${'-'.repeat(indent)}label: ${parent.label}, uid: ${parent.uid}, parent: ${parent.parent?.label || parent.parent?.uid || '-'}`);
		}

		if (parent.children.length > 0) {
			parent.children.forEach((child) => {
				let string = `${'-'.repeat(indent)}label: ${child.label}, uid: ${child.uid}, parent: ${parent.parent?.label || parent.parent?.uid || '-'}`;
				console.log(string, child);
				if (child.children.length > 0) {
					showChildren(child, indent + 1);
				}
			});
		}
	}

	function logDebug()
	{
		console.log('TargetStore:', $TargetStore);
		console.log('UserSettingsStore:', $UserSettingsStore);
		console.log('EditorStore:', $EditorStore);
		console.log('---');
		console.log(`Mode: ${mode}`);
		// showChildren(app.stage);

	}

	onMount(async () => {
		await getChromeArea();
		await initializeApp();

		if (app) {
			await loadStaticAssets();
			await drawTarget();
			try {
				if (data.user?.id && $TargetStore.target.image.filename) {
					const res = await fetchAnalysis(data.user.id as UUID, $TargetStore.target.image.filename);
					if (res && res.predictions?.length > 0) {
						console.log(res.count)
						res.predictions.forEach((pred) => {
							const coords = converTopLeftCoordinates(pred.xy[0], pred.xy[1]);
							addShot(coords.x, coords.y, '1');
						});
					}
				}
			} catch (error) {
				console.error('Failed to fetch analysis:', error);
			}

			// setupReferenceLine();
			setupCrosshairs();
			applicationState = "Adding groups ... "
			await addGroups();

			// selection check... -.-
			app.ticker.add(() => {
				if (selected) {
					// console.log(tick++)
					const shots = targetContainer.getChildrenByLabel(/shot-\d-\d/i, true);
					shots.forEach((shot) => { selected.includes(shot) ? shot.alpha = 0.5 : shot.alpha = 1 })
				}
			});

			applicationState = `Loading done.`
			setTimeout(() => {
				loadingDone();
			}, 300);
		};

		if (app && targetContainer) {
            selectionTool = new SelectionTool(targetContainer);
			referenceTool = new ReferenceTool(targetContainer);

            window.addEventListener('shotsSelected', ((event: CustomEvent) => {
                const selectedShots = event.detail.shots;
                selected = selectedShots;
            }) as EventListener);

			window.addEventListener('referenceMeasurementSet', () => {
				if (!referenceTool) {
					throw new Error(`Couldn't initialize ReferenceTool!`);
				}
				refMeasurementDirty = referenceTool.isDirty;
				refMeasurementComplete = referenceTool.isComplete;
			});
        }

		// TODO: Check om det redan är en påbörjad tavla.
		// 		 If groups.length > 0?
		// mode = "reference";
		// showPanel(new Event('load'), "reference");
	});

	onDestroy(async () => {
		if (app) {
			await Assets.unload(staticAssets)
			app.destroy(true, true);
		}

		if (selectionTool) {
            selectionTool.destroy();
        }

		if (referenceTool) {
			referenceTool.destroy();
		}

		if (browser) {
        	window.removeEventListener('shotsSelected', () => {});
			window.removeEventListener('referenceMeasurementSet', () => {});
		}
	});

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

		if (mode) {
			referenceTool?.setVisible(mode === "reference");
		}

		if ($UserSettingsStore) {
			if ($UserSettingsStore.editorcrosshair && crosshairContainer) {
				crosshairContainer.visible = true;
			} else if (crosshairContainer) {
				crosshairContainer.visible = false;
			}
		}

		if ($EditorStore) {
			// console.log(`EditorStore updated.`, $EditorStore)
		}
	});
</script>

<svelte:window
	onload={getChromeArea}
	onresize={handleResize}
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
			title="Target information"
			id="targetinfo-button"
			onclick={ (e) => {$activePanel = "info-panel";}  }
			class="w-16 h-12 mt-2 cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center"
		>
			<LucideTarget
				color="#000"
				class="pointer-events-none"
			/>
		</button>

		<button
			title="Set reference"
			id="reference-button"
			onclick={ (e) => {mode === "reference" ? setMode(undefined) : setMode("reference"); $activePanel="reference-panel" }}
			class="w-16 h-12 cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center"
		>
			<LucideRuler
				color="#000"
				class="pointer-events-none"
			/>
		</button>

		<button
			title={ refMeasurementComplete ? 'Set reference points first' : 'Set point of aim' }
			id="poa-button"
			disabled={ refMeasurementComplete ? false : true }
			onclick={() => {mode === "poa" ? setMode(undefined) : setMode("poa"); }}
			class="w-16 h-12 cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center"
		>
			<LucideLocateFixed
				color="#000"
				class="pointer-events-none"
			/>
		</button>

		<button
			id="shots-button"
			title={ refMeasurementComplete ? 'Set reference points first' : 'Place shots' }
			disabled={ refMeasurementComplete ? false : true }
			onclick={() => {mode === "shots" ? setMode(undefined) : setMode("shots"); }}
			class="w-16 h-12 cursor-pointer hover:bg-gradient-radial from-white/20 justify-items-center"
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
			onclick={ (e) => { showPanel(e, "rotate"); setMode("rotate"); $activePanel="rotate-panel"; }}
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
			onclick={ (e) => { showPanel(e, "settings"); setMode("settings"); $activePanel='settings-panel' }}
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
<div id="rotate-panel" class="absolute z-50 {$activePanel === 'info-panel' ? 'grid' : 'hidden' }  grid-rows-[auto_1fr_auto] grid-flow-row pb-0 space-y-0 bg-slate-400 w-64 max-w-64">
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

<div id="reference-panel" class="absolute z-50 {$activePanel === 'reference-panel' ? 'grid' : 'hidden' }  grid-rows-[auto_1fr_auto] grid-flow-row pb-0 space-y-0 bg-slate-400 shadow-md left-11 top-10 w-64 max-w-64">
	<div id="header" class="w-full bg-slate-600 py-2 px-4 text-xs h-10 place-items-center leading-0 uppercase grid grid-cols-2">
		<p class="tracking-widest pointer-events-none justify-self-start whitespace-nowrap">Reference points</p>
		<p class="justify-self-end">
			<LucideX size="14" class="cursor-pointer" onclick={(e) => { $activePanel = ''; }} />
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

					onclick={setRefMeasurement}
				>Set</button>

		</div>
		<div class="italic text-sm text-body-color-dark/70 mt-2" style="line-height: 14px;">
			Tip: You can change measurement units in <a href="##" class="anchor underline">the settings panel</a>.
		</div>
	</div>
</div>

<div id="settings-panel" class="absolute z-50 {$activePanel === 'info-panel' ? 'grid' : 'hidden' }  grid-rows-[auto_1fr_auto] grid-flow-row pb-0 space-y-0 bg-slate-400 w-64 max-w-64">
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

<div id="info-panel" class="absolute z-50 {$activePanel === 'info-panel' ? 'grid' : 'hidden' } grid-rows-[auto_1fr_auto] grid-flow-row pb-0 space-y-0 bg-slate-400 w-64 max-w-64">
    <div id="header" class="w-full py-2 px-4 text-xs text-black h-8 place-items-center leading-0 uppercase grid grid-cols-2">
        <p class="tracking-widest pointer-events-none justify-self-start whitespace-nowrap">Target information</p>
        <p class="justify-self-end">
            <LucideX size="14" class="cursor-pointer" onclick={(e) => showPanel(e, "settings")} />
        </p>
    </div>
	<div class="p-4 mb-8 grid grid-flow-row gap-y-2">
		<div class="text-sm text-primary-950">
			Name
		</div>
		<div class="text-sm text-primary-950">
			Type
		</div>
		<div class="text-sm text-primary-950">
			Note
		</div>
		<div class="text-sm text-primary-950">
			Firearm
		</div>
		<div class="text-sm text-primary-950">
			Ammunition
		</div>
		<div class="text-sm text-primary-950">
			Weather data:
		</div>
	</div>
</div>

<!-- followcursor -->
{#if mode === "reference" && $UserSettingsStore.cursortips}
	<div class="absolute p-2 bg-black/70 max-w-40 text-xs font-white z-40 pointer-events-none" style="top: {mouse.y + 20}px; left: {mouse.x + 20}px">
		{#if !aIsSet}
			Set start point.
		{:else if !xIsSet}
			Set end point.
		{:else if referenceTool?.isDirty}
			Adjust points if necessary then enter the length and press Set.
		{:else}
			All set! Now add point of aim (required for scoring) or start placing shots on the target.
		{/if}
	</div>
{/if}

{#if Array.isArray($EditorStore.warnings) && $EditorStore.warnings.length > 0}
	<div class="z-[100] absolute right-10 bottom-10 bg-slate-400 p-4 text-sm">
		Warnings:
		{#each $EditorStore.warnings as warning}
			<p>{warning.message}</p>
		{/each}
	</div>
{/if}

<div class="absolute z-50 top-2 right-2 text-black">
	<div
		class="grid grid-cols-1 grid-flow-row"
	>
		{#if selected.length > 0}
			<div class="col-span-2">
				{selected.length === 1 ? `${selected.length} shot` : `${selected.length} shots`} selected.
			</div>


			{#if groupContainers && groupContainers.length > 0}
				<div class="grid grid-cols-2">
					<select name="assignToGroupSelect" id="assignToGroupSelect" bind:this={assignToGroupSelect}>
						<option value={null} selected>Assign selected to group:</option>
						{#each groupContainers as group}
							<option value={group.label}>Group {group.label} {group.uid}</option>
						{/each}
						<option value="createNew">Add to new group</option>
					</select>
					<button
						onclick={ (e) => assignSelectedShotsToGroup() }
					>
						Go
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- canvas -->
<div
	role="application"
	aria-roledescription="The funny thing is that if you can't see properly, why would you use this service? Anyways, compliance is bliss!"
	bind:this={canvasContainer}
	onmousemove={mousePosition}
	onwheel={handleWheel}
	class="relative grid justify-items-center align-middle place-content-center opacity-35 w-[100vw] h-[100vh]"
></div>
<div bind:this={loader} class="z-50 transition-all top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-center absolute py-6 px-8 w-72 max-w-screen-sm rounded border-2 border-surface-500 bg-surface-300 text-surface-100 shadow-lg">{applicationState}</div>
