import { EditorStore } from '@/stores/EditorStore';
import { UserSettingsStore } from '@/stores/UserSettingsStore';
import { EditorCrosshair } from '@/utils/editor/crosshairs';
import { Container, Application } from 'pixi.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/stores/EditorStore', () => ({
    EditorStore: {
        subscribe: vi.fn((cb) => {
            cb({ selected: [] });
            return () => {};
        })
    }
 }));

 vi.mock('@/stores/UserSettingsStore', () => {
    const subscribe = vi.fn((cb) => {
      cb({});
      return () => {};
    });

    return {
      UserSettingsStore: {
            subscribe
      }
    };
});

vi.mock('svelte/store', () => ({
    get: vi.fn().mockImplementation((store) => {
        if (store === EditorStore) return {};
        if (store === UserSettingsStore) return {};
        return {};
    }),
    writable: vi.fn(() => ({
        subscribe: vi.fn(),
        set: vi.fn(),
        update: vi.fn()
    }))
}));

describe('EditorCrosshair', () => {
    let mockContainer: Container;
    let mockApp;

    beforeEach(() => {
        vi.clearAllMocks();

        mockContainer = new Container();
    });

    it('should initialize with default position and visibility', () => {
        // Arrange
        mockApp = { ticker: { add: vi.fn() } } as unknown as Application;
        mockContainer = new Container();
        mockContainer.addChild = vi.fn();

        const mockEditorStore = { /* mock editor store properties */ };
        const mockUserSettings = { editorcrosshair: true };

        const crosshair = new EditorCrosshair(mockContainer, mockApp);
        // @ts-ignore
        crosshair.editorStore = mockEditorStore;
        // @ts-ignore
        crosshair.userSettings = mockUserSettings;

        // Act
        const addChildSpy = vi.spyOn(mockContainer, 'addChild');
        const crosshairContainer = addChildSpy.mock.calls[0][0] as Container;
        const [nLine, sLine, eLine, wLine] = crosshairContainer.children;

        // Assert
        expect(addChildSpy).toHaveBeenCalled();
        expect(crosshairContainer).toBeInstanceOf(Container);
        expect(crosshairContainer.label).toBe('editorCrosshair');
        expect(crosshairContainer.children.length).toBe(4);
        expect(nLine.label).toBe('N-Line');
        expect(sLine.label).toBe('S-Line');
        expect(eLine.label).toBe('E-Line');
        expect(wLine.label).toBe('W-Line');
        expect(crosshair.position).toEqual({ x: 0, y: 0 });
        expect(crosshair.visible).toBe(true);
        expect(crosshair.app).toBe(mockApp);
        expect(crosshair.targetContainer).toBe(mockContainer);
        expect(mockApp.ticker.add).toHaveBeenCalled();
        expect(crosshair.position).toEqual({x: 0, y: 0});
        expect(crosshair.visible).toBe(true);
        expect(crosshair.editorStore).toBe(mockEditorStore);
        expect(crosshair.userSettings).toBe(mockUserSettings);
    });

    it('should hide crosshairs if editorCrosshair is false', () => {
        // Arrange
        const tickerAddMock = vi.fn();
        mockApp = { ticker: { add: tickerAddMock } } as unknown as Application;
        mockContainer = new Container();
        mockContainer.addChild = vi.fn();

        const mockEditorStore = { };
        const mockUserSettings = { editorcrosshair: false };

        const crosshair = new EditorCrosshair(mockContainer, mockApp);
        // @ts-ignore
        crosshair.editorStore = mockEditorStore;
        // @ts-ignore
        crosshair.userSettings = mockUserSettings;

        const addChildSpy = vi.spyOn(mockContainer, 'addChild');
        const crosshairContainer = addChildSpy.mock.calls[0][0] as Container;
        const [nLine, sLine, eLine, wLine] = crosshairContainer.children;

        // Tick!
        const tickerCallback = tickerAddMock.mock.calls[0][0];
        tickerCallback();

        // Act
        expect(nLine.visible).toBe(false);
        expect(sLine.visible).toBe(false);
        expect(eLine.visible).toBe(false);
        expect(wLine.visible).toBe(false);
    });

    it('should show crosshairs if editorCrosshair is true', () => {
        // Arrange
        const tickerAddMock = vi.fn();
        mockApp = { ticker: { add: tickerAddMock } } as unknown as Application;
        mockContainer = new Container();
        mockContainer.addChild = vi.fn();

        const mockEditorStore = { };
        const mockUserSettings = { editorcrosshair: true };

        const crosshair = new EditorCrosshair(mockContainer, mockApp);
        // @ts-ignore
        crosshair.editorStore = mockEditorStore;
        // @ts-ignore
        crosshair.userSettings = mockUserSettings;

        const addChildSpy = vi.spyOn(mockContainer, 'addChild');
        const crosshairContainer = addChildSpy.mock.calls[0][0] as Container;
        const [nLine, sLine, eLine, wLine] = crosshairContainer.children;

        // Tick!
        const tickerCallback = tickerAddMock.mock.calls[0][0];
        tickerCallback();

        // Act
        expect(nLine.visible).toBe(true);
        expect(sLine.visible).toBe(true);
        expect(eLine.visible).toBe(true);
        expect(wLine.visible).toBe(true);
    });
});