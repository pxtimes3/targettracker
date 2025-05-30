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

// vi.mock('@/utils/editor/MetricsRenderer', () => ({
//     MetricsRenderer: vi.fn().mockImplementation(() => ({
//       drawAllMetrics: vi.fn()
//   }))
// }));

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
           setShot: vi.fn(),
           update: vi.fn(),
           pxToMm: vi.fn().mockReturnValue(10)
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
            reference: { measurement: 10, linelength: 100 }
        };
        return {};
    }),
    writable: vi.fn(() => ({
        subscribe: vi.fn(),
        set: vi.fn(),
        update: vi.fn()
    }))
}));

import { Container, Graphics } from "pixi.js";
import { type SettingsInterface, UserSettingsStore } from '@/stores/UserSettingsStore';
import { TargetStore, type TargetStoreInterface, type GroupInterface } from "@/stores/TargetImageStore";
import { get } from "svelte/store";
import { MetricsRenderer } from '@/utils/editor/MetricsRenderer';
import { group } from 'console';

describe('MetricsRenderer', () => {
    let mockContainer: Container;
    let mockGroupContainer: Container;
    let mockTargetStore: TargetStoreInterface;

    beforeEach(() => {
        vi.clearAllMocks();

        mockContainer = new Container();
        mockGroupContainer = new Container();

        // @ts-ignore
        mockTargetStore = {
            activeGroup: 1,
            reference: { measurement: 10, linelength: 100 },
            groups: [
                { 
                    id: 1,
                    shots: [
                        // @ts-ignore
                        { x: 10, y: 10},
                        // @ts-ignore
                        { x: 20, y: 20 },
                        // @ts-ignore
                        { x: 30, y: 30 },
                    ],
                }, 
                {
                    id: 666,
                    shots: [
                        // @ts-ignore
                        { x: 10, y: 10},
                    ],
                }
            ],
        };
        TargetStore.pxToMm = vi.fn().mockReturnValue(10);
    });


    /// MR

    it('should draw metrics for a single group when group-id is supplied', () => {
        const metricsRenderer = new MetricsRenderer(mockContainer);
        metricsRenderer.targetStore = mockTargetStore;

        const drawGroupMetricsSpy = vi.spyOn(metricsRenderer, 'drawGroupMetrics').mockImplementation(vi.fn());
        
        // Act
        metricsRenderer.drawAllMetrics(1);

        // Assert
        expect(drawGroupMetricsSpy).toHaveBeenCalledExactlyOnceWith(1);
    });

    it('should draw metrics for a all groups when no group-id is supplied', () => {
        const metricsRenderer = new MetricsRenderer(mockContainer);
        metricsRenderer.targetStore = mockTargetStore;

        const drawGroupMetricsSpy = vi.spyOn(metricsRenderer, 'drawGroupMetrics').mockImplementation(vi.fn());
        
        // Act
        metricsRenderer.drawAllMetrics();

        // Assert
        expect(drawGroupMetricsSpy).toHaveBeenNthCalledWith(1, 1);
        expect(drawGroupMetricsSpy).toHaveBeenNthCalledWith(2, 666);
    });

    // mr
    
    it('should draw mean radius circle for a group with multiple shots', () => {
        mockGroupContainer.addChild = vi.fn();
        mockGroupContainer.getChildByLabel = vi.fn().mockReturnValue(null);
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockGroupContainer);
    
        const metricsRenderer = new MetricsRenderer(mockContainer);
        // @ts-ignore
        metricsRenderer.userSettings = { showmr: true };
        
        const mockCurrentStore = {
            ...mockTargetStore,
            reference: { 
                measurement: 10, 
                linelength: 100 
            }
        };
        // @ts-ignore
        get.mockReturnValue(mockCurrentStore);
        
        // mock getGroup
        TargetStore.getGroup = vi.fn().mockReturnValue({
            id: 1,
            shots: [
                { x: 10, y: 10 },
                { x: 20, y: 20 },
                { x: 30, y: 30 }
            ]
        });
        
        // @ts-ignore
        metricsRenderer.graphicsFactory = {
            createMeanRadiusGraphics: vi.fn().mockReturnValue(new Graphics())
        };
    
        // Act
        metricsRenderer.drawMeanRadius(1);
    
        // Assert
        expect(mockGroupContainer.getChildByLabel).toHaveBeenCalled();
        expect(mockGroupContainer.addChild).toHaveBeenCalled();
    });

    it('should remove the old mean radius circle if it exists', () => {
        mockGroupContainer.addChild = vi.fn();
        mockGroupContainer.removeChild = vi.fn();
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockGroupContainer);

        const mockOldCircle = new Container({label: 'mr-1'});
        mockGroupContainer.addChild(mockOldCircle);
        mockGroupContainer.getChildByLabel = vi.fn().mockReturnValue(mockOldCircle);
    
        const metricsRenderer = new MetricsRenderer(mockContainer);
        // @ts-ignore
        metricsRenderer.userSettings = { showmr: true };
        
        const mockCurrentStore = {
            ...mockTargetStore,
            reference: { 
                measurement: 10, 
                linelength: 100 
            }
        };
        // @ts-ignore
        get.mockReturnValue(mockCurrentStore);
        
        // mock getGroup
        TargetStore.getGroup = vi.fn().mockReturnValue({
            id: 1,
            shots: [
                { x: 10, y: 10 },
                { x: 20, y: 20 },
                { x: 30, y: 30 }
            ]
        });
        
        // @ts-ignore
        metricsRenderer.graphicsFactory = {
            createMeanRadiusGraphics: vi.fn().mockReturnValue(new Graphics())
        };
    
        // Act
        metricsRenderer.drawMeanRadius(1);
    
        // Assert
        expect(mockGroupContainer.removeChild).toHaveBeenCalled();
        expect(mockGroupContainer.getChildByLabel).toHaveBeenCalled();
        expect(mockGroupContainer.addChild).toHaveBeenCalled();
    });

    it('should update the TargetStore', () => {
        mockGroupContainer.addChild = vi.fn();
        mockGroupContainer.removeChild = vi.fn();
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockGroupContainer);

        const mockOldCircle = new Container({label: 'mr-1'});
        mockGroupContainer.addChild(mockOldCircle);
        mockGroupContainer.getChildByLabel = vi.fn().mockReturnValue(mockOldCircle);
    
        const metricsRenderer = new MetricsRenderer(mockContainer);
        // @ts-ignore
        metricsRenderer.userSettings = { showmr: true };
        
        const mockGroup = {
            id: 1,
            shots: [
                { x: 10, y: 10 },
                { x: 20, y: 20 },
                { x: 30, y: 30 }
            ],
            metrics: {}
        };
        
        TargetStore.getGroup = vi.fn().mockReturnValue(mockGroup);
        TargetStore.pxToMm = vi.fn().mockReturnValue(10);
        
        // Create a mock store object that the update callback will receive
        const mockStore = {
            groups: [mockGroup]
        };
        
        // Mock update to actually execute the callback
        TargetStore.update = vi.fn(callback => {
            // Execute the callback with our mock store
            const result = callback(mockStore);
            // Return the result
            return result;
        });
        
        // @ts-ignore
        metricsRenderer.graphicsFactory = {
            createMeanRadiusGraphics: vi.fn().mockReturnValue(new Graphics())
        };
    
        // Act
        metricsRenderer.drawMeanRadius(1);
    
        // Assert
        expect(TargetStore.update).toHaveBeenCalled();
    
        // Check that the store was updated correctly
        // @ts-ignore
        expect(mockGroup.metrics.meanradius).toBeDefined();
        // @ts-ignore
        expect(mockGroup.metrics.meanradius.px).toBeCloseTo(
            // Calculate expected mean radius
            // For points (10,10), (20,20), (30,30) with mean center at (20,20)
            // Mean radius = (√200 + 0 + √200) / 3 ≈ 9.43
            9.43, 
            1 // Precision
        );
        // @ts-ignore
        expect(mockGroup.metrics.meanradius.mm).toBe(10);
    });

    it('should NOT draw mean radius if reference points aren\'t set', () => {
        class TestMetricsRenderer extends MetricsRenderer {
            constructor(container: Container) {
                super(container);
            }
            
            // JFC
            drawGroupMetrics() {}
            drawCoveringRadius() {}
            drawMPI() {}
            drawDiagonal() {}
            drawExtremeSpread() {}
        }

        mockGroupContainer.addChild = vi.fn();
        mockGroupContainer.getChildByLabel = vi.fn().mockReturnValue(null);
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockGroupContainer);
        
        const metricsRenderer = new TestMetricsRenderer(mockContainer);

        // @ts-ignore
        metricsRenderer.userSettings = { showmr: true };
        
        const mockCurrentStore = {
            ...mockTargetStore,
            reference: {}
        };
        
        // @ts-ignore
        get.mockReturnValue(mockCurrentStore);
        
        TargetStore.getGroup = vi.fn().mockReturnValue({
            id: 1,
            shots: [
                { x: 10, y: 10 },
                { x: 20, y: 20 }
            ]
        });
    
        // Act
        metricsRenderer.drawMeanRadius(1);
    
        // Assert
        expect(mockGroupContainer.addChild).not.toHaveBeenCalled();
    });

    it('should recieve a Graphics object from GraphicsFactory', () => {
        mockGroupContainer.addChild = vi.fn();
        mockGroupContainer.getChildByLabel = vi.fn().mockReturnValue(null);
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockGroupContainer);
        
        const mockGraphics = new Graphics();
        mockGraphics.label = `mr-1`;

        const mockGraphicsFactory = {
            createMeanRadiusGraphics: vi.fn().mockReturnValue(mockGraphics)
        };

        const metricsRenderer = new MetricsRenderer(mockContainer);
        // @ts-ignore
        metricsRenderer.graphicsFactory = mockGraphicsFactory;

        // @ts-ignore
        metricsRenderer.userSettings = { showmr: true };

        const mockCurrentStore = {
            ...mockTargetStore,
            reference: { 
                measurement: 10, 
                linelength: 100 
            }
        };
        // @ts-ignore
        get.mockReturnValue(mockCurrentStore);
        
        // mock getGroup
        TargetStore.getGroup = vi.fn().mockReturnValue({
            id: 1,
            shots: [
                { x: 10, y: 10 },
                { x: 20, y: 20 },
                { x: 30, y: 30 }
            ]
        });

        // Act
        metricsRenderer.drawMeanRadius(1);

        // Assert
        expect(mockGraphicsFactory.createMeanRadiusGraphics).toHaveBeenCalledWith(
            1,
            expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
            expect.any(Number),
            expect.any(Boolean)
        );
        expect(mockGroupContainer.addChild).toHaveBeenCalledWith(mockGraphics);
    });


    /// CCR
    
    it('should draw ccr-circle for a group with multiple shots', () => {
        mockGroupContainer.addChild = vi.fn();
        mockGroupContainer.getChildByLabel = vi.fn().mockReturnValue(null);
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockGroupContainer);
    
        const metricsRenderer = new MetricsRenderer(mockContainer);
        // @ts-ignore
        metricsRenderer.userSettings = { showccr: true };
        
        const mockCurrentStore = {
            ...mockTargetStore,
            reference: { 
                measurement: 10, 
                linelength: 100 
            }
        };
        // @ts-ignore
        get.mockReturnValue(mockCurrentStore);
        
        // mock getGroup
        TargetStore.getGroup = vi.fn().mockReturnValue({
            id: 1,
            shots: [
                { x: 10, y: 10 },
                { x: 20, y: 20 },
                { x: 30, y: 30 }
            ]
        });
        
        // @ts-ignore
        metricsRenderer.graphicsFactory = {
            createCoveringRadiusGraphics: vi.fn().mockReturnValue(new Graphics())
        };
    
        // Act
        metricsRenderer.drawCoveringRadius(1);
    
        // Assert
        expect(mockGroupContainer.getChildByLabel).toHaveBeenCalled();
        expect(mockGroupContainer.addChild).toHaveBeenCalled();
    });

    it('should remove the old ccr-circle if it exists', () => {
        mockGroupContainer.addChild = vi.fn();
        mockGroupContainer.removeChild = vi.fn();
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockGroupContainer);

        const mockOldCircle = new Container({label: 'ccr-1'});
        mockGroupContainer.addChild(mockOldCircle);
        mockGroupContainer.getChildByLabel = vi.fn().mockReturnValue(mockOldCircle);
    
        const metricsRenderer = new MetricsRenderer(mockContainer);
        // @ts-ignore
        metricsRenderer.userSettings = { showccr: true };
        
        const mockCurrentStore = {
            ...mockTargetStore,
            reference: { 
                measurement: 10, 
                linelength: 100 
            }
        };
        // @ts-ignore
        get.mockReturnValue(mockCurrentStore);
        
        // mock getGroup
        TargetStore.getGroup = vi.fn().mockReturnValue({
            id: 1,
            shots: [
                { x: 10, y: 10 },
                { x: 20, y: 20 },
                { x: 30, y: 30 }
            ]
        });
        
        // @ts-ignore
        metricsRenderer.graphicsFactory = {
            createCoveringRadiusGraphics: vi.fn().mockReturnValue(new Graphics())
        };
    
        // Act
        metricsRenderer.drawCoveringRadius(1);
    
        // Assert
        expect(mockGroupContainer.removeChild).toHaveBeenCalled();
        expect(mockGroupContainer.getChildByLabel).toHaveBeenCalled();
        expect(mockGroupContainer.addChild).toHaveBeenCalled();
    });

    it('should update the TargetStore', () => {
        mockGroupContainer.addChild = vi.fn();
        mockGroupContainer.removeChild = vi.fn();
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockGroupContainer);

        const mockOldCircle = new Container({label: 'mr-1'});
        mockGroupContainer.addChild(mockOldCircle);
        mockGroupContainer.getChildByLabel = vi.fn().mockReturnValue(mockOldCircle);
    
        const metricsRenderer = new MetricsRenderer(mockContainer);
        // @ts-ignore
        metricsRenderer.userSettings = { showccr: true };
        
        const mockGroup = {
            id: 1,
            shots: [
                { x: 10, y: 10 },
                { x: 20, y: 20 },
                { x: 30, y: 30 }
            ],
            metrics: {}
        };
        
        TargetStore.getGroup = vi.fn().mockReturnValue(mockGroup);
        TargetStore.pxToMm = vi.fn().mockReturnValue(10);
        
        // Create a mock store object that the update callback will receive
        const mockStore = {
            groups: [mockGroup]
        };
        
        // Mock update to actually execute the callback
        TargetStore.update = vi.fn(callback => {
            // Execute the callback with our mock store
            const result = callback(mockStore);
            // Return the result
            return result;
        });
        
        // @ts-ignore
        metricsRenderer.graphicsFactory = {
            createCoveringRadiusGraphics: vi.fn().mockReturnValue(new Graphics())
        };
    
        // Act
        metricsRenderer.drawCoveringRadius(1);
    
        // Assert
        expect(TargetStore.update).toHaveBeenCalled();
    
        // Check that the store was updated correctly
        // @ts-ignore
        expect(mockGroup.metrics.coveringradius).toBeDefined();
        // @ts-ignore
        expect(mockGroup.metrics.coveringradius.px).toBeCloseTo(
            // Calculate expected mean radius
            // For points (10,10), (20,20), (30,30) with mean center at (20,20)
            // Mean radius = (√200 + 0 + √200) / 3 ≈ 9.43
            9.43, 
            1 // Precision
        );
        // @ts-ignore
        expect(mockGroup.metrics.coveringradius.mm).toBe(10);
    });

    it('should NOT draw ccr if reference points aren\'t set', () => {
        class TestMetricsRenderer extends MetricsRenderer {
            constructor(container: Container) {
                super(container);
            }
            
            // JFC
            drawGroupMetrics() {}
            drawCoveringRadius() {}
            drawMPI() {}
            drawDiagonal() {}
            drawExtremeSpread() {}
        }

        mockGroupContainer.addChild = vi.fn();
        mockGroupContainer.getChildByLabel = vi.fn().mockReturnValue(null);
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockGroupContainer);
        
        const metricsRenderer = new TestMetricsRenderer(mockContainer);

        // @ts-ignore
        metricsRenderer.userSettings = { showccr: true };
        
        const mockCurrentStore = {
            ...mockTargetStore,
            reference: {}
        };
        
        // @ts-ignore
        get.mockReturnValue(mockCurrentStore);
        
        TargetStore.getGroup = vi.fn().mockReturnValue({
            id: 1,
            shots: [
                { x: 10, y: 10 },
                { x: 20, y: 20 }
            ]
        });
    
        // Act
        metricsRenderer.drawCoveringRadius();
    
        // Assert
        expect(mockGroupContainer.addChild).not.toHaveBeenCalled();
    });

    it('should recieve a Graphics object from GraphicsFactory', () => {
        mockGroupContainer.addChild = vi.fn();
        mockGroupContainer.getChildByLabel = vi.fn().mockReturnValue(null);
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockGroupContainer);
        
        const mockGraphics = new Graphics();
        mockGraphics.label = `ccr-1`;

        const mockGraphicsFactory = {
            createCoveringRadiusGraphics: vi.fn().mockReturnValue(mockGraphics)
        };

        const metricsRenderer = new MetricsRenderer(mockContainer);
        // @ts-ignore
        metricsRenderer.graphicsFactory = mockGraphicsFactory;

        // @ts-ignore
        metricsRenderer.userSettings = { showccr: true };

        const mockCurrentStore = {
            ...mockTargetStore,
            reference: { 
                measurement: 10, 
                linelength: 100 
            }
        };
        // @ts-ignore
        get.mockReturnValue(mockCurrentStore);
        
        // mock getGroup
        TargetStore.getGroup = vi.fn().mockReturnValue({
            id: 1,
            shots: [
                { x: 10, y: 10 },
                { x: 20, y: 20 },
                { x: 30, y: 30 }
            ]
        });

        // Act
        metricsRenderer.drawCoveringRadius(1);

        // Assert
        expect(mockGraphicsFactory.createCoveringRadiusGraphics).toHaveBeenCalledWith(
            1,
            expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
            expect.any(Number),
            expect.any(Boolean)
        );
        expect(mockGroupContainer.addChild).toHaveBeenCalledWith(mockGraphics);
    });


    /// MPI
    
    it('should draw MPI for a group with multiple shots', () => {
        mockGroupContainer.addChild = vi.fn();
        mockGroupContainer.getChildByLabel = vi.fn().mockReturnValue(null);
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockGroupContainer);
    
        const metricsRenderer = new MetricsRenderer(mockContainer);
        // @ts-ignore
        metricsRenderer.userSettings = { showmpi: true };
        
        const mockCurrentStore = {
            ...mockTargetStore,
            reference: { 
                measurement: 10, 
                linelength: 100 
            }
        };
        // @ts-ignore
        get.mockReturnValue(mockCurrentStore);
        
        // mock getGroup
        TargetStore.getGroup = vi.fn().mockReturnValue({
            id: 1,
            shots: [
                { x: 10, y: 10 },
                { x: 20, y: 20 },
                { x: 30, y: 30 }
            ]
        });
        
        // @ts-ignore
        metricsRenderer.graphicsFactory = {
            createMPIGraphics: vi.fn().mockReturnValue(new Graphics())
        };
    
        // Act
        metricsRenderer.drawMPI(1);
    
        // Assert
        expect(mockGroupContainer.getChildByLabel).toHaveBeenCalled();
        expect(mockGroupContainer.addChild).toHaveBeenCalled();
    });

    it('should remove the old mpi-graphics if it exists', () => {
        mockGroupContainer.addChild = vi.fn();
        mockGroupContainer.removeChild = vi.fn();
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockGroupContainer);

        const mockOldCircle = new Container({label: 'mpi-1'});
        mockGroupContainer.addChild(mockOldCircle);
        mockGroupContainer.getChildByLabel = vi.fn().mockReturnValue(mockOldCircle);
    
        const metricsRenderer = new MetricsRenderer(mockContainer);
        // @ts-ignore
        metricsRenderer.userSettings = { showmpi: true };
        
        const mockCurrentStore = {
            ...mockTargetStore,
            reference: { 
                measurement: 10, 
                linelength: 100 
            }
        };
        // @ts-ignore
        get.mockReturnValue(mockCurrentStore);
        
        // mock getGroup
        TargetStore.getGroup = vi.fn().mockReturnValue({
            id: 1,
            shots: [
                { x: 10, y: 10 },
                { x: 20, y: 20 },
                { x: 30, y: 30 }
            ]
        });
        
        // @ts-ignore
        metricsRenderer.graphicsFactory = {
            createMPIGraphics: vi.fn().mockReturnValue(new Graphics())
        };
    
        // Act
        metricsRenderer.drawMPI(1);
    
        // Assert
        expect(mockGroupContainer.removeChild).toHaveBeenCalled();
        expect(mockGroupContainer.getChildByLabel).toHaveBeenCalled();
        expect(mockGroupContainer.addChild).toHaveBeenCalled();
    });

    
    /// Diagonal + FOM
    
    it('should draw Diagonal and FOM for a group with multiple shots', () => {
        mockGroupContainer.addChild = vi.fn();
        mockGroupContainer.getChildByLabel = vi.fn().mockReturnValue(null);
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockGroupContainer);
    
        const metricsRenderer = new MetricsRenderer(mockContainer);
        // @ts-ignore
        metricsRenderer.userSettings = { showdiagonal: true };
        
        const mockCurrentStore = {
            ...mockTargetStore,
            reference: { 
                measurement: 10, 
                linelength: 100 
            }
        };
        // @ts-ignore
        get.mockReturnValue(mockCurrentStore);
        
        // mock getGroup
        TargetStore.getGroup = vi.fn().mockReturnValue({
            id: 1,
            shots: [
                { x: 10, y: 10 },
                { x: 20, y: 20 },
                { x: 30, y: 30 }
            ]
        });
        
        // @ts-ignore
        metricsRenderer.graphicsFactory = {
            createDiagonalGraphics: vi.fn().mockReturnValue(new Graphics())
        };
    
        // Act
        metricsRenderer.drawDiagonal(1);
    
        // Assert
        expect(mockGroupContainer.getChildByLabel).toHaveBeenCalled();
        expect(mockGroupContainer.addChild).toHaveBeenCalled();
    });

    it('should remove the old Diagonal and FOM-graphics if it exists', () => {
        mockGroupContainer.addChild = vi.fn();
        mockGroupContainer.removeChild = vi.fn();
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockGroupContainer);

        const mockOldGraphics = new Container({label: 'diagonal-1'});
        mockGroupContainer.addChild(mockOldGraphics);
        mockGroupContainer.getChildByLabel = vi.fn().mockReturnValue(mockOldGraphics);
    
        const metricsRenderer = new MetricsRenderer(mockContainer);
        // @ts-ignore
        metricsRenderer.userSettings = { showdiagonal: true };
        
        const mockCurrentStore = {
            ...mockTargetStore,
            reference: { 
                measurement: 10, 
                linelength: 100 
            }
        };
        // @ts-ignore
        get.mockReturnValue(mockCurrentStore);
        
        // mock getGroup
        TargetStore.getGroup = vi.fn().mockReturnValue({
            id: 1,
            shots: [
                { x: 10, y: 10 },
                { x: 20, y: 20 },
                { x: 30, y: 30 }
            ]
        });
        
        // @ts-ignore
        metricsRenderer.graphicsFactory = {
            createDiagonalGraphics: vi.fn().mockReturnValue(new Graphics())
        };
    
        // Act
        metricsRenderer.drawDiagonal(1);
    
        // Assert
        expect(mockGroupContainer.removeChild).toHaveBeenCalled();
        expect(mockGroupContainer.getChildByLabel).toHaveBeenCalled();
        expect(mockGroupContainer.addChild).toHaveBeenCalled();
    });

    it('should update the TargetStore', () => {
        mockGroupContainer.addChild = vi.fn();
        mockGroupContainer.removeChild = vi.fn();
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockGroupContainer);

        const mockOldGraphics = new Container({label: 'diagonal-1'});
        mockGroupContainer.addChild(mockOldGraphics);
        mockGroupContainer.getChildByLabel = vi.fn().mockReturnValue(mockOldGraphics);
    
        const metricsRenderer = new MetricsRenderer(mockContainer);
        // @ts-ignore
        metricsRenderer.userSettings = { showccr: true };
        
        const mockGroup = {
            id: 1,
            shots: [
                { x: 10, y: 10 },
                { x: 20, y: 20 },
                { x: 30, y: 30 }
            ],
            metrics: {}
        };
        
        TargetStore.getGroup = vi.fn().mockReturnValue(mockGroup);
        TargetStore.pxToMm = vi.fn().mockReturnValue(10);
        
        // Create a mock store object that the update callback will receive
        const mockStore = {
            groups: [mockGroup]
        };
        
        // Mock update to actually execute the callback
        TargetStore.update = vi.fn(callback => {
            // Execute the callback with our mock store
            const result = callback(mockStore);
            // Return the result
            return result;
        });
        
        // @ts-ignore
        metricsRenderer.graphicsFactory = {
            createDiagonalGraphics: vi.fn().mockReturnValue(new Graphics())
        };
    
        // Act
        metricsRenderer.drawDiagonal(1);
    
        // Assert
        expect(TargetStore.update).toHaveBeenCalled();
    
        // Check that the store was updated correctly
        // @ts-ignore
        expect(mockGroup.metrics.diagonal).toBeDefined();
        // @ts-ignore
        expect(mockGroup.metrics.fom).toBeDefined();
        // @ts-ignore
        expect(mockGroup.metrics.diagonal.px).toBeCloseTo(28.28, 1);
        // @ts-ignore
        expect(mockGroup.metrics.fom.px).toBeCloseTo(20, 1);
        // @ts-ignore
        expect(mockGroup.metrics.diagonal.px).toBeCloseTo(28.28, 1);
        // @ts-ignore
        expect(mockGroup.metrics.diagonal.mm).toBe(10);
        // @ts-ignore
        expect(mockGroup.metrics.diagonal.width).toBe(20);
        // @ts-ignore
        expect(mockGroup.metrics.diagonal.height).toBe(20);
        // @ts-ignore
        expect(mockGroup.metrics.fom.px).toBe(20);
        // @ts-ignore
        expect(mockGroup.metrics.fom.mm).toBe(10);
    });


    /// ES
    
    it('should draw ES for a group with multiple shots', () => {
        mockGroupContainer.addChild = vi.fn();
        mockGroupContainer.getChildByLabel = vi.fn().mockReturnValue(null);
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockGroupContainer);
    
        const metricsRenderer = new MetricsRenderer(mockContainer);
        // @ts-ignore
        metricsRenderer.userSettings = { showes: true };
        
        const mockCurrentStore = {
            ...mockTargetStore,
            reference: { 
                measurement: 10, 
                linelength: 100 
            }
        };
        // @ts-ignore
        get.mockReturnValue(mockCurrentStore);
        
        // mock getGroup
        TargetStore.getGroup = vi.fn().mockReturnValue({
            id: 1,
            shots: [
                { x: 10, y: 10 },
                { x: 20, y: 20 },
                { x: 30, y: 30 }
            ]
        });
        
        // @ts-ignore
        metricsRenderer.graphicsFactory = {
            createExtremeSpreadGraphics: vi.fn().mockReturnValue(new Graphics())
        };
    
        // Act
        metricsRenderer.drawExtremeSpread(1);
    
        // Assert
        expect(mockGroupContainer.getChildByLabel).toHaveBeenCalled();
        expect(mockGroupContainer.addChild).toHaveBeenCalled();
    });

    it('should remove the old Diagonal and FOM-graphics if it exists', () => {
        mockGroupContainer.addChild = vi.fn();
        mockGroupContainer.removeChild = vi.fn();
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockGroupContainer);

        const mockOldGraphics = new Container({label: 'es-1'});
        mockGroupContainer.addChild(mockOldGraphics);
        mockGroupContainer.getChildByLabel = vi.fn().mockReturnValue(mockOldGraphics);
    
        const metricsRenderer = new MetricsRenderer(mockContainer);
        // @ts-ignore
        metricsRenderer.userSettings = { showes: true };
        
        const mockCurrentStore = {
            ...mockTargetStore,
            reference: { 
                measurement: 10, 
                linelength: 100 
            }
        };
        // @ts-ignore
        get.mockReturnValue(mockCurrentStore);
        
        // mock getGroup
        TargetStore.getGroup = vi.fn().mockReturnValue({
            id: 1,
            shots: [
                { x: 10, y: 10 },
                { x: 20, y: 20 },
                { x: 30, y: 30 }
            ]
        });
        
        // @ts-ignore
        metricsRenderer.graphicsFactory = {
            createExtremeSpreadGraphics: vi.fn().mockReturnValue(new Graphics())
        };
    
        // Act
        metricsRenderer.drawExtremeSpread(1);
    
        // Assert
        expect(mockGroupContainer.removeChild).toHaveBeenCalled();
        expect(mockGroupContainer.getChildByLabel).toHaveBeenCalled();
        expect(mockGroupContainer.addChild).toHaveBeenCalled();
    });

    it('should update the TargetStore', () => {
        mockGroupContainer.addChild = vi.fn();
        mockGroupContainer.removeChild = vi.fn();
        mockContainer.getChildByLabel = vi.fn().mockReturnValue(mockGroupContainer);

        const mockOldGraphics = new Container({label: 'es-1'});
        mockGroupContainer.addChild(mockOldGraphics);
        mockGroupContainer.getChildByLabel = vi.fn().mockReturnValue(mockOldGraphics);
    
        const metricsRenderer = new MetricsRenderer(mockContainer);
        // @ts-ignore
        metricsRenderer.userSettings = { showes: true };
        
        const mockGroup = {
            id: 1,
            shots: [
                { x: 10, y: 10 },
                { x: 20, y: 20 },
                { x: 30, y: 30 }
            ],
            metrics: {}
        };
        
        TargetStore.getGroup = vi.fn().mockReturnValue(mockGroup);
        TargetStore.pxToMm = vi.fn().mockReturnValue(10);
        
        // Create a mock store object that the update callback will receive
        const mockStore = {
            groups: [mockGroup]
        };
        
        // Mock update to actually execute the callback
        TargetStore.update = vi.fn(callback => {
            // Execute the callback with our mock store
            const result = callback(mockStore);
            // Return the result
            return result;
        });
        
        // @ts-ignore
        metricsRenderer.graphicsFactory = {
            createExtremeSpreadGraphics: vi.fn().mockReturnValue(new Graphics())
        };
    
        // Act
        metricsRenderer.drawExtremeSpread(1);
    
        // Assert
        expect(TargetStore.update).toHaveBeenCalled();
    
        // Check that the store was updated correctly
        // @ts-ignore
        expect(mockGroup.metrics.extremespread).toBeDefined();
        // @ts-ignore
        expect(mockGroup.metrics.extremespread.px).toBeCloseTo(28.28, 1);
        // @ts-ignore
        expect(mockGroup.metrics.extremespread.mm).toBe(10);
    });
});