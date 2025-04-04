import { sveltekit } from '@sveltejs/kit/vite';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [sveltekit()],
    test: {
        environment: 'jsdom',
        globals: true,
        // setupFiles: ['./tests/setup.ts'],
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/targettracker.analysis/**',
            '**/.{idea,git,cache,output,temp}/**'
        ],
        deps: {
            optimizer: {
                web: {
                    include: ['@sveltejs/kit'],
                }
            }
        },
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
            reporter: ['json', 'json-summary', 'html'],
            reportsDirectory: './coverage',
            exclude: [
                'node_modules/',
                'tests/',
                '**/*.d.ts',
                '**/*.test.ts',
                '**/targettracker.analysis/**',
                '**/.svelte-kit/**',
            ]
        }
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src/lib'),
            '$app': resolve('./src/mocks/app')
        }
    }
});
