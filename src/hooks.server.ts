// src/hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks';
// import * as Sentry from '@sentry/sveltekit';
import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import * as auth from '$lib/server/auth.js';
import { validateCsrfToken } from '$lib/server/csrf';

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

const handleCsrf: Handle = async ({ event, resolve }) => {
    const request = event.request;
    const method = request.method;
    const url = new URL(request.url);
    
    // Only validate CSRF for mutation operations on API routes
    if (
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) &&
        url.pathname.startsWith('/api/') &&
        !url.pathname.startsWith('/api/csrf-token') // Skip CSRF endpoint itself
    ) {
        const csrfToken = request.headers.get('x-csrf-token');
        const csrfSignature = event.cookies.get('csrf-signature');
        
        // Validate CSRF token
        if (!csrfToken || !csrfSignature || !validateCsrfToken(csrfToken, csrfSignature)) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Invalid or missing CSRF token'
            }), {
                status: 403,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
    }
    
    return await resolve(event);
};

export const handle: Handle = sequence(
    /*Sentry.sentryHandle(),*/ 
    handleAuth,
    handleCsrf
);
/* export const handleError = Sentry.handleErrorWithSentry(); */