import type { PageServerLoad } from './$types';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

export const load: PageServerLoad = async () => {

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
