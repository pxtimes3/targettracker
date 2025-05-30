import * as table from '$lib/server/db/schema';
import { db } from "@/server/db";
import type { Actions } from "@sveltejs/kit";
import { fail } from '@sveltejs/kit';
import { and, eq, asc, desc } from "drizzle-orm";
import type { PageServerLoad } from "./$types";
import { GunStore } from '../../lib/stores/GunStore';
import { get } from 'svelte/store';

export const load = async ({locals, depends}) => {
    depends('pixi');

    if (!locals.user) {
		return;
	}

    // console.debug('Hello from pixis +page.server.ts load method!');

    return { user: locals.user, gunsEvents: await fetchData(locals.user.id) };
};

export const actions: Actions = {
    fetchanalysis: async ({ request }) => {
        try {
            const formData = await request.formData();
            const user_id = formData.get('user_id')?.toString();
            const imagename = formData.get('imagename')?.toString();

            if (!user_id || !imagename) {
                return fail(400, { error: 'Invalid data' });
            }

            const result = await db.select()
                .from(table.analysis)
                .where(
                    and(
                        eq(table.analysis.user_id, user_id),
                        eq(table.analysis.image_name, imagename)
                    ))
                .limit(1);

            if (result.length > 0) {
                return result;
            } else {
                return fail(404, { error: `No data found for ${imagename}` });
            }

        } catch (error) {
            return fail(500, { error: String(error) });
        }
    },
    saveTarget: async ({ request }) => {
        try {
            console.debug(request);
        } catch (err) {
            
        }
    }
}

async function fetchData(userId: string): Promise<GunsEvents|boolean> {
    console.debug(`Fetching data... `);

    try {
        if (!userId) { 
            console.error(`No userId supplied!`); 
            throw new Error(`No userId supplied!`); 
        } 
        // else {
        //     console.debug(`UserID: ${userId}`);
        // }

        // console.log('Trying to fetch from db...');
        const gunsResult = await db
            .select()
            .from(table.gun)
            .where(
                eq(table.gun.userId, userId),
            )
            .orderBy(table.gun.name);
        
        //console.debug('gunsResult:',gunsResult.length)
        
        GunStore.set({
            loading: false,
            error: null,
            guns: gunsResult
        });

        // console.debug('gunStore:', get(GunStore))
        
        const eventsResult = await db
            .select()
            .from(table.events)
            .where(
                eq(table.events.userId, userId),
            )
            .orderBy(desc(table.events.createdAt));

        const ammunitionResult = await db
            .select()
            .from(table.ammunition)
            .where(
                eq(table.ammunition.userId, userId)
            );
        
        // console.debug('guns:', gunsResult, 'events:', eventsResult, 'ammunition:', ammunitionResult);
        return {guns: gunsResult, events: eventsResult, ammunition: ammunitionResult};
    } catch (error) {
        console.error(`Something failed!`, error);
        return false;
    }
}