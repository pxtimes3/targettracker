import { vi, describe, it, beforeEach, afterEach, expect } from "vitest";
import { MockTargetStoreSubscribe, MockUserSettingsSubscribe, TargetStoreMock } from "../../storeMocks";
import { Target } from "@/utils/editor/Target";
import { Application, Container, FederatedPointerEvent, RendererType, Sprite, type Renderer } from "pixi.js";
import { fetchAnalysis } from "@/utils/target";

const mockTargetRenderer = {
    initialize: vi.fn().mockResolvedValue(undefined),
    targetContainer: new Container(),
    app: {},
    rotateTarget: vi.fn(),
    handleResize: vi.fn(),
};
vi.mock('@/utils/editor/TargetRenderer', () => ({
    TargetRenderer: vi.fn().mockImplementation(() => mockTargetRenderer)
}));

const mockCrosshairs = { initialize: vi.fn() };
vi.mock('@/utils/editor/EditorCrosshair', () => ({
    EditorCrosshair: vi.fn().mockImplementation(() => mockCrosshairs)
}));

const mockShotPoaTool = {};
vi.mock('@/utils/editor/PlaceShotPoaTool', () => ({
    ShotPoaTool: vi.fn().mockImplementation(() => mockShotPoaTool)
}));

const mockReferenceTool = {
    setRefMeasurement: vi.fn(),
};
vi.mock('@/utils/editor/ReferenceTool', () => ({
    ReferenceTool: vi.fn().mockImplementation(() => mockReferenceTool)
}));

const mockInteractionManager = {
    setupInteractivity: vi.fn(),
    handleWheel: vi.fn(),
    handleMouseDown: vi.fn(),
    handleDragStart: vi.fn(),
    handleDragMove: vi.fn(),
    handleDragEnd: vi.fn(),
};
vi.mock('@/utils/editor/TargetInteractionManager', () => ({
    TargetInteractionManager: vi.fn().mockImplementation(() => mockInteractionManager)
}));

const mockAnalysisProcessor = {
    initializeAnalysis: vi.fn().mockResolvedValue(undefined),
    fetchAnalysis: vi.fn().mockResolvedValue(undefined),
    processAnalysisResults: vi.fn().mockResolvedValue(undefined),
};
vi.mock('@/utils/editor/TargetAnalysisProcessor', () => ({
    TargetAnalysisProcessor: vi.fn().mockImplementation(() => mockAnalysisProcessor)
}));

const mockTargetAssetManager = {
    loadAssets: vi.fn(),
};
vi.mock('@/utils/editor/TargetAssetManager', () => ({
    TargetAssetManager: vi.fn().mockImplementation(() => mockTargetAssetManager)
}));


describe('Target', () => {
    let   mockCanvasContainer: HTMLDivElement;
    let   target: Target;
    const mockSetApplicationState = vi.fn();

    beforeEach(() => {
        mockCanvasContainer = document.createElement('div');
        vi.clearAllMocks();
        TargetStoreMock.target.rotation = 0;

        mockTargetRenderer.rotateTarget = vi.fn();

        target = new Target({ x: 0, y: 0 }, []);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Initialization', () => {
        it('Should set application state', async () => {
            // Act
            await target.initialize(mockCanvasContainer, mockSetApplicationState);

            // Assert
            expect(mockSetApplicationState).toHaveBeenCalledTimes(2);
            expect(mockSetApplicationState).nthCalledWith(1, expect.stringMatching(/^Initializing.*/));
            expect(mockSetApplicationState).nthCalledWith(2, expect.stringMatching(/^Done.*/));
        });

        it('Should not rotate target when rotation is 0', async () => {
            // @ts-ignore
            const target = new Target({ x: 0, y: 0 }, [], TargetStoreMock);
            
            await target.initialize(mockCanvasContainer, mockSetApplicationState);

            expect(mockTargetRenderer.rotateTarget).not.toBeCalled();
        });

        it('Should rotate target when rotation has a value', async () => {
            vi.clearAllMocks();
            TargetStoreMock.target.rotation = 69;
            
            // Act
            await target.initialize(mockCanvasContainer, mockSetApplicationState);
        
            // Assert
            expect(mockTargetRenderer.rotateTarget).toBeCalledWith(45, { absolute: true });
        });

        it('Should use default parameters in rotateTarget', async () => {
            await target.initialize(mockCanvasContainer, mockSetApplicationState);
            vi.clearAllMocks();
            
            target.rotateTarget();
            expect(mockTargetRenderer.rotateTarget).toHaveBeenCalledWith(0, {});
        });

        it('Should handle errors gracefully and with tact', async () => {
            vi.clearAllMocks();
            mockTargetRenderer.initialize = vi.fn().mockRejectedValue( new Error('mock error') );

            await expect(() => target.initialize(mockCanvasContainer, mockSetApplicationState)).rejects.toThrow('mock error');
            expect(mockSetApplicationState).toHaveBeenCalledWith(expect.stringMatching(/Error: mock error/));

            // Cleanup
            mockTargetRenderer.initialize = vi.fn();
        });
    });

    describe('TargetAssetManager', () => {
        it('Should pass loadAssets to targetAssetManager', async () => {
            await target.loadAssets();

            expect(mockTargetAssetManager.loadAssets).toBeCalled();
        });
    });

    describe('TargetAnalysis', () => {
        it('Should pass calls to targetAnalysisProcesser', async () => {
            vi.clearAllMocks();
            await target.initialize(mockCanvasContainer, mockSetApplicationState);

            await target.initializeAnalysis('69');
            expect(mockAnalysisProcessor.initializeAnalysis).toHaveBeenCalledWith('69');

            await target.fetchAnalysis('666');
            expect(mockAnalysisProcessor.fetchAnalysis).toHaveBeenCalledWith('666');

            await target.processAnalysisResults({ monkey: true });
            expect(mockAnalysisProcessor.processAnalysisResults).toHaveBeenCalledWith({ monkey: true });
        });
    });

    describe('TargetRenderer', () => {
        it('Should pass calls to targetRenderer', async () => {
            await target.initialize(mockCanvasContainer, mockSetApplicationState);
            const mockApp = { foo: 'bar' };
            mockTargetRenderer.app = mockApp;
            
            const app = target.getApp;
            expect(app).toBe(mockApp);

            target.handleResize();
            expect(mockTargetRenderer.handleResize).toBeCalledTimes(1);

            let options = { reset: true, slider: 2, absolute: false };
            target.rotateTarget(69, options);
            expect(mockTargetRenderer.rotateTarget).toHaveBeenCalledWith(69, options);
        });
    });

    describe('InteractionMangager', () => {
        it('Should pass calls to the interactionMangaer', async () => {
            const wheelEvent = 0 as unknown as WheelEvent;
            const federatedPointerEvent = 0 as unknown as FederatedPointerEvent;
            await target.initialize(mockCanvasContainer, mockSetApplicationState);

            vi.clearAllMocks();

            target.setupInteractivity();
            expect(mockInteractionManager.setupInteractivity).toHaveBeenCalledTimes(1);
            expect(mockInteractionManager.setupInteractivity).toHaveBeenCalledWith();

            target.handleWheel(wheelEvent);
            expect(mockInteractionManager.handleWheel).toHaveBeenCalledTimes(1);
            expect(mockInteractionManager.handleWheel).toHaveBeenCalledWith(wheelEvent);

            target.handleMouseDown(federatedPointerEvent);
            expect(mockInteractionManager.handleMouseDown).toHaveBeenCalledTimes(1);
            expect(mockInteractionManager.handleMouseDown).toHaveBeenCalledWith(federatedPointerEvent);

            target.handleDragStart(federatedPointerEvent);
            expect(mockInteractionManager.handleDragStart).toHaveBeenCalledTimes(1);
            expect(mockInteractionManager.handleDragStart).toHaveBeenCalledWith(federatedPointerEvent);
            
            target.handleDragMove(federatedPointerEvent);
            expect(mockInteractionManager.handleDragMove).toHaveBeenCalledTimes(1);
            expect(mockInteractionManager.handleDragMove).toHaveBeenCalledWith(federatedPointerEvent);
            
            target.handleDragEnd(federatedPointerEvent);
            expect(mockInteractionManager.handleDragEnd).toHaveBeenCalledTimes(1);
            expect(mockInteractionManager.handleDragEnd).toHaveBeenCalledWith(federatedPointerEvent);
        });
    });

    describe('ReferenceTool', () => {
        it('Should pass calls to the referenceTool', () => {
            vi.clearAllMocks();
            target.initialize(mockCanvasContainer, mockSetApplicationState);
            // @ts-ignore
            target.referenceTool = mockReferenceTool;
            target.setRefMeasurement();
            expect(mockReferenceTool.setRefMeasurement).toHaveBeenCalledTimes(1);
        });
    });

    describe('Getters & Destroy', () => {
        it('Should return a container when getContainer() is called', async () => {
            vi.clearAllMocks();
            await target.initialize(mockCanvasContainer, mockSetApplicationState);
            target.targetContainer = new Container();

            const getContainer = target.getContainer;
            expect(getContainer).toBe(target.targetContainer);
        });

        it('Should return targetSprite when getSprite() is called', async () => {
            vi.clearAllMocks();
            await target.initialize(mockCanvasContainer, mockSetApplicationState);
            target.targetSprite = new Sprite();

            const getSprite = target.getSprite;
            expect(getSprite).toBe(target.targetSprite);
        });

        it('Should return the scale, as a number when getScale() is called', async () => {
            vi.clearAllMocks();
            await target.initialize(mockCanvasContainer, mockSetApplicationState);
            
            const getScale = target.scale;
            expect(getScale).toBe(1);
            expect(getScale).toBeTypeOf('number');
        });

        it('Should destroy the app and remove any listeners from the targetContainer when destroy() is called', async () => {
            vi.clearAllMocks();
            await target.initialize(mockCanvasContainer, mockSetApplicationState);
            target.targetContainer = new Container();
            target.targetContainer.removeAllListeners = vi.fn();

            const mockApp = { foo: 'bar', destroy: vi.fn() } as unknown as Application<Renderer>;
            target.app = mockApp;

            target.destroy();

            expect(target.app).toBe(mockApp);
            expect(target.app.destroy).toBeCalledTimes(1);
            expect(target.targetContainer.removeAllListeners).toBeCalledTimes(1);
        });

        it('Should unsubscribe from stores when destroyed', async () => {
            target.app = { destroy: vi.fn() } as any;
            target.targetContainer = { removeAllListeners: vi.fn() } as any;
            
            // Mock the unsubscribe functions
            const unsubscribeSpy = vi.fn();
            target.targetStoreUnsubscribe = unsubscribeSpy;
            target.editorStoreUnsubscribe = unsubscribeSpy;
            
            target.destroy();
            
            expect(unsubscribeSpy).toHaveBeenCalledTimes(2);
        });
    });
});