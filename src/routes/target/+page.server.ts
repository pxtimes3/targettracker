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
    targetupload: async ({ request }) => {
        const formData = await request.formData();
        if (!formData) return;

        const uploadedFile = formData?.get('targetImage') as File;
        if(!uploadedFile) {
            return fail(400, {message: "no file"});
        }

        // return fail(400, {message: "Errormessage"});

        const filename = `${uuidv4()}${extname(uploadedFile?.name)}`;

        await writeFile('temp/' + filename, Buffer.from(await uploadedFile?.arrayBuffer()));

        let store: TargetStoreInterface = get(TargetStore);
        store.target.image.filename = filename;
        store.target.name = formData.get('targetName')?.toString();
        store.target.type = formData.get('targetType')?.toString();
        store.target.range = formData.get('targetRange')?.toString();
        store.target.rangeUnit = formData.get('targetRangeUnit')?.toString() === "metric" ? 'metric' : 'imperial';

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

        return { success: true };
    }
};

async function getWeatherData(): Promise<void>
{
    let store: TargetStoreInterface = get(TargetStore);

    if (!store.weather.timestamp) return;

    // EXIF sparar datum som 2001:03:16 14:15:16 -.-
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
