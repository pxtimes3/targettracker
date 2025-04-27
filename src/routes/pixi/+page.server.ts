import * as table from '$lib/server/db/schema';
import { db } from "@/server/db";
import type { Actions } from "@sveltejs/kit";
import { fail } from '@sveltejs/kit';
import { and, desc, eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";
import type { UUIDTypes } from 'uuid';
import type { Gun, Events, Targets } from '$lib/server/db/schema';
import { events, ammunition } from '../../lib/server/db/schema';

export const load: PageServerLoad = async (event) => {
    if (!event.locals.user) {
		return;
	}

    return { user: event.locals.user, gunsEvents: await fetchData(event.locals.user.id) };
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
}

async function fetchData(userId: string): Promise<GunsEvents|boolean> {
    console.debug(`Fetching data... `);

    try {
        if (!userId) { 
            console.error(`No userId supplied!`); 
            throw new Error(`No userId supplied!`); 
        } else {
            console.debug(`UserID: ${userId}`);
        }

        console.log('Trying to fetch from db...');
        const gunsResult = await db
            .select({
                gun: table.gun,
                target: table.targets
            })
            .from(table.gun)
            .leftJoin(
                table.targets,
                eq(table.gun.id, table.targets.gunId),
            )
            .where(
                eq(table.gun.userId, userId),
            )
            .orderBy(table.gun.name);
        
        const eventsResult = await db
            .select({
                event: table.events,
                targets: table.targets
            })
            .from(table.events)
            .leftJoin(
                table.targets,
                eq(table.events.id, table.targets.eventId)
            )
            .where(
                and(
                    eq(table.events.userId, userId),
                    eq(table.targets.userId, userId),
                )
            );

        const ammunitionResult = await db
            .select()
            .from(table.ammunition)
            .where(
                eq(table.ammunition.userId, userId)
            );
        
        console.debug('guns:', gunsResult, 'events:', eventsResult, 'ammunition:', ammunitionResult);
        return {guns: gunsResult, events: eventsResult, ammunition: ammunitionResult};
    } catch (error) {
        console.error(`Something failed!`, error);
        return false;
    }
}