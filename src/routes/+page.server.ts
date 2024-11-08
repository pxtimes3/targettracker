import * as auth from '$lib/server/auth';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from '../../.svelte-kit/types/src/routes/dashboard/invite/$types';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return;
	}

	return {
		user: event.locals.user,
	};
}

export const actions: Actions = {
	logout: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}
		await auth.invalidateSession(event.locals.session.id);
		event.cookies.delete(auth.sessionCookieName, { path: '/' });

		return redirect(302, '/');
	}
} satisfies Actions;
