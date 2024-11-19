// import { sentrySvelteKit } from "@sentry/sveltekit";
import { sveltekit } from '@sveltejs/kit/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		// sentrySvelteKit({
		// 	sourceMapsUploadOptions: {
		// 		org: "mamoco-hobby",
		// 		project: "targettracker"
		// 	}
		// }),
		sveltekit(),
		basicSsl()
	],
	server: {
		proxy: {},
		fs: {
			allow: [
				'temp/',
			],
		},
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['**/targettracker.analysis/**']
	}
});
