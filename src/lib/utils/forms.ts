// src/lib/utils/forms.ts
export function validate(e: Event) {
    if (!e.target) return;

    const target = e.target as HTMLInputElement;

    if (
        !target.pattern || 
        !target.min || 
        target.value.trim().length < 2
    ) {
        return true;
    }

    if (target.value.length < parseInt(target.min)) return;
    
    let patternStr = target.pattern;
    
    if (patternStr.startsWith('\\')) {
        patternStr = patternStr.replace(/\\\\([dDwWsS])/g, '\\$1');
        
        patternStr = patternStr.replace(/\\d2/g, '\\d{0,2}');
        patternStr = patternStr.replace(/\\d3/g, '\\d{1,3}');
    }
    
    // console.log("Fixed pattern:", patternStr);
    
    try {
        const regex = new RegExp(`^${patternStr}$`);
        console.log("Regex:", regex);
        console.log("Testing value:", target.value);
        
        const isValid = regex.test(target.value);
        
        if (isValid) {
            target.classList.remove('invalid');
            target.classList.add('valid');
            
            // Remove error message if it exists
            const errorElement = target.parentElement?.querySelector('.error-message');
            if (errorElement) {
                errorElement.remove();
            }
        } else {
            target.classList.remove('valid');
            target.classList.add('invalid');
            
            // Add error message if it doesn't exist
            let errorElement = target.parentElement?.querySelector('.error-message');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                target.parentElement?.appendChild(errorElement);
            }
            
            // Set error message based on input type or pattern
            if (target.pattern.includes('\\d')) {
                errorElement.textContent = 'Please enter a valid number format';
            } else {
                errorElement.textContent = 'Invalid format';
            }
        }
        
        return isValid;
    } catch (err) {
        console.error('Invalid regex pattern:', err);
        return false;
    }
}

export function convertComma(event: Event)
{   
    if (!event.target) return;
    let target = event.target as HTMLInputElement;
    
    const newValue = target.value.replace(',', '.');
    target.value = newValue;

    validate(event);
}

export function convertCommaString(string: string): number
{
    return parseFloat(string.replace(/,/,'.'));
}

export function convertInchToMm(value: string|number): number
{
    const inch: number = 2.54;
    let val: number;
    typeof value == "string" ? val = parseFloat(value) : val = value;
    
    return  val * 2.54;
}

export function resetForm(form: HTMLFormElement, originalData: GunData) {
    const resetData = JSON.parse(JSON.stringify(originalData));
    
    Object.keys(resetData).forEach(key => {
        // @ts-ignore
        const element = form.elements[key];
        if (element) {
            element.value = resetData[key] || '';
            
            // checkboxes & radio
            if (element.type === 'checkbox' || element.type === 'radio') {
            element.checked = !!resetData[key];
            }
            
            // select
            if (element.tagName === 'SELECT') {
            for (let i = 0; i < element.options.length; i++) {
                if (element.options[i].value === resetData[key]) {
                element.selectedIndex = i;
                break;
                }
            }
            }
        }
    });
    
    // publish
    form.dispatchEvent(new Event('reset', { bubbles: true }));
}

/**
 * Creates a safe copy of data for reset functionality
 * 
 * @param data - The gun data object
 * @returns A deep copy of the data without reactive proxies
 */
export function createOriginalDataCopy(data: any)
{
    return JSON.parse(JSON.stringify(data));
}

/**
 * Handles form reset by restoring original values
 * 
 * @param event - The reset event
 * @param originalData - The original data to reset to
 */
export function handleReset(event: Event, originalData: any): void 
{
    event.preventDefault();
    if (originalData) {
        resetForm(event.target as HTMLFormElement, originalData);
    }
}

/**
 * Formats a string by replacing hyphens with spaces, 
 * converting to lowercase, and capitalizing the first letter of each word.
 * 
 * @param type - The string to format.
 * @returns The formatted string.
 */
export function hyphensToSpaces(type: string): string {
	return type.replace('-', ' ')
		.toLowerCase()
		.split(' ')
		.map(word => word.charAt(0).toUpperCase() + word.substring(1))
		.join(' ');
}