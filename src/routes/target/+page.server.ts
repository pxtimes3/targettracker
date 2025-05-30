import { VITE_ANALYSIS_URL } from '$env/static/private';
import * as table from '$lib/server/db/schema';
import { db } from '@/server/db';
import { TargetStore, type TargetStoreInterface } from '@/stores/TargetImageStore.js';
import { fail } from '@sveltejs/kit';
import ExifReader from 'exifreader';
import { writeFile } from 'fs/promises';
import { DateTime } from 'luxon';
import { extname } from 'path';
import { get } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {

};

export const actions = {
    targetupload: async ({ locals, request }) => {
        if (!locals.user) {
		    return fail(401, {message: "Unauthorized"});
	    }

        const formData = await request.formData();
        if (!formData) return;

        const uploadedFile = formData?.get('targetImage') as File;
        if(!uploadedFile) {
            console.error("nofile");
            return fail(400, {message: "no file"});
        }

        // return fail(400, {message: "Errormessage"});

        let ext;
        extname(uploadedFile?.name) ? ext = extname(uploadedFile?.name) : ext = `.${formData.get('extension')?.toString()}`;

        const filename = `${uuidv4()}${ext}`;

        //console.log(filename);

        await writeFile('temp/' + filename, Buffer.from(await uploadedFile?.arrayBuffer()));
        await writeFile('targettracker.analysis/analyze/' + filename, Buffer.from(await uploadedFile?.arrayBuffer()));

        let store: TargetStoreInterface = get(TargetStore);
        store.target.image.filename = filename;
        store.target.name = formData.get('targetName')?.toString();
        store.target.type = formData.get('targetType')?.toString();
        store.target.range = formData.get('targetRange')?.toString();
        store.target.image.filename = filename.toString();
        store.target.rangeUnit = formData.get('targetRangeUnit')?.toString() === "metric" ? 'metric' : 'imperial';

        // console.log(store);

        try {
            const result = await db.insert(table.analysis)
                .values({
                    user_id: locals.user?.id,
                    image_name: filename
                })
                .returning({'id': table.analysis.id });

            if (result[0].id) {
                console.log(result[0].id)
                fetch(`${VITE_ANALYSIS_URL}${result[0].id}`);
            }

        } catch (error) {
            console.error(error);
        }

        const tags = await ExifReader.load(Buffer.from(await uploadedFile?.arrayBuffer()), {expanded: true, includeUnknown: true});

        if (tags.exif?.DateTimeOriginal && tags.exif?.OffsetTimeOriginal ) {
            store.weather.timestamp = tags.exif.DateTimeOriginal?.description+tags.exif.OffsetTimeOriginal?.description;
            // Nested since we dont care about GPS if there's no timedata.
            if (tags.gps) {
                store.weather.latitude = tags.gps.Latitude || undefined;
                store.weather.longitude = tags.gps.Longitude || undefined;
                store.weather.altitude = tags.gps.Altitude || undefined;
            }

            await getWeatherData();
            console.log(store);
        }

        return { success: true, storeData: JSON.stringify(store) }
    }
};

async function getWeatherData(): Promise<void>
{
    let store: TargetStoreInterface = get(TargetStore);

    if (!store.weather.timestamp) return;

    // EXIF sparar datum som 2001:03:16 14:15:16 -.-
    // exif.OffsetTimeOriginal tillagd när vi hämtar tags i targetupload så strängen är 2001:03:16 14:15:16+02:00 när vi får den här.
    const dateTime = DateTime.fromISO(`${store.weather.timestamp.substring(0,10).replaceAll(/:/gi, '-')}T${store.weather.timestamp.substring(11, store.weather.timestamp.length)}`);
    const timezoneText = dateTime.zoneName;
    const hour = dateTime.hour;

    const meteourl = `https://archive-api.open-meteo.com/v1/archive?latitude=${store.weather.latitude}&longitude=${store.weather.longitude}&start_date=${dateTime.toFormat('yyyy-MM-dd')}&end_date=${dateTime.toFormat('yyyy-MM-dd')}&hourly=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m&timezone=${timezoneText}`;

    try {
        const request = await fetch(meteourl, {
            method: 'GET'
        });

        const result = await request.json();
        if (result) {
            store.weather.data.temperature = result.hourly.temperature_2m[hour];
            store.weather.data.humidity = result.hourly.relative_humidity_2m[hour];
            store.weather.data.pressure = result.hourly.surface_pressure[hour];
            store.weather.data.windspeed =  result.hourly.wind_speed_10m[hour];
            store.weather.data.winddirection = result.hourly.wind_direction_10m[hour];
        }
    } catch (error) {
        // TODO: Logging
        console.error(error);
    }
}
