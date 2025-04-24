// src/lib/components/gun/addEditGun.ts
import { derived } from 'svelte/store';
import { convertCaliberToMm, validateCaliberInput } from "@/utils/caliber";
import { sanitizeInput } from "@/utils/security";

export interface AddEditGunProps {
	data: GunData;
	gunTypes: string[];
}

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
export function createGunTypeOptions(gunTypes: string[]) {
	return gunTypes.map(type => ({
		value: type,
		label: formatGunType(type)
	}));
}

/**
 * Handles user input for caliber, validates it, converts it to millimeters, 
 * and updates the corresponding hidden field and input styles.
 * 
 * @param e - The input event.
 * @param setCaliberMm - A callback to set the caliber value in millimeters.
 */
export function handleCaliberInput(e: Event, setCaliberMm: (value: number) => void): void {
	const target = e.target as HTMLInputElement;
	const input = target.value;
	
	if (validateCaliberInput(input)) {
		const mmValue = convertCaliberToMm(input);
		setCaliberMm(mmValue);
		
		const mmInput = document.getElementById('caliber_mm') as HTMLInputElement;
		if (mmInput) {
		mmInput.value = mmValue.toString();
		}
		
		target.classList.remove('invalid');
		target.classList.add('valid');
	} else {
		target.classList.remove('valid');
		target.classList.add('invalid');
	}
}

/**
 * Handles the selection of a caliber by updating the selected caliber state.
 * 
 * @param caliberId - The ID of the selected caliber.
 * @param setSelectedCaliber - A callback to set the selected caliber.
 */
export function onCaliberSelected(caliberId: string, setSelectedCaliber: (value: string) => void): void {
	setSelectedCaliber(caliberId);
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
 * Handles form submission by sending the form data to the server.
 * 
 * @param event - The form submission event.
 * @param data - The gun data object containing user and gun details.
 * @param csrfToken - The CSRF token for secure submission.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function handleSubmit(
	event: Event, 
	data: GunData, 
	csrfToken: string
): Promise<{ success: boolean, message?: string }> {
	event.preventDefault();
	if (!event.target) return { success: false, message: 'No event target' };

	const form = event.target as HTMLFormElement;
	const formData = new FormData(form);

	const formDataObj = Object.fromEntries(formData);
	formDataObj.userId = data.userId;

	console.log('formDataObj:', formDataObj);
	
	try {
		const response = await fetch('/api/gun/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-csrf-token': csrfToken
		},
		body: JSON.stringify(formDataObj)
		});
		
		const result = await response.json();
		if (result.success) {
		console.log('success!');
		return { success: true };
		} else {
		console.log('Error:', result.message || 'Unknown error');
		return { success: false, message: result.message || 'Unknown error' };
		}
	} catch (error) {
		console.error('Form submission error:', error);
		return { 
		success: false, 
		message: error instanceof Error ? error.message : 'Unknown error' 
		};
	}
}