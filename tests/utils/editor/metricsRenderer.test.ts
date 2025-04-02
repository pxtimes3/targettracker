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
            reference: { measurement: 'mm', linelength: 100 }
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
            groups: [{ id: 1 }, {id: 666}],
        };
    });

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

        // Act
        metricsRenderer.drawMeanRadius(1);

        // Assert
        expect(mockGroupContainer.addChild).toHaveBeenCalled();
    });
});