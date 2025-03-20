// src/lib/utils/editor/dragHandler.ts
import { EditorStore, type EditorStoreInterface } from '@/stores/EditorStore';
import { TargetStore, type GroupInterface, type TargetStoreInterface } from '@/stores/TargetImageStore';
import { UserSettingsStore, type SettingsInterface } from '@/stores/UserSettingsStore';
import { MetricsRenderer } from './MetricsRenderer';
import type { FederatedPointerEvent } from 'pixi.js';
import { Container, Sprite, Graphics } from 'pixi.js';
import { get } from 'svelte/store';
import { GroupManager } from './groupManager';
import { getAllChildren } from './editorUtils';

export class DragHandler {
    private targetContainer: Container;
    private editorStore: EditorStoreInterface;
    private targetStore: TargetStoreInterface;
    private userSettings: SettingsInterface;
    private groupManager: GroupManager;
    private metricsRenderer: MetricsRenderer;

    private isDragging: boolean = false;
    private dragTarget: Sprite | null = null;
    private dragStartPosition: {x: number, y: number} | null = null;

    private userSettingsUnsubscribe: () => void;
    private targetStoreUnsubscribe: () => void;
 
    constructor(targetContainer: Container) {
        this.targetContainer = targetContainer;

        this.editorStore = get(EditorStore);
        this.targetStore = get(TargetStore);
        this.userSettings = get(UserSettingsStore);
        this.groupManager = new GroupManager(targetContainer);
        this.metricsRenderer = new MetricsRenderer(targetContainer);
        
        type Point = {x: number, y: number};

        this.targetStoreUnsubscribe = TargetStore.subscribe((store) => {
            this.targetStore = store;
        });

        this.userSettingsUnsubscribe = UserSettingsStore.subscribe((settings) => {
            this.userSettings = settings;
        });
    }

    public destroy() {
        if (this.userSettingsUnsubscribe) {
            this.userSettingsUnsubscribe();
        }
        if (this.targetStoreUnsubscribe) {
            this.targetStoreUnsubscribe();
        }
    }


    public handleSpriteDrag(e: FederatedPointerEvent): void
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

    public handleDragMove(e: FederatedPointerEvent): void
    {
        if (!this.isDragging || !this.dragTarget) return;

        const newPosition = this.targetContainer.toLocal(e.global);
        this.dragTarget.x = newPosition.x;
        this.dragTarget.y = newPosition.y;

        console.log(`Finished dragging ${this.dragTarget.label}`);
    }

    public handleDragEnd(e: FederatedPointerEvent): void
    {
        if (!this.isDragging || !this.dragTarget) return;

        let id;
        if (this.dragTarget.label.startsWith('shot')) {
            const match = this.dragTarget.label.match(/^shot-(\d+)-(\d+)$/i);
            if (!match) { 
                console.error(`dragTarget label => id failed!`); 
                return; 
            }
            
            // Get the actual shot ID from the label
            id = match[1];
            const groupId = parseInt(match[2]);

            console.log(`handleDragEnd`, `shotId: ${id}` );
            TargetStore.updateShot(id, groupId, this.dragTarget.x, this.dragTarget.y);
        } else if (this.dragTarget.label.startsWith('poa')) {
            id = this.dragTarget.label.match(/^poa-(\d+)$/i)?.[1];
            if (!id) { console.error(`dragTarget label => id failed!`); return; }
            TargetStore.updatePoa(parseInt(id), this.dragTarget.x, this.dragTarget.y)
        }

        this.isDragging = false;
        this.dragTarget = null;
        this.dragStartPosition = null;

        this.targetContainer.off('pointermove', this.handleDragMove.bind(this));
        this.targetContainer.off('pointerup', this.handleDragEnd.bind(this));
        this.targetContainer.off('pointerupoutside', this.handleDragEnd.bind(this));

        this.metricsRenderer.drawAllMetrics();
    }
}