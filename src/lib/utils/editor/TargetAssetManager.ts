import { Assets } from "pixi.js";
import { type TargetStoreInterface } from '../../stores/TargetImageStore';

export class TargetAssetManager {
    public  staticAssets: string[];
    private targetStore: TargetStoreInterface;

    constructor(staticAssets: string[], targetStore: TargetStoreInterface)
    {
        this.staticAssets = staticAssets;
        this.targetStore = targetStore;
    }
    // Methods: loadAssets, getTargetPath, etc.

    public async loadAssets(): Promise<void> 
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
}