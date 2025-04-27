// src/lib/utils/editor/dragHandler.ts
import { EditorStore, type EditorStoreInterface } from '@/stores/EditorStore';
import { TargetStore, type GroupInterface, type TargetStoreInterface } from '@/stores/TargetImageStore';
import { UserSettingsStore, type SettingsInterface } from '@/stores/UserSettingsStore';
import { MetricsRenderer } from './MetricsRenderer';
import type { FederatedPointerEvent } from 'pixi.js';
import { Container, Sprite, Graphics } from 'pixi.js';
import { get } from 'svelte/store';
import { GroupManager } from './GroupManager';
import { getAllChildren } from './EditorUtils';

export class DragHandler {
    public targetContainer: Container;
    public editorStore: EditorStoreInterface;
    public targetStore: TargetStoreInterface;
    public userSettings: SettingsInterface;
    public groupManager: GroupManager;
    public metricsRenderer: MetricsRenderer;

    public isDragging: boolean = false;
    public dragTarget: Sprite | null = null;
    public dragStartPosition: {x: number, y: number} | null = null;
    public boundHandleDragEnd;
    public boundHandleDragMove;

    public userSettingsUnsubscribe: () => void;
    public targetStoreUnsubscribe: () => void;
 
    constructor(
        targetContainer: Container,
        groupManager?: GroupManager,
        metricsRenderer?: MetricsRenderer
    ) {
        this.targetContainer = targetContainer;

        this.editorStore = get(EditorStore);
        this.targetStore = get(TargetStore);
        this.userSettings = get(UserSettingsStore);
        this.groupManager = groupManager || new GroupManager(targetContainer);
        this.metricsRenderer = metricsRenderer || new MetricsRenderer(targetContainer);
        
        type Point = {x: number, y: number};

        this.boundHandleDragMove = this.handleDragMove.bind(this);
        this.boundHandleDragEnd = this.handleDragEnd.bind(this);

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

        // console.log(`Dragging ${target.label}`)

        this.targetContainer.eventMode = 'dynamic';
        this.targetContainer.on('pointermove', this.boundHandleDragMove);
        this.targetContainer.on('pointerup', this.boundHandleDragEnd);
        this.targetContainer.on('pointerupoutside', this.boundHandleDragEnd);
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
    
        try {
            if (this.dragTarget.label.startsWith('shot')) {
                const match = this.dragTarget.label.match(/^shot-(\d+)-(\d+)$/i);
                if (!match) { 
                    console.error('Matching failed!');
                    return; 
                }
                
                const shotId = match[1];
                const groupId = parseInt(match[2]);
                TargetStore.updateShot(shotId, groupId, this.dragTarget.x, this.dragTarget.y);
            } else if (this.dragTarget.label.startsWith('poa')) {
                const match = this.dragTarget.label.match(/^poa-(\d+)$/i);
                if (!match) {
                    console.error('Matching failed!');
                    return;
                }
                
                const groupId = parseInt(match[1]);
                TargetStore.updatePoa(groupId, this.dragTarget.x, this.dragTarget.y);
            }
        } finally {
            this.targetContainer.off('pointermove', this.boundHandleDragMove);
            this.targetContainer.off('pointerup', this.boundHandleDragEnd);
            this.targetContainer.off('pointerupoutside', this.boundHandleDragEnd);
            
            // Reset
            this.isDragging = false;
            this.dragTarget = null;
            this.dragStartPosition = null;
            
            this.metricsRenderer.drawAllMetrics();
        }
    }
}