/**
 * src/lib/stores/EditorStore.ts
 * Pubsub-ish för target editorn.
 */
import { type Writable, writable } from "svelte/store";
import { z } from 'zod';

const WarningSchema = z.object({
    id: z.string(),
    message: z.string()
});

export type WarningInterface = z.infer<typeof WarningSchema>;

const modeSchema = z.enum(['drag', 'info', 'shots', 'poa', 'reference', 'rotate', 'settings', 'none']);
export type Mode = z.infer<typeof modeSchema>

const EditorStoreSchema = z.object({
    warnings: z.array(WarningSchema).optional(),
    aIsMoved: z.boolean(),
    aIsSet: z.boolean(),
    xIsMoved: z.boolean(),
    xIsSet: z.boolean(),
    refMeasurement: z.string(),
    refMeasurementUnit: z.string(),
    isRefDirty: z.boolean(),
    isRefComplete: z.boolean(),
    isInfoComplete: z.boolean(),
    selected: z.array(z.any()),
    mode: modeSchema
})

export type EditorStoreInterface = z.infer<typeof EditorStoreSchema>;

export const showAddFirearm:    Writable<boolean> = writable(false);
export const showAddAmmunition: Writable<boolean> = writable(false);
export const showAddWeather:    Writable<boolean> = writable(false);

const warnings: Writable<WarningInterface[]> = writable([]);

export const EditorStore: Writable<EditorStoreInterface> = writable({
    warnings: [],
    aIsMoved: false,
    aIsSet: false,
    xIsMoved: false,
    xIsSet: false,
    refMeasurement: '',
    refMeasurementUnit: 'cm',
    isRefDirty: true,
    isRefComplete: false,
    isInfoComplete: false,
    selected: [],
    mode: 'none'
});
