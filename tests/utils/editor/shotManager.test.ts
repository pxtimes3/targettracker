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

vi.mock('@/utils/editor/dragHandler', () => ({
  	DragHandler: vi.fn().mockImplementation(() => ({
    	handleSpriteDrag: vi.fn()
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
    // Define the mock functions inside the factory
    const subscribe = vi.fn((cb) => {
        cb({ groups: [] });
        return () => {};
    });

    return {
        TargetStore: {
            subscribe,
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

import { ShotManager } from '@/utils/editor/ShotManager';
import { Container, FederatedPointerEvent } from 'pixi.js';
import { ElementType } from '@/types/editor';
import { TargetStore } from '@/stores/TargetImageStore';
import { UserSettingsStore } from '@/stores/UserSettingsStore';
import { EditorStore } from '@/stores/EditorStore';


describe('ShotManager', () => {
	let shotManager: ShotManager;
	let mockContainer;

	beforeEach(() => {
		// Create a simple mock container
		mockContainer = {
			toLocal: vi.fn().mockReturnValue({ x: 10, y: 20 }),
			scale: { x: 1 },
			getChildByLabel: vi.fn().mockReturnValue(null) // Mock getChildByLabel to return null
		} as unknown as Container;
	
		// Reset mock counters
		vi.clearAllMocks();
	
		// Create mock group manager that returns a valid group
		const mockGroupManager = {
			getGroupContainer: vi.fn().mockResolvedValue(null),
			createGroup: vi.fn().mockReturnValue({
				group: { id: 1, shots: [] },
				container: new Container()
			}),
			getGroupStoreShots: vi.fn()
		};
	
		// Create the ShotManager instance with the mock group manager
		shotManager = new ShotManager(
			mockContainer,
			mockGroupManager as any,
			{ drawAllMetrics: vi.fn() } as any, // Mock metrics renderer
			{ handleSpriteDrag: vi.fn() } as any // Mock drag handler
		);
	
		// Mock the addElement method
		shotManager.addElement = vi.fn().mockResolvedValue(new Container());
	});
  
  	// Constructor initializes with required dependencies and subscribes to stores
	it('should initialize with required dependencies and subscribe to stores', () => {
		// Arrange
		const mockContainer = new Container();
		const mockGroupManager = { getGroupContainer: vi.fn() };
		const mockMetricsRenderer = { drawAllMetrics: vi.fn() };
		const mockDragHandler = { handleSpriteDrag: vi.fn() };

		// Reset mocks for this test
		vi.clearAllMocks();

		// Act
		const shotManager = new ShotManager(
			mockContainer,
			mockGroupManager as any,
			mockMetricsRenderer as any,
			mockDragHandler as any
		);

		// Assert
		expect(shotManager.targetContainer).toBe(mockContainer);
		expect(shotManager.groupManager).toBe(mockGroupManager);
		expect(shotManager.metricsRenderer).toBe(mockMetricsRenderer);
		expect(shotManager.dragHandler).toBe(mockDragHandler);
		expect(UserSettingsStore.subscribe).toHaveBeenCalled();
    	expect(TargetStore.subscribe).toHaveBeenCalled();
	});
  
	it('should call addElement with correct parameters when addShot and addPoa are called', async () => {
		// Arrange
		const mockContainer = new Container();
		const mockGroupManager = {
			getGroupContainer: vi.fn().mockResolvedValue(null),
			createGroup: vi.fn().mockReturnValue({
				group: { id: 1, shots: [] },
				container: new Container()
			})
		};
		const mockMetricsRenderer = { drawAllMetrics: vi.fn() };
		const mockDragHandler = { handleSpriteDrag: vi.fn() };
	
		const shotManager = new ShotManager(
			mockContainer,
			mockGroupManager as any,
			mockMetricsRenderer as any,
			mockDragHandler as any
		);
	
		// Mock addElement to track all calls
		shotManager.addElement = vi.fn().mockResolvedValue(new Container());
		
		// Mock TargetStore.getGroup to return null for the second call (addPoa)
		// This simulates a group without an existing POA
		TargetStore.getGroup = vi.fn().mockReturnValue(null);
	
		// Act
		await shotManager.addShot(100, 200, '1');
		
		// For addPoa, we need to mock a group with no POA
		TargetStore.getGroup = vi.fn().mockReturnValue({ id: 2 }); // Group exists but no POA
		await shotManager.addPoa(300, 400, '2');
	
		// Assert - check specific calls by index
		expect(shotManager.addElement).toHaveBeenCalledTimes(2);
		expect(shotManager.addElement).toHaveBeenNthCalledWith(1, {
			x: 100,
			y: 200,
			groupId: '1',
			type: ElementType.SHOT
		});
		expect(shotManager.addElement).toHaveBeenNthCalledWith(2, {
			x: 300,
			y: 400,
			groupId: '2',
			type: ElementType.POA
		});
	});

	
	// addElement creates and adds a shot element to the target container, ensuring TargetStore.addShot is properly mocked
    it('should create and add a shot element to the target container', async () => {
		// Arrange
		const mockContainer = new Container();
		mockContainer.toLocal = vi.fn().mockReturnValue({ x: 10, y: 20 });
		mockContainer.addChild = vi.fn();

		const mockGroupContainer = new Container();
		mockGroupContainer.addChild = vi.fn();

		const mockStoreGroup = {
			id: 1,
			shots: []
		};

		const shotManager = new ShotManager(mockContainer);
			shotManager.prepareGroupForElement = vi.fn().mockResolvedValue({
			groupContainer: mockGroupContainer,
			storeGroup: mockStoreGroup
		});

		shotManager.createShotGraphic = vi.fn().mockReturnValue(new Container());
		shotManager.metricsRenderer.drawAllMetrics = vi.fn();

		// Mock TargetStore.addShot
		TargetStore.addShot = vi.fn();

		// Act
		const result = await shotManager.addElement({ 
			x: 100, 
			y: 200, 
			groupId: '1', 
			type: ElementType.SHOT 
		});

		// Assert
		expect(shotManager.prepareGroupForElement).toHaveBeenCalledWith('1');
		expect(shotManager.createShotGraphic).toHaveBeenCalled();
		expect(TargetStore.addShot).toHaveBeenCalled();
		expect(mockGroupContainer.addChild).toHaveBeenCalled();
		expect(shotManager.metricsRenderer.drawAllMetrics).toHaveBeenCalledWith(1);
		expect(result).toBeDefined();
    });

	// Handle case when groupContainer or storeGroup is null/undefined in prepareGroupForElement
	it('should return undefined when groupContainer or storeGroup is null', async () => {
		// Arrange
		const mockContainer = new Container();
		const shotManager = new ShotManager(mockContainer);
	
		shotManager.prepareGroupForElement = vi.fn().mockResolvedValue({
			groupContainer: null,
			storeGroup: undefined
		});
	
		// Act
		const result = await shotManager.addElement({
			x: 100,
			y: 200,
			groupId: '1',
			type: ElementType.SHOT
		});
	
		// Assert
		expect(shotManager.prepareGroupForElement).toHaveBeenCalledWith('1');
		expect(result).toBeUndefined();
	});

	// Handle missing shots array in store group when adding a shot
	it('should handle missing shots array in store group when adding a shot', async () => {
		// Arrange
		const mockContainer = new Container();
		mockContainer.toLocal = vi.fn().mockReturnValue({ x: 10, y: 20 });
	
		const mockGroupContainer = new Container();
	
		// Store group without shots array
		const mockStoreGroup = {
			id: 1
			// shots array is missing
		};
	
		const shotManager = new ShotManager(mockContainer);
		shotManager.prepareGroupForElement = vi.fn().mockResolvedValue({
			groupContainer: mockGroupContainer,
			storeGroup: mockStoreGroup
		});
	
		// Mock console.error
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
	
		// Act
		const result = await shotManager.addElement({
			x: 100,
			y: 200,
			groupId: '1',
			type: ElementType.SHOT
		});
	
		// Assert
		expect(shotManager.prepareGroupForElement).toHaveBeenCalledWith('1');
		expect(consoleErrorSpy).toHaveBeenCalled();
		expect(consoleErrorSpy.mock.calls[0][0]).toContain('No shots-array found in store-group');
		expect(result).toBeUndefined();
	
		// Cleanup
		consoleErrorSpy.mockRestore();
	});

	// Ensure that an error is thrown when attempting to assign shots to a non-existent group
	it('should throw error when no group is found with specified ID', () => {
		// Arrange
		const mockContainer = new Container();
		const shotManager = new ShotManager(mockContainer);
	
		// @ts-ignore
		shotManager.editorStore = { selected: [{ label: 'shot-1-2', x: 10, y: 20 }] };
	
		// @ts-ignore
		shotManager.targetStore = { groups: [] };
	
		// Mock getChildByLabel to return null (no container found)
		mockContainer.getChildByLabel = vi.fn().mockReturnValue(null);
	
		// Act & Assert
		expect(() => {
			shotManager.assignSelectedShotsToGroup('3');
		}).toThrow('No group found with id: 3');
	
		// Verify that the store was checked for the group
		expect(shotManager.targetStore.groups.find).toBeDefined();
		expect(mockContainer.getChildByLabel).toHaveBeenCalledWith('3');
	});

	// assignSelectedShotsToGroup moves shots to a newly created group when 'createNew' is specified
	it('should move selected shots to a new group when assignSelectedShotsToGroup is called with "createNew"', () => {
		// Arrange
		const mockContainer = new Container();
		mockContainer.addChild = vi.fn(); // Mock the addChild method
		const mockGroup = { id: 2, shots: [] };
		const mockShot = new Container();
		mockShot.label = 'shot-0-1';
		mockShot.x = 10;
		mockShot.y = 20;
		mockShot.emit = vi.fn();
	
		const mockEditorStore = { selected: [mockShot] };
		const mockTargetStore = { groups: [{ id: 1, shots: [mockShot] }] };
		const mockUserSettings = {};
	
		const shotManager = new ShotManager(
			mockContainer
		);
		// @ts-ignore
		shotManager.editorStore = mockEditorStore;
		// @ts-ignore
		shotManager.targetStore = mockTargetStore;
		// @ts-ignore
		shotManager.userSettings = mockUserSettings;
	
		shotManager.groupManager.createGroup = vi.fn().mockReturnValue({ group: mockGroup, container: mockContainer });
		shotManager.targetContainer.getChildByLabel = vi.fn().mockReturnValue(mockContainer);
	
		TargetStore.setShot = vi.fn();
		TargetStore.removeShot = vi.fn();
	
		// Act
		shotManager.assignSelectedShotsToGroup('createNew');
	
		// Assert
		expect(shotManager.groupManager.createGroup).toHaveBeenCalled();
		expect(TargetStore.setShot).toHaveBeenCalledWith('0', 2, 10, 20, 0);
		expect(TargetStore.removeShot).toHaveBeenCalledWith("1", '0');
		expect(mockContainer.addChild).toHaveBeenCalledWith(mockShot);
	});

	it('should unsubscribe from userSettings and targetStore when destroy is called', () => {
		// Arrange
		const mockContainer = new Container();
		
		// Create mock unsubscribe functions
		const userSettingsUnsubscribe = vi.fn();
		const targetStoreUnsubscribe = vi.fn();
		
		// Mock the subscribe methods to return the unsubscribe functions
		UserSettingsStore.subscribe = vi.fn().mockReturnValue(userSettingsUnsubscribe);
		TargetStore.subscribe = vi.fn().mockReturnValue(targetStoreUnsubscribe);
		
		// Create the ShotManager instance
		const shotManager = new ShotManager(mockContainer);
		
		// Act
		shotManager.destroy();
		
		// Assert
		expect(userSettingsUnsubscribe).toHaveBeenCalled();
		expect(targetStoreUnsubscribe).toHaveBeenCalled();
	});

	// prepareGroupForElement creates a new group if one doesn't exist
	it('should create a new group when no group exists for the given groupId', async () => {
		const mockContainer = new Container();
		const mockGroupManager = {
			getGroupContainer: vi.fn().mockResolvedValue(null),
			createGroup: vi.fn().mockReturnValue({
			group: { id: 1, shots: [] },
			container: new Container()
			})
		};
	
		const mockTargetStore = {
			groups: []
		};
	
		const get = vi.fn().mockImplementation((store) => {
			if (store === EditorStore) return { selected: [] };
			if (store === TargetStore) return mockTargetStore;
			if (store === UserSettingsStore) return {};
		});
	
		// @ts-ignore
		const shotManager = new ShotManager(mockContainer, mockGroupManager);
	
		const result = await shotManager.prepareGroupForElement('1');
	
		expect(mockGroupManager.createGroup).toHaveBeenCalled();
		expect(result.groupContainer).not.toBeNull();
		expect(result.storeGroup).toEqual({ id: 1, shots: [] });
	});

	// removeShot properly calls removeChild on the container and removes a shot from the store
	it('should remove a shot from the store and container when removeShot is called', () => {
		// Arrange
		const mockContainer = new Container();
		const mockShot = new Container();
		mockShot.label = 'shot-0-1';
		mockContainer.addChild(mockShot);
	
		const shotManager = new ShotManager(mockContainer);
		mockContainer.getChildByLabel = vi.fn((label) => {
			if (label === 'shot-0-1') return mockShot;
			if (label === '1') return mockContainer; // Mocking group container retrieval
			return null;
		});
	
		const mockGroup = { id: 1, shots: [{ id: '0', group: 1, x: 0, y: 0, score: 0 }] };
		TargetStore.getGroup = vi.fn().mockReturnValue(mockGroup);
		TargetStore.removeShot = vi.fn();
		mockContainer.removeChild = vi.fn();
	
		shotManager.metricsRenderer.drawAllMetrics = vi.fn();
		shotManager.removeShotSprite = vi.fn();
	
		const mockEvent = {
			target: mockShot
		} as unknown as FederatedPointerEvent;
	
		// Act
		shotManager.removeShot(mockEvent);
	
		// Assert
		expect(TargetStore.removeShot).toHaveBeenCalledWith(1, '0');
		expect(shotManager.removeShotSprite).toHaveBeenCalledWith('shot-0-1', mockContainer);
	});

	// Test for createShotGraphic
	it('should create a shot graphic with correct properties', () => {
		// Arrange
		const shotManager = new ShotManager(new Container());
		
		// Act
		const shot = shotManager.createShotGraphic('test-shot-1');
		
		// Assert
		expect(shot).toBeInstanceOf(Container);
		expect(shot.label).toBe('test-shot-1');
		expect(shot.eventMode).toBe('dynamic');
		expect(shot.cursor).toBe('pointer');
		expect(shot.interactive).toBe(true);
		expect(shot.children.length).toBe(1);
		expect(shot.children[0].label).toBe('test-shot-1-graphics');
	});
	
	// Test for createPoaGraphic
	it('should create a POA graphic with correct properties', () => {
		// Arrange
		const shotManager = new ShotManager(new Container());
		
		// Act
		const poa = shotManager.createPoaGraphic('test-poa-1');
		
		// Assert
		expect(poa).toBeInstanceOf(Container);
		expect(poa.label).toBe('test-poa-1');
		expect(poa.eventMode).toBe('dynamic');
		expect(poa.cursor).toBe('pointer');
		expect(poa.interactive).toBe(true);
		expect(poa.children.length).toBe(1);
		expect(poa.children[0].label).toBe('test-poa-1-graphics');
	});
	
	// Test for setScale
	it('should calculate the correct scale based on container scale', () => {
		// Arrange
		const mockContainer = new Container();
		mockContainer.scale.x = 2;
		const shotManager = new ShotManager(mockContainer);
		
		// Act & Assert
		expect(shotManager.setScale()).toBe(0.5); // 1 / 2
		expect(shotManager.setScale(4)).toBe(2); // 4 / 2
	});
  
	// Test for updateRemainingShots
	it('should update shot labels after removing a shot', () => {
		// Arrange
		const mockContainer = new Container();
		const shotManager = new ShotManager(mockContainer);
		
		const mockGroupContainer = new Container();
		const shot1 = new Container();
		shot1.label = 'shot-0-1';
		const shot2 = new Container();
		shot2.label = 'shot-1-1';
		mockGroupContainer.addChild(shot1);
		mockGroupContainer.addChild(shot2);
		
		TargetStore.getGroup = vi.fn().mockReturnValue({ 
		id: 1, 
		shots: [
			{ id: '0', group: 1, x: 10, y: 10, score: 0 },
			{ id: '1', group: 1, x: 20, y: 20, score: 0 }
		] 
		});
		
		// Act
		shotManager.updateRemainingShots(1, mockGroupContainer);
		
		// Assert
		expect(shot1.label).toBe('shot-0-1');
		expect(shot2.label).toBe('shot-1-1');
	});
  
	// Test for when getChildByLabel returns a container but no matching group in store
	it('should handle case when container exists but no matching group in store', async () => {
		// Arrange
		const mockContainer = new Container();
		const mockGroupContainer = new Container();
		mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockGroupContainer);
		
		const shotManager = new ShotManager(mockContainer);
		// @ts-ignore
		shotManager.targetStore = { groups: [] }; // Empty groups array
		
		// Act
		const result = await shotManager.prepareGroupForElement('1');
		
		// Assert
		expect(result.groupContainer).toBeNull();
		expect(result.storeGroup).toBeUndefined();
		// Should log an error - you could spy on console.error to verify
	});

	// When a POA exists but no POA container is found, it should create a new POA
	it('should create a new POA when a POA exists but no POA container is found', async () => {
		// Arrange
		const mockContainer = new Container();
		const mockGroupContainer = new Container();
		mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockGroupContainer); // Return valid group container
		mockGroupContainer.getChildByLabel = vi.fn().mockReturnValue(null); // No existing POA container
		mockContainer.toLocal = vi.fn().mockReturnValue({ x: 10, y: 20 });

		// Mock TargetStore.getGroup to return a group with a POA
		TargetStore.getGroup = vi.fn().mockReturnValue({ 
			id: 1, 
			poa: { x: 5, y: 5 } 
		});
		
		// Mock TargetStore.updatePoa
		TargetStore.updatePoa = vi.fn();

		const shotManager = new ShotManager(mockContainer);
		shotManager.addElement = vi.fn().mockResolvedValue(new Container());

		// Act
		await shotManager.addPoa(100, 200, '1');

		// Assert
		expect(shotManager.addElement).toHaveBeenCalledWith({
			x: 100,
			y: 200,
			groupId: '1',
			type: ElementType.POA
		});
	});

    // The method should convert coordinates to local space using toLocal and update the position of an existing poaContainer.
    it('should convert coordinates to local space and update existing poaContainer', async () => {
        // Arrange
        const mockPoaContainer = {
            position: { x: 0, y: 0 }
        } as unknown as Container;

        const mockGroupContainer = {
            getChildByLabel: vi.fn().mockReturnValue(mockPoaContainer)
        } as unknown as Container;

        const mockContainer = {
            toLocal: vi.fn().mockReturnValue({ x: 10, y: 20 }),
            getChildByLabel: vi.fn().mockReturnValue(mockGroupContainer)
        } as unknown as Container;

        vi.spyOn(TargetStore, 'getGroup').mockReturnValue({ id: 0, poa: {x: 0, y: 0} });
        vi.spyOn(TargetStore, 'updatePoa').mockImplementation(() => {});

        const shotManager = new ShotManager(mockContainer);
        shotManager.targetContainer = mockContainer;

        // Act
        const result = await shotManager.addPoa(100, 200, '1');

        // Assert
        expect(mockContainer.toLocal).toHaveBeenCalledWith({ x: 100, y: 200 });
        expect(mockGroupContainer.getChildByLabel).toHaveBeenCalledWith(/poa-.*/);
        expect(TargetStore.updatePoa).toHaveBeenCalledWith(1, 10, 20);
        expect(result).toBeDefined();
    });	

    
    // The method should update the POA position in the TargetStore and return the updated POA container
    it('should update POA position in TargetStore when POA exists', async () => {
        // Arrange
        const mockContainer = new Container();
        mockContainer.toLocal = vi.fn().mockReturnValue({ x: 300, y: 400 });
        const mockGroupContainer = new Container();
        const mockPoaContainer = new Container();
        mockGroupContainer.getChildByLabel = vi.fn().mockReturnValue(mockPoaContainer);
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockGroupContainer);

        const shotManager = new ShotManager(mockContainer);

        TargetStore.getGroup = vi.fn().mockReturnValue({ poa: true });
        TargetStore.updatePoa = vi.fn();

        // Act
        const result = await shotManager.addPoa(300, 400, '1');

        // Assert
        expect(mockContainer.toLocal).toHaveBeenCalledWith({ x: 300, y: 400 });
        expect(mockPoaContainer.position).toMatchObject({ _x: 300, _y: 400 });
        expect(TargetStore.updatePoa).toHaveBeenCalledWith(1, 300, 400);
        expect(result).toBe(mockPoaContainer);
    });


});