import { browser } from "$app/environment";
import { writable, type Writable } from "svelte/store";
import { z } from 'zod';

const STORE_KEY = 'targetTrackerStore';

/**
 * Håller bild-datan som base64-string.
 */
export const cameraImageDataStore: Writable<undefined|string> = writable();

const ShotSchema = z.object({
    group: z.number(),
    image: z.instanceof(HTMLImageElement).optional(),
    x: z.number(),
    y: z.number(),
    score: z.number().optional()
}).and(
    z.record(
        z.union([z.string(), z.number()]), // key
		z.union([z.string(), z.number()]).optional() // value
    )
);

export type ShotInterface = z.infer<typeof ShotSchema>;

const PoaSchema = z.object({
    x: z.number(),
    y: z.number()
}).and(
    z.record(
        z.union([z.string(), z.number()]),
        z.number(),
    )
);

export type PoaInterface = z.infer<typeof PoaSchema>

const GroupSchema = z.object({
    id: z.number(),
    shots: z.array(ShotSchema).optional(),
    score: z.number().optional(),
    poa: PoaSchema.optional(),
    metrics: z.object({
        meanradius: z.number().optional(),
        size: z.number().optional(),
        diagonal: z.number().optional()
    }).optional()
}).passthrough();

export type GroupInterface = z.infer<typeof GroupSchema>;


export interface zTargetStoreInterface {
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
        a: number[]|undefined;            // [x,y]
        aImage: HTMLImageElement|undefined;
        x: number[]|undefined;
        xImage: HTMLImageElement|undefined;
        y?: number[]|undefined;
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

const TargetStoreSchema = z.object({
    target: z.object({
        scale: z.number().optional(),
        rotation: z.number().optional(),               // degrees. * Math.PI / 180 => angle
        type: z.string().optional(),
        range: z.number().optional(),
        rangeUnit: z.union([z.literal('metric'), z.literal('imperial')]),
        name: z.string().optional(),
        image: z.object({
            image: z.instanceof(HTMLImageElement).optional(),
            filename: z.string().optional(),
            originalsize: z.tuple([z.number().optional(), z.number().optional()]),
            x: z.number().optional(),
            y: z.number().optional(),
            w: z.number().optional(),
            h: z.number().optional(),
        }),
    }),
    reference: z.object({
        a: z.number().optional(),            // [x,y]
        x: z.number().optional(),
        y: z.number().optional(),
        measurement: z.number().optional(),    // User supplied;
        cm: z.number().optional(),             // 1 cm === % av tavlan
        pct: z.number().optional()            // det omvända
    }),
    activeGroup: z.number().default(0),
    groups: z.array(GroupSchema),
    weather: z.object({
        // averages
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        altitude: z.number().optional(),
        timestamp: z.number().optional(),
        data: z.object({
            temperature: z.number().optional(),  // Celcius
            humidity: z.number().optional(),
            pressure: z.number().optional(),
            windspeed: z.number().optional(),
            winddirection: z.number().optional(),
        })
    })
});

export type TargetStoreInterface = z.infer<typeof TargetStoreSchema>;

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
        a: undefined,
        y: undefined,
        measurement: undefined,    // User supplied,
        cm: undefined,             // 1 cm === % av tavlan
        pct: undefined,            // det omvända
    },
    activeGroup: 0,
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
