// src/routes/api/csrf-token/+server.ts
import { json } from '@sveltejs/kit';
import { createCsrfToken } from '$lib/server/csrf';
import { dev } from '$app/environment';

export async function GET({ cookies }) {
  const { token, signature } = createCsrfToken();
  
  // Set the signature in a secure, HttpOnly cookie
  cookies.set('csrf-signature', signature, {
    httpOnly: true,
    secure: !dev,
    path: '/',
    sameSite: 'lax', // Using 'lax' to match your auth cookie settings
    maxAge: 60 * 60 // 1 hour
  });
  
  // Return the token to be stored in JavaScript and sent with requests
  return json({ csrfToken: token });
}