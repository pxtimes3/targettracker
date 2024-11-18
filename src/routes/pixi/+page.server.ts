import * as table from '$lib/server/db/schema';
import { db } from "@/server/db";
import type { Actions } from "@sveltejs/kit";
import { fail } from '@sveltejs/kit';
import { and, eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
    if (!event.locals.user) {
		return;
	}
    return { user: event.locals.user };
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
