import type { Application, Container, FederatedPointerEvent } from "pixi.js";
import { ShotPoaTool } from "./PlaceShotPoaTool";
import { TargetRenderer } from "./TargetRenderer";
import { ReferenceTool } from "./ReferenceTool";
import { EditorCrosshair } from "./EditorCrosshair";
import { TargetStore, type TargetStoreInterface } from '../../stores/TargetImageStore';
import { EditorStore, type EditorStoreInterface } from '../../stores/EditorStore';

export class TargetInteractionManager {
    // Methods: setupInteractivity, handleMouseDown, handleDragStart, etc.
    public  targetContainer: Container;
    public  app: Application;
    public  shotPoaTool: ShotPoaTool;
    public  referenceTool: ReferenceTool;
    public  editorCrosshair: EditorCrosshair;
    public  chromeArea: {x: number, y: number} = {x:0, y:0};
    public  scale: number = 1;
    public  isDragging: boolean = false;
    public  dragStartPosition: {x: number, y: number}|null = {x: 0, y: 0};
    public  dragStartMousePosition: {x: number, y: number}|null = {x: 0, y: 0};
    private targetRenderer: TargetRenderer;
    private targetStore!: TargetStoreInterface;
    private editorStore!: EditorStoreInterface;
    private editorStoreUnsubscribe: () => void;
    private targetStoreUnsubscribe: () => void;

    constructor(
        targetRenderer: TargetRenderer,
        targetContainer: Container,
        targetRendererApp: Application,
        shotPoaTool: ShotPoaTool,
        referenceTool: ReferenceTool,
        editorCrosshair: EditorCrosshair
    ) {
        this.targetRenderer = targetRenderer;
        this.targetContainer = targetContainer;
        this.app = targetRendererApp;
        this.shotPoaTool = shotPoaTool;
        this.referenceTool = referenceTool;
        this.editorCrosshair = editorCrosshair;

        // Stores
        this.targetStoreUnsubscribe = TargetStore.subscribe((store) => {
            this.targetStore = store;
        });
        this.editorStoreUnsubscribe = EditorStore.subscribe(value => {
            this.editorStore = value;
        });
    }

    public setupInteractivity(): void
    {
        this.targetContainer.eventMode = 'dynamic';
        this.targetContainer.cursor = 'default';

        // this.selectionTool = new SelectionTool(this.targetContainer, this.app);

        this.targetContainer.on('pointerdown', this.handleMouseDown.bind(this));
        this.targetContainer.on('pointermove', this.handleDragMove.bind(this));
        this.targetContainer.on('pointerup', this.handleDragEnd.bind(this));
        this.targetContainer.on('pointerupoutside', this.handleDragEnd.bind(this));
        this.targetContainer.on('wheel', this.handleWheel.bind(this));
    }

    public handleResize(): void
    {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
            // console.log(`Handle resize. Window: ${width}:${height}`);
        this.app.renderer.resize(width, height);
        
        // Update chromeArea to match
        this.chromeArea.x = width;
        this.chromeArea.y = height;
        
        this.targetRenderer.updateScale();
        this.targetRenderer.centerTarget();
    }

    public handleWheel(e: WheelEvent): void
    {
        const zoomBoundaries = [0.25, 3.0];
        const zoomStep = 0.1;

        const currentScale = this.targetContainer.scale.x;
        let newScale = currentScale + (e.deltaY > 0 ? -zoomStep : zoomStep);

        if (newScale >= zoomBoundaries[0] && newScale <= zoomBoundaries[1]) {
            this.scale = newScale;
            this.targetContainer.scale.set(this.scale);
            // console.log(`Scale is now: ${this.scale}`);
            this.shotPoaTool.drawAllMetrics();
        }
    }
    
    public handleMouseDown(e: FederatedPointerEvent): void
    {
        // console.log('mousedown',e)
        if (e.button === 1) {
            this.handleDragStart(e);
        // } else if (e.shiftKey) {
        //     this.selectionTool.isSelecting = true;
        //     this.selecting = true;
        //     this.selectionTool.onSelectionStart(e);
        //     return
        } else if (e.button === 0) {
            if (['shots', 'none'].includes(this.editorStore.mode))
                this.shotPoaTool.addShot(e.clientX, e.clientY, '1');
            if (this.editorStore.mode === 'poa')
                this.shotPoaTool.addPoa(e.clientX, e.clientY, '1');
            if (this.editorStore.mode === 'reference')
                this.referenceTool.addReferencePoint(e.clientX, e.clientY);
        }
    }

    public handleDragStart(e: FederatedPointerEvent): void
    {
        if (e.button !== 1) return;

        this.targetContainer.cursor = 'grab';
        this.isDragging = true;

        this.dragStartPosition = {
            x: this.targetContainer.x,
            y: this.targetContainer.y
        };

        this.dragStartMousePosition = {
            x: e.global.x,
            y: e.global.y
        };
    }

    public handleDragMove(e: FederatedPointerEvent): void
    {
        // if (this.selecting) {
        //     this.selectionTool.onSelectionMove(e);
        //     return;
        // }

        this.editorCrosshair.position = {x: e.globalX, y: e.globalY}

        if (!this.isDragging || !this.dragStartPosition || !this.dragStartMousePosition) return;

        const dx = e.global.x - this.dragStartMousePosition.x;
        const dy = e.global.y - this.dragStartMousePosition.y;

        this.targetContainer.x = this.dragStartPosition.x + dx;
        this.targetContainer.y = this.dragStartPosition.y + dy;
    }

    public handleDragEnd(e: FederatedPointerEvent): void
    {
        // if (this.selecting) {
        //     this.selectionTool.onSelectionEnd(e);
        //     this.selecting = false;
        // }

        this.targetContainer.cursor = 'crosshair';
        this.isDragging = false;
        this.dragStartPosition = null;
        this.dragStartMousePosition = null;
    }
}