// src/stores/calibers.ts
import { z } from 'zod';
import { readable } from 'svelte/store';
import { type Caliber } from '@/utils/caliber';

export const CaliberSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    mm: z.string(),
    in: z.string(),
    aliases: z.array(z.string()).default([])
});

export const calibers = readable<Caliber[]>([], (set) => {
    console.debug('Loading calibers...');
    
    try {
        const cachedData = localStorage.getItem('calibers');
        if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            console.debug('Loaded calibers from cache:', parsedData.length);
            set(parsedData);
        }
    } catch (e) {
        console.error('Error loading calibers from cache:', e);
    }
    
    // Fetch latest data
    fetch('/public/calibers.json')
        .then(response => response.json())
        .then(data => {
            console.debug('Calibers loaded from fetch:', data.length);
            set(data);
        
            // Put data in localstorage
            try {
                localStorage.setItem('calibers', JSON.stringify(data));
            } catch (e) {
                console.error('Error caching calibers:', e);
            }
        })
        .catch(error => console.error('Failed to load calibers:', error));
      
    return () => {};
  });