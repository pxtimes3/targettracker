import { describe, it, expect, vi, beforeEach } from 'vitest';

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
            activeGroup: vi.fn(),
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

import { DragHandler } from '@/utils/editor/dragHandler';
import { Container } from 'pixi.js';
import { TargetStore } from '@/stores/TargetImageStore';
import { UserSettingsStore } from '@/stores/UserSettingsStore';
import { GroupManager } from '@/utils/editor/groupManager';
import { get } from 'svelte/store';
import type { GroupInterface } from '../../../src/lib/stores/TargetImageStore';


describe('GroupManager', () => {
    let groupManager: GroupManager;
    let mockContainer: Container;
    let mockActiveGroupContainer: Container;

    beforeEach(() => {
        vi.clearAllMocks();

        mockContainer = new Container();
        mockActiveGroupContainer = new Container();

        mockContainer.getChildByLabel = vi.fn().mockImplementation(label => {
            if (label === '1') return mockActiveGroupContainer;
            return null;
        });

        const mockTargetStore = {
            activeGroup: 1,
            groups: [{ id: 1 }, {id: 666}],
        };

        (get as unknown as ReturnType<typeof vi.fn>).mockImplementation((store) => {
            if (store === TargetStore) return mockTargetStore;
            if (store === UserSettingsStore) return {};
            return {};
        });

        groupManager = new GroupManager(mockContainer);

        // @ts-ignore
        groupManager.targetStore = {
            activeGroup: 1,
            groups: [{ id: 1 }]
        };
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

    it('should return the active group container when getCurrentGroupContainer is called', () => {
        // Setup the mock to return our container
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockActiveGroupContainer);
        
        // Act
        const result = groupManager.getCurrentGroupContainer;
        
        // Assert
        expect(mockContainer.getChildByLabel).toHaveBeenCalledWith('1');
        expect(result).toBe(mockActiveGroupContainer);
    });
    
    it('should throw an error when the active group container does not exist', () => {
        // Arrange - make getChildByLabel return null
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(null);
        
        // Act & Assert
        expect(() => {
            const result = groupManager.getCurrentGroupContainer;
        }).toThrow();
    });

    it('should return undefined and log error if an non-existing group is removed', () => {
        // Arrange
        const mockGroupContainer = new Container();
        mockGroupContainer.label = '1';

        mockContainer.addChild(mockGroupContainer);
        mockContainer.removeChild = vi.fn();
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(null);

        // @ts-ignore
        groupManager.targetStore = {
            groups: [{ id: 1, shots: [] }],
            activeGroup: 1
        };

        const consoleSpy = vi.spyOn(console, 'error');

        // Act
        const result = groupManager.removeGroup('666');

        // Assert
        expect(result).toBeUndefined();
        expect(consoleSpy).toHaveBeenCalledWith('No such group (666) in targetStore.');

        // Housekeeping
        consoleSpy.mockRestore();
    });

    it('should return undefined and log error if an non-existing group container is removed', () => {
        // Set up the targetStore with a group that has a matching ID
        // @ts-ignore
        groupManager.targetStore = {
            groups: [{ id: 1, shots: [] }, { id: 2, shots: [] }],
            activeGroup: 1
        };
        
        // Make getChildByLabel return null to simulate a missing container
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(null);
        
        // Spy on console.error
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        // Act
        const result = groupManager.removeGroup('1');
        
        // Assert
        expect(result).toBeUndefined();
        expect(consoleSpy).toHaveBeenCalledWith('No such groupContainer (1) in targetContainer.');
        
        // Housekeeping
        consoleSpy.mockRestore();
    });

    it('should return undefined and log warning if last group is asked to be removed', () => {
        const mockGroupContainer = new Container();
        mockGroupContainer.label = '1';
        
        mockContainer.addChild(mockGroupContainer);
        mockContainer.removeChild = vi.fn();
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(null);

        // @ts-ignore
        groupManager.targetStore = {
            groups: [{ id: 1, shots: [] }],
            activeGroup: 1
        };

        const consoleSpy = vi.spyOn(console, 'warn');

        const result = groupManager.removeGroup('1');

        expect(result).toBeUndefined();
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringMatching(/Tried to remove the one group that exists/)
        );

        consoleSpy.mockRestore();
    });

    // Removing a group successfully removes it from both store and container
    it('should remove a group from both store and container when removeGroup is called', () => {
        // Arrange
        const mockGroupContainer1 = new Container();
        mockGroupContainer1.label = '1';

        const mockGroupContainer2 = new Container();
        mockGroupContainer2.removeChildren = vi.fn();
        mockGroupContainer2.label = '2';

        mockContainer.addChild(mockGroupContainer1, mockGroupContainer2);

        expect(mockContainer.children.length).toBe(2);

        mockContainer.getChildByLabel = vi.fn().mockImplementation((label) => {
            if (label === '1') return mockGroupContainer1;
            if (label === '2') return mockGroupContainer2;
            return null;
        });
        
        const originalRemoveChild = mockContainer.removeChild;
        mockContainer.removeChild = vi.fn().mockImplementation((child) => {
            // Call the original method to actually remove the child
            const result = originalRemoveChild.call(mockContainer, child);
            return result;
        });
        
        // @ts-ignore
        groupManager.targetStore = {
            groups: [{ id: 1, shots: [] }, { id: 2, shots: [] }],
            activeGroup: 1
        };
        
        // Act
        const result = groupManager.removeGroup('2');

        // Assert
        expect(mockContainer.getChildByLabel).toHaveBeenCalledWith('2');
        expect(mockGroupContainer2.removeChildren).toHaveBeenCalled();
        expect(mockContainer.removeChild).toHaveBeenCalledWith(mockGroupContainer2);
        expect(mockContainer.children.length).toBe(1);
        expect(mockContainer.children[0]).toBe(mockGroupContainer1);
        expect(groupManager.targetStore.groups.length).toBe(1);
        expect(groupManager.targetStore.activeGroup).toBe(1);
    });

    // Getting a group container by label returns the correct container
    it('should return the correct group container when getGroupContainer is called with a valid label', async () => {
        // Arrange
        const mockContainer = new Container();
        const mockGroupContainer = new Container();
        mockGroupContainer.label = '1';
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockGroupContainer);
    
        const groupManager = new GroupManager(mockContainer);
    
        // Act
        const result = await groupManager.getGroupContainer('1');
    
        // Assert
        expect(mockContainer.getChildByLabel).toHaveBeenCalledWith('1');
        expect(result).toBe(mockGroupContainer);
    });

    // Getting group store shots returns the shot IDs for a valid group
    it('should return shot IDs for a valid group when getGroupStoreShots is called', () => {
        // Arrange
        const mockContainer = new Container();
        // @ts-ignore
        const mockGetShots = vi.spyOn(TargetStore, 'getShots').mockReturnValue([{ id: 'shot-1' }, { id: 'shot-2' }]);
        const groupManager = new GroupManager(mockContainer);

        // Act
        const shotIds = groupManager.getGroupStoreShots(1);

        // Assert
        expect(shotIds).toEqual(['shot-1', 'shot-2']);
        expect(mockGetShots).toHaveBeenCalledWith(1);

        // Cleanup
        mockGetShots.mockRestore();
    });

    // Creating a group when createNewGroupContainer fails should return null
    it('should return null when createNewGroupContainer fails', () => {
        // Arrange
        const groupManager = new GroupManager(mockContainer);

        // Mock console.error
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        // Mock createNewTargetStoreGroup to return a valid group
        groupManager.createNewTargetStoreGroup = vi.fn().mockReturnValue({
            id: 1,
            shots: [],
            poa: { x: 0, y: 0 },
            metrics: {},
            score: 0
        });

        // Mock createNewGroupContainer to simulate failure
        groupManager.createNewGroupContainer = vi.fn().mockReturnValue(null);

        // Act
        const result = groupManager.createGroup();

        // Assert
        expect(result).toBeNull();
        expect(console.error).toHaveBeenCalledWith('Failed to createNewGroupContainer');

        // Restore console.error
        consoleErrorSpy.mockRestore();
    });

    // Should return created container when createNewGroupContainer is called
    it('Should return created container when createNewGroupContainer is called', () => {
        // Arrange
        const groupManager = new GroupManager(mockContainer);
        
        const result = groupManager.createNewGroupContainer(1);
        
        expect(result).toBeTypeOf("object");
        expect(result?.label).toBe('1');
    });

    // An error should be logged if we fail to create a new groupContainer
    it('Should return null and log error when newGroupContainer fails', () => {
        // Arrange
        const originalAddChild = mockContainer.addChild;

        const groupManager = new GroupManager(mockContainer);
        
        mockContainer.addChild = vi.fn().mockImplementation(() => {
            throw Error();
        })
        
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        // Act
        const result = groupManager.createNewGroupContainer(1);
        
        // Assert
        expect(result).toBe(null);
        expect(console.error).toHaveBeenCalledWith('Failed to create new group!', expect.any(Error));

        // Housekeeping
        mockContainer.addChild = originalAddChild;
        consoleErrorSpy.mockRestore();
    });

    // Create TargetStoreGroup should increment the ID and return the correct group
    it('Should increment the group id and return the correct group when createTargetStoreGroup is called', () => {
        // Arrange
        const groupManager = new GroupManager(mockContainer);

        // @ts-ignore
        groupManager.targetStore = {
            groups: [{ id: 1, shots: [] }, { id: 2, shots: [] }],
            activeGroup: 1
        };

        const isGroupInterface = (obj: any): obj is GroupInterface => {
            return (
                typeof obj === 'object' &&
                obj !== null &&
                typeof obj.id === 'number' &&
                Array.isArray(obj.shots)
            );
        }

        // Act
        const result = groupManager.createNewTargetStoreGroup();

        // Assert
        expect(result?.id).toBe(3);
        expect(isGroupInterface(result)).toBe(true);
    });

    it('Should log an error if createTargetStoreGroup fails', () => {
        // Arrange
        const groupManager = new GroupManager(mockContainer);

        // @ts-ignore
        groupManager.targetStore = {
            groups: [{ id: 1, shots: [] }, { id: 2, shots: [] }],
            activeGroup: 1
        };

        groupManager.targetStore.groups.push = vi.fn().mockImplementation(() => {
            throw new Error('Failed to push new group to store!');
        });
    
        // Act & Assert
        expect(() => groupManager.createNewTargetStoreGroup()).toThrowError(
            'Failed to push new group to store!'
        );
    });

    it('should unsubscribe from stores when destroy is called', () => {
        // Arrange
        const groupManager = new GroupManager(mockContainer);
        
        // Mock
        const targetStoreUnsubscribeSpy = vi.fn();
        const userSettingsUnsubscribeSpy = vi.fn();
        groupManager.targetStoreUnsubscribe = targetStoreUnsubscribeSpy;
        groupManager.userSettingsUnsubscribe = userSettingsUnsubscribeSpy;
        
        // Act
        groupManager.destroy();
        
        // Assert
        expect(targetStoreUnsubscribeSpy).toHaveBeenCalled();
        expect(userSettingsUnsubscribeSpy).toHaveBeenCalled();
    });
});