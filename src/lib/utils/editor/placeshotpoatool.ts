import { EditorStore, type EditorStoreInterface } from '@/stores/EditorStore';
import { TargetStore, type TargetStoreInterface } from '@/stores/TargetImageStore';
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
    private dragStartPosition: {x: number, y: number} = {x:0, y:0};

    constructor(targetContainer: Container) {
        this.targetContainer = targetContainer;
        this.editorStore = get(EditorStore);
        this.targetStore = get(TargetStore);
        this.texturePath = '/cursors/shot.svg';
    }

    public async addShot(x: number, y: number, group: string): Promise<void>
    {
        const label = `shot-${this.getShotsTotal}-${group}`;
        const shot = await this.createSprite(label);
        const groupContainer = await this.getGroupContainer(group);
        const position = this.targetContainer.toLocal({x,y});

        shot.position.set(position.x, position.y);
        shot.scale.set(this.setScale())

        groupContainer?.addChild(shot);

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
        poa.scale.set(1 / (1 / this.targetContainer.scale.x));

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

    private async createSprite(
        label: string,
        texturePath: string = this.texturePath,
    ): Promise<Sprite>
    {
        const texture = await Assets.load(this.texturePath);
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

        this.targetContainer.eventMode = 'dynamic';
        this.targetContainer.on('pointermove', this.handleDragMove.bind(this));
        this.targetContainer.on('pointerup', this.handleDragEnd.bind(this));
        this.targetContainer.on('pointerupoutside', this.handleDragEnd.bind(this));
    }

    private handleDragMove(e: FederatedPointerEvent): void
    {

    }

    private handleDragEnd(e: FederatedPointerEvent): void
    {

    }

    private addShotToTargetStore(): void
    {
        
    }
}
