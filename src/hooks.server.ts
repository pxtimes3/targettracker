import {sequence} from '@sveltejs/kit/hooks';
// import * as Sentry from '@sentry/sveltekit';
import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import * as auth from '$lib/server/auth.js';

// Sentry.init({
//     dsn: "https://c9a35240befd4fdb4291046a467ca80c@o4508320665567232.ingest.de.sentry.io/4508325332254800",
//     tracesSampleRate: 1
// })

const handleAuth: Handle = async ({ event, resolve }) => {
				const sessionId = event.cookies.get(auth.sessionCookieName);
				if (!sessionId) {
								event.locals.user = null;
								event.locals.session = null;
								return resolve(event);
				}

				const { session, user } = await auth.validateSession(sessionId);
				if (session) {
								event.cookies.set(auth.sessionCookieName, session.id, {
												path: '/',
												sameSite: 'lax',
												httpOnly: true,
												expires: session.expiresAt,
												secure: !dev
								});
				} else {
								event.cookies.delete(auth.sessionCookieName, { path: '/' });
				}

				event.locals.user = user;
				event.locals.session = session;

				return resolve(event);
};

export const handle: Handle = sequence(/*Sentry.sentryHandle(),*/ handleAuth);
/* export const handleError = Sentry.handleErrorWithSentry(); */
