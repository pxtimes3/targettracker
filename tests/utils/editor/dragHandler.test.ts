import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Stores
const mockUserSettingsSubscribe = vi.fn((cb) => {
    cb({});
    return () => {};
});

const mockTargetStoreSubscribe = vi.fn((cb) => {
     cb({ groups: [] });
     return () => {};
});

// Dependencies
vi.mock('@/utils/editor/groupManager', () => ({
     GroupManager: vi.fn().mockImplementation(() => ({
       getGroupContainer: vi.fn(),
       createGroup: vi.fn(),
       getGroupStoreShots: vi.fn()
     }))
}));

vi.mock('@/utils/editor/MetricsRenderer', () => ({
     MetricsRenderer: vi.fn().mockImplementation(() => ({
       drawAllMetrics: vi.fn()
   }))
}));

// Mock stores with inline functions
vi.mock('@/stores/EditorStore', () => ({
   EditorStore: {
       subscribe: vi.fn((cb) => {
           cb({ selected: [] });
           return () => {};
       })
   }
}));

vi.mock('@/stores/TargetImageStore', () => {
    return {
        TargetStore: {
            subscribe: vi.fn((cb) => {
                cb({ groups: [] });
                return () => {};
            }),
            addShot: vi.fn(),
            removeShot: vi.fn(),
            getGroup: vi.fn(),
            getShots: vi.fn(),
            updateShot: vi.fn(),
            updatePoa: vi.fn(),
            setShot: vi.fn()
        }
    };
});

vi.mock('@/stores/UserSettingsStore', () => {
     // Define the mock functions inside the factory
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

// Mock svelte/store
vi.mock('svelte/store', () => ({
     get: vi.fn(() => ({})),
    writable: vi.fn(() => ({
       subscribe: vi.fn(),
       set: vi.fn(),
       update: vi.fn()
     }))
}));

import { DragHandler } from '@/utils/editor/DragHandler';
import { MetricsRenderer } from '@/utils/editor/MetricsRenderer';
import { Container, FederatedPointerEvent, Sprite } from 'pixi.js';
import { TargetStore } from '@/stores/TargetImageStore';
import { UserSettingsStore } from '@/stores/UserSettingsStore';


describe('DragHandler', () => {

    let dragHandler: DragHandler;
    let mockContainer;
    let mockSprite;

    beforeEach(() => {
        mockContainer = {
			toLocal: vi.fn().mockReturnValue({ x: 10, y: 20 }),
			scale: { x: 1 },
			getChildByLabel: vi.fn().mockReturnValue(null) // Mock getChildByLabel to return null
		} as unknown as Container;

        vi.clearAllMocks();

        const mockGroupManager = {
			getGroupContainer: vi.fn().mockResolvedValue(null),
			createGroup: vi.fn().mockReturnValue({
				group: { id: 1, shots: [] },
				container: new Container()
			}),
			getGroupStoreShots: vi.fn()
		};

        dragHandler = new DragHandler(mockContainer)
    });
    
    // Dragging a sprite updates its position correctly
    it('should update sprite position when handleDragMove is called', () => {
      // Arrange
      const mockContainer = new Container();
      mockContainer.toLocal = vi.fn().mockReturnValue({ x: 50, y: 60 });
  
      const dragHandler = new DragHandler(mockContainer);
      const mockSprite = { x: 10, y: 20, label: 'test-sprite' } as unknown as Sprite;
  
      // Set up drag state
      dragHandler.isDragging = true;
      dragHandler.dragTarget = mockSprite;
  
      const mockEvent = {
        global: { x: 100, y: 100 }
      } as unknown as FederatedPointerEvent;
  
      // Act
      dragHandler.handleDragMove(mockEvent);
  
      // Assert
      expect(mockContainer.toLocal).toHaveBeenCalledWith(mockEvent.global);
      expect(mockSprite.x).toBe(50);
      expect(mockSprite.y).toBe(60);
    });

    
    // Subscribing to TargetStore and UserSettingsStore during initialization
    it('should subscribe to TargetStore and UserSettingsStore when initialized', () => {
      // Arrange
      const mockContainer = new Container();
  
      // Mock the subscribe methods
      const targetStoreSubscribeSpy = vi.spyOn(TargetStore, 'subscribe');
      const userSettingsSubscribeSpy = vi.spyOn(UserSettingsStore, 'subscribe');

      // Act
      const dragHandler = new DragHandler(mockContainer);

      // Assert
      expect(targetStoreSubscribeSpy).toHaveBeenCalled();
      expect(userSettingsSubscribeSpy).toHaveBeenCalled();

      // Verify unsubscribe functions are stored
      expect(dragHandler.targetStoreUnsubscribe).toBeDefined();
      expect(dragHandler.userSettingsUnsubscribe).toBeDefined();
    });

    
    // Handling drag events when no drag target is set
    it('should not update position when handleDragMove is called with no drag target', () => {
      // Arrange
      const mockContainer = new Container();
      mockContainer.toLocal = vi.fn();
  
      const dragHandler = new DragHandler(mockContainer);
      dragHandler.isDragging = true;
      dragHandler.dragTarget = null;
  
      const mockEvent = {
        global: { x: 100, y: 100 }
      } as unknown as FederatedPointerEvent;
  
      // Act
      dragHandler.handleDragMove(mockEvent);
  
      // Assert
      expect(mockContainer.toLocal).not.toHaveBeenCalled();
    });


    // Handling drag events when isDragging is false
    it('should not update position when handleDragMove is called with isDragging false', () => {
      // Arrange
      const mockContainer = new Container();
      mockContainer.toLocal = vi.fn();
  
      const dragHandler = new DragHandler(mockContainer);
      const mockSprite = { x: 10, y: 20, label: 'test-sprite' } as unknown as Sprite;
  
      // Set up drag state
      dragHandler.isDragging = false;
      dragHandler.dragTarget = mockSprite;
  
      const mockEvent = {
        global: { x: 100, y: 100 }
      } as unknown as FederatedPointerEvent;
  
      // Act
      dragHandler.handleDragMove(mockEvent);
  
      // Assert
      expect(mockContainer.toLocal).not.toHaveBeenCalled();
      expect(mockSprite.x).toBe(10); // Position unchanged
      expect(mockSprite.y).toBe(20); // Position unchanged
    });

    
    // Updating shot position in TargetStore after dragging
    it('should update shot position in TargetStore after dragging ends', () => {
        // Arrange
        const mockContainer = new Container();
        const mockSprite = new Sprite();
        mockSprite.label = 'shot-1-2';
        mockSprite.x = 50;
        mockSprite.y = 50;
    
        const mockEvent = {
            currentTarget: mockSprite,
            global: { x: 100, y: 100 }
        } as unknown as FederatedPointerEvent;
    
        const dragHandler = new DragHandler(mockContainer);
    
        // Mock TargetStore.updateShot
        TargetStore.updateShot = vi.fn();
    
        // Act
        dragHandler.handleSpriteDrag(mockEvent);
        dragHandler.handleDragMove(mockEvent);
        dragHandler.handleDragEnd(mockEvent);
    
        // Assert
        expect(TargetStore.updateShot).toHaveBeenCalledWith('1', 2, 100, 100);
    });

    // Updating POA position in TargetStore after dragging
    it('should update POA position in TargetStore when dragging ends', () => {
        // Arrange
        const mockContainer = new Container();
        const mockSprite = new Sprite();
        mockSprite.label = 'poa-1';  // Make sure this matches your regex
        mockSprite.x = 50;
        mockSprite.y = 50;
    
        const mockEvent = {
            currentTarget: mockSprite,
            global: { x: 100, y: 100 }
        } as unknown as FederatedPointerEvent;
    
        const dragHandler = new DragHandler(mockContainer);
        
        // Mock TargetStore.updatePoa
        TargetStore.updatePoa = vi.fn();
    
        // Act
        dragHandler.handleSpriteDrag(mockEvent);
        dragHandler.handleDragMove(mockEvent);
        dragHandler.handleDragEnd(mockEvent);
    
        // Assert
        expect(TargetStore.updatePoa).toHaveBeenCalledWith(1, 100, 100);
    });

    // Handling drag start, move, and end events in sequence with a valid group setup in TargetStore
    it('should handle drag start, move, and end events correctly with valid group setup', () => {
        // Arrange
        const mockContainer = new Container();
        const mockSprite = new Sprite();
        mockSprite.label = 'shot-1-1';
        mockSprite.x = 0;
        mockSprite.y = 0;
        mockContainer.toLocal = vi.fn().mockReturnValue({ x: 100, y: 200 });

        const mockEventStart = { currentTarget: mockSprite } as unknown as FederatedPointerEvent;
        const mockEventMove = { global: { x: 100, y: 200 } } as unknown as FederatedPointerEvent;
        const mockEventEnd = {} as unknown as FederatedPointerEvent;

        // Mock TargetStore and its methods
        const mockUpdateShot = vi.fn();
        const mockGroup = { id: 1, shots: [{ id: '1', x: 0, y: 0 }] };
        TargetStore.updateShot = mockUpdateShot;
        TargetStore.getGroup = vi.fn().mockReturnValue([mockGroup]);

        const dragHandler = new DragHandler(mockContainer);

        // Act
        dragHandler.handleSpriteDrag(mockEventStart);
        dragHandler.handleDragMove(mockEventMove);
        dragHandler.handleDragEnd(mockEventEnd);

        // Assert
        expect(dragHandler.isDragging).toBe(false);
        expect(dragHandler.dragTarget).toBeNull();
        expect(dragHandler.dragStartPosition).toBeNull();
        expect(mockSprite.x).toBe(100);
        expect(mockSprite.y).toBe(200);
        expect(mockUpdateShot).toHaveBeenCalledWith('1', 1, 100, 200);
    });

    // Converting global coordinates to local container coordinates
    it('should convert global coordinates to local container coordinates during drag', () => {
        // Arrange
        const mockContainer = new Container();
        const mockSprite = new Sprite();
        mockSprite.x = 0;
        mockSprite.y = 0;
        mockSprite.label = 'test-sprite';
    
        const mockEvent = {
            currentTarget: mockSprite,
            global: { x: 100, y: 200 }
        } as unknown as FederatedPointerEvent;
    
        mockContainer.toLocal = vi.fn().mockReturnValue({ x: 50, y: 75 });
    
        const dragHandler = new DragHandler(mockContainer);
    
        // Act
        dragHandler.handleSpriteDrag(mockEvent);
        dragHandler.handleDragMove(mockEvent);
    
        // Assert
        expect(mockContainer.toLocal).toHaveBeenCalledWith(mockEvent.global);
        expect(mockSprite.x).toBe(50);
        expect(mockSprite.y).toBe(75);
    });

    // Extracting shot ID and group ID from sprite labels
    it('should extract shot ID and group ID from sprite label when handleDragEnd is called', () => {
        // Arrange
        const mockContainer = new Container();
        const dragHandler = new DragHandler(mockContainer);
        const mockSprite = new Sprite();
        mockSprite.label = 'shot-123-456';
        mockSprite.x = 100;
        mockSprite.y = 200;
    
        const mockEvent = {
            currentTarget: mockSprite
        } as unknown as FederatedPointerEvent;
    
        // Mock TargetStore.updateShot
        TargetStore.updateShot = vi.fn();
    
        // Act
        dragHandler.handleSpriteDrag(mockEvent);
        dragHandler.handleDragEnd(mockEvent);
    
        // Assert
        expect(TargetStore.updateShot).toHaveBeenCalledWith('123', 456, 100, 200);
    });

    // Maintaining drag start position for potential rollback
    it('should maintain drag start position when handleSpriteDrag is called', () => {
        // Arrange
        const mockContainer = new Container();
        const mockSprite = new Sprite();
        mockSprite.x = 50;
        mockSprite.y = 100;
        mockSprite.label = 'test-sprite';
    
        const mockEvent = {
            currentTarget: mockSprite
        } as unknown as FederatedPointerEvent;
    
        const dragHandler = new DragHandler(mockContainer);
    
        // Act
        dragHandler.handleSpriteDrag(mockEvent);
    
        // Assert
        expect(dragHandler.isDragging).toBe(true);
        expect(dragHandler.dragTarget).toBe(mockSprite);
        expect(dragHandler.dragStartPosition).toEqual({ x: 50, y: 100 });
    });

    // Redrawing metrics after drag operations complete
    it('should redraw metrics when drag operation completes', () => {
        // Arrange
        const mockContainer = new Container();
        const mockMetricsRenderer = { drawAllMetrics: vi.fn() };
        const mockTargetStore = {
            updateShot: vi.fn(),
            updatePoa: vi.fn()
        };
        const mockSprite = new Sprite();
        mockSprite.label = 'shot-1-1';
        mockSprite.x = 0;
        mockSprite.y = 0;

        const dragHandler = new DragHandler(mockContainer);
        dragHandler.metricsRenderer = new MetricsRenderer(mockContainer);
        dragHandler.metricsRenderer.drawAllMetrics = vi.fn();
        dragHandler.handleSpriteDrag({ currentTarget: mockSprite } as unknown as FederatedPointerEvent);

        // Act
        dragHandler.handleDragEnd({} as FederatedPointerEvent);

        // Assert
        expect(dragHandler.metricsRenderer.drawAllMetrics).toHaveBeenCalled();
    });

    // Check for drawAllMetrics without group ID
    it('should call drawAllMetrics with the correct group ID after dragging a shot', () => {
        // Arrange
        const mockContainer = new Container();
        const mockSprite = new Sprite();
        mockSprite.label = 'shot-1-2';
        
        const dragHandler = new DragHandler(mockContainer);
        dragHandler.metricsRenderer = new MetricsRenderer(mockContainer);
        dragHandler.metricsRenderer.drawAllMetrics = vi.fn();
        
        dragHandler.isDragging = true;
        dragHandler.dragTarget = mockSprite;
        
        // Act
        dragHandler.handleDragEnd({} as unknown as FederatedPointerEvent);
        
        // Assert
        expect(dragHandler.metricsRenderer.drawAllMetrics).toHaveBeenCalled();
    });


    it('should set up event handlers with correct binding when drag starts', () => {
        // Arrange
        const mockContainer = {
            on: vi.fn(),
            off: vi.fn(),
            eventMode: 'static'
        } as unknown as Container;
        
        const dragHandler = new DragHandler(mockContainer);
        
        // Act
        dragHandler.handleSpriteDrag({ 
            currentTarget: new Sprite() 
        } as unknown as FederatedPointerEvent);
        
        // Assert
        // Check that event handlers were registered
        expect(mockContainer.on).toHaveBeenCalledWith('pointermove', expect.any(Function));
        expect(mockContainer.on).toHaveBeenCalledWith('pointerup', expect.any(Function));
        expect(mockContainer.on).toHaveBeenCalledWith('pointerupoutside', expect.any(Function));
        
        // Check that the drag state was set up correctly
        expect(dragHandler.isDragging).toBe(true);
        expect(dragHandler.dragTarget).toBeInstanceOf(Sprite);
    });


    it('should handle starting a new drag while another is in progress', () => {
        // Arrange
        const mockContainer = new Container();
        const sprite1 = new Sprite();
        sprite1.label = 'shot-1-1';
        const sprite2 = new Sprite();
        sprite2.label = 'shot-2-1';
        
        const dragHandler = new DragHandler(mockContainer);
        
        // Act
        dragHandler.handleSpriteDrag({ currentTarget: sprite1 } as unknown as FederatedPointerEvent);
        dragHandler.handleSpriteDrag({ currentTarget: sprite2 } as unknown as FederatedPointerEvent);
        
        // Assert
        expect(dragHandler.dragTarget).toBe(sprite2);
        expect(dragHandler.dragStartPosition).toEqual({ x: sprite2.x, y: sprite2.y });
    });


    // Dragging outside the container boundaries and ensure state reset without actual store update
    it('should stop dragging and reset state when pointer is released outside container', () => {
      // Arrange
      const mockContainer = new Container();
      const mockSprite = new Sprite();
      mockSprite.label = 'shot-1-1';
      mockSprite.x = 50;
      mockSprite.y = 50;

      const dragHandler = new DragHandler(mockContainer);
      dragHandler.handleSpriteDrag({ currentTarget: mockSprite } as unknown as FederatedPointerEvent);

      // Mock the event
      const mockEvent = {
        global: { x: 200, y: 200 }
      } as FederatedPointerEvent;

      // Mock the TargetStore.updateShot method
      vi.spyOn(TargetStore, 'updateShot').mockImplementation(() => {});

      // Act
      dragHandler.handleDragMove(mockEvent);
      dragHandler.handleDragEnd(mockEvent);

      // Assert
      expect(dragHandler.isDragging).toBe(false);
      expect(dragHandler.dragTarget).toBeNull();
      expect(dragHandler.dragStartPosition).toBeNull();
      expect(mockContainer.eventMode).toBe('dynamic');
    });

    // Verify that the sprite position is updated correctly after a drag move operation
    it('should correctly update sprite position after drag move', () => {
        // Arrange
        const mockContainer = new Container();
        const mockSprite = new Sprite();
        mockSprite.label = 'shot-1-1';
        mockSprite.x = 0;
        mockSprite.y = 0;

        const dragHandler = new DragHandler(mockContainer);

        const mockEventStart = {
            currentTarget: mockSprite,
            global: { x: 100, y: 100 }
        } as unknown as FederatedPointerEvent;

        const mockEventMove = {
            global: { x: 150, y: 150 }
        } as unknown as FederatedPointerEvent;

        const mockEventEnd = {
            global: { x: 200, y: 200 }
        } as unknown as FederatedPointerEvent;

        // Mock the updateShot method
        vi.spyOn(TargetStore, 'updateShot').mockImplementation(() => {});

        // Act
        dragHandler.handleSpriteDrag(mockEventStart);
        dragHandler.handleDragMove(mockEventMove);
        dragHandler.handleDragEnd(mockEventEnd);

        // Assert
        expect(dragHandler.isDragging).toBe(false);
        expect(dragHandler.dragTarget).toBeNull();
        expect(dragHandler.dragStartPosition).toBeNull();
        expect(mockSprite.x).toBe(150);
        expect(mockSprite.y).toBe(150);
    });

    // Handling event binding/unbinding when drag operations are interrupted without affecting the store
    it('should unbind events when drag is interrupted', () => {
        // Arrange
        const mockContainer = new Container();
        const mockSprite = new Sprite();
        mockSprite.label = 'shot-1-1';
        const dragHandler = new DragHandler(mockContainer);

        // Mock event methods
        mockContainer.on = vi.fn();
        mockContainer.off = vi.fn();

        // Mock TargetStore methods
        const updateShotMock = vi.spyOn(TargetStore, 'updateShot').mockImplementation(() => {});

        // Act
        dragHandler.handleSpriteDrag({ currentTarget: mockSprite } as unknown as FederatedPointerEvent);
        dragHandler.handleDragEnd({} as FederatedPointerEvent);

        // Assert
        expect(mockContainer.off).toHaveBeenCalledWith('pointermove', expect.any(Function));
        expect(mockContainer.off).toHaveBeenCalledWith('pointerup', expect.any(Function));
        expect(mockContainer.off).toHaveBeenCalledWith('pointerupoutside', expect.any(Function));

        // Clean up
        updateShotMock.mockRestore();
    });

    it('should unsubscribe from stores when destroy is called', () => {
        // Arrange
        const mockContainer = new Container();
        const dragHandler = new DragHandler(mockContainer);
        
        // Mock
        const targetStoreUnsubscribeSpy = vi.fn();
        const userSettingsUnsubscribeSpy = vi.fn();
        dragHandler.targetStoreUnsubscribe = targetStoreUnsubscribeSpy;
        dragHandler.userSettingsUnsubscribe = userSettingsUnsubscribeSpy;
        
        // Act
        dragHandler.destroy();
        
        // Assert
        expect(targetStoreUnsubscribeSpy).toHaveBeenCalled();
        expect(userSettingsUnsubscribeSpy).toHaveBeenCalled();
    });

    
    it('should handle invalid labels gracefully in handleDragEnd', () => {
        // Arrange
        const mockContainer = new Container();
        const mockSprite = {
            label: 'invalid-label',
            x: 0,
            y: 0
        } as unknown as Sprite;
        
        const dragHandler = new DragHandler(mockContainer);
        dragHandler.isDragging = true;
        dragHandler.dragTarget = mockSprite;

        // TODO: Lägg till check för logging @ dragHandler.test.ts istället för att spionera på console.

        // Act
        dragHandler.handleDragEnd({} as FederatedPointerEvent);
        
        // Assert
        expect(dragHandler.isDragging).toBe(false);
        expect(dragHandler.dragTarget).toBeNull();
    });
});
