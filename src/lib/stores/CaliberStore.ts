import { z } from 'zod';
import { readable, writable, derived } from 'svelte/store';
import { type Caliber } from '@/utils/caliber';
import { browser } from '$app/environment';

export const CaliberSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    mm: z.string(),
    in: z.string(),
    aliases: z.array(z.string()).default([])
});

// Default category order
const defaultCategoryOrder = ['Rimfire', 'Rifle', 'Handgun', 'Shotgun', 'Airgun'];

// Store for category order configuration
export const categoryOrder = writable<string[]>(defaultCategoryOrder);

export const calibers = readable<Caliber[]>([], (set) => {
    // console.debug('Loading calibers...');
    
    if (browser) {
        try {
            const cachedData = localStorage.getItem('calibers');
            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                // console.debug('Loaded calibers from cache:', parsedData.length);
                set(parsedData);
            }
        } catch (e) {
            console.error('Error loading calibers from cache:', e);
        }
    
        // Fetch latest data
        fetch('/public/calibers.json')
            .then(response => response.json())
            .then(data => {
                // console.debug('Calibers loaded from fetch:', data.length);
                set(data);
            
                // Put data in localstorage
                try {
                    localStorage.setItem('calibers', JSON.stringify(data));
                } catch (e) {
                    console.error('Error caching calibers:', e);
                }
            })
            .catch(error => console.error('Failed to load calibers:', error));
    }
    
    return () => {};
});

// Derived store that sorts calibers based on category order
export const sortedCalibers = derived(
    [calibers, categoryOrder],
    ([$calibers, $categoryOrder]) => {
        return [...$calibers].sort((a, b) => {
            const aIndex = $categoryOrder.indexOf(a.category);
            const bIndex = $categoryOrder.indexOf(b.category);
            
            // If category isn't in the order list, put it at the end
            const aActualIndex = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
            const bActualIndex = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
            
            // Sort by category order first
            if (aActualIndex !== bActualIndex) {
                return aActualIndex - bActualIndex;
            }
            
            // If same category, sort alphabetically by name
            return a.name.localeCompare(b.name);
        });
    }
);

// Helper function to update category order
export function setCategoryOrder(newOrder: string[]): void {
    categoryOrder.set(newOrder);
}

// Helper function to add a new category to the order
export function addCategory(category: string, position?: number): void {
    categoryOrder.update(current => {
        const newOrder = [...current];
        if (position !== undefined && position >= 0 && position <= newOrder.length) {
            newOrder.splice(position, 0, category);
        } else {
            newOrder.push(category);
        }
        return newOrder;
    });
}

// Helper function to remove a category from the order
export function removeCategory(category: string): void {
    categoryOrder.update(current => current.filter(c => c !== category));
}