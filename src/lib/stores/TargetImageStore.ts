import { browser } from "$app/environment";
import { calculateReferenceValues } from "@/utils/target";
import { writable, type Writable } from "svelte/store";
import { z } from 'zod';

// TODO: Save to database periodsvis.

const STORE_KEY = 'targetTrackerStore';

/**
 * Håller bild-datan som base64-string.
 */
export const cameraImageDataStore: Writable<undefined|string> = writable();

const ShotSchema = z.object({
    id: z.string(),
    group: z.number(),
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


const TargetStoreSchema = z.object({
    target: z.object({
        scale: z.number().optional(),
        rotation: z.number().optional(),               // degrees. * Math.PI / 180 => angle
        type: z.string().optional(),
        range: z.number().optional(),
        rangeUnit: z.union([z.literal('metric'), z.literal('imperial')]),
        name: z.string().optional(),
        firearm: z.string().uuid().optional(),         // firearm-ID
        ammunition: z.string().uuid().optional(),      // ammo-ID
        caliberInMm: z.number().optional(),            //
        image: z.object({
            image: browser
                ? z.instanceof(HTMLImageElement).optional()
                : z.any().optional(),
            filename: z.string().optional(),
            originalsize: z.tuple([z.number().optional(), z.number().optional()]),
            x: z.number().optional(),
            y: z.number().optional(),
            w: z.number().optional(),
            h: z.number().optional(),
        }),
    }),
    reference: z.object({
        a: z.array(z.number().optional(), z.number().optional()).optional(),            // [x,y]
        x: z.array(z.number().optional(), z.number().optional()).optional(),
        y: z.array(z.number().optional(), z.number().optional()).optional(),
        linelength: z.number().optional(),
        measurement: z.number().optional(),    // User supplied;
        cm: z.number().optional(),             // 1 cm === px
        px: z.number().optional()              // 100px == mm
    }),
    analysisFetched: z.boolean().default(false),
    activeGroup: z.number().default(0),
    groups: z.array(GroupSchema),
    weather: z.object({
        // averages
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        altitude: z.number().optional(),
        timestamp: z.string().optional(),
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

export const initialStore: TargetStoreInterface = {
    target: {
        type: undefined,
        range: undefined,
        rangeUnit: "metric",
        name: undefined,
        firearm: undefined,         // firearm-ID
        ammunition: undefined,
        caliberInMm: undefined,
        scale: undefined,
        rotation: 0,
        image: {
            filename: "debugtarget.jpg",
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
        linelength: undefined,
        measurement: undefined,    // User supplied, converted to mm
        cm: undefined,             // 10 mm === px
        px: undefined,             // 100px == mm
    },
    analysisFetched: false,
    activeGroup: 0,
    groups: [
        /*{
            id: 1,
            shots: [
                {
                    group: 1,
                    x: 100,
                    y: 100,
                },
                {
                    group: 1,
                    x: 200,
                    y: 200,
                },
            ],
            poa: undefined,
            metrics: {
                meanradius: 0,
                size: 0,
                diagonal: 0
            }
        }*/
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
    let storedData = browser ? JSON.parse(localStorage.getItem(STORE_KEY) || 'null') : null;
    // TODO: Remove @ release
    if (storedData) { storedData = null }

    // pluppa in data
    const store = writable<TargetStoreInterface>(storedData || initialStore);

    if (browser) {
        store.subscribe(val => {
            localStorage.setItem(STORE_KEY, JSON.stringify(val));
        });
    }

    let currentState: TargetStoreInterface;
    store.subscribe(value => {
        currentState = value;
    });

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
        },
        setShot: (label: string, groupid: number, x: number, y: number, score: number = 0) => {
            store.update(state => {
                const group: number = state.groups.findIndex((g) => g.id === groupid);
                if (group === -1) throw new Error(`Tried to add to group: ${groupid} but none were found!`);

                const shot: ShotInterface = {id: label, x: x, y: y, group: groupid, score: score};

                state.groups[group].shots?.push(shot);

                // TODO: Räkna ut/uppdatera MR, ES etc...

                return state;
            })
        },
        /**
         * Uppdaterar position och score för shot.
         *
         * @param label    Parsead från sprite.label till motsv. id i store.
         * @param groupid  Används för att lokalisera vilket shot som ska uppdateras
         * @param x        Position
         * @param y
         * @param score    Ev. score
         * @param newgroup Används inte. Flyttande av shots sköts av ShotPoaTool.ts
         */
        updateShot: (label: string, groupid: number, x: number, y: number, score: number = 0, newgroup?: number) => {
            store.update(state => {
                // le deep state
                const newState = structuredClone(state);
                
                // Find
                const group = newState.groups.find(g => g.id === groupid);
                if (!group || !group.shots) 
                    throw new Error(`Group ${groupid} not found or has no shots`);
                    
                const shot = group.shots.find(s => s.id === label);
                if (!shot) 
                    throw new Error(`Shot ${label} not found`);

                // Update
                shot.x = x;
                shot.y = y;
                shot.score = score;
                
                return newState;
            });
        },
        removeShot: (groupid: number|string, shotid: string) => {
            store.update(state => {
                const newState = structuredClone(state);

                // console.log('state:', {
                //     groupid,
                //     shotid,
                //     groups: newState.groups.map(g => ({ id: g.id, shots: g.shots }))
                // });
                
                const group = newState.groups.find(g => g.id === Number(groupid));
                // console.log('Found group:', group);

                if (!group) {
                    throw new Error(`Tried to delete shot ${shotid} from group: ${groupid} but no such group were found!`);
                }
                if (!group.shots) {
                    throw new Error(`Tried to delete shot ${shotid} from group: ${groupid} but shots array was empty!`);
                }

                const shotIndex = group.shots.findIndex(shot => shot.id === shotid);
                if (shotIndex === -1) {
                    throw new Error(`Tried to find shot with id: ${shotid} but no shot was found!`);
                }
                
                group.shots.splice(shotIndex, 1);
                
                return newState;
            })
        },
        updatePoa: (groupid: number, x: number, y:number) => {
            store.update(state => {
                const group: GroupInterface|undefined = state.groups.find((g) => g.id === groupid);
                if (!group) throw new Error(`Tried to find group: ${groupid} to update PoA, but none were found!`);
                group.poa = {
                    x: x,
                    y: y
                }
                return state;
            })
        },
        setReference: (key: keyof TargetStoreInterface['reference'], value: number[]|number) => {
            store.update(state => {
                const newState = {
                    ...state,
                    reference: {
                        ...state.reference,
                        [key]: value
                    }
                };

                if (newState.reference.a && newState.reference.x && newState.reference.measurement) {
                    const calculatedValues = calculateReferenceValues(newState.reference, newState.target);

                    return {
                        ...newState,
                        reference: {
                            ...newState.reference,
                            ...calculatedValues
                        }
                    };
                }

                return newState;
            });
        },
        createNewGroup: (id: number = currentState.groups.length + 1) => {
            const newGroup = {
                id: id,
                shots: [],
                score: 0,
                poa: {x:0, y: 0},
                metrics: {
                    meanradius: 0,
                    size: 0,
                    diagonal:0
                }
            }
            store.update(state => {
                currentState.groups.push(newGroup);
                return state;
            });
            return currentState.groups.find((g) => g.id === id)
        },
        mmToPx: (mm: number) => {
            if (!currentState.reference.cm) {
                return 0;
            }
            return (mm / 10) * currentState.reference.cm;
        },
        pxToMm: (px: number) => {
            if (!currentState.reference.measurement || !currentState.reference.linelength) {
                return 0;
            }
            return (px * currentState.reference.measurement) / currentState.reference.linelength;
        }
    }
}

export const TargetStore = createTargetStore();
