import { initialStore, type TargetStoreInterface } from '@/stores/TargetImageStore';
import { initialize } from '@/utils/target';
import { afterEach } from 'node:test';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock PIXI
vi.mock('pixi.js', () => ({
    Application: vi.fn().mockImplementation(() => {
        const canvas = document.createElement('canvas');
        return {
            init: vi.fn().mockResolvedValue({
                canvas: canvas,  // Return actual canvas element
                width: 800,
                height: 600,
                view: canvas    // Some PIXI versions use 'view' instead of 'canvas'
            }),
            canvas: canvas      // Make sure canvas is available on the app instance
        };
    })
}));

describe('initialize', () => {
    const mockSetApplicationState = vi.fn();
    const mockSetStaticAssets = vi.fn();
    let mockTargetStore: TargetStoreInterface;
    let chromeArea = { x: 1024, y: 768 };
    let canvasContainer: HTMLDivElement;
    let currentStaticAssets = ['url/asset.ext'];

    beforeEach(() => {
        canvasContainer = document.createElement('div');
        document.body.appendChild(canvasContainer);

        mockTargetStore = {
            ...initialStore,
            target: {
                ...initialStore.target,
                image: {
                    ...initialStore.target.image,
                    filename: 'test.jpg'
                }
            }
        };

        mockSetApplicationState.mockReset();
        mockSetStaticAssets.mockReset();
    });

    afterEach(() => {
        // Cleanup
        if (canvasContainer.parentNode) {
            canvasContainer.parentNode.removeChild(canvasContainer);
        }
    });

    it('should initialize PIXI application', async () => {
        const app = await initialize(
            chromeArea,
            canvasContainer,
            mockSetApplicationState,
            mockSetStaticAssets,
            currentStaticAssets,
            mockTargetStore
        );

        expect(mockSetApplicationState).toHaveBeenCalledWith('Initializing application...');
        expect(canvasContainer.children.length).toBe(1);
        // ... rest of your assertions
    });

    it('should throw error when no filename', async () => {
        mockTargetStore.target.image.filename = undefined;

        await expect(initialize(
            chromeArea,
            canvasContainer,
            mockSetApplicationState,
            mockSetStaticAssets,
            currentStaticAssets,
            mockTargetStore
        )).rejects.toThrow('No target?');
    });
});

/*
describe('initialize', () => {
    let chromeArea = { x: 1024, y: 768 };
    let canvasContainer: HTMLDivElement;

    beforeEach(() => {
        // Setup DOM element
        canvasContainer = document.createElement('div');

        // Reset mocks
        vi.clearAllMocks();

        // Mock TargetStore initial state
        TargetStore.set(initialStore);
    });

    afterEach(() => {
        // Cleanup
        vi.resetAllMocks();
    });

    it('should initialize PIXI application with correct dimensions', async () => {
        const app = await initialize();

        expect(Application).toHaveBeenCalled();
        expect(app.init).toHaveBeenCalledWith({
            width: chromeArea.x,
            height: chromeArea.y,
            backgroundColor: 0xcdcdcc,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            hello: true
        });
    });

    it('should append canvas to container', async () => {
        const app = await initialize();

        expect(canvasContainer.children.length).toBe(1);
        expect(canvasContainer.children[0]).toBe(app.canvas);
    });

    it('should throw error if no target image filename', async () => {
        // Set store to have no filename
        TargetStore.set({
            target: {
                image: {
                    filename: undefined
                }
                // ... other required properties
            }
            // ... other required properties
        });

        await expect(initialize()).rejects.toThrow('No target?');
    });

    it('should set correct targetPath for non-uploads files', async () => {
        TargetStore.set({
            target: {
                image: {
                    filename: 'test.jpg' // doesn't start with 'uploads'
                }
                // ... other required properties
            }
            // ... other required properties
        });

        await initialize();

        expect(targetPath).toBe('/temp/test.jpg');
        expect(staticAssets).toContain('/temp/test.jpg');
    });

    // Test error handling
    it('should handle PIXI initialization errors', async () => {
        // Mock PIXI to throw error
        vi.mocked(Application).mockImplementationOnce(() => ({
            init: vi.fn().mockRejectedValue(new Error('PIXI init failed'))
        }));

        await expect(initialize()).rejects.toThrow('PIXI init failed');
    });

    // Test state updates
    it('should update applicationState during initialization', async () => {
        await initialize();

        expect(applicationState).toBe('Initalizing application...');
    });
});
*/

// Helper function to wait for state updates
const waitForState = async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
};
