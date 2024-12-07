// TODO: Rotation.
// TODO: Cursor verkar inte funka.
// TODO: Unit testing.

import { deserialize } from '$app/forms';
import { EditorStore, type EditorStoreInterface } from '@/stores/EditorStore';
import { TargetStore, type TargetStoreInterface } from '@/stores/TargetImageStore';
import { ShotPoaTool } from '@/utils/editor/placeshotpoatool';
import type { Application as ApplicationType, Container as ContainerType, FederatedPointerEvent, Renderer as RendererType, Sprite as SpriteType } from 'pixi.js';
import { Application, Assets, Container, Sprite } from 'pixi.js';
import { get } from 'svelte/store';
import { ReferenceTool } from './referencetool';
import { SelectionTool } from './selectiontool';
import { EditorCrosshair } from './crosshairs';

interface ActionSuccess {
    type: 'success';
    status: number;
    data: Array<{
        id: string;
        submitted: string;
        updated: string;
        user_id: string;
        image_name: string;
        result: string;
        error: null;
    }>;
}

interface ActionFailure {
    type: 'failure';
    status: number;
    data: {
        error: string;
    };
}

type ActionResponse = ActionSuccess | ActionFailure;

interface AnalysisResult {
    predictions: Array<{
		[x: string]: any;
        x: number;
        y: number;
        group?: string;
    }>;
    count: number;
}

export class Target {
    public app!: ApplicationType<RendererType>;
    private targetContainer!: ContainerType;
    private targetSprite!: SpriteType;
    private shotPoaTool!: ShotPoaTool;
    private referenceTool!: ReferenceTool;
    private selectionTool!: SelectionTool;
    public  crosshairs!: EditorCrosshair;
    private store: TargetStoreInterface;
    private editorStore!: EditorStoreInterface;
    private targetStore: TargetStoreInterface;
    private scale: number;
    public  selecting: boolean = false;
    public  currentAngle: number = 0;
    public  sliderAngle: number = 0;
    private staticAssets: string[];
    private chromeArea: { x: number, y: number };
    private originalWidth!: number;
    private originalHeight!: number;
    private isDragging: boolean = false;
    private dragStartPosition: { x: number; y: number } | null = null;
    private dragStartMousePosition: { x: number; y: number } | null = null;

    constructor(chromeArea: { x: number, y: number }, staticAssets: string[]) {
        this.chromeArea = chromeArea;
        this.staticAssets = staticAssets;
        this.store = get(TargetStore);
        EditorStore.subscribe(value => {
            this.editorStore = value;
        });
        this.targetStore = get(TargetStore);
        this.scale = 1;
    }

    public async initialize(
        canvasContainer: HTMLDivElement,
        setApplicationState: (state: string) => void
    ): Promise<void> {
        setApplicationState('Initializing application...');

        // Initialize PIXI Application
        this.app = new Application();
        await this.app.init({
            width: this.chromeArea.x,
            height: this.chromeArea.y,
            backgroundColor: 0xcdcdcc,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            // hello: true,
        });

        canvasContainer.appendChild(this.app.canvas);

        // Verify and set up target image
        if (!this.store.target.image.filename) {
            throw new Error('No target image specified');
        }

        await this.loadAssets();
        await this.createTarget();
        this.setupInteractivity();

        this.shotPoaTool = new ShotPoaTool(this.targetContainer);
        this.referenceTool = new ReferenceTool(this.targetContainer);
        this.crosshairs = new EditorCrosshair(this.targetContainer, this.app);

        this.targetContainer.angle = this.targetStore.target.rotation || 0;

        setApplicationState('Done!');
    }

    private async loadAssets(): Promise<void>
    {
        // Load static assets (cursors etc)
        await Assets.load(this.staticAssets);

        // Load target image
        const targetPath = this.getTargetPath();
        if (!targetPath) { console.error('Invalid target path!', targetPath); return; }

        if (!this.staticAssets.includes(targetPath)) {
            this.staticAssets.push(targetPath);
            await Assets.load(targetPath);
        }
    }

    private getTargetPath(): string | undefined
    {
        const { filename } = this.store.target.image;
        if (!filename) {
            console.error('TargetStore filename invalid!?');
            return;
        }

        if (filename.startsWith('debug')) {
            return '/img/debugtarget.jpg';
        }
        return filename.startsWith('uploads')
            ? `/uploads/${filename}`
            : `/temp/${filename}`;
    }

    private async createTarget(): Promise<void>
    {
        const targetPath = this.getTargetPath();
        if (!targetPath) { console.error('No targetPath!?'); return; }

        const texture = await Assets.load(targetPath);
        if (!texture) { console.error('No texture!?'); return; }

        this.targetSprite = new Sprite(texture);
        this.targetSprite.cursor = 'crosshair';
        this.targetSprite.label = 'targetSprite';

        this.targetContainer = new Container();
        this.targetContainer.cursor = 'crosshair';
        this.targetContainer.label = 'targetContainer';

        this.originalWidth = this.targetSprite.width;
        this.originalHeight = this.targetSprite.height;

        this.app.stage.addChild(this.targetContainer);
        this.targetContainer.addChild(this.targetSprite);

        this.centerTarget();
        this.updateScale();

        this.targetStore.target.image.originalsize = [this.originalWidth, this.originalHeight];
    }

    public centerTarget(): void
    {
        this.targetContainer.pivot.x = this.originalWidth / 2;
        this.targetContainer.pivot.y = this.originalHeight / 2;

        this.targetContainer.x = this.app.screen.width / 2;
        this.targetContainer.y = this.app.screen.height / 2;

        console.log(`app.screen w:h : ${this.app.screen.width}:${this.app.screen.height}`);
        console.log(`Original w:h : ${this.originalWidth}:${this.originalHeight}`);
        console.log(`TargetContainer scale: ${this.scale}`);
        console.log(`TargetContainer x:y : ${this.targetContainer.x}:${this.targetContainer.y}`);
        console.log(`TargetContainer pivot x:y : ${this.targetContainer.pivot.x}:${this.targetContainer.pivot.y}`);
    }

    private updateScale(): void {
        this.scale = Math.min(
            (this.app.screen.height - 100) / this.originalHeight,
            (this.app.screen.width - 100) / this.originalWidth
        );

        this.targetContainer.scale.set(this.scale);
    }

    public async initializeAnalysis(userId: string): Promise<void> {
        if (this.store.analysisFetched) {
            console.log('Analysis already fetched, skipping...');
            return;
        }

        try {
            const analysis = await this.fetchAnalysis(userId);

            console.log('Fetched analysis:', analysis);

            if (analysis && analysis?.predictions?.length > 0) {
                await this.processAnalysisResults(analysis);
                TargetStore.update(store => ({ ...store, analysisFetched: true }));
            } else {
                console.warn('No analysis to process... ');
            }
        } catch (error) {
            console.error('Failed to initialize analysis:', error);
        }
    }

    private async fetchAnalysis(userId: string) {
        if (!this.store.target.image.filename) {
            console.error('No this.store.target.image.filename!');
            return;
        }
        const formData = new FormData();

        console.log(`Appending userId: ${userId} & imagename: ${this.store.target.image.filename} to formData.`);

        formData.append('user_id', userId);
        formData.append('imagename', this.store.target.image.filename);

        const response = await fetch('?/fetchanalysis', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: {[key:string]: any} = deserialize(await response.text()) as ActionResponse;

        if (result.type === 'success' && result.data[0]?.result) {
            return JSON.parse(result.data[0].result) as AnalysisResult;
        }
    }

    public async processAnalysisResults(analysis: any) {
        if (this.store.groups.length === 0) {
            const newGroup = await this.shotPoaTool.createGroup();
            if (!newGroup) {
                throw new Error('Failed to create initial group');
            }
        } else {
            console.log(`this.store.groups.length is ${this.store.groups.length}`);
        }

        for (const prediction of analysis.predictions) {
            const coords = this.targetContainer.toGlobal({
                x: prediction.xy[0],
                y: prediction.xy[1]
            });
            await this.shotPoaTool.addShot(coords.x, coords.y, '1');
        }
    }

    public rotate(degrees: number, isAbsolute: boolean = false): void
    {
        if (!this.store.target.rotation) {
            this.store.target.rotation = 0;
        }

        const newRotation = isAbsolute
            ? degrees % 360
            : (this.store.target.rotation + degrees) % 360;

        this.targetContainer.rotation = newRotation * (Math.PI / 180);
        this.store.target.rotation = newRotation;
    }

    public handleResize(): void
    {
        console.log(`Handle resize. Chrome: ${this.chromeArea.x}:${this.chromeArea.y}`);
        this.app.renderer.resize(this.chromeArea.x, this.chromeArea.y);
        this.updateScale();
        this.centerTarget();
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
        }
    }

    private setupInteractivity(): void
    {
        this.targetContainer.eventMode = 'dynamic';
        this.targetContainer.cursor = 'default';

        this.selectionTool = new SelectionTool(this.targetContainer, this.app);

        this.targetContainer.on('pointerdown', this.handleMouseDown.bind(this));
        this.targetContainer.on('pointermove', this.handleDragMove.bind(this));
        this.targetContainer.on('pointerup', this.handleDragEnd.bind(this));
        this.targetContainer.on('pointerupoutside', this.handleDragEnd.bind(this));
        this.targetContainer.on('wheel', this.handleWheel.bind(this));
    }

    private handleMouseDown(e: FederatedPointerEvent): void
    {
        if (e.button === 1) {
            this.handleDragStart(e);
        } else if (e.shiftKey) {
            this.selectionTool.isSelecting = true;
            this.selecting = true;
            this.selectionTool.onSelectionStart(e);
            return
        } else {
            if (['shots', 'none'].includes(this.editorStore.mode))
                this.shotPoaTool.addShot(e.clientX, e.clientY, '1');
            if (this.editorStore.mode === 'poa')
                this.shotPoaTool.addPoa(e.clientX, e.clientY, '1');
            if (this.editorStore.mode === 'reference')
                this.referenceTool.addReferencePoint(e.clientX, e.clientY);
        }
    }

    private handleDragStart(e: FederatedPointerEvent): void
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

    private handleDragMove(e: FederatedPointerEvent): void
    {
        if (this.selecting) {
            this.selectionTool.onSelectionMove(e);
            return;
        }

        this.crosshairs.position = {x: e.globalX, y: e.globalY}

        if (!this.isDragging || !this.dragStartPosition || !this.dragStartMousePosition) return;

        const dx = e.global.x - this.dragStartMousePosition.x;
        const dy = e.global.y - this.dragStartMousePosition.y;

        this.targetContainer.x = this.dragStartPosition.x + dx;
        this.targetContainer.y = this.dragStartPosition.y + dy;
    }

    private handleDragEnd(e: FederatedPointerEvent): void
    {
        if (this.selecting) {
            this.selectionTool.onSelectionEnd(e);
            this.selecting = false;
        }

        this.targetContainer.cursor = 'crosshair';
        this.isDragging = false;
        this.dragStartPosition = null;
        this.dragStartMousePosition = null;
    }

    // Toggla drag etc. via mode
    // Kanske någon gång behövs. Låt stå.
    public enableDragging(): void
    {
        this.targetContainer.eventMode = 'dynamic';
        this.targetContainer.cursor = 'move';
    }

    public disableDragging(): void
    {
        this.targetContainer.eventMode = 'none';
        this.targetContainer.cursor = 'default';
    }

    public setMode(mode: 'drag' | 'shots' | 'poa' | 'reference'): void
    {
        switch (mode) {
            case 'drag':
                this.enableDragging();
                break;
            case 'shots':
                this.disableDragging();
                break;
            case 'poa':
                this.disableDragging();
                break;
            case 'reference':
                this.disableDragging();
                break;
        }
    }

    // rotation
    public rotateTarget(degrees: number = 0, options: { 
        reset?: boolean, 
        slider?: number, 
        absolute?: boolean 
    } = {}) {
        const { reset, slider, absolute } = options;

        if (reset) {
            this.currentAngle = 0;
            this.sliderAngle = 0;
            this.targetContainer.angle = 0;
        } else if (slider !== undefined) {
            const previousSliderAngle = this.sliderAngle;
            this.sliderAngle = slider;
            
            this.currentAngle = this.currentAngle - previousSliderAngle + this.sliderAngle;
        } else if (absolute) {
            // textinput 
            this.currentAngle = degrees;
            this.sliderAngle = 0;
        } else {
            this.currentAngle = (this.currentAngle + degrees) % 360;
            this.sliderAngle = 0;
        }

        this.targetContainer.angle = this.currentAngle % 360;

        // Update store
        TargetStore.update(s => {
            s.target.rotation = this.targetContainer.angle;
            return s;
        });

        // Debug
        // console.log({
        //     currentAngle: this.currentAngle,
        //     sliderAngle: this.sliderAngle,
        //     containerAngle: this.targetContainer.angle,
        //     storeRotation: this.targetStore.target.rotation
        // });
    }

    // set forwards
    public setRefMeasurement()
    {
        this.referenceTool.setRefMeasurement();
    }

    public assignSelectedShotsToGroup()
    {
        this.shotPoaTool.assignSelectedShotsToGroup();
    }

    // Getter, får och annat bös!
    public get getApp(): ApplicationType<RendererType> {
        return this.app;
    }

    public get getContainer(): Container {
        return this.targetContainer;
    }

    public get getSprite(): Sprite {
        return this.targetSprite;
    }

    public get getScale(): number {
        return this.scale;
    }

    // Din morsa jobbar inte här!
    public destroy(): void {
        this.app.destroy(true, true);
        this.targetContainer.removeAllListeners();
    }
}
