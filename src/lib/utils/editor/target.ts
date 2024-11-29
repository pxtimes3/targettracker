// classes/Target.ts
import { TargetStore, type TargetStoreInterface } from '@/stores/TargetImageStore';
import { ShotPoaTool } from '@/utils/editor/placeshotpoatool';
import type { Application as ApplicationType, Container as ContainerType, Renderer as RendererType, Sprite as SpriteType } from 'pixi.js';
import { Application, Assets, Container, Sprite } from 'pixi.js';
import { get } from 'svelte/store';

export class Target {
    private app!: ApplicationType<RendererType>;
    private targetContainer!: ContainerType;
    private targetSprite!: SpriteType;
    private shotPoaTool!: ShotPoaTool;
    private store: TargetStoreInterface;
    private scale: number;
    private staticAssets: string[];
    private chromeArea: { x: number, y: number };

    constructor(chromeArea: { x: number, y: number }, staticAssets: string[]) {
        this.chromeArea = chromeArea;
        this.staticAssets = staticAssets;
        this.store = get(TargetStore);
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
            hello: true
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

    private async createTarget(): Promise<void> {
        const targetPath = this.getTargetPath();
        if (!targetPath) { console.error('No targetPath!?'); return; }

        const texture = await Assets.load(targetPath);
        if (!texture) { console.error('No texture!?'); return; }

        this.targetSprite = new Sprite(texture);
        this.targetSprite.label = 'targetSprite';

        this.targetContainer = new Container();
        this.targetContainer.label = 'targetContainer';
        this.app.stage.addChild(this.targetContainer);
        this.targetContainer.addChild(this.targetSprite);

        this.centerTarget();
        this.updateScale();
    }

    private centerTarget(): void {
        this.targetContainer.x = this.app.screen.width / 2;
        this.targetContainer.y = this.app.screen.height / 2;
        this.targetContainer.pivot.x = this.targetContainer.width / 2;
        this.targetContainer.pivot.y = this.targetContainer.height / 2;
    }

    private updateScale(): void {
        this.scale = Math.min(
            (window.innerHeight - 100) / this.targetSprite.height,
            (window.innerWidth - 100) / this.targetSprite.width
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
            if (analysis?.predictions?.length > 0) {
                await this.processAnalysisResults(analysis);
                TargetStore.update(store => ({ ...store, analysisFetched: true }));
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
        formData.append('user_id', userId);
        formData.append('imagename', this.store.target.image.filename);

        const response = await fetch('?/fetchanalysis', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    private async processAnalysisResults(analysis: any) {
        if (this.store.groups.length === 0) {
            const newGroup = await this.shotPoaTool.createGroup();
            if (!newGroup) {
                throw new Error('Failed to create initial group');
            }
        }

        for (const prediction of analysis.predictions) {
            const coords = this.targetContainer.toGlobal({
                x: prediction.xy[0],
                y: prediction.xy[1]
            });
            await this.shotPoaTool.addShot(coords.x, coords.y, '1', false);
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

    private setupInteractivity(): void {
        this.targetContainer.eventMode = 'dynamic';
        this.targetContainer.cursor = 'pointer';
        // Add any other interaction setup needed
    }

    // Getter methods
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

    // Clean up method
    public destroy(): void {
        this.app.destroy(true, true);
    }
}
