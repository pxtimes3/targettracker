import { z } from 'zod';
import { CaliberSchema } from "$src/lib/stores/CaliberStore"

export type Caliber = z.infer<typeof CaliberSchema>;

export const validateCalibers = (data: unknown) => {
    return z.array(CaliberSchema).parse(data);
}

/**
 * Handle caliber selection change
 * @param value The selected caliber ID
 * @param callback Optional callback for additional processing
 * @returns The selected caliber ID
 */
export function handleCaliberChange(
    value: string, 
    callback?: (value: string) => void
  ): string {
    if (callback && typeof callback === 'function') {
      callback(value);
    }
    return value;
  }
  
  /**
   * Convert a caliber string to mm value
   * @param caliberStr The caliber string (e.g. "308", ".308", "7.62")
   * @returns The mm value as a number
   */
  export function convertCaliberToMm(caliberStr: string): number {
    // Remove any spaces
    caliberStr = caliberStr.trim();
    
    // Check if it's already in mm format (no leading dot, likely metric)
    if (!caliberStr.startsWith('.') && parseFloat(caliberStr) > 0) {
      // Convert comma to dot if needed
      caliberStr = caliberStr.replace(',', '.');
      return parseFloat(caliberStr);
    }
    
    // Handle imperial format (with or without leading dot)
    let value = caliberStr.startsWith('.') ? 
      parseFloat(caliberStr) : 
      parseFloat('.' + caliberStr);
    
    // Convert from inches to mm
    return value * 25.4;
  }
  
  /**
   * Find the closest caliber match from the calibers array
   * @param calibers Array of available calibers
   * @param mmValue The mm value to match
   * @param tolerance Tolerance for matching (default 0.1mm)
   * @returns The closest matching caliber or undefined
   */
  export function findClosestCaliber(
    calibers: Caliber[], 
    mmValue: number, 
    tolerance: number = 0.1
  ): Caliber | undefined {
    // First try exact match within tolerance
    const exactMatch = calibers.find(cal => {
      const calMm = parseFloat(cal.mm);
      return Math.abs(calMm - mmValue) <= tolerance;
    });
    
    if (exactMatch) return exactMatch;
    
    // If no exact match, find closest
    let closestCal: Caliber | undefined;
    let minDiff = Number.MAX_VALUE;
    
    calibers.forEach(cal => {
      const calMm = parseFloat(cal.mm);
      const diff = Math.abs(calMm - mmValue);
      if (diff < minDiff) {
        minDiff = diff;
        closestCal = cal;
      }
    });
    
    return closestCal;
  }
  
  /**
   * Validate a caliber input string
   * @param input The input string to validate
   * @returns True if valid caliber format, false otherwise
   */
  export function validateCaliberInput(input: string): boolean {
    // Metric format: 1-2 digits followed by optional decimal point and 1-3 digits
    const metricRegex = /^\d{1,2}([\.,]\d{1,3})?$/;
    
    // Imperial format: optional leading dot followed by 1-3 digits
    const imperialRegex = /^(\.?)(\d{1,3})$/;
    
    return metricRegex.test(input) || imperialRegex.test(input);
  }