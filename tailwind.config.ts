import { skeleton } from '@skeletonlabs/skeleton/plugin';
import forms from '@tailwindcss/forms';
import { join } from 'path';
import ducks from './ducks.theme';


/** @type {import('tailwindcss').Config} \*/
export default {
    content: [
        './src/**/*.{html,js,svelte,ts}',
        join(require.resolve('@skeletonlabs/skeleton-svelte'), '../**/*.{html,js,svelte,ts}')
    ],
    theme: {
        extend: {
            gridTemplateRows: {
                'layout' : 'auto min-content auto',
            }
        },
    },
    plugins: [
        forms,
        skeleton({
            // NOTE: each theme included will be added to your CSS bundle
            themes: [ ducks ]
        })
    ]
}
