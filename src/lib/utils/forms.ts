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

export function convertInchToMm(value: string|number): number
{
    const inch: number = 2.54;
    let val: number;
    typeof value == "string" ? val = parseFloat(value) : val = value;
    
    return  val * 2.54;
}