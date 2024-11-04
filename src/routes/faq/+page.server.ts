import { db } from '$lib/server/db/index';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { faq } from '../../lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    try {
        const query = await db.select()
            .from(faq);

        if (query) {
            console.log(query)
            return { faq: query[0] }
        }
    } catch (error) {
        // FIXME: Logging
        console.error(error);
    }
};

export const actions = {
    targetupload: async ({ request }) => {
        console.log('targetupload called');
        const formData = await request.formData();
        if (!formData) return;

        const uploadedFile = formData?.get('file') as File;
        if(!uploadedFile) return;

        const filename = `${uuidv4()}${extname(uploadedFile?.name)}`;
        console.log(filename);
        // await writeFile(filename, Buffer.from(await uploadedFile?.arrayBuffer()));

        return { success: true };
    }
};
