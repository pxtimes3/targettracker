// src/routes/dashboard/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { UUIDTypes } from 'uuid';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { db } from '$lib/server/db';
import pkg from 'pg';
const {Pool, types} = pkg;

types.setTypeParser(3802, function(value) {  // 3802 is the OID for JSONB
    return value === null ? null : JSON.parse(value);
});

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/auth');
	}

	// const gundata = await fetchGunData(event.locals.user.id);
	return { user: event.locals.user, gundata: await fetchGunData(event.locals.user.id) };
};

async function fetchGunData(id: UUIDTypes)
{	
	let returnArray: any[] = [];
	const result = await db.execute(sql`SELECT get_user_firearms_data(${id})`);

	if (result && result.length > 0) {
		result.forEach(entry => {
			returnArray.push(entry.get_user_firearms_data);
		});
	} else {
		console.warn('No length on result.');
	}

	return returnArray;
} 

function parseGunData(entry: any)
{
	return {
		[entry.get_user_firearms_data.id]: entry.get_user_firearms_data.gun_data,
		targets: entry.get_user_firearms_data.targets,
		averages: entry.get_user_firearms_data.averages
	};
}