// tests/helpers.ts
import { TargetStore } from '@/stores/TargetImageStore';
import { get } from 'svelte/store';

export const getStoreValue = () => get(TargetStore);

export const setupStore = (initialState = {}) => {
    TargetStore.set({
        // Default test state
        target: {
            rangeUnit: "metric",
            image: {
                filename: 'test.jpg',
                originalsize: [1240, 768]
            }
        },
        // Merge with provided state
        ...initialState,
        reference: {},
        activeGroup: 0,
        groups: [],
        weather: {
            data: {}
        }
    });
};
