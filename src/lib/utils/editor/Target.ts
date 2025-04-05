// src/lib/utils/editor/target.ts
import { EditorStore, type EditorStoreInterface } from '@/stores/EditorStore';
import { TargetStore, type TargetStoreInterface } from '@/stores/TargetImageStore';
import { ShotPoaTool } from '@/utils/editor/PlaceShotPoaTool';
import { Container, Sprite, type ALPHA_MODES } from 'pixi.js';
import { ReferenceTool } from './ReferenceTool';
import { SelectionTool } from './selectiontool';
import { EditorCrosshair } from './EditorCrosshair';
import { TargetInteractionManager } from './TargetInteractionManager';
import { TargetAssetManager } from './TargetAssetManager';
import { TargetRenderer } from './TargetRenderer';
import { TargetAnalysisProcessor } from './TargetAnalysisProcessor';
import type { AnalysisResult } from '@/types/editor';
import type { Application as ApplicationType, Container as ContainerType, FederatedPointerEvent, Renderer as RendererType, Sprite as SpriteType } from 'pixi.js';


export class Target {
    public targetAssetManager: TargetAssetManager;
    public targetRenderer!: TargetRenderer;
    public targetInteractionManager!: TargetInteractionManager;
    public targetAnalysisProcessor!: TargetAnalysisProcessor;
    public app!: ApplicationType<RendererType>;
    public targetContainer!: ContainerType;
    public targetSprite!: SpriteType;
    public shotPoaTool!: ShotPoaTool;
    public referenceTool!: ReferenceTool;
    public selectionTool!: SelectionTool;
    public crosshairs!: EditorCrosshair;
    public editorStore!: EditorStoreInterface;
    public targetStore!: TargetStoreInterface;
    public scale: number;
    public selecting: boolean = false;
    public currentAngle: number = 0;
    public sliderAngle: number = 0;
    public staticAssets: string[];
    public chromeArea: { x: number, y: number };
    public originalWidth!: number;
    public originalHeight!: number;
    public isDragging: boolean = false;
    public dragStartPosition: { x: number; y: number } | null = null;
    public dragStartMousePosition: { x: number; y: number } | null = null;
    public dark: boolean = false;
    public editorStoreUnsubscribe: () => void;
    public targetStoreUnsubscribe: () => void;

    constructor(
        chromeArea: { x: number, y: number }, 
        staticAssets: string[],
        testStore?: TargetStoreInterface
    ) {
        this.chromeArea = chromeArea;
        this.staticAssets = staticAssets;
        this.scale = 1;
        
        // Stores
        if (testStore) {
            // For testing
            this.targetStore = testStore;
            this.targetStoreUnsubscribe = () => {};
        } else {
            this.targetStoreUnsubscribe = TargetStore.subscribe((store) => {
                this.targetStore = store;
            });
        };

        this.editorStoreUnsubscribe = EditorStore.subscribe(value => {
            this.editorStore = value;
        });

        this.targetAssetManager = new TargetAssetManager(staticAssets, this.targetStore);
    }

    public async initialize(canvasContainer: HTMLDivElement, setApplicationState: (state: string) => void): Promise<void> 
    {
        try {
            setApplicationState('Initializing application...');
            
            // Initialize renderer first
            this.targetRenderer = new TargetRenderer(this.targetStore, this.targetAssetManager);
            await this.targetRenderer.initialize(canvasContainer, setApplicationState);
            
            // Now we have access to the container and app
            this.crosshairs = new EditorCrosshair(this.targetRenderer.targetContainer, this.targetRenderer.app);
            this.shotPoaTool = new ShotPoaTool(this.targetRenderer.targetContainer);
            this.referenceTool = new ReferenceTool(this.targetRenderer.targetContainer);
            
            // Now initialize interaction manager with all required components
            this.targetInteractionManager = new TargetInteractionManager(
                this.targetRenderer,
                this.targetRenderer.targetContainer,
                this.targetRenderer.app,
                this.shotPoaTool,
                this.referenceTool,
                this.crosshairs
            );
            
            // Call setupInteractivity here after initialization
            this.targetInteractionManager.setupInteractivity();
            
            // Initialize analysis processor
            this.targetAnalysisProcessor = new TargetAnalysisProcessor(this.targetStore, this.shotPoaTool, this.targetRenderer.targetContainer);
            
            // Set initial rotation
            if (this.targetStore.target.rotation) {
                this.targetRenderer.rotateTarget(this.targetStore.target.rotation, { absolute: true });
            }
            
            setApplicationState('Done!');
        } catch (error) {
            setApplicationState(`Error: ${(error as Error).message || 'Unknown error'}`);
            throw error;
        }
    }
   
    public async loadAssets(): Promise<void> 
    {
        this.targetAssetManager.loadAssets();
    }

    public async initializeAnalysis(userId: string): Promise<void> {
        this.targetAnalysisProcessor.initializeAnalysis(userId);
    }

    public async fetchAnalysis(userId: string): Promise<AnalysisResult|undefined>
    {
        return await this.targetAnalysisProcessor.fetchAnalysis(userId);
    }

    public async processAnalysisResults(analysis: any) 
    {
        await this.targetAnalysisProcessor.processAnalysisResults(analysis);
    }

    public handleResize(): void
    {
        this.targetRenderer.handleResize();
    }

    public rotateTarget(degrees: number = 0, options: { 
        reset?: boolean, 
        slider?: number, 
        absolute?: boolean 
    } = {}) {
        const { reset, slider, absolute } = options;
        this.targetRenderer.rotateTarget(degrees, options);
    }

    public get getApp(): ApplicationType<RendererType> {
        return this.targetRenderer.app;
    }

    public setupInteractivity(): void
    {
        this.targetInteractionManager.setupInteractivity();
    }

    public handleWheel(e: WheelEvent): void
    {
        this.targetInteractionManager.handleWheel(e);
    }

    public handleMouseDown(e: FederatedPointerEvent): void
    {
        this.targetInteractionManager.handleMouseDown(e);
    }

    public handleDragStart(e: FederatedPointerEvent): void
    {
        this.targetInteractionManager.handleDragStart(e);
    }

    public handleDragMove(e: FederatedPointerEvent): void
    {
        this.targetInteractionManager.handleDragMove(e);
    }

    public handleDragEnd(e: FederatedPointerEvent): void
    {
        this.targetInteractionManager.handleDragEnd(e);
    }

    public setRefMeasurement()
    {
        this.referenceTool.setRefMeasurement();
    }

    

    public get getContainer(): Container 
    {
        return this.targetContainer;
    }

    public get getSprite(): Sprite 
    {
        return this.targetSprite;
    }

    public get getScale(): number 
    {
        return this.scale;
    }

    public destroy(): void 
    {
        this.app.destroy(true, true);
        this.targetContainer.removeAllListeners();
        if (this.targetStoreUnsubscribe) this.targetStoreUnsubscribe();
        if (this.editorStoreUnsubscribe) this.editorStoreUnsubscribe();
    }


    // Toggla drag etc. via mode
    // Kanske någon gång behövs. Låt stå.
    //
    // private enableDragging(): void
    // {
    //     this.targetContainer.eventMode = 'dynamic';
    //     this.targetContainer.cursor = 'move';
    // }

    // private disableDragging(): void
    // {
    //     this.targetContainer.eventMode = 'none';
    //     this.targetContainer.cursor = 'default';
    // }

    // public setMode(mode: 'drag' | 'shots' | 'poa' | 'reference'): void
    // {
    //     switch (mode) {
    //         case 'drag':
    //             this.enableDragging();
    //             break;
    //         case 'shots':
    //             this.disableDragging();
    //             break;
    //         case 'poa':
    //             this.disableDragging();
    //             break;
    //         case 'reference':
    //             this.disableDragging();
    //             break;
    //     }
    // }
}
