import { db } from '$lib/server/db/index';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { faq } from '../../lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    try {
        const query = await db.select()
            .from(faq)
            .orderBy(faq.order);

        if (query) {
            console.log(query)
            return { faq: query }
        }
    } catch (error) {
        // FIXME: Logging
        console.error(error);
    }
};

export const actions = {

};
