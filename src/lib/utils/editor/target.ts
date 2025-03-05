// src/lib/utils/editor/target.ts
import { deserialize } from '$app/forms';
import { EditorStore, type EditorStoreInterface } from '@/stores/EditorStore';
import { TargetStore, type TargetStoreInterface } from '@/stores/TargetImageStore';
import { ShotPoaTool } from '@/utils/editor/placeshotpoatool';
import type { Application as ApplicationType, Container as ContainerType, FederatedPointerEvent, Renderer as RendererType, Sprite as SpriteType } from 'pixi.js';
import { Application, Assets, Container, Sprite, type ALPHA_MODES } from 'pixi.js';
import { get } from 'svelte/store';
import { ReferenceTool } from './referencetool';
import { SelectionTool } from './selectiontool';
import { EditorCrosshair } from './crosshairs';
import { DropShadowFilter } from 'pixi-filters';
import { getSettings } from 'svelte-ux';

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
    public scale: number;
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
    private dark: boolean = false;

    constructor(chromeArea: { x: number, y: number }, staticAssets: string[]) 
    {
        // Suppress specific WebGL warnings
        // const originalConsoleWarn = console.warn;
        // console.warn = function(message) {
        //     if (typeof message === 'string' && 
        //     (message.includes('Alpha-premult and y-flip are deprecated') || 
        //         message.includes('incurring lazy initialization'))) {
        //         // Ignore these specific warnings
        //         return;
        //     }
        //     originalConsoleWarn.apply(console, arguments as any);
        // };

        this.chromeArea = chromeArea;
        this.staticAssets = staticAssets;
        this.store = get(TargetStore);
        EditorStore.subscribe(value => {
            this.editorStore = value;
        });
        this.targetStore = get(TargetStore);
        this.scale = 1;

        const { currentTheme } = getSettings();
        
        currentTheme.subscribe(settings => {
            settings.dark ? this.dark = true : this.dark = false;
            this.updateBackground();
        });
    }

    private updateBackground(): void {
        if (this.app) {
            this.app.renderer.background.color = this.dark ? 0x545960 : 0xcccbc9;
        }
    }

    public async initialize(
        canvasContainer: HTMLDivElement,
        setApplicationState: (state: string) => void
    ): Promise<void> {
        try {
            setApplicationState('Initializing application...');
        
            // get window dimensions
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            // Create custom WebGL context
            const canvas = this.createWebGLContext();
            
            // init PIXI with custom canvas
            this.app = new Application();
            
            try {
                await this.app.init({
                    width: width,
                    height: height,
                    backgroundColor: this.dark ? 0x545960 : 0xcccbc9,
                    antialias: true,
                    resolution: 1,
                    hello: true,
                    preference: "webgl",
                    canvas: canvas // Use our custom canvas
                });
    
                if (this.app.renderer) {
                    console.log("Renderer initialized:", this.app.renderer.type);
                }
            } catch (webglError) {
                console.warn("WebGL initialization failed, trying canvas fallback:", webglError);
                
                // Try again with canvas renderer if WebGL fails
                await this.app.init({
                    width: width,
                    height: height,
                    backgroundColor: this.dark ? 0x545960 : 0xcccbc9,
                    antialias: true,
                    resolution: 1,
                    hello: true,
                    preference: undefined
                });
            }
        
            // Update chromeArea to match
            this.chromeArea.x = width;
            this.chromeArea.y = height;
        
            canvasContainer.appendChild(this.app.canvas);
    
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
        } catch (error) {
            console.error("Target initialization error:", error);
            setApplicationState(`Error: ${(error as Error).message || 'Unknown error'}`);
            throw error; // Re-throw to notify the caller
        }
    }

    private createWebGLContext(): HTMLCanvasElement {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        
        // Get WebGL context with specific attributes to avoid warnings
        const gl = canvas.getContext('webgl2', {
            alpha: true,
            antialias: true,
            premultipliedAlpha: false, // This is key for the alpha-premult warning
            preserveDrawingBuffer: true
        });
        
        if (gl) {
            // Disable flip Y
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            
            // Force texture initialization
            gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
        }
        
        return canvas;
    }

    private async loadAssets(): Promise<void> 
    {
        // Configure global asset options first
        Assets.setPreferences({
            preferCreateImageBitmap: true
        });
        
        // Process each asset to add configuration
        for (const asset of this.staticAssets) {
            // Skip if already registered
            if (!Assets.cache.has(asset)) {
                // Register with options to avoid alpha-premult warning
                Assets.add({
                    src: asset,
                    alias: asset,
                    data: { skipPreMultipliedAlpha: true }
                });
            }
        }
        
        // Load all static assets
        console.log("Loading static assets:", this.staticAssets);
        await Assets.load(this.staticAssets);
        console.log("Static assets loaded successfully");
        
        // Load target image with specific options
        const targetPath = this.getTargetPath();
        if (!targetPath) { 
            console.error('Invalid target path!', targetPath); 
            return; 
        }
        
        // Register target with options if not already registered
        if (!Assets.cache.has(targetPath)) {
            console.log("Registering target asset:", targetPath);
            Assets.add({
                src: targetPath,
                alias: targetPath,
                data: { 
                    skipPreMultipliedAlpha: true,
                    createBitmap: true
                }
            });
            
            // Add to static assets list for tracking
            this.staticAssets.push(targetPath);
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

    private async createTarget(): Promise<void> {
        try {
            const targetPath = this.getTargetPath();
            if (!targetPath) { 
                console.error('No targetPath!?'); 
                throw new Error('Target image path not found');
            }
    
            console.log("Loading target texture:", targetPath);
            
            // Make sure the asset is registered with proper options first
            if (!Assets.cache.has(targetPath)) {
                Assets.add({
                    src: targetPath,
                    alias: targetPath,
                    data: { skipPreMultipliedAlpha: true }
                });
            }
            
            // Then load it normally
            const texture = await Assets.load(targetPath);
            
            if (!texture) { 
                console.error('No texture loaded!'); 
                throw new Error('Failed to load target texture');
            }
            
            console.log("Texture loaded successfully");
    
            // Create sprite with the loaded texture
            this.targetSprite = new Sprite(texture);
            this.targetSprite.cursor = 'crosshair';
            this.targetSprite.label = 'targetSprite';
            
            // Set initial scale to 1
            this.targetSprite.scale.set(1);
    
            this.targetContainer = new Container();
            this.targetContainer.cursor = 'crosshair';
            this.targetContainer.label = 'targetContainer';
    
            // Add the sprite to the container before measuring
            this.targetContainer.addChild(this.targetSprite);
    
            // Store original dimensions
            this.originalWidth = this.targetSprite.width;
            this.originalHeight = this.targetSprite.height;
    
            console.log("Target dimensions:", this.originalWidth, "x", this.originalHeight);

            // set initialpivot
            this.targetSprite.pivot.set(this.originalWidth / 2, this.originalHeight / 2);
    
            // dropshadow
            this.targetContainer.filters = [ 
                new DropShadowFilter({
                    alpha: this.dark ? 0.5 : 0.25,
                    color: this.dark ? 0x000000 : 0x666666,
                    offset: {x: 8, y: 8}
                }) 
            ];
    
            this.centerTarget();
            this.updateScale();
    
            this.app.stage.addChild(this.targetContainer);
    
            this.targetStore.target.image.originalsize = [this.originalWidth, this.originalHeight];
        } catch (error) {
            console.error("Error creating target:", error);
            throw new Error(`Failed to create target: ${(error as Error).message}`);
        }
    }

    public centerTarget(): void {
        // Center the container
        this.targetContainer.x = this.app.screen.width / 2;
        this.targetContainer.y = this.app.screen.height / 2;
        
        // Make sure sprite is at origin of container
        this.targetSprite.position.set(0, 0);
    }

    private updateScale(): void 
    {
        // Calculate scale based on available space
        this.scale = Math.min(
            (this.app.screen.height - 100) / this.originalHeight,
            (this.app.screen.width - 100) / this.originalWidth
        );
    
        // Apply scale to container
        this.targetContainer.scale.set(this.scale);
        
         // console.log(`Scale set to: ${this.scale}`);
         // console.log(`App dimensions: ${this.app.screen.width}x${this.app.screen.height}`);
         // console.log(`Target container scale: ${this.targetContainer.scale.x}:${this.targetContainer.scale.y}`);
         // console.log(`Target container size: ${this.targetContainer.width}:${this.targetContainer.height}`);
         // console.log(`Target sprite size: ${this.targetSprite.width}:${this.targetSprite.height}`);
    }

    public async initializeAnalysis(userId: string): Promise<void> {
        if (this.store.analysisFetched) {
             // console.log('Analysis already fetched, skipping...');
            return;
        }

        try {
            const analysis = await this.fetchAnalysis(userId);

             // console.log('Fetched analysis:', analysis);

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

         // console.log(`Appending userId: ${userId} & imagename: ${this.store.target.image.filename} to formData.`);

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
             // console.log(`this.store.groups.length is ${this.store.groups.length}`);
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
        const width = window.innerWidth;
        const height = window.innerHeight;
        
         // console.log(`Handle resize. Window: ${width}:${height}`);
        this.app.renderer.resize(width, height);
        
        // Update chromeArea to match
        this.chromeArea.x = width;
        this.chromeArea.y = height;
        
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
            // console.log(`Scale is now: ${this.scale}`);
            this.shotPoaTool.drawAllMetrics();
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

    public rotateTarget(degrees: number = 0, options: { 
        reset?: boolean, 
        slider?: number, 
        absolute?: boolean 
    } = {}) {
        const { reset, slider, absolute } = options;

        // console.log("Before rotation:", {
        //     currentAngle: this.currentAngle,
        //     position: {x: this.targetSprite.x, y: this.targetSprite.y},
        //     pivot: {x: this.targetSprite.pivot.x, y: this.targetSprite.pivot.y},
        //     angle: this.targetSprite.angle,
        //     visible: this.targetSprite.visible,
        //     scale: this.targetSprite.scale.x
        // });
    
        // Calculate the new angle
        if (reset) {
            this.currentAngle = 0;
            this.sliderAngle = 0;
        } else if (slider !== undefined) {
            const previousSliderAngle = this.sliderAngle;
            this.sliderAngle = slider;
            this.currentAngle = this.currentAngle - previousSliderAngle + this.sliderAngle;
        } else if (absolute) {
            this.currentAngle = degrees;
            this.sliderAngle = 0;
        } else {
            this.currentAngle = (this.currentAngle + degrees) % 360;
            this.sliderAngle = 0;
        }
    
        const currentScale = this.targetContainer.scale.x;
        
        this.targetSprite.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
        this.targetSprite.pivot.set(this.targetSprite.width / 2, this.targetSprite.height / 2);
        
        this.targetSprite.angle = this.currentAngle;
        
        // this.targetSprite.scale.set(this.scale);
        this.centerTarget();
    
        TargetStore.update(s => {
            s.target.rotation = this.currentAngle;
            return s;
        });
        
        // console.log("After rotation:", {
        //     currentAngle: this.currentAngle,
        //     position: {x: this.targetSprite.x, y: this.targetSprite.y},
        //     pivot: {x: this.targetSprite.pivot.x, y: this.targetSprite.pivot.y},
        //     angle: this.targetSprite.angle,
        //     visible: this.targetSprite.visible,
        //     scale: this.targetSprite.scale.x
        // });
    }

    // set forwards
    public setRefMeasurement()
    {
        this.referenceTool.setRefMeasurement();
    }

    public assignSelectedShotsToGroup(value: string)
    {
        this.shotPoaTool.assignSelectedShotsToGroup(value);
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
