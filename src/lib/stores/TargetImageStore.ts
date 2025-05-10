// src/lib/stores/TargetImageStore.ts
import { browser } from "$app/environment";
import { calculateReferenceValues } from "@/utils/target";
import { writable, type Writable } from "svelte/store";
import { z } from 'zod';

const STORE_KEY = 'targetTrackerStore';

/**
 * Håller bild-datan som base64-string.
 */
export const cameraImageDataStore: Writable<undefined|string> = writable();

const ShotSchema = z.object({
    id: z.union([z.string(),z.number()]),
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
        meanradius: z.object({
            px: z.number().optional(),
            mm: z.number().optional()
        }).optional(),
        coveringradius: z.object({
            px: z.number().optional(),
            mm: z.number().optional()
        }).optional(),
        extremespread: z.object({
            px: z.number().optional(),
            mm: z.number().optional()
        }).optional(),
        diagonal: z.object({
            px: z.number().optional(),
            mm: z.number().optional(),
            width: z.number().optional(),  // X^ (extreme width)
            height: z.number().optional(), // Y^ (extreme height)
        }).optional(),
        fom: z.object({
            px: z.number().optional(),
            mm: z.number().optional()
        }).optional()
    }).optional()
}).passthrough();

export type GroupInterface = z.infer<typeof GroupSchema>;


const TargetStoreSchema = z.object({
    info: z.object({
        event: z.string(),
        name: z.string(),
        type: z.string(),
        firearm: z.string(),
        ammunition: z.string(),
        weather: z.object({
            windspeed: z.number(),
            wind_direction: z.string(),
            altitude: z.number(),
            temperature: z.number(),
            humidity: z.number(),
        }),
        note: z.string(),
        public: z.boolean(),
    }),
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
        a: z.tuple([z.number(), z.number()]), // [x,y]
        x: z.tuple([z.number(), z.number()]), // [x,y]
        y: z.tuple([z.number(), z.number()]).optional(), // [x,y]
        linelength: z.number(),
        measurement: z.number(),    // User supplied;
        measurementUnit: z.union([z.literal('cm'), z.literal('in')]),
        cm: z.number(),             // 1 cm === px
        px: z.number()              // 100px == mm
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
    info: {
        event: '',
        name: '',
        type: '',
        firearm: '',
        ammunition: '',
        weather: {
            windspeed: 0,
            wind_direction: '',
            altitude: 0,
            temperature: 0,
            humidity: 0,
        },
        note: '',
        public: false,
    },
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
        x: [693.6582781456955, -441.3245033112584],
        a: [-718.5801324503311, -435.09403973509944],
        y: undefined,
        linelength: 1410.175353247501,
        measurement: 7.5,    // User supplied, converted to mm
        measurementUnit: 'cm',
        cm: 201.7503077426864,             // 10 mm === px
        px: 5.318487507761503,             // 100px == mm
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
        getShots: (groupId: number) => {
            return currentState.groups.find((g) => g.id === groupId)?.shots;
        },
        addShot(shot: ShotInterface, groupId: number) {
            this.update(store => {
                const group = store.groups.find(g => g.id === groupId);
                if (!group || !group.shots) {
                    throw new Error('Fail!');
                } else {
                    group.shots.push(shot);
                }
                return store;
            });
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
                if (!shot) {
                    console.error(group.shots);
                    console.error(`Shot ${label} not found`);
                    return state;
                }

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

                const shotIndex = group.shots.findIndex(shot => shot.id === (parseInt(shotid)).toString());
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
                    meanradius: { px: 0, mm: 0 },
                    coveringradius: { px: 0, mm: 0 },
                    extremespread: { px: 0, mm: 0 },
                    diagonal: { px: 0, mm: 0, width: 0, height: 0 },
                    fom: { px: 0, mm: 0 }
                }
            }
            store.update(state => {
                currentState.groups.push(newGroup);
                return state;
            });
            return currentState.groups.find((g) => g.id === id)
        },
        getGroup: (id: number = currentState.groups.length) => {
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
        },
        totalShots: (group?: number) => {
            let total: number = 0;

            if (!group) {
                currentState.groups.forEach(group =>{
                    if (group.shots?.length) {
                        total += group.shots.length;
                    }
                });
            } else {
                const grp = currentState.groups.find((g) => group === g.id);
                if (grp) {
                    return grp.shots?.length || 0;
                }
            }
            
            return total;
        },
    }
}

export const TargetStore = createTargetStore();


// Så komponenter kan prata med varandra
import type { Target } from '@/utils/editor/Target';

export const targetInstance = writable<Target | undefined>(undefined);