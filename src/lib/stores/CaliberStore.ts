// src/stores/calibers.ts
import { z } from 'zod';
import { readable } from 'svelte/store';
import { validateCalibers, type Caliber } from '@/utils/caliber';

export const CaliberSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    mm: z.string(),
    in: z.string(),
    aliases: z.array(z.string()).default([])
});

export const calibers = readable<Caliber[]>([], (set) => {
  fetch('/calibers.json')
    .then(response => response.json())
    .then(data => set(validateCalibers(data)))
    .catch(error => console.error('Failed to load calibers:', error));
    
  return () => {};
});