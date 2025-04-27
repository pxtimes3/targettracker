/* src/routes/gun/edit/[uuid]/+page.server.ts */
import type { PageServerLoad } from '$types';
import { redirect } from '@sveltejs/kit';
import { sql, eq, and } from 'drizzle-orm';
import type { v4 } from 'uuid';
import { db } from '$lib/server/db';
import { gun, gunTypeEnum } from '@/server/db/schema';
import { error } from 'console';

// @ts-ignore (event)
export const load: PageServerLoad = async ( event ) => {
    if (!event.locals.user) {
        return redirect(302, '/auth');
    }

    const gundata = await fetchGunData(event.params.uuid, event.locals.user.id);
    return { user: event.locals.user, gundata: gundata, gunTypes: gunTypeEnum.enumValues };
};

async function fetchGunData(gunid: any, user_id: any)
{
    const result = await db.select()
        .from(gun)
        .where(
            and(
                eq(gun.id, gunid),
                eq(gun.userId, user_id)
            )
        );
    
    if(result && result.length) {
        return result[0];
    } else {
        return {error: { message: `No gun with that ID.` }}
    }
}