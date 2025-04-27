// src/lib/components/gun/addEditGun.ts
import { derived } from 'svelte/store';
import { convertCaliberToMm, validateCaliberInput } from "@/utils/caliber";
import { sanitizeInput } from "@/utils/security";
import { resetForm } from "@/utils/forms";

// @ts-ignore
export const createEmptyGun = (): GunData => ({
    id: '',
    userId: '',
    name: '',
    type: '',
    manufacturer: '',
    model: '',
    caliber: '',
    caliberMm: 0,
    barrel: '',
    barrelLength: null,
    barrelLengthUnit: 'metric',
    barrelTwist: '',
    barrelTwistUnit: 'metric',
    stock: '',
    note: '',
    error: { message: '' }
});

/**
 * Formats a gun type string by replacing hyphens with spaces, 
 * converting to lowercase, and capitalizing the first letter of each word.
 * 
 * @param type - The gun type string to format.
 * @returns The formatted gun type string.
 */
export function formatGunType(type: string): string {
	return type.replace('-', ' ')
		.toLowerCase()
		.split(' ')
		.map(word => word.charAt(0).toUpperCase() + word.substring(1))
		.join(' ');
}

/**
 * Creates an array of gun type options with formatted labels.
 * 
 * @param gunTypes - An array of gun type strings.
 * @returns An array of objects containing value and label for each gun type.
 */
export function createGunTypeOptions(gunTypes: string[]): { value: string; label: string }[] 
{
    return gunTypes.map(type => ({
        value: type,
        label: formatGunType(type)
    }));
}

/**
 * Handles the selection of a caliber by updating the selected caliber state.
 * 
 */
export function onCaliberSelected(
    caliberId: string, 
    setSelectedCaliber: (value: string) => void,
    data?: GunData
): void {
    setSelectedCaliber(caliberId);
    
    // Update the data object if provided
    if (data) {
        data.caliber = caliberId;
    }
    
    // Also update any form field if it exists
    const caliberInput = document.querySelector('input[name="caliber"]') as HTMLInputElement;
    if (caliberInput) {
        caliberInput.value = caliberId;
    }
}

/**
 * Sets up an event listener for custom "caliber-selected" events, 
 * updates the caliber value in millimeters, and updates the hidden field.
 * 
 * @param setCaliberMm - A callback to set the caliber value in millimeters.
 * @returns A cleanup function to remove the event listener.
 */
export function setupCaliberListener(setCaliberMm: (value: number) => void): () => void {
	const handleCaliberEvent = ((e: CustomEvent) => {
		const mmValue = e.detail.mm;
		setCaliberMm(mmValue);
		
		const mmInput = document.getElementById('caliber_mm') as HTMLInputElement;
		if (mmInput) {
		mmInput.value = mmValue.toString();
		}
	}) as EventListener;
	
	document.addEventListener('caliber-selected', handleCaliberEvent);
	
	return () => {
		document.removeEventListener('caliber-selected', handleCaliberEvent);
	};
}

/**
 * Fetches a CSRF token from the server.
 * 
 * @returns A promise that resolves to the CSRF token string.
 */
export async function fetchCsrfToken(): Promise<string> {
	try {
		const response = await fetch('/api/csrf-token');
		const data = await response.json();
		return data.csrfToken;
	} catch (error) {
		console.error('Failed to fetch CSRF token:', error);
		return '';
	}
}

/**
 * Creates a safe copy of data for reset functionality
 * 
 * @param data - The gun data object
 * @returns A deep copy of the data without reactive proxies
 */
export function createOriginalDataCopy(data: GunData): GunData {
    return JSON.parse(JSON.stringify(data));
}

/**
 * Handles form reset by restoring original values
 * 
 * @param event - The reset event
 * @param originalData - The original data to reset to
 */
export function handleReset(event: Event, originalData: GunData): void {
    event.preventDefault();
    if (originalData) {
        resetForm(event.target as HTMLFormElement, originalData);
    }
}