import { extname } from 'path';
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { v4 as uuidv4 } from 'uuid';
import type { PageServerLoad } from '../../../.svelte-kit/types/src/routes/target/$types';
import { targetUploadFormSchema } from "./targetuploadformschema";

export const load: PageServerLoad = async () => {
  return {
    form: await superValidate(zod(targetUploadFormSchema)),
  };
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
