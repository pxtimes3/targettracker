import { browser } from "$app/environment";
import { writable } from "svelte/store";
import { z } from 'zod';

const STORE_KEY = 'targetTrackerSettingsStore';

const SettingsSchema = z.object({
    cursortips: z.boolean(),
	isometrics: z.boolean(),
	mils: z.boolean(),
	showallshots: z.boolean(),
	editorhelpclosed: z.boolean(),
	lasttargettype: z.string().optional(),
	lastcaliber: z.string().uuid().optional(),
	lastgun: z.string().uuid().optional(),
});

export type SettingsInterface = z.infer<typeof SettingsSchema>;

const initSettingsStore: SettingsInterface = {
    cursortips: true,
	isometrics: true,
	mils: true,
	showallshots: true,
	editorhelpclosed: false,
	lasttargettype: undefined,
	lastcaliber: undefined,
	lastgun: undefined,
}

function createTargetStore()
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
}
