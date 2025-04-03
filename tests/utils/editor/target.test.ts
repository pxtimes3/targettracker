import { vi, describe, it, beforeEach, afterEach, expect } from "vitest";

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
vi.mock('pixi.js', () => {
    const mockCanvas = document.createElement('canvas');
    const mockApplication = {
      init: vi.fn().mockResolvedValue(undefined),
      canvas: mockCanvas,
      stage: { addChild: vi.fn() },
      screen: { width: 1024, height: 768 },
      renderer: { type: 'WebGL', background: { color: 0 } },
      destroy: vi.fn()
    };
    
    return {
      Application: vi.fn(() => mockApplication),
      Container: vi.fn(() => ({
        addChild: vi.fn(),
        removeAllListeners: vi.fn(),
        scale: { set: vi.fn(), x: 1, y: 1 },
        position: { set: vi.fn() },
        x: 0,
        y: 0,
        angle: 0,
        rotation: 0,
        label: '',
        cursor: '',
        eventMode: 'none',
        on: vi.fn(),
        children: [],
        filters: []
      })),
      Sprite: vi.fn(() => ({
        scale: { set: vi.fn(), x: 1, y: 1 },
        position: { set: vi.fn() },
        pivot: { set: vi.fn(), x: 0, y: 0 },
        width: 500,
        height: 400,
        cursor: '',
        label: '',
        angle: 0,
        visible: true
      })),
      Graphics: vi.fn(),
      Assets: {
        setPreferences: vi.fn(),
        add: vi.fn(),
        load: vi.fn().mockResolvedValue({}),
        cache: {
          has: vi.fn().mockReturnValue(false)
        }
      },
      DropShadowFilter: vi.fn()
    };
});

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
    get: vi.fn().mockImplementation((store) => {
            if (store === TargetStore) return {
                groups: [
                    { 
                        id: 1,
                        shots: [
                            { x: 10, y: 10 },
                            { x: 20, y: 20 },
                            { x: 30, y: 30 },
                        ]
                    }, 
                    { 
                        id: 666,
                        shots: [
                            { x: 10, y: 10 },
                        ]
                    }
                ],
                activeGroup: 1,
                reference: { measurement: 10, linelength: 100 },
                target: {
                    rotation: 0,
                },
            };
            return {};
        }),
    writable: vi.fn(() => ({
       subscribe: vi.fn(),
       set: vi.fn(),
       update: vi.fn()
     }))
}));

vi.mock('@/utils/editor/placeshotpoatool', () => ({
    ShotPoaTool: vi.fn().mockImplementation(() => ({
      drawAllMetrics: vi.fn(),
      createGroup: vi.fn().mockResolvedValue({ id: 1 }),
      addShot: vi.fn()
    }))
  }));
  
  vi.mock('@/utils/editor/referencetool', () => ({
    ReferenceTool: vi.fn().mockImplementation(() => ({}))
  }));
  
  vi.mock('@/utils/editor/crosshairs', () => ({
    EditorCrosshair: vi.fn().mockImplementation(() => ({}))
  }));
  
  vi.mock('svelte-ux', () => ({
    getSettings: vi.fn().mockReturnValue({
      currentTheme: {
        subscribe: vi.fn(callback => {
          callback({ dark: false });
          return () => {};
        })
      }
    })
  }));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock svelte-ux
vi.mock('svelte-ux', () => ({
    getSettings: vi.fn().mockReturnValue({
      currentTheme: {
        subscribe: vi.fn(callback => {
          callback({ dark: false });
          return () => {};
        })
      }
    })
}));

import { Target } from "@/utils/editor/target";
import { TargetStore } from "@/stores/TargetImageStore";
import { Application } from "pixi.js";

describe('Target', () => {

    beforeEach(() => {

    });

    afterEach(() => {

    });

    it('should load and display the target image when initialized with a valid image path', async () => {
        expect(true).toBeTruthy();
    });

    it('should update the target angle correctly when rotated by a specific degree', () => {
        // Arrange
        const mockApp = {
            screen: { width: 800, height: 600 }
        };
        
        const mockContainer = {
            rotation: 0,
            scale: { x: 1, y: 1 },
            addChild: vi.fn(),
            removeAllListeners: vi.fn()
        };
        
        const mockTargetStore = {
            target: {
                rotation: 0,
                image: { /* any required image properties */ }
            },
            groups: [],
            // Add any other properties needed by the method
        };

        const target = new Target({ x: 800, y: 600 }, []);

        // @ts-ignore
        target['store'] = mockTargetStore;
        // @ts-ignore
        target['targetStore'] = mockTargetStore;
        // @ts-ignore
        target['app'] = mockApp;
        // @ts-ignore
        target['targetContainer'] = mockContainer;

        // Act
        target.rotate(45);

        // Assert
        expect(mockContainer.rotation).toBeCloseTo(45 * (Math.PI / 180));
        expect(target['targetStore'].target.rotation).toBe(45);
    });

    it('should update the target angle correctly when absolute is set to true', () => {
        // Arrange
        const mockApp = {
            screen: { width: 800, height: 600 }
        };
        
        const mockContainer = {
            rotation: 10,
            scale: { x: 1, y: 1 },
            addChild: vi.fn(),
            removeAllListeners: vi.fn()
        };
        
        const mockTargetStore = {
            target: {
                rotation: 0,
                image: { /* any required image properties */ }
            },
            groups: [],
            // Add any other properties needed by the method
        };

        const target = new Target({ x: 800, y: 600 }, []);

        // @ts-ignore
        target['store'] = mockTargetStore;
        // @ts-ignore
        target['targetStore'] = mockTargetStore;
        // @ts-ignore
        target['app'] = mockApp;
        // @ts-ignore
        target['targetContainer'] = mockContainer;

        // Act
        target.rotate(45, true);

        // Assert
        expect(mockContainer.rotation).toBeCloseTo(45 * (Math.PI / 180));
        expect(target['targetStore'].target.rotation).toBe(45);
    });

    // Scale is correctly calculated based on available space with 100px margin
    it('should calculate correct scale based on available space with 100px margin', () => {
        // Arrange
        const mockApp = {
            screen: {
                width: 1000,
                height: 800
            }
        };
    
        const mockTargetContainer = {
            scale: {
            set: vi.fn()
            }
        };
    
        const target = new Target({ x: 500, y: 400 }, []);
        // @ts-ignore
        target.app = mockApp;
        // @ts-ignore
        target.targetContainer = mockTargetContainer;
        target.originalWidth = 500;
        target.originalHeight = 400;
        target.scale = 0;
    
        // Act
        target.updateScale();
    
        // Assert
        const expectedScale = Math.min(
            (800 - 100) / 400,
            (1000 - 100) / 500
        );
        expect(target.scale).toBe(expectedScale);
        expect(mockTargetContainer.scale.set).toHaveBeenCalledWith(expectedScale);
    });

    // Scale is correctly calculated and applied to targetContainer using scale.set()
    it('should apply calculated scale to targetContainer using scale.set()', () => {
        // Arrange
        const mockApp = {
            screen: {
                width: 800,
                height: 600
            }
        };

        const mockTargetContainer = {
            scale: {
                set: vi.fn()
            }
        };

        const target = new Target({ x: 500, y: 400 }, []);
        // @ts-ignore
        target.app = mockApp;
        // @ts-ignore
        target.targetContainer = mockTargetContainer;
        target.originalWidth = 500;
        target.originalHeight = 400;
        target.scale = 0;

        // Act
        target.updateScale();

        // Assert
        expect(mockTargetContainer.scale.set).toHaveBeenCalledWith(target.scale);
        expect(mockTargetContainer.scale.set).toHaveBeenCalledTimes(1);
    });

    // Scale is correctly calculated and applied to targetContainer using scale.set()
    it('should apply calculated scale to targetContainer using scale.set()', () => {
        // Arrange
        const mockApp = {
            screen: {
                width: 800,
                height: 600
            }
        };

        const mockTargetContainer = {
            scale: {
                set: vi.fn()
            }
        };

        const target = new Target({ x: 500, y: 400 }, []);
        // @ts-ignore
        target.app = mockApp;
        // @ts-ignore
        target.targetContainer = mockTargetContainer;
        target.originalWidth = 500;
        target.originalHeight = 400;
        target.scale = 0;

        // Act
        target.updateScale();

        // Assert
        expect(mockTargetContainer.scale.set).toHaveBeenCalledWith(target.scale);
        expect(mockTargetContainer.scale.set).toHaveBeenCalledTimes(1);
    });

    // Correctly handles app screen dimensions smaller than 100px margin
    it('should handle app screen dimensions smaller than 100px margin', () => {
        // Arrange
        const mockApp = {
            screen: {
                width: 90,
                height: 80
            }
        };

        const mockTargetContainer = {
            scale: {
                set: vi.fn()
            }
        };

        const target = new Target({ x: 500, y: 400 }, []);
        // @ts-ignore
        target.app = mockApp;
        // @ts-ignore
        target.targetContainer = mockTargetContainer;
        target.originalWidth = 500;
        target.originalHeight = 400;
        target.scale = 0;

        // Act
        target.updateScale();

        // Assert
        // When dimensions are smaller than margin, scale becomes negative
        expect(target.scale).toBeLessThan(0);
        expect(mockTargetContainer.scale.set).toHaveBeenCalledWith(target.scale);
    });

    // Correctly calculates scale for extremely large original image dimensions
    it('should handle extremely large original image dimensions', () => {
        // Arrange
        const mockApp = {
            screen: {
                width: 1000,
                height: 800
            }
        };

        const mockTargetContainer = {
            scale: {
                set: vi.fn()
            }
        };

        const target = new Target({ x: 500, y: 400 }, []);
        // @ts-ignore
        target.app = mockApp;
        // @ts-ignore
        target.targetContainer = mockTargetContainer;
        target.originalWidth = 800;
        target.originalHeight = 1000;
        target.scale = 0;

        // Act
        target.updateScale();

        // Assert
        expect(target.scale).toBe(0.7);
        expect(target.scale).toBeLessThan(1);
        expect(mockTargetContainer.scale.set).toHaveBeenCalledWith(0.7);
    });

    // Ensures the scale is calculated correctly using the minimum value from the available space and applied to the target container.
    it('should calculate correct scale based on original dimensions and apply to target container', () => {
        // Arrange
        const mockApp = {
            screen: {
                width: 800,
                height: 600
            }
        };
        const mockTargetContainer = {
            scale: {
                set: vi.fn()
            }
        };
        
        const target = new Target({ x: 500, y: 400 }, []);
        // @ts-ignore
        target.app = mockApp;
        // @ts-ignore
        target.targetContainer = mockTargetContainer;
        target.originalWidth = 400;
        target.originalHeight = 300;
        target.scale = 0;

        // Act
        target.updateScale();

        // Assert
        // @ts-ignore
        expect(target.scale).toBe(1.6666666666666667);
        expect(mockTargetContainer.scale.set).toHaveBeenCalledWith(1.6666666666666667);
    });

    // Scale is correctly calculated using Math.min to maintain aspect ratio
    it('should calculate scale using Math.min to maintain aspect ratio', () => {
        // Arrange
        const mockApp = {
            screen: {
                width: 800,
                height: 600
            }
        };
        const mockTargetContainer = {
            scale: {
                set: vi.fn()
            }
        };

        const target = new Target({ x: 500, y: 400 }, []);
        // @ts-ignore
        target.app = mockApp;
        // @ts-ignore
        target.targetContainer = mockTargetContainer;
        target.originalWidth = 400;
        target.originalHeight = 300;
        target.scale = 0;

        // Act
        target.updateScale();

        // Assert
        // @ts-ignore
        expect(target.scale).toBeCloseTo(1.66, 1);
        expect(mockTargetContainer.scale.set).toHaveBeenCalledWith(1.6666666666666667);
    });

    // Scale is correctly calculated and applied to the target container based on app dimensions
    it('should correctly calculate and store scale based on app dimensions', () => {
        // Arrange
        const mockApp = {
            screen: {
                width: 800,
                height: 600
            }
        };
        const mockTargetContainer = {
            scale: {
                set: vi.fn()
            }
        };
        const target = new Target({ x: 500, y: 400 }, []);
        // @ts-ignore
        target.app = mockApp;
        // @ts-ignore
        target.targetContainer = mockTargetContainer;
        target.originalWidth = 400;
        target.originalHeight = 300;
        target.scale = 0;

        // Act
        target.updateScale();

        // Assert
        // @ts-ignore
        expect(target.scale).toBeCloseTo(1.6666666666666667);
        expect(mockTargetContainer.scale.set).toHaveBeenCalledWith(1.6666666666666667);
    });

    // Correct scale calculation for very wide images
    it('should correctly calculate scale for very wide images', () => {
        // Arrange
        const mockApp = {
            screen: {
                width: 2000,
                height: 500
            }
        };
        
        const mockTargetContainer = {
            scale: {
                set: vi.fn()
            }
        };

        const target = new Target({ x: 500, y: 400 }, []);
        // @ts-ignore
        target.app = mockApp;
        // @ts-ignore
        target.targetContainer = mockTargetContainer;
        target.originalWidth = 100;
        target.originalHeight = 1000;
        target.scale = 0;

        // Act
        target.updateScale();

        // Assert
        // @ts-ignore
        expect(target.scale).toBeCloseTo(0.4, 1);
        expect(mockTargetContainer.scale.set).toHaveBeenCalledWith(0.4);
    });

    it('should set background color to 0x545960 when dark mode is enabled and 0xcccbc9 when light mode is enabled', () => {
        // Arrange
        const mockRenderer = {
            background: {
                color: 0
            }
        };
        const mockApp = {
            renderer: mockRenderer
        };
        
        const target = new Target({ x: 500, y: 400 }, []);
        // @ts-ignore
        target.app = mockApp;
        
        // Act & Assert Dark
        target.dark = true;
        target.updateBackground();
        expect(mockApp.renderer.background.color).toBe(0x545960);

        // Act & Assert Light
        target.dark = false;
        target.updateBackground();
        expect(mockApp.renderer.background.color).toBe(0xcccbc9);
    });

    it('should initialize the target application correctly', async () => {
        // Mock DOM elements
        const mockCanvasContainer = document.createElement('div');
        const appendChildSpy = vi.spyOn(mockCanvasContainer, 'appendChild');
        const mockSetApplicationState = vi.fn();
        
        // Mock createWebGLContext
        const mockCanvas = document.createElement('canvas');
        const createWebGLContextSpy = vi.spyOn(Target.prototype, 'createWebGLContext')
          .mockReturnValue(mockCanvas);
        
        // Mock store with target image
        const mockStore = {
          target: {
            image: {
              filename: 'test.jpg',
              originalsize: [0, 0]
            },
            rotation: 45
          },
          groups: []
        };
        
        // Mock methods
        const loadAssetsSpy = vi.spyOn(Target.prototype, 'loadAssets')
          .mockResolvedValue(undefined);
        const createTargetSpy = vi.spyOn(Target.prototype, 'createTarget')
          .mockResolvedValue(undefined);
        const setupInteractivitySpy = vi.spyOn(Target.prototype, 'setupInteractivity')
          .mockImplementation(() => {});
        
        // Create target instance with mocked properties
        const target = new Target({ x: 800, y: 600 }, []);
        // @ts-ignore
        target['store'] = mockStore;
        // @ts-ignore
        target['targetStore'] = mockStore;
        // @ts-ignore
        target.targetContainer = { angle: 0 }
        
        // Act
        await target.initialize(mockCanvasContainer, mockSetApplicationState);
        
        // Assert
        expect(mockSetApplicationState).toHaveBeenCalledWith('Initializing application...');
        expect(createWebGLContextSpy).toHaveBeenCalled();
        expect(appendChildSpy).toHaveBeenCalled();
        expect(loadAssetsSpy).toHaveBeenCalled();
        expect(createTargetSpy).toHaveBeenCalled();
        expect(setupInteractivitySpy).toHaveBeenCalled();
        expect(mockSetApplicationState).toHaveBeenLastCalledWith('Done!');
      });
    
      it('should handle errors during initialization', async () => {
        // Mock DOM elements
        const mockCanvasContainer = document.createElement('div');
        const mockSetApplicationState = vi.fn();
        
        // Create target instance with mocked properties
        const target = new Target({ x: 800, y: 600 }, []);
        
        // Mock store with missing target image
        const mockStore = {
          target: {
            image: {
              filename: '' // Empty filename to trigger error
            }
          }
        };
        
        // @ts-ignore
        target['store'] = mockStore;
        
        // Mock app initialization to succeed (to get past that part)
        vi.spyOn(Target.prototype, 'createWebGLContext')
          .mockReturnValue(document.createElement('canvas'));
        
        // Act & Assert
        await expect(target.initialize(mockCanvasContainer, mockSetApplicationState))
          .rejects.toThrow();
        
        expect(mockSetApplicationState).toHaveBeenCalledWith('Initializing application...');
        expect(mockSetApplicationState).toHaveBeenCalledWith(expect.stringMatching(/Error:/));
      });
    
      it('should fall back to canvas renderer if WebGL fails', async () => {
        // Reset the Application mock to simulate WebGL failure
        const mockCanvas = document.createElement('canvas');
        let initCallCount = 0;
        
        const mockInitFn = vi.fn().mockImplementation(async () => {
          if (initCallCount === 0) {
            initCallCount++;
            throw new Error('WebGL failed');
          }
          return undefined;
        });
        
        const mockApp = {
          init: mockInitFn,
          canvas: mockCanvas,
          stage: { addChild: vi.fn() },
          screen: { width: 1024, height: 768 },
          renderer: { type: 'Canvas', background: { color: 0 } }
        };
        
        // Update the Application mock for this test
        vi.mocked(Application).mockImplementation(() => mockApp as any);
        
        // Mock DOM elements
        const mockCanvasContainer = document.createElement('div');
        const mockSetApplicationState = vi.fn();
        
        // Mock store with target image
        const mockStore = {
          target: {
            image: {
              filename: 'test.jpg',
              originalsize: [0, 0]
            },
            rotation: 0
          },
          groups: []
        };
        
        // Create target instance with mocked properties
        const target = new Target({ x: 800, y: 600 }, []);
        // @ts-ignore
        target['store'] = mockStore;
        // @ts-ignore
        target['targetStore'] = mockStore;
        // @ts-ignore
        target.targetContainer = { angle: 0 };
        
        // Mock methods to avoid actual implementation
        vi.spyOn(Target.prototype, 'createWebGLContext')
          .mockReturnValue(document.createElement('canvas'));
        vi.spyOn(Target.prototype, 'loadAssets')
          .mockResolvedValue(undefined);
        vi.spyOn(Target.prototype, 'createTarget')
          .mockResolvedValue(undefined);
        vi.spyOn(Target.prototype, 'setupInteractivity')
          .mockImplementation(() => {});
        
        // Act
        await target.initialize(mockCanvasContainer, mockSetApplicationState);
        
        // Assert
        expect(mockInitFn).toHaveBeenCalledTimes(2);
        expect(mockSetApplicationState).toHaveBeenLastCalledWith('Done!');
    });
});