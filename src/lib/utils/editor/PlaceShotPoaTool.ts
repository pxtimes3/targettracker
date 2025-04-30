// src/lib/utils/editor/placeshotpoatool.ts
import { EditorStore, type EditorStoreInterface } from '@/stores/EditorStore';
import { TargetStore, type GroupInterface, type TargetStoreInterface } from '@/stores/TargetImageStore';
import { UserSettingsStore, type SettingsInterface } from '@/stores/UserSettingsStore';
import { MetricsRenderer } from './MetricsRenderer';
import type { FederatedPointerEvent } from 'pixi.js';
import { Container, Sprite, Graphics } from 'pixi.js';
import { get } from 'svelte/store';
import { DragHandler } from './DragHandler';
import { ShotManager } from './ShotManager';
import { GroupManager } from './GroupManager';
import { initialize } from '@/utils/target';

export class ShotPoaTool {
    private targetContainer: Container;
    private targetStore: TargetStoreInterface;
    private editorStore: EditorStoreInterface;
    private userSettings: SettingsInterface;
    private metricsRenderer: MetricsRenderer;
    private groupManager: GroupManager;
    private dragHandler: DragHandler;
    private shotManager: ShotManager;
    
    private isSelected: boolean = false;
    private userSettingsUnsubscribe: () => void;
    private targetStoreUnsubscribe: () => void;
    private editorStoreUnsubscribe: () => void;

    constructor(targetContainer: Container) {
        this.targetContainer = targetContainer;
        
        this.metricsRenderer = new MetricsRenderer(targetContainer);
        this.dragHandler = new DragHandler(targetContainer);
        this.groupManager = new GroupManager(targetContainer);
        this.shotManager = new ShotManager(targetContainer, this.groupManager, this.metricsRenderer, this.dragHandler);
        
        this.editorStore = get(EditorStore);
        this.targetStore = get(TargetStore);
        this.userSettings = get(UserSettingsStore);

        type Point = {x: number, y: number};

        this.targetStoreUnsubscribe = TargetStore.subscribe((store) => {
            this.targetStore = store;
        });

        this.editorStoreUnsubscribe = TargetStore.subscribe((store) => {
            this.targetStore = store;
        });

        this.userSettingsUnsubscribe = UserSettingsStore.subscribe((settings) => {
             // console.log('Settings updated:', settings);
            this.userSettings = settings;
            this.metricsRenderer.drawAllMetrics();
        });

        this.initialize();
    }

    public destroy() {
        if (this.userSettingsUnsubscribe) {
            this.userSettingsUnsubscribe();
        }
        if (this.targetStoreUnsubscribe) {
            this.targetStoreUnsubscribe();
        }
    }

    public initialize(): void
    {
        // check localstorage for 
    }

    public async addShot(x: number, y: number, group: string): Promise<void>
    {
        if(this.editorStore.mode == 'shots') {
            const shot = await this.shotManager.addShot(x, y, group);
            this.metricsRenderer.drawAllMetrics(parseInt(group));
        }
    }

    public async addPoa(x: number, y: number, group: string): Promise<void>
    {
        if(this.editorStore.mode == 'poa') {
            const poa = await this.shotManager.addPoa(x, y, group);
            this.metricsRenderer.drawAllMetrics(parseInt(group));
        }
    }

    public async drawAllMetrics(group?: GroupInterface): Promise<void>
    {
        this.metricsRenderer.drawAllMetrics(group?.id);
    }
    
    public async createGroup(): Promise<{group: GroupInterface, container: Container} | null>
    {
        return this.groupManager.createGroup();
    }

    public async assignSelectedShotsToGroup(): Promise<void>
    {
        // not used
    }

    // private async getGroupContainer(label: string): Promise<Container|null>
    // {
    //     return this.targetContainer.getChildByLabel(label);
    // }

    private get getShotsTotal(): number
    {
        return this.targetContainer.getChildrenByLabel(/^shot-/i, true).length || 0;
    }

    public isReferenceSet(): boolean {
        return !!(
            this.targetStore.reference.measurement &&
            this.targetStore.reference.linelength &&
            this.targetStore.reference.a &&
            this.targetStore.reference.x
        );
    }  
}
