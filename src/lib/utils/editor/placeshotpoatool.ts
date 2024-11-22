// TODO: PlaceShotPoaTool.ts - Unit testing.
// TODO: PlaceShotPoaTool.ts - Integrationstester.
import { EditorStore, type EditorStoreInterface } from '@/stores/EditorStore';
import { TargetStore, type GroupInterface, type TargetStoreInterface } from '@/stores/TargetImageStore';
import type { FederatedPointerEvent } from 'pixi.js';
import { Assets, Container, Sprite } from 'pixi.js';
import { get } from 'svelte/store';

export class ShotPoaTool {
    private targetContainer: Container;
    private editorStore: EditorStoreInterface;
    private targetStore: TargetStoreInterface;
    private texturePath: string;
    private isDragging: boolean = false;
    private dragTarget: Sprite | null = null;
    private dragStartPosition: {x: number, y: number} | null = null;
    private isSelected: boolean = false;

    constructor(targetContainer: Container) {
        this.targetContainer = targetContainer;
        this.editorStore = get(EditorStore);
        this.targetStore = get(TargetStore);
        this.texturePath = '/cursors/shot.svg';
    }

    public async addShot(x: number, y: number, group: string): Promise<void>
    {
        const label = `shot-${this.getShotsTotal + 1}-${group}`;
        const shot = await this.createSprite(label);
        const groupContainer = await this.getGroupContainer(group);
        const position = this.targetContainer.toLocal({x,y});

        shot.position.set(position.x, position.y);
        shot.scale.set(this.setScale());
        shot.width = 32 * (1 / this.targetContainer.scale.x);
        shot.height = shot.width;

        groupContainer?.addChild(shot);

        const storeGroup = this.targetStore.groups.find((g) => g.id === parseInt(group));
        if (!storeGroup) { console.error(`Tried to add shot to group ${group} in targetStore but no such group was found!`); return; }

        let shots = storeGroup.shots;
        if (!shots) {
            console.error(`Tried to add shot to ${storeGroup.shots} but failed!`);
            return;
        }

        shots.push({
            id: this.getShotsTotal.toString(),
            group: parseInt(group),
            x: position.x,
            y: position.y,
            score: 0,
        });

        console.log(this.targetStore.groups)

        shot.on('pointerdown', (e) => {
            e.stopPropagation();
            this.handleSpriteDrag(e);
        });
    }

    public async addPoa(x: number, y: number, group: string): Promise<void>
    {
        const label = `poa-${group}`;
        const poa = await this.createSprite(label, '/cursors/poa.svg');
        const groupContainer = await this.getGroupContainer(group);
        const position = this.targetContainer.toLocal({x,y});

        poa.position.set(position.x, position.y)
        poa.scale.set(24 / (1 / this.targetContainer.scale.x));

        groupContainer?.addChild(poa);

        poa.on('pointerdown', (e) => {
            e.stopPropagation();
            this.handleSpriteDrag(e);
        });
    }

    public setScale(scale: number = 1)
    {
        return scale / this.targetContainer.scale.x;
    }

    public createGroup(): {group: GroupInterface, container: Container} | null
    {
        const newGroup: GroupInterface = {
            id: this.targetStore.groups.length + 1,
            shots: [],
            poa: {x: 0, y: 0},
            metrics: {},
            score: 0,
        };

        let groupContainer: Container;

        try {
            this.targetStore.groups.push(newGroup);
        } catch (e) {
            // TODO: Logging.
            throw new Error(`Failed to push new group to store!`);
        }

        try {
            groupContainer = new Container();
            groupContainer.label = newGroup.id.toString();

            console.log(`Creating group: ${newGroup.id} ${groupContainer.uid}`);
            this.targetContainer.addChild(groupContainer);

            return { group: newGroup, container: groupContainer }
        } catch (e) {
            // TODO: Logging.
            console.error(`Failed to create new group!`, e);
            return null;
        }
    }

    public removeGroup(id: string): void|undefined
    {
        if (this.targetStore.groups.length === 1) {
            console.warn(`Tried to remove the one group that exists. Exiting.`);
            return;
        }

        let group = this.targetStore.groups.findIndex((g) => g.id === parseInt(id));
        if (group === -1) {
            console.error(`No such group (${id}) in targetStore.`);
            return;
        }

        let container = this.targetContainer.getChildByLabel(id);
        if (!container) {
            console.error(`No such groupContainer (${id}) in targetContainer.`);
            return;
        }

        container.removeChildren();
        this.targetContainer.removeChild(container);
        this.targetStore.groups.splice(group, 1);
        this.targetStore.activeGroup = this.targetStore.groups.length;

        console.log(`ActiveGroup is now ${this.targetStore.activeGroup}.`);
    }

    public get getCurrentGroupContainer(): Container
    {
        let storedCurrentGroup = this.targetStore.activeGroup;
        const currentGroupContainer = this.targetContainer.getChildByLabel(storedCurrentGroup.toString());

        if (!currentGroupContainer) throw new Error(`Tried to get currentGroup but no currentgroup existed in targetContainer!`);

        return currentGroupContainer;
    }

    private async createSprite(
        label: string,
        texturePath: string = this.texturePath,
    ): Promise<Sprite>
    {
        const texture = await Assets.load(texturePath);
        const sprite = new Sprite(texture);

        sprite.label = label;
        sprite.eventMode = 'dynamic';
        sprite.cursor = 'pointer';
        sprite.interactive = true;
        sprite.anchor.set(0.5);
        sprite.scale.set(1 / this.targetContainer.scale.x);

        return sprite;
    }

    private async getGroupContainer(label: string): Promise<Container|null>
    {
        return this.targetContainer.getChildByLabel(label);
    }

    private get getShotsTotal(): number
    {
        return this.targetContainer.getChildrenByLabel(/^shot-/i, true).length || 0;
    }

    private handleSpriteDrag(e: FederatedPointerEvent): void
    {
        const target = e.currentTarget as Sprite;
        this.isDragging = true;
        this.dragTarget = target;
        this.dragStartPosition = { x: target.x, y: target.y};

        console.log(`Dragging ${target.label}`)

        this.targetContainer.eventMode = 'dynamic';
        this.targetContainer.on('pointermove', this.handleDragMove.bind(this));
        this.targetContainer.on('pointerup', this.handleDragEnd.bind(this));
        this.targetContainer.on('pointerupoutside', this.handleDragEnd.bind(this));
    }

    private handleDragMove(e: FederatedPointerEvent): void
    {
        if (!this.isDragging || !this.dragTarget) return;

        const newPosition = this.targetContainer.toLocal(e.global);
        this.dragTarget.x = newPosition.x;
        this.dragTarget.y = newPosition.y;
    }

    private handleDragEnd(e: FederatedPointerEvent): void
    {
        if (!this.isDragging || !this.dragTarget) return;

        const id = this.dragTarget.label.match(/^shot-(\d+)-\d+$/i)?.[1];
        if (!id) { console.error(`dragTarget label => id failed!`); return; }

        TargetStore.updateShot(id, parseInt(this.dragTarget.parent.label), this.dragTarget.x, this.dragTarget.y);

        this.isDragging = false;
        this.dragTarget = null;
        this.dragStartPosition = null;
        
        this.targetContainer.off('pointermove', this.handleDragMove.bind(this));
        this.targetContainer.off('pointerup', this.handleDragEnd.bind(this));
        this.targetContainer.off('pointerupoutside', this.handleDragEnd.bind(this));
    }
}
