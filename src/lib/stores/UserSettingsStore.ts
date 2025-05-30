import { browser } from "$app/environment";
import { writable } from "svelte/store";
import { z } from 'zod';

const STORE_KEY = 'targetTrackerSettingsStore';

const SettingsSchema = z.object({
    cursortips: z.boolean(),
	isometrics: z.boolean(),
	mils: z.boolean(),
	showallshots: z.boolean(),
    editorcrosshair: z.boolean(),
	editorhelpclosed: z.boolean(),
    showccr: z.boolean(),
    showmr: z.boolean(),
    showes: z.boolean(),
    showmpi: z.boolean(),
    showdiagonal: z.boolean(),
    showrectangle: z.boolean(),
	lasttargettype: z.string().optional(),
	lastcaliber: z.string().uuid().optional(),
	lastgun: z.string().uuid().optional(),
}).and(
    z.record(
        z.union([z.string(), z.number()]),
        z.union([z.boolean(), z.string().uuid(), z.undefined()]),
    )
);;

export type SettingsInterface = z.infer<typeof SettingsSchema>;

const initSettingsStore: SettingsInterface = {
    cursortips: true,
	isometrics: true,
	mils: true,
	showallshots: true,
    editorcrosshair: true,
    editorhelpclosed: false,

    showccr: false,
    showmr: true,
    showes: true,
    showmpi: true,
    showdiagonal: false,
    showrectangle: false,

	lasttargettype: undefined,
	lastcaliber: undefined,
	lastgun: undefined,
}

function createSettingStore()
{
    // har vi sparad data?
    const storedData = browser ? JSON.parse(localStorage.getItem(STORE_KEY) || 'null') : null;

    // pluppa in data
    const store = writable<SettingsInterface>(storedData || initSettingsStore);

    if (browser) {
        store.subscribe(val => {
            localStorage.setItem(STORE_KEY, JSON.stringify(val));
        });
    }

	return {
        ...store,
        reset: () => {
            store.set(initSettingsStore);
        },
        clearStorage: () => {
            if (browser) {
                localStorage.removeItem(STORE_KEY);
            }
            store.set(initSettingsStore);
        }
    }
}

export const UserSettingsStore = createSettingStore();
