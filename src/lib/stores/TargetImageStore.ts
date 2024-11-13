import { browser } from "$app/environment";
import { writable, type Writable } from "svelte/store";

const STORE_KEY = 'targetTrackerStore';

/**
 * Håller bild-datan som base64-string.
 */
export const cameraImageDataStore: Writable<undefined|string> = writable();

export interface ShotInterface {
    [key: string|number]: string|object|number|undefined;
    group: number|undefined;
    image: HTMLImageElement|undefined;
    x: number|undefined;
    y: number|undefined;
    score?: number|undefined;
}

export interface PoaInterface {
    [key: string]: undefined|number|HTMLImageElement;
    image: HTMLImageElement|undefined;
    x: number|undefined;
    y: number|undefined;
}

export type GroupInterface = {
    [key: string|number]: string|object|number|undefined;  // This allows numeric indexing
    id: number|undefined;
    shots: ShotInterface[]|undefined;
    score?: number|undefined;
    poa?: PoaInterface;
    metrics: {
        meanradius: number|undefined;
        size: number|undefined;
        diagonal: number|undefined;
    }
}

export interface TargetStoreInterface {
    [key: string|number|symbol]: string|object|number|undefined;
    target: {
        scale: number|undefined;
        rotation: number;               // degrees. * Math.PI / 180 => angle
        type: string|undefined;
        range: string|undefined;
        rangeUnit: "metric"|"imperial";
        name: string|undefined;
        image: {
            image?: HTMLImageElement;
            filename: string|undefined;
            originalsize: [number|undefined, number|undefined];
            x: number|undefined;
            y: number|undefined;
            w: number|undefined;
            h: number|undefined;
        }
    }
    reference: {
        x: number|undefined;
        y: number|undefined;
        z?: number|undefined;
        measurement: number|undefined;    // User supplied;
        cm: number|undefined;             // 1 cm === % av tavlan
        pct: number|undefined;            // det omvända
    }
    activeGroup: number;
    groups: Array<GroupInterface>;
    weather: {
        // averages
        latitude: number|undefined;
        longitude: number|undefined;
        altitude: number|undefined;
        timestamp: string|undefined;
        data: {
            temperature: number|undefined;  // Celcius
            humidity: number|undefined;
            pressure: number|undefined,
            windspeed: number|undefined,
            winddirection: number|undefined,
        }
    }
}

const initialStore: TargetStoreInterface = {
    target: {
        type: undefined,
        range: undefined,
        rangeUnit: "metric",
        name: undefined,
        scale: undefined,
        rotation: 0,
        image: {
            filename: undefined,
            originalsize: [undefined, undefined],
            x: undefined,
            y: undefined,
            w: undefined,
            h: undefined,
        }
    },
    reference: {
        x: undefined,
        y: undefined,
        z: undefined,
        measurement: undefined,    // User supplied,
        cm: undefined,             // 1 cm === % av tavlan
        pct: undefined,            // det omvända
    },
    activeGroup: 1,
    groups: [
        {
            id: 1,
            shots: [],
            poa: undefined,
            metrics: {
                meanradius: 0,
                size: 0,
                diagonal: 0
            }
        }
    ],
    weather: {
        latitude:  undefined,
        longitude: undefined,
        altitude:  undefined,
        timestamp: undefined,
        data: {
            temperature: undefined,  // Celcius
            humidity: undefined,
            pressure: undefined,
            windspeed: undefined,
            winddirection: undefined,
        }
    }
};

function createTargetStore()
{
    // har vi sparad data?
    const storedData = browser ? JSON.parse(localStorage.getItem(STORE_KEY) || 'null') : null;

    // pluppa in data
    const store = writable<TargetStoreInterface>(storedData || initialStore);

    if (browser) {
        store.subscribe(val => {
            localStorage.setItem(STORE_KEY, JSON.stringify(val));
        });
    }

    return {
        ...store,
        reset: () => {
            store.set(initialStore);
        },
        clearStorage: () => {
            if (browser) {
                localStorage.removeItem(STORE_KEY);
            }
            store.set(initialStore);
        }
    }
}

export const TargetStore = createTargetStore();
