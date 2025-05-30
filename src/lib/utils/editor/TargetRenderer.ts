import { Assets, Application, Sprite, Container } from "pixi.js";
import { Application as ApplicationType, type Container as ContainerType, type FederatedPointerEvent, type Renderer as RendererType, type Sprite as SpriteType } from 'pixi.js';
import { DropShadowFilter } from "pixi-filters";
import { getSettings } from 'svelte-ux';
import { TargetStore, type TargetStoreInterface } from "@/stores/TargetImageStore";
import { ShotPoaTool } from './PlaceShotPoaTool';
import { ReferenceTool } from './ReferenceTool';
import { EditorCrosshair } from "./EditorCrosshair";
import { TargetAssetManager } from "./TargetAssetManager";
import { TargetInteractionManager } from "./TargetInteractionManager";

export class TargetRenderer {
    // Methods: createWebGLContext, createTarget, updateScale, centerTarget, etc.
    public  targetPath!: string;
    public  targetSprite!: Sprite;
    public  targetContainer!: Container;
    public  originalWidth: number = 0;
    public  originalHeight: number = 0;
    public  dark: boolean = false;
    public  scale: number = 1;
    public  app!: ApplicationType<RendererType>;
    public  chromeArea: { x: number, y: number };
    public  currentAngle: number = 0;
    public  sliderAngle: number = 0;
    private targetStore: TargetStoreInterface;
    private targetAssetManager: TargetAssetManager;
    
    constructor(
        targetStore: TargetStoreInterface,
        targetAssetManager: TargetAssetManager
    ) {
        this.targetStore = targetStore;
        this.targetAssetManager = targetAssetManager;
        this.chromeArea = { x: 0, y: 0 };
    
        const { currentTheme } = getSettings();
        
        currentTheme.subscribe(settings => {
            settings.dark ? this.dark = true : this.dark = false;
            this.updateBackground();
        });
    }

    public async initialize(
        canvasContainer: HTMLDivElement,
        setApplicationState: (state: string) => void
    ): Promise<void> {
        try {
            setApplicationState('Initializing application...');
            console.warn('Lost WebGL-context is normal, esp. in Firefox. Nothing to worry about');
        
            // get window dimensions
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            const canvas = this.createContext();
            
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
                    preference: "webgpu",
                    powerPreference: 'high-performance',
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
    
            if (!this.targetStore.target.image.filename) {
                throw new Error('No target image specified');
            }
    
            await this.targetAssetManager.loadAssets();
            await this.createTarget();
            
            // this.shotPoaTool = new ShotPoaTool(this.targetContainer);
            // this.referenceTool = new ReferenceTool(this.targetContainer);
            // this.editorCrosshair = new EditorCrosshair(this.targetContainer, this.app);
    
            this.targetContainer.angle = this.targetStore.target.rotation || 0;
    
            setApplicationState('Done!');
        } catch (error) {
            // console.error("Target initialization error:", error);
            setApplicationState(`Error: ${(error as Error).message || 'Unknown error'}`);
            throw error; // Re-throw to notify the caller
        }
    }

    public createContext(): HTMLCanvasElement 
    {
        const canvas = document.createElement('canvas');
        canvas.getContext('webgpu', {
            alpha: true,
            antialias: true,
            premultipliedAlpha: false, // This is key for the alpha-premult warning
            preserveDrawingBuffer: true
        });
        
        // if (gl) {
        //     gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        //     gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
        // }
        
        return canvas;
    }

    public getTargetPath(): string
    {
        let filename: string;
        if (!this.targetStore.target.image.filename) {
            throw new Error('TargetStore filename invalid!?');
        } else {
            filename = this.targetStore.target.image.filename
        }

        if (filename.startsWith('debug')) {
            return '/img/debugtarget.jpg';
        }
        return filename.startsWith('uploads')
            ? `/${filename}`
            : `/temp/${filename}`;
    }

    public async createTarget(): Promise<void> 
    {
        try {
            const targetPath = this.getTargetPath();
            if (!targetPath) { 
                throw new Error('Target image path not found');
            }
    
            // console.log("Loading target texture:", targetPath);
            
            if (!Assets.cache.has(targetPath)) {
                Assets.add({
                    src: targetPath,
                    alias: targetPath,
                    data: { skipPreMultipliedAlpha: true }
                });
            }
            
            const texture = await Assets.load(targetPath);
            
            if (!texture) { 
                console.error('No texture loaded!'); 
                throw new Error('Failed to load target texture');
            }
            
            // console.log("Texture loaded successfully");
    
            // Create sprite with the loaded texture
            this.targetSprite = new Sprite(texture);
            this.targetSprite.cursor = 'crosshair';
            this.targetSprite.label = 'targetSprite';
            
            // Set initial scale to 1
            this.targetSprite.scale.set(1);
    
            this.targetContainer = new Container();
            this.targetContainer.cursor = 'crosshair';
            this.targetContainer.label = 'targetContainer';
    
            this.targetContainer.addChild(this.targetSprite);
    
            // Store original dimensions
            this.originalWidth = this.targetSprite.width;
            this.originalHeight = this.targetSprite.height;
    
            // console.log("Target dimensions:", this.originalWidth, "x", this.originalHeight);

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
            // console.error("Error creating target:", error);
            throw new Error(`Failed to create target: ${(error as Error).message}`);
        }
    }

    public updateBackground(): void 
    {
        if (this.app) {
            this.app.renderer.background.color = this.dark ? 0x545960 : 0xcccbc9;
        }
    }

    public centerTarget(): void 
    {
        this.targetContainer.x = this.app.screen.width / 2;
        this.targetContainer.y = this.app.screen.height / 2;
        
        this.targetSprite.position.set(0, 0);
    }

    public updateScale(): void 
    {
        this.scale = Math.min(
            (this.app.screen.height - 100) / this.originalHeight,
            (this.app.screen.width - 100) / this.originalWidth
        );
    
        this.targetContainer.scale.set(this.scale);
    }

    public rotateTarget(degrees: number = 0, options: { 
        reset?: boolean, 
        slider?: number, 
        absolute?: boolean 
    } = {}) {
        const { reset, slider, absolute } = options;

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
        
        this.centerTarget();
    
        TargetStore.update(s => {
            s.target.rotation = this.currentAngle;
            return s;
        });
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
}