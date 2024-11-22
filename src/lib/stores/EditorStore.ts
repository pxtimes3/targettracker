/**
 * Pubsub-ish för target editorn.
 */
import { type Writable, writable } from "svelte/store";
import { z } from 'zod';

const WarningSchema = z.object({
    id: z.string(),
    message: z.string()
});

export type WarningInterface = z.infer<typeof WarningSchema>;

const EditorStoreSchema = z.object({
    warnings: z.array(WarningSchema).optional(),
    isRefDirty: z.boolean(),
    isRefComplete: z.boolean(),
    selected: z.array(z.any())
})

export type EditorStoreInterface = z.infer<typeof EditorStoreSchema>;

export const activeButton:      Writable<string> = writable();
export const activePanel:       Writable<string> = writable();

export const showAddFirearm:    Writable<boolean> = writable(false);
export const showAddAmmunition: Writable<boolean> = writable(false);
export const showAddWeather:    Writable<boolean> = writable(false);

const warnings: Writable<WarningInterface[]> = writable([]);

export const EditorStore: Writable<EditorStoreInterface> = writable({
    warnings: [],
    isRefDirty: true,
    isRefComplete: false,
    selected: []
});
