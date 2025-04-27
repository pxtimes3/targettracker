// First, all imports
import { vi } from "vitest";

// Define mock objects before using them in vi.mock
export const TargetStoreMock = {
    subscribe: vi.fn((cb) => {
        cb({ 
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
                rotation: 45,
            },
        });
        return () => {};
    }),
    addShot: vi.fn(),
    removeShot: vi.fn(),
    getGroup: vi.fn(),
    getShots: vi.fn(),
    updateShot: vi.fn(),
    updatePoa: vi.fn(),
    setShot: vi.fn(),
    // Add direct properties that might be accessed
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
    target: { rotation: 45 },
};

export const MockUserSettingsSubscribe = vi.fn((cb) => {
    cb({});
    return () => {};
});

export const MockTargetStoreSubscribe = TargetStoreMock.subscribe;

// Now all vi.mock calls
vi.mock('@/stores/TargetImageStore', () => ({
    TargetStore: TargetStoreMock
}));

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

// Fix the svelte/store mock to use TargetStoreMock instead of importing TargetStore
vi.mock('svelte/store', () => ({
    get: vi.fn().mockImplementation((store) => {
        // Compare by reference to the mock we created
        if (store === TargetStoreMock) {
            return {
                groups: TargetStoreMock.groups,
                activeGroup: TargetStoreMock.activeGroup,
                reference: TargetStoreMock.reference,
                target: TargetStoreMock.target,
            };
        }
        return {};
    }),
    writable: vi.fn(() => ({
       subscribe: vi.fn(),
       set: vi.fn(),
       update: vi.fn()
    }))
}));